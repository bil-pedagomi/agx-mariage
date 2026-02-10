import type { StatutDossier, ModePaiement, TypeEvenement, CategorieDebit } from '@/types/database';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export const STATUT_LABELS: Record<StatutDossier, string> = {
  prospect: 'Prospect',
  en_cours: 'En cours',
  confirme: 'Confirmé',
  termine: 'Terminé',
  annule: 'Annulé',
};

export const STATUT_COLORS: Record<StatutDossier, string> = {
  prospect: 'bg-gray-100 text-gray-600',
  en_cours: 'bg-blue-100 text-blue-700',
  confirme: 'bg-emerald-100 text-emerald-700',
  termine: 'bg-purple-100 text-purple-700',
  annule: 'bg-red-100 text-red-700',
};

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  cb: 'CB',
  virement: 'Virement',
  especes: 'Espèces',
  cheque: 'Chèque',
};

export const TYPE_EVENEMENT_LABELS: Record<TypeEvenement, string> = {
  mariage: 'Mariage',
  rdv_preparation: 'RDV Préparation',
  reperage_lieu: 'Repérage lieu',
  autre: 'Autre',
};

export const TYPE_EVENEMENT_COLORS: Record<TypeEvenement, string> = {
  mariage: '#3b82f6',
  rdv_preparation: '#22c55e',
  reperage_lieu: '#f59e0b',
  autre: '#94a3b8',
};

export const CATEGORIE_DEBIT_LABELS: Record<CategorieDebit, string> = {
  location: 'Location',
  option: 'Option',
};

export const TYPES_PRESTATION = [
  'DJ/Musique',
  'Décoration',
  'Coordination jour J',
  'Forfait global personnalisé',
  'Autre',
];

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DT';
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Convertit un nombre en lettres (français) — pour les contrats */
export function numberToWords(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + numberToWords(-n);

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);

  function convert(num: number): string {
    if (num === 0) return '';
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7 || t === 9) {
        return tens[t] + (u === 1 && t === 7 ? '-et-' : '-') + units[u + 10];
      }
      if (u === 0) return tens[t] + (t === 8 ? 's' : '');
      if (u === 1 && t !== 8) return tens[t] + '-et-un';
      return tens[t] + '-' + units[u];
    }
    if (num < 1000) {
      const h = Math.floor(num / 100);
      const rest = num % 100;
      const prefix = h === 1 ? 'cent' : units[h] + '-cent';
      if (rest === 0) return prefix + (h > 1 ? 's' : '');
      return prefix + '-' + convert(rest);
    }
    if (num < 1000000) {
      const th = Math.floor(num / 1000);
      const rest = num % 1000;
      const prefix = th === 1 ? 'mille' : convert(th) + '-mille';
      if (rest === 0) return prefix;
      return prefix + '-' + convert(rest);
    }
    const m = Math.floor(num / 1000000);
    const rest = num % 1000000;
    const prefix = m === 1 ? 'un million' : convert(m) + ' millions';
    if (rest === 0) return prefix;
    return prefix + ' ' + convert(rest);
  }

  let result = convert(intPart);
  if (decPart > 0) {
    result += ' dinars et ' + convert(decPart) + ' millimes';
  } else {
    result += ' dinars';
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}
