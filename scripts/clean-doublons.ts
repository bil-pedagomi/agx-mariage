import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5waGJ0Z214eWVjb3h0eWR6ZmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcwODIyMywiZXhwIjoyMDg2Mjg0MjIzfQ.ztNewOkWzKBd3yyi0SfpdZfXT9O8-exZuTBIo39OTAQ';

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL manquant dans .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// MODE
// ============================================================
const confirmMode = process.argv.includes('--confirm');

if (confirmMode) {
  console.log('🔴 MODE SUPPRESSION ACTIVÉ — les doublons seront supprimés\n');
} else {
  console.log('🟡 MODE DRY-RUN — aucune suppression, aperçu uniquement');
  console.log('   Pour supprimer réellement : npx tsx scripts/clean-doublons.ts --confirm\n');
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalise une désignation pour comparaison :
 * - minuscules, trim, espaces multiples → un seul espace
 * - supprime les mots courants non significatifs ("de", "la", "le", "du", "des", "l'", "d'")
 */
function normalizeDesignation(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, ' ')     // apostrophes → espace
    .replace(/\s+/g, ' ')       // espaces multiples → un seul
    .replace(/\b(de|la|le|du|des|l|d)\b/gi, '') // mots vides
    .replace(/\s+/g, ' ')       // re-nettoyer les espaces après suppression
    .trim();
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🔍 Recherche des doublons dans les débits...\n');

  // 1. Charger tous les débits
  const { data: debits, error: debitsError } = await supabase
    .from('debits')
    .select('id, client_id, designation, prix_unitaire_ht, taux_tva, montant_ttc, categorie, created_at')
    .order('created_at', { ascending: true });

  if (debitsError) {
    console.error('❌ Erreur chargement débits:', debitsError.message);
    process.exit(1);
  }

  // 2. Charger les clients pour les noms
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, nom_marie_1, prenom_marie_1');

  if (clientsError) {
    console.error('❌ Erreur chargement clients:', clientsError.message);
    process.exit(1);
  }

  const clientNames: Record<string, string> = {};
  (clients || []).forEach((c: any) => {
    clientNames[c.id] = `${c.nom_marie_1 || ''} ${c.prenom_marie_1 || ''}`.trim();
  });

  // 3. Grouper les débits par client
  const debitsByClient: Record<string, any[]> = {};
  (debits || []).forEach((d: any) => {
    if (!debitsByClient[d.client_id]) debitsByClient[d.client_id] = [];
    debitsByClient[d.client_id].push(d);
  });

  // 4. Détecter les doublons
  let totalDoublons = 0;
  let totalSupprimes = 0;
  const idsToDelete: string[] = [];
  let clientsAnalyses = 0;

  const clientIds = Object.keys(debitsByClient);
  clientsAnalyses = clientIds.length;

  for (const clientId of clientIds) {
    const clientDebits = debitsByClient[clientId];
    if (clientDebits.length < 2) continue;

    // Grouper par : catégorie + montant normalisé + désignation normalisée
    const groups: Record<string, any[]> = {};
    for (const d of clientDebits) {
      // Clé de regroupement : même catégorie + même prix_unitaire_ht arrondi
      // La désignation est normalisée pour détecter "Location de la salle" = "Location salle"
      const normDesig = normalizeDesignation(d.designation);
      const key = `${d.categorie}|${Number(d.prix_unitaire_ht).toFixed(2)}|${normDesig}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    }

    // Chercher les groupes avec plus d'un élément
    let clientHasDoublons = false;
    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.length <= 1) continue;

      if (!clientHasDoublons) {
        console.log(`👤 ${clientNames[clientId] || clientId} (client_id: ${clientId})`);
        clientHasDoublons = true;
      }

      // Garder le premier (created_at le plus ancien, déjà trié)
      const toKeep = group[0];
      const toRemove = group.slice(1);

      console.log(`   ✅  Conservé : "${toKeep.designation}" — ${Number(toKeep.montant_ttc).toLocaleString('fr-FR')} DT (id: ${toKeep.id.slice(0, 8)}...)`);
      for (const dup of toRemove) {
        console.log(`   🗑️  Doublon supprimé : "${dup.designation}" — ${Number(dup.montant_ttc).toLocaleString('fr-FR')} DT (id: ${dup.id.slice(0, 8)}...)`);
        idsToDelete.push(dup.id);
        totalDoublons++;
      }
      console.log('');
    }
  }

  // 5. Résumé
  console.log('─'.repeat(60));
  console.log('📊 Résumé :');
  console.log(`   Clients analysés : ${clientsAnalyses}`);
  console.log(`   Doublons trouvés : ${totalDoublons}`);

  if (totalDoublons === 0) {
    console.log('\n✅ Aucun doublon détecté !');
    return;
  }

  // 6. Suppression si --confirm
  if (confirmMode) {
    console.log(`\n🔴 Suppression de ${idsToDelete.length} doublons...`);

    // Supprimer par lots de 10
    for (let i = 0; i < idsToDelete.length; i += 10) {
      const batch = idsToDelete.slice(i, i + 10);
      const { error } = await supabase
        .from('debits')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`   ❌ Erreur suppression batch ${i / 10 + 1}:`, error.message);
      } else {
        totalSupprimes += batch.length;
      }
    }

    console.log(`   Doublons supprimés : ${totalSupprimes}`);

    // Recompter les débits restants
    const { count } = await supabase
      .from('debits')
      .select('id', { count: 'exact', head: true });
    console.log(`   Débits restants : ${count}`);

    console.log('\n✅ Nettoyage terminé !');
  } else {
    console.log(`   Doublons à supprimer : ${totalDoublons}`);
    console.log(`   Débits actuels : ${(debits || []).length}`);
    console.log(`   Débits après nettoyage : ${(debits || []).length - totalDoublons}`);
    console.log(`\n💡 Pour exécuter la suppression : npx tsx scripts/clean-doublons.ts --confirm`);
  }
}

main().catch(console.error);
