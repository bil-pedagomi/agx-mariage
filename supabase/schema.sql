-- ============================================
-- AGX Mariage - Supabase Schema
-- ============================================

-- Profils utilisateurs (lié à Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collaborateur')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients (dossiers mariage)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_marie_1 TEXT NOT NULL,
  prenom_marie_1 TEXT NOT NULL,
  nom_marie_2 TEXT,
  prenom_marie_2 TEXT,
  telephone_1 TEXT,
  telephone_2 TEXT,
  email_1 TEXT,
  email_2 TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  date_mariage DATE,
  lieu_ceremonie TEXT,
  lieu_reception TEXT,
  nombre_invites INTEGER,
  type_prestation TEXT[] DEFAULT '{}',
  formule TEXT,
  statut TEXT DEFAULT 'prospect' CHECK (statut IN ('prospect', 'en_cours', 'confirme', 'termine', 'annule')),
  referent TEXT,
  memo TEXT,
  date_inscription TIMESTAMPTZ DEFAULT now(),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lignes de débit (prestations facturées)
CREATE TABLE debits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantite NUMERIC DEFAULT 1,
  designation TEXT NOT NULL,
  prix_unitaire_ht NUMERIC NOT NULL,
  taux_tva NUMERIC DEFAULT 20,
  montant_ttc NUMERIC GENERATED ALWAYS AS (quantite * prix_unitaire_ht * (1 + taux_tva / 100)) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Règlements (paiements reçus)
CREATE TABLE reglements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('cb', 'virement', 'especes', 'cheque')),
  reference TEXT,
  montant NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Événements planning
CREATE TABLE evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mariage', 'rdv_preparation', 'reperage_lieu', 'autre')),
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  couleur TEXT DEFAULT '#4A90D9',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Échéances de paiement
CREATE TABLE echeances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date_echeance DATE NOT NULL,
  montant NUMERIC NOT NULL,
  libelle TEXT,
  payee BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Paramètres entreprise (pour les PDF)
CREATE TABLE parametres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_entreprise TEXT,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  siret TEXT,
  logo_url TEXT,
  conditions_paiement TEXT,
  mentions_legales TEXT
);

-- ============================================
-- Trigger: mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE debits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE echeances ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;

-- Helper: obtenir le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: chacun peut lire son profil, admin peut tout voir
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Admin can manage profiles" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- Clients: admin full access, collaborateur lecture/écriture
CREATE POLICY "Admin full access clients" ON clients
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Collaborateur read write clients" ON clients
  FOR ALL USING (get_user_role() = 'collaborateur');

-- Debits: admin full access, collaborateur lecture seule
CREATE POLICY "Admin full access debits" ON debits
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Collaborateur read debits" ON debits
  FOR SELECT USING (get_user_role() = 'collaborateur');

-- Reglements: admin full access, collaborateur lecture seule
CREATE POLICY "Admin full access reglements" ON reglements
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Collaborateur read reglements" ON reglements
  FOR SELECT USING (get_user_role() = 'collaborateur');

-- Evenements: admin full access, collaborateur lecture/écriture
CREATE POLICY "Admin full access evenements" ON evenements
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Collaborateur read write evenements" ON evenements
  FOR ALL USING (get_user_role() = 'collaborateur');

-- Echeances: admin full access, collaborateur lecture seule
CREATE POLICY "Admin full access echeances" ON echeances
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Collaborateur read echeances" ON echeances
  FOR SELECT USING (get_user_role() = 'collaborateur');

-- Parametres: admin full access, collaborateur lecture
CREATE POLICY "Admin full access parametres" ON parametres
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Collaborateur read parametres" ON parametres
  FOR SELECT USING (get_user_role() = 'collaborateur');

-- ============================================
-- Insérer un jeu de paramètres par défaut
-- ============================================
INSERT INTO parametres (nom_entreprise, conditions_paiement, mentions_legales)
VALUES (
  'AGX Mariage',
  'Acompte de 30% à la signature du devis. Solde à régler 15 jours avant la date du mariage.',
  'TVA non applicable, art. 293 B du CGI (si applicable). Pénalités de retard : 3 fois le taux d''intérêt légal.'
);
