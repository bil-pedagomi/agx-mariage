import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Utiliser la service_role key pour contourner le RLS
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5waGJ0Z214eWVjb3h0eWR6ZmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcwODIyMywiZXhwIjoyMDg2Mjg0MjIzfQ.ztNewOkWzKBd3yyi0SfpdZfXT9O8-exZuTBIo39OTAQ';

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL manquant dans .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// HELPERS
// ============================================================

function normalizeStr(s: string): string {
  return (s || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function parseDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Format DD/MM/YYYY
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return null;
  }
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
  }
  return null;
}

// Insert par batch
async function batchInsert(table: string, rows: any[], batchSize: number = 10): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data, error } = await supabase.from(table).insert(batch).select('id');
    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    } else {
      inserted += (data || []).length;
    }
  }

  return { inserted, errors };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('📋 Lecture du fichier Excel...');

  const wb = XLSX.readFile(path.resolve(__dirname, '../data/client_claude.xlsx'));

  // ---- Read sheets ----
  const clientsSheet = XLSX.utils.sheet_to_json<any>(wb.Sheets['clients']);
  const debitsSheet = XLSX.utils.sheet_to_json<any>(wb.Sheets['debits']);
  const reglementsSheet = XLSX.utils.sheet_to_json<any>(wb.Sheets['reglements']);

  console.log(`   ${clientsSheet.length} clients, ${debitsSheet.length} débits, ${reglementsSheet.length} règlements trouvés\n`);

  // ============================================================
  // ÉTAPE 1 : VÉRIFICATION CONNEXION (service_role bypass RLS)
  // ============================================================
  console.log('🔐 Vérification connexion (service_role)...');
  const { data: testData, error: testError } = await supabase.from('clients').select('id').limit(1);
  if (testError) {
    console.error('❌ Erreur de connexion Supabase:', testError.message);
    process.exit(1);
  }
  console.log('   ✅ Connexion Supabase OK (service_role)');

  // ============================================================
  // ÉTAPE 2 : IMPORT DES CLIENTS
  // ============================================================
  console.log('\n👥 Import des clients...');

  // Récupérer tous les clients existants
  const { data: existingClients } = await supabase.from('clients').select('id, nom_marie_1, date_mariage');
  const existingMap = new Map<string, string>();
  (existingClients || []).forEach((c: any) => {
    const key = normalizeStr(c.nom_marie_1) + '|' + (c.date_mariage || '');
    existingMap.set(key, c.id);
  });

  // Mapping ID Excel → UUID Supabase
  const idMapping = new Map<number, string>();
  // Mapping "NOM PRENOM" normalisé → UUID (pour les règlements)
  const nameMapping = new Map<string, string>();

  let clientsInserted = 0;
  let clientsSkipped = 0;
  let clientsErrors = 0;

  for (const row of clientsSheet) {
    const excelId = Number(row['ID']);
    const nom = (row['Nom'] || '').trim();
    const prenom = (row['Prénom'] || '').trim();
    const dateMariage = parseDate(row['Date mariage']);
    const dateInscription = parseDate(row['Date inscription']);
    const cin = (row['CIN'] || '').toString().trim();
    const telephone = (row['Téléphone'] || '').toString().trim();
    const numContrat = (row['N° contrat'] || '').toString().trim();
    const statut = (row['Statut'] || 'confirme').toString().trim().toLowerCase();

    // Clé de déduplication
    const dedupKey = normalizeStr(nom) + '|' + (dateMariage || '');

    if (existingMap.has(dedupKey)) {
      // Client existe déjà
      const uuid = existingMap.get(dedupKey)!;
      idMapping.set(excelId, uuid);
      const fullName = normalizeStr(nom + ' ' + prenom);
      nameMapping.set(fullName, uuid);
      // Aussi mapper juste le nom
      nameMapping.set(normalizeStr(nom), uuid);
      clientsSkipped++;
      continue;
    }

    // Insérer le client
    const clientData: any = {
      nom_marie_1: nom,
      prenom_marie_1: prenom,
      cin_passeport: cin || null,
      telephone_1: telephone || null,
      date_mariage: dateMariage,
      date_inscription: dateInscription,
      statut: statut === 'annule' ? 'annule' : 'confirme',
      lieu_reception: "L'Élysée du Lac",
      archived: false,
    };

    const { data: inserted, error } = await supabase.from('clients').insert(clientData).select('id').single();

    if (error) {
      console.error(`   ❌ Erreur client ${nom} ${prenom}: ${error.message}`);
      clientsErrors++;
    } else {
      const uuid = inserted.id;
      idMapping.set(excelId, uuid);
      existingMap.set(dedupKey, uuid);
      const fullName = normalizeStr(nom + ' ' + prenom);
      nameMapping.set(fullName, uuid);
      nameMapping.set(normalizeStr(nom), uuid);
      clientsInserted++;

      // Insérer le contrat si numéro existe
      if (numContrat) {
        await supabase.from('contrats').insert({
          client_id: uuid,
          numero: numContrat,
          date_contrat: dateInscription || dateMariage,
          statut: 'signe',
        });
      }
    }
  }

  console.log(`   ✅ ${clientsInserted} nouveaux clients insérés`);
  console.log(`   ⏭️  ${clientsSkipped} clients déjà existants (ignorés)`);
  console.log(`   ❌ ${clientsErrors} erreurs`);

  // ============================================================
  // ÉTAPE 3 : IMPORT DES DÉBITS
  // ============================================================
  console.log('\n💰 Import des débits...');

  // Récupérer les débits existants pour déduplication
  const { data: existingDebits } = await supabase.from('debits').select('id, client_id, designation, prix_unitaire_ht, taux_tva');
  const existingDebitsSet = new Set<string>();
  (existingDebits || []).forEach((d: any) => {
    // Recalculer le montant TTC pour la comparaison
    const ttc = Math.round(Number(d.prix_unitaire_ht) * (1 + Number(d.taux_tva) / 100) * 100) / 100;
    const key = d.client_id + '|' + normalizeStr(d.designation || '') + '|' + ttc;
    existingDebitsSet.add(key);
  });

  const debitsToInsert: any[] = [];
  let debitsSkipped = 0;
  const debitsWarnings: string[] = [];

  for (const row of debitsSheet) {
    const excelClientId = Number(row['ID Client']);
    const clientUuid = idMapping.get(excelClientId);
    const montant = Number(row['Montant (DT)'] || 0);

    if (!clientUuid) {
      debitsWarnings.push(`Client ID ${excelClientId} (${row['Nom client']}) non trouvé`);
      continue;
    }

    if (montant === 0) continue;

    const designation = (row['Désignation'] || 'Location salle').toString().trim();
    const categorie = (row['Catégorie'] || 'location').toString().trim().toLowerCase();
    const date = parseDate(row['Date']);
    const quantite = Number(row['Qté'] || 1);

    // Le montant dans Excel est TTC, on calcule le HT
    const tva = 19;
    const prixHt = montant / (1 + tva / 100);
    const montantTtc = montant;

    // Déduplication: même client + même designation + même montant TTC
    const dedupKey = clientUuid + '|' + normalizeStr(designation) + '|' + montant;
    if (existingDebitsSet.has(dedupKey)) {
      debitsSkipped++;
      continue;
    }

    // Si pas de date, utiliser la date d'inscription ou date_mariage du client
    const finalDate = date || parseDate(row['Date']) || null;

    debitsToInsert.push({
      client_id: clientUuid,
      date: finalDate || '2025-01-01', // fallback si aucune date
      quantite: quantite,
      designation: designation,
      categorie: categorie,
      prix_unitaire_ht: Math.round(prixHt * 100) / 100,
      taux_tva: tva,
    });

    existingDebitsSet.add(dedupKey);
  }

  const debitsResult = await batchInsert('debits', debitsToInsert);

  console.log(`   ✅ ${debitsResult.inserted} nouveaux débits insérés`);
  console.log(`   ⏭️  ${debitsSkipped} débits déjà existants (ignorés)`);
  if (debitsWarnings.length > 0) {
    console.log(`   ⚠️  ${debitsWarnings.length} avertissements :`);
    debitsWarnings.forEach(w => console.log(`      - ${w}`));
  }
  if (debitsResult.errors.length > 0) {
    console.log(`   ❌ ${debitsResult.errors.length} erreurs :`);
    debitsResult.errors.forEach(e => console.log(`      - ${e}`));
  } else {
    console.log(`   ❌ 0 erreurs`);
  }

  // ============================================================
  // ÉTAPE 4 : IMPORT DES RÈGLEMENTS
  // ============================================================
  console.log('\n💳 Import des règlements...');

  // Récupérer les règlements existants pour déduplication
  const { data: existingReglements } = await supabase.from('reglements').select('id, client_id, date, mode, montant');
  const existingRegSet = new Set<string>();
  (existingReglements || []).forEach((r: any) => {
    const key = r.client_id + '|' + (r.date || '') + '|' + (r.mode || '') + '|' + Number(r.montant);
    existingRegSet.add(key);
  });

  const regsToInsert: any[] = [];
  let regsSkipped = 0;
  const regsWarnings: string[] = [];

  for (const row of reglementsSheet) {
    const nomClient = normalizeStr((row['Nom client'] || '').toString());
    const montant = Number(row['Montant (DT)'] || 0);
    const mode = (row['Mode'] || '').toString().trim().toLowerCase();
    const date = parseDate(row['Date paiement']);

    if (montant === 0) continue;

    // Trouver le client_id par le nom
    let clientUuid = nameMapping.get(nomClient);

    // Si pas trouvé exactement, essayer une recherche partielle
    if (!clientUuid) {
      for (const [key, uuid] of nameMapping.entries()) {
        if (key === nomClient || nomClient.startsWith(key) || key.startsWith(nomClient)) {
          clientUuid = uuid;
          break;
        }
      }
    }

    // Essai inversé: "PRENOM NOM" dans reglements vs "NOM PRENOM" dans clients
    if (!clientUuid) {
      const parts = nomClient.split(' ');
      if (parts.length >= 2) {
        // Essayer toutes les combinaisons de mots
        for (let i = 1; i < parts.length; i++) {
          const reversed = [...parts.slice(i), ...parts.slice(0, i)].join(' ');
          if (nameMapping.has(reversed)) {
            clientUuid = nameMapping.get(reversed);
            break;
          }
        }
      }
    }

    // Recherche par premier mot (nom de famille)
    if (!clientUuid) {
      const parts = nomClient.split(' ');
      if (parts.length > 0) {
        for (const [key, uuid] of nameMapping.entries()) {
          if (key.startsWith(parts[0] + ' ') || key.endsWith(' ' + parts[0])) {
            clientUuid = uuid;
            break;
          }
        }
      }
    }

    // Recherche floue: un mot en commun (au moins 4 caractères)
    if (!clientUuid) {
      const parts = nomClient.split(' ').filter(p => p.length >= 4);
      for (const part of parts) {
        for (const [key, uuid] of nameMapping.entries()) {
          if (key.includes(part)) {
            clientUuid = uuid;
            break;
          }
        }
        if (clientUuid) break;
      }
    }

    if (!clientUuid) {
      regsWarnings.push(`${row['Nom client']} (${date})`);
      continue;
    }

    // Déduplication: même client + même date + même mode + même montant
    const dedupKey = clientUuid + '|' + (date || '') + '|' + mode + '|' + montant;
    if (existingRegSet.has(dedupKey)) {
      regsSkipped++;
      continue;
    }

    regsToInsert.push({
      client_id: clientUuid,
      date: date,
      mode: mode,
      montant: montant,
    });

    existingRegSet.add(dedupKey);
  }

  const regsResult = await batchInsert('reglements', regsToInsert);

  console.log(`   ✅ ${regsResult.inserted} nouveaux règlements insérés`);
  console.log(`   ⏭️  ${regsSkipped} règlements déjà existants (ignorés)`);
  if (regsWarnings.length > 0) {
    console.log(`   ⚠️  ${regsWarnings.length} règlements non liés (client introuvable) :`);
    regsWarnings.forEach(w => console.log(`      - ${w}`));
  }
  if (regsResult.errors.length > 0) {
    console.log(`   ❌ ${regsResult.errors.length} erreurs :`);
    regsResult.errors.forEach(e => console.log(`      - ${e}`));
  } else {
    console.log(`   ❌ 0 erreurs`);
  }

  // ============================================================
  // RÉSUMÉ FINAL
  // ============================================================
  console.log('\n✅ Import terminé !');
  console.log(`   Clients: ${clientsInserted} insérés, ${clientsSkipped} ignorés`);
  console.log(`   Débits: ${debitsResult.inserted} insérés, ${debitsSkipped} ignorés`);
  console.log(`   Règlements: ${regsResult.inserted} insérés, ${regsSkipped} ignorés`);
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
