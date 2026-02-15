export type UserRole = 'admin' | 'collaborateur' | 'secretaire';

export type StatutDossier = 'prospect' | 'en_cours' | 'confirme' | 'termine' | 'annule';

export type ModePaiement = 'cb' | 'virement' | 'especes' | 'cheque';

export type TypeEvenement = 'mariage' | 'rdv_preparation' | 'reperage_lieu' | 'autre';

export type CategorieDebit = 'location' | 'option';

export type TypePrestation =
  | 'DJ/Musique'
  | 'Décoration'
  | 'Coordination jour J'
  | 'Forfait global personnalisé'
  | 'Autre';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: string;
  nom_marie_1: string;
  prenom_marie_1: string;
  nom_marie_2: string | null;
  prenom_marie_2: string | null;
  telephone_1: string | null;
  telephone_2: string | null;
  email_1: string | null;
  email_2: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  date_mariage: string | null;
  lieu_ceremonie: string | null;
  lieu_reception: string | null;
  nombre_invites: number | null;
  type_prestation: string[];
  formule: string | null;
  statut: StatutDossier;
  referent: string | null;
  memo: string | null;
  date_inscription: string;
  archived: boolean;
  cin_passeport: string | null;
  heure_debut: string | null;
  heure_fin: string | null;
  created_at: string;
  updated_at: string;
}

export interface Debit {
  id: string;
  client_id: string;
  date: string;
  quantite: number;
  designation: string;
  prix_unitaire_ht: number;
  taux_tva: number;
  montant_ttc: number;
  categorie: CategorieDebit;
  created_at: string;
}

export interface Reglement {
  id: string;
  client_id: string;
  date: string;
  mode: ModePaiement;
  reference: string | null;
  montant: number;
  depose: boolean;
  date_depot: string | null;
  created_at: string;
}

export interface Evenement {
  id: string;
  client_id: string | null;
  titre: string;
  type: TypeEvenement;
  date_debut: string;
  date_fin: string;
  couleur: string;
  notes: string | null;
  created_at: string;
}

export interface Echeance {
  id: string;
  client_id: string;
  date_echeance: string;
  montant: number;
  libelle: string | null;
  payee: boolean;
  created_at: string;
}

export interface Parametres {
  id: string;
  nom_entreprise: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  siret: string | null;
  logo_url: string | null;
  conditions_paiement: string | null;
  mentions_legales: string | null;
  nom_gerant: string | null;
}

export interface Contrat {
  id: string;
  client_id: string;
  numero: number;
  type: 'location' | 'options';
  date_generation: string;
  pdf_url: string | null;
}
