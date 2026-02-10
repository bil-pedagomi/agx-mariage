/**
 * Script d'import des données Excel vers Supabase
 * Usage: node scripts/import-data.js
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Config Supabase (mêmes variables que .env.local)
const SUPABASE_URL = 'https://nphbtgmxyecoxtydzfhj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DftHCjDwM0qcOqzPFSQ84w_K3-DessQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fichier Excel
const EXCEL_PATH = path.join(__dirname, '..', 'data', 'AGX_Mariage_Import.xlsx');

// Stats
const stats = { clients: 0, debits: 0, reglements: 0, contrats: 0, errors: [] };

// Mapping ID temporaire → UUID Supabase
const clientMapping = new Map();

/**
 * Valide une date ISO. Retourne la date ou null si invalide.
 */
function parseDate(val) {
  if (!val || val === '') return null;
  const str = String(val).trim();
  // Cas mal formaté comme "12/01/216"
  if (/^\d{2}\/\d{2}\/\d{2,3}$/.test(str)) return null;
  // Vérifie si c'est un format ISO valide (yyyy-mm-dd)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return str;
  }
  return null;
}

/**
 * Extrait le numéro de contrat depuis "N 79", "116", etc.
 */
function parseContratNumero(val) {
  if (!val || val === '') return null;
  const str = String(val).trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Authentification Supabase (nécessaire pour RLS)
 */
async function authenticate() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'bilel@pedagomi.com',
    password: 'Azerty123!'
  });
  if (error) {
    console.error('❌ Erreur authentification:', error.message);
    process.exit(1);
  }
  console.log('🔐 Authentifié en tant que:', data.user.email);
}

/**
 * Import des clients
 */
