-- Migration: Création de la table depots_banque pour le suivi caisse/banque
CREATE TABLE depots_banque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  montant NUMERIC NOT NULL,
  mode TEXT CHECK (mode IN ('especes', 'cheque')) NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE depots_banque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access depots" ON depots_banque
  FOR ALL USING (true) WITH CHECK (true);
