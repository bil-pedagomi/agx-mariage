-- ============================================
-- Migration 002: Système de rôles + secrétaire
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================

-- 1. Mise à jour du CHECK constraint pour accepter 'secretaire'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'collaborateur', 'secretaire'));

-- 2. S'assurer que l'admin existant a un profil
-- (Remplacer l'UUID et l'email par les vrais après avoir vérifié dans auth.users)
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'admin'
-- FROM auth.users
-- WHERE email = 'VOTRE_EMAIL_ADMIN'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Créer l'utilisateur secrétaire dans auth.users via le Dashboard Supabase :
--    Dashboard > Authentication > Users > Add user
--    Email: info@elysee-du-lac.com
--    Password: Elysee2026@@
--    Auto Confirm: coché
--
-- Puis insérer son profil (remplacer UUID par celui généré) :
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('UUID_DE_LA_SECRETAIRE', 'info@elysee-du-lac.com', 'Secrétaire', 'secretaire');

-- 4. RLS : Mettre à jour les politiques pour le nouveau rôle

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admin full access clients" ON clients;
DROP POLICY IF EXISTS "Collaborateur read write clients" ON clients;
DROP POLICY IF EXISTS "Admin full access debits" ON debits;
DROP POLICY IF EXISTS "Collaborateur read debits" ON debits;
DROP POLICY IF EXISTS "Admin full access reglements" ON reglements;
DROP POLICY IF EXISTS "Collaborateur read reglements" ON reglements;
DROP POLICY IF EXISTS "Admin full access evenements" ON evenements;
DROP POLICY IF EXISTS "Collaborateur read write evenements" ON evenements;
DROP POLICY IF EXISTS "Admin full access echeances" ON echeances;
DROP POLICY IF EXISTS "Collaborateur read echeances" ON echeances;
DROP POLICY IF EXISTS "Admin full access parametres" ON parametres;
DROP POLICY IF EXISTS "Collaborateur read parametres" ON parametres;

-- Profiles: chacun peut lire son propre profil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Profiles: admin peut tout gérer
CREATE POLICY "Admin can manage profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients: tout le monde peut lire et écrire
CREATE POLICY "Authenticated users can manage clients" ON clients
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Debits: tout le monde peut lire et ajouter
CREATE POLICY "Authenticated users can read debits" ON debits
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert debits" ON debits
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage debits" ON debits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reglements: tout le monde peut LIRE
CREATE POLICY "Authenticated users can read reglements" ON reglements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Reglements: seuls les admins peuvent AJOUTER/MODIFIER/SUPPRIMER
CREATE POLICY "Admin can manage reglements" ON reglements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Evenements: tout le monde peut lire et écrire
CREATE POLICY "Authenticated users can manage evenements" ON evenements
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Echeances: tout le monde peut lire
CREATE POLICY "Authenticated users can read echeances" ON echeances
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage echeances" ON echeances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parametres: tout le monde peut lire, admin peut modifier
CREATE POLICY "Authenticated users can read parametres" ON parametres
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage parametres" ON parametres
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Depots banque: seuls les admins
DROP POLICY IF EXISTS "Admin full access depots_banque" ON depots_banque;
DROP POLICY IF EXISTS "Seuls les admins voient les depots" ON depots_banque;

CREATE POLICY "Admin can manage depots_banque" ON depots_banque
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
