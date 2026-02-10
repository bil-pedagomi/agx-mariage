-- Fix: Les montants importés étaient TTC, pas HT
-- On divise prix_unitaire_ht par 1.19 pour obtenir le vrai HT
-- Le montant_ttc (colonne GENERATED) se recalculera automatiquement

UPDATE debits
SET prix_unitaire_ht = ROUND(prix_unitaire_ht / 1.19, 2)
WHERE designation = 'Location de la salle'
  AND taux_tva = 19;