async function importClients(rows) {
  console.log('\n📋 Import des clients...');

  for (const row of rows) {
    const tempId = row[0]; // ID temporaire (1, 2, 3...)
    const nom = String(row[1] || '').trim();
    const prenom = String(row[2] || '').trim();
    const cin = String(row[3] || '').trim();
    const telephone = String(row[4] || '').trim();
    const dateMariage = parseDate(row[5]);
    const dateInscription = parseDate(row[6]);
    const statut = String(row[7] || 'confirme').trim();
    const numContrat = parseContratNumero(row[8]);
    const lieuReception = String(row[9] || "L'Élysée du Lac").trim();

    // Vérifier si un client avec le même nom + date_mariage existe déjà (anti-doublons)
    let query = supabase
      .from('clients')
      .select('id')
      .eq('nom_marie_1', nom);

    if (dateMariage) {
      query = query.eq('date_mariage', dateMariage);
    } else {
      query = query.is('date_mariage', null);
    }

    if (prenom) {
      query = query.eq('prenom_marie_1', prenom);
    }

    const { data: existing } = await query;

    if (existing && existing.length > 0) {
      console.log(`  ⏭️  Client ${nom} ${prenom} existe déjà → skip`);
      clientMapping.set(tempId, existing[0].id);
      continue;
    }

    // CIN spécial : si "annulee" → statut annulé, CIN vide
    let cinFinal = cin;
    let statutFinal = statut;
    if (cin.toLowerCase() === 'annulee') {
      statutFinal = 'annule';
      cinFinal = null;
    }

    const clientData = {
      nom_marie_1: nom,
      prenom_marie_1: prenom || null,
      cin_passeport: cinFinal || null,
      telephone_1: telephone || null,
      date_mariage: dateMariage,
      date_inscription: dateInscription || new Date().toISOString().split('T')[0],
      statut: statutFinal,
      lieu_reception: lieuReception,
      archived: false,
      type_prestation: [],
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select('id')
      .single();

    if (error) {
      stats.errors.push(`Client ${nom} ${prenom}: ${error.message}`);
      console.log(`  ❌ Client ${nom} ${prenom}: ${error.message}`);
    } else {
      clientMapping.set(tempId, data.id);
      stats.clients++;
      console.log(`  ✅ Client ${nom} ${prenom} → ${data.id}`);

      // Insérer le contrat s'il y a un numéro
      if (numContrat) {
        const { error: contratErr } = await supabase.from('contrats').insert({
          client_id: data.id,
          numero: numContrat,
          type: 'location',
        });
        if (contratErr) {
          stats.errors.push(`Contrat ${numContrat} (${nom}): ${contratErr.message}`);
        } else {
          stats.contrats++;
        }
      }
    }
  }
}

/**
 * Import des débits
 */
async function importDebits(rows) {
  console.log('\n💰 Import des débits...');

  for (const row of rows) {
    const tempClientId = row[0];
    const nomClient = String(row[1] || '');
    const date = parseDate(row[2]);
    const quantite = Number(row[3]) || 1;
    const designation = String(row[4] || '').trim();
    const categorie = String(row[5] || 'location').trim();
    const montant = Number(row[6]) || 0;

    // Ne pas insérer les montants à 0
    if (montant === 0) {
      console.log(`  ⏭️  Débit ${nomClient} montant 0 → skip`);
      continue;
    }

    const clientId = clientMapping.get(tempClientId);
    if (!clientId) {
      stats.errors.push(`Débit ${nomClient}: client ID ${tempClientId} non trouvé dans le mapping`);
      console.log(`  ❌ Débit ${nomClient}: client ID ${tempClientId} non trouvé`);
      continue;
    }

    // Vérifier doublon : même client + même désignation + même montant + même date
    const { data: existing } = await supabase
      .from('debits')
      .select('id')
      .eq('client_id', clientId)
      .eq('designation', designation)
      .eq('prix_unitaire_ht', montant);

    if (existing && existing.length > 0) {
      console.log(`  ⏭️  Débit ${nomClient} "${designation}" existe déjà → skip`);
      continue;
    }

    const debitData = {
      client_id: clientId,
      date: date || new Date().toISOString().split('T')[0],
      quantite: quantite,
      designation: designation,
      prix_unitaire_ht: montant,
      taux_tva: 19, // TVA 19% par défaut en Tunisie
      categorie: categorie,
    };

    const { error } = await supabase.from('debits').insert(debitData);

    if (error) {
      stats.errors.push(`Débit ${nomClient} "${designation}": ${error.message}`);
      console.log(`  ❌ Débit ${nomClient}: ${error.message}`);
    } else {
      stats.debits++;
      console.log(`  ✅ Débit ${nomClient} → ${designation} = ${montant} DT`);
    }
  }
}

/**
 * Import des règlements
 */
async function importReglements(rows) {
  console.log('\n🧾 Import des règlements...');

  for (const row of rows) {
    const tempClientId = row[0];
    const nomClient = String(row[1] || '');
    const date = parseDate(row[2]);
    const mode = String(row[3] || 'especes').trim();
    const montant = Number(row[4]) || 0;

    // Ne pas insérer les montants à 0
    if (montant === 0) {
      console.log(`  ⏭️  Règlement ${nomClient} montant 0 → skip`);
      continue;
    }

    const clientId = clientMapping.get(tempClientId);
    if (!clientId) {
      stats.errors.push(`Règlement ${nomClient}: client ID ${tempClientId} non trouvé dans le mapping`);
      console.log(`  ❌ Règlement ${nomClient}: client ID ${tempClientId} non trouvé`);
      continue;
    }

    // Vérifier doublon : même client + même mode + même montant + même date
    const checkQuery = supabase
      .from('reglements')
      .select('id')
      .eq('client_id', clientId)
      .eq('montant', montant)
      .eq('mode', mode);

    if (date) {
      checkQuery.eq('date', date);
    }

    const { data: existing } = await checkQuery;

    if (existing && existing.length > 0) {
      console.log(`  ⏭️  Règlement ${nomClient} ${montant} DT existe déjà → skip`);
      continue;
    }

    const reglementData = {
      client_id: clientId,
      date: date || new Date().toISOString().split('T')[0],
      mode: mode,
      montant: montant,
    };

    const { error } = await supabase.from('reglements').insert(reglementData);

    if (error) {
      stats.errors.push(`Règlement ${nomClient} ${montant} DT: ${error.message}`);
      console.log(`  ❌ Règlement ${nomClient}: ${error.message}`);
    } else {
      stats.reglements++;
      console.log(`  ✅ Règlement ${nomClient} → ${montant} DT (${mode})`);
    }
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Import des données AGX Mariage');
  console.log('📁 Fichier:', EXCEL_PATH);
  console.log('');

  // Authentification
  await authenticate();

  // Lire le fichier Excel
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log('📊 Onglets trouvés:', wb.SheetNames.join(', '));

  // Parser les onglets
  const clientsData = XLSX.utils.sheet_to_json(wb.Sheets['clients'], { header: 1 });
  const debitsData = XLSX.utils.sheet_to_json(wb.Sheets['debits'], { header: 1 });
  const reglementsData = XLSX.utils.sheet_to_json(wb.Sheets['reglements'], { header: 1 });

  // Retirer les en-têtes
  const clientRows = clientsData.slice(1);
  const debitRows = debitsData.slice(1);
  const reglementRows = reglementsData.slice(1);

  console.log(`\n📈 Données à importer:`);
  console.log(`   - ${clientRows.length} clients`);
  console.log(`   - ${debitRows.length} débits`);
  console.log(`   - ${reglementRows.length} règlements`);

  // Import séquentiel
  await importClients(clientRows);
  await importDebits(debitRows);
  await importReglements(reglementRows);

  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(50));
  console.log(`✅ ${stats.clients} clients importés`);
  console.log(`✅ ${stats.contrats} contrats importés`);
  console.log(`✅ ${stats.debits} débits importés`);
  console.log(`✅ ${stats.reglements} règlements importés`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ ${stats.errors.length} erreurs :`);
    stats.errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  } else {
    console.log('\n🎉 Aucune erreur !');
  }
}

main().catch(console.error);
