-- ============================================
-- Migration: Ajout catégories débits, champs client, contrats
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================

-- 1. Ajouter colonne categorie aux débits
ALTER TABLE debits ADD COLUMN IF NOT EXISTS categorie TEXT DEFAULT 'location' CHECK (categorie IN ('location', 'option'));

-- 2. Ajouter champs supplémentaires aux clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cin_passeport TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS heure_debut TIME;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS heure_fin TIME;

-- 3. Ajouter nom du gérant dans les paramètres
ALTER TABLE parametres ADD COLUMN IF NOT EXISTS nom_gerant TEXT;

-- 4. Table de numérotation des contrats
CREATE TABLE IF NOT EXISTS contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  numero SERIAL,
  type TEXT CHECK (type IN ('location', 'options')),
  date_generation TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT
);

-- 5. RLS pour la table contrats
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contrats_select" ON contrats FOR SELECT TO authenticated USING (true);
CREATE POLICY "contrats_insert" ON contrats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contrats_update" ON contrats FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contrats_delete" ON contrats FOR DELETE TO authenticated USING (true);
