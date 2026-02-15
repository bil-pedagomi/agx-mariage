'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Loader2, X, Trash2, BarChart3, ArrowRight, CheckSquare, Square, Package } from 'lucide-react';
import { format } from 'date-fns';
import type { CategorieDebit } from '@/types/database';
import AdminGuard from '@/components/AdminGuard';

type PeriodFilter = 'tout' | 'annee' | 'mois' | 'custom';

// Chèque non déposé (panneau gauche)
interface ChequeEnCaisse {
  id: string;
  date: string;
  montant: number;
  client_id: string;
  nom_marie_1: string;
  prenom_marie_1: string;
  reference: string | null;
}

// Ligne dans le panneau droit (dépôts en banque)
interface DepotBanque {
  id: string;
  date: string;
  montant: number;
  mode: 'especes' | 'cheque';
  reference: string | null;
  notes: string | null;
}

interface RapportDebit {
  id: string;
  date: string;
  designation: string;
  categorie: CategorieDebit;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  montant_ttc: number;
  nom_marie_1: string;
  prenom_marie_1: string;
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function BanqueContent() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // Données principales
  const [chequesEnCaisse, setChequesEnCaisse] = useState<ChequeEnCaisse[]>([]);
  const [depots, setDepots] = useState<DepotBanque[]>([]);
  const [totalEspEncaisse, setTotalEspEncaisse] = useState(0);
  const [totalEspDepose, setTotalEspDepose] = useState(0);
  const [totalChqEncaisse, setTotalChqEncaisse] = useState(0);
  const [totalChqDepose, setTotalChqDepose] = useState(0);
  const [totalVirements, setTotalVirements] = useState(0);

  // Filtres période
  const [period, setPeriod] = useState<PeriodFilter>('annee');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Sélection chèques (dépôt en lot)
  const [selectedCheques, setSelectedCheques] = useState<Set<string>>(new Set());

  // Modal dépôt chèque(s)
  const [showDepotChequeModal, setShowDepotChequeModal] = useState(false);
  const [depotChequeDate, setDepotChequeDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [depotChequeIds, setDepotChequeIds] = useState<string[]>([]);
  const [savingCheque, setSavingCheque] = useState(false);

  // Modal dépôt espèces
  const [showDepotEspModal, setShowDepotEspModal] = useState(false);
  const [depotEspMontant, setDepotEspMontant] = useState('');
  const [depotEspDate, setDepotEspDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [depotEspReference, setDepotEspReference] = useState('');
  const [savingEsp, setSavingEsp] = useState(false);

  // Rapport comptable
  const [rapportMois, setRapportMois] = useState(new Date().getMonth());
  const [rapportAnnee, setRapportAnnee] = useState(new Date().getFullYear());
  const [rapportDebits, setRapportDebits] = useState<RapportDebit[]>([]);
  const [rapportLoading, setRapportLoading] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (period === 'annee') {
      return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
    }
    if (period === 'mois') {
      const y = now.getFullYear();
      const m = now.getMonth();
      return { start: format(new Date(y, m, 1), 'yyyy-MM-dd'), end: format(new Date(y, m + 1, 0), 'yyyy-MM-dd') };
    }
    if (period === 'custom' && (customStart || customEnd)) {
      return { start: customStart || '2000-01-01', end: customEnd || '2099-12-31' };
    }
    return { start: '2000-01-01', end: '2099-12-31' };
  }, [period, customStart, customEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    const [regEsp, regChq, regVir, depotsRes, chequesNonDeposes, regChqDeposes] = await Promise.all([
      // Total encaissé espèces
      supabase.from('reglements').select('montant').eq('mode', 'especes').gte('date', start).lte('date', end),
      // Total encaissé chèques (tous)
      supabase.from('reglements').select('montant').eq('mode', 'cheque').gte('date', start).lte('date', end),
      // Total virements
      supabase.from('reglements').select('montant').eq('mode', 'virement').gte('date', start).lte('date', end),
      // Dépôts en banque (panneau droit)
      supabase.from('depots_banque').select('*').gte('date', start).lte('date', end).order('date', { ascending: false }),
      // Chèques NON déposés (panneau gauche)
      supabase.from('reglements')
        .select('id, date, montant, client_id, reference, client:clients(nom_marie_1, prenom_marie_1)')
        .eq('mode', 'cheque')
        .eq('depose', false)
        .gte('date', start).lte('date', end)
        .order('date', { ascending: false }),
      // Chèques déposés (pour calcul)
      supabase.from('reglements').select('montant').eq('mode', 'cheque').eq('depose', true).gte('date', start).lte('date', end),
    ]);

    setTotalEspEncaisse((regEsp.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));
    setTotalChqEncaisse((regChq.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));
    setTotalVirements((regVir.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));

    const allDepots = (depotsRes.data || []) as DepotBanque[];
    setDepots(allDepots);
    setTotalEspDepose(allDepots.filter(d => d.mode === 'especes').reduce((s, d) => s + Number(d.montant), 0));
    setTotalChqDepose((regChqDeposes.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));

    setChequesEnCaisse((chequesNonDeposes.data || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      montant: Number(r.montant),
      client_id: r.client_id,
      reference: r.reference,
      nom_marie_1: r.client?.nom_marie_1 || '',
      prenom_marie_1: r.client?.prenom_marie_1 || '',
    })));

    setSelectedCheques(new Set());
    setLoading(false);
  }, [getDateRange]);

  useEffect(() => { load(); }, [load]);

  // Chargement du rapport comptable
  const loadRapport = useCallback(async () => {
    setRapportLoading(true);
    const startDate = format(new Date(rapportAnnee, rapportMois, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(rapportAnnee, rapportMois + 1, 0), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('debits')
      .select('id, date, designation, categorie, quantite, prix_unitaire_ht, taux_tva, montant_ttc, client:clients(nom_marie_1, prenom_marie_1)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (!error && data) {
      setRapportDebits(data.map((d: any) => ({
        id: d.id,
        date: d.date,
        designation: d.designation,
        categorie: d.categorie || 'location',
        quantite: Number(d.quantite),
        prix_unitaire_ht: Number(d.prix_unitaire_ht),
        taux_tva: Number(d.taux_tva),
        montant_ttc: Number(d.montant_ttc),
        nom_marie_1: d.client?.nom_marie_1 || '',
        prenom_marie_1: d.client?.prenom_marie_1 || '',
      })));
    } else {
      setRapportDebits([]);
    }
    setRapportLoading(false);
  }, [rapportMois, rapportAnnee]);

  useEffect(() => { loadRapport(); }, [loadRapport]);

  // Calculs rapport
  const rapportLocation = rapportDebits.filter(d => d.categorie === 'location');
  const rapportOptions = rapportDebits.filter(d => d.categorie === 'option');

  const calcTotals = (items: RapportDebit[]) => {
    const totalTTC = items.reduce((s, d) => s + d.montant_ttc, 0);
    const totalHT = items.reduce((s, d) => s + d.quantite * d.prix_unitaire_ht, 0);
    const totalTVA = totalTTC - totalHT;
    return { totalTTC, totalHT, totalTVA };
  };

  const locationTotals = calcTotals(rapportLocation);
  const optionsTotals = calcTotals(rapportOptions);
  const generalTotals = calcTotals(rapportDebits);
  const anneesDisponibles = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i);

  // Calculs récapitulatif
  const enCaisseEsp = totalEspEncaisse - totalEspDepose;
  const enCaisseChq = totalChqEncaisse - totalChqDepose;
  const totalBanque = totalEspDepose + totalChqDepose + totalVirements;
  const recapTotalEncaisse = totalEspEncaisse + totalChqEncaisse + totalVirements;
  const recapTotalCaisse = enCaisseEsp + enCaisseChq;
  const totalChequesEnCaisse = chequesEnCaisse.reduce((s, c) => s + c.montant, 0);

  // ===== ACTIONS =====

  // Déposer un ou plusieurs chèques
  const openDepotChequeModal = (chequeIds: string[]) => {
    setDepotChequeIds(chequeIds);
    setDepotChequeDate(format(new Date(), 'yyyy-MM-dd'));
    setShowDepotChequeModal(true);
  };

  const handleDepotCheques = async () => {
    if (depotChequeIds.length === 0) return;
    setSavingCheque(true);

    for (const chequeId of depotChequeIds) {
      const cheque = chequesEnCaisse.find(c => c.id === chequeId);
      if (!cheque) continue;

      // 1. Marquer le règlement comme déposé
      await supabase.from('reglements').update({
        depose: true,
        date_depot: depotChequeDate,
      }).eq('id', chequeId);

      // 2. Créer une ligne dans depots_banque
      await supabase.from('depots_banque').insert({
        date: depotChequeDate,
        montant: cheque.montant,
        mode: 'cheque' as const,
        reference: `${cheque.nom_marie_1} ${cheque.prenom_marie_1}`.trim(),
        notes: null,
      });
    }

    setSavingCheque(false);
    setShowDepotChequeModal(false);
    setSelectedCheques(new Set());
    load();
  };

  // Déposer des espèces
  const handleDepotEspeces = async () => {
    if (!depotEspMontant || Number(depotEspMontant) <= 0) return;
    setSavingEsp(true);

    await supabase.from('depots_banque').insert({
      date: depotEspDate,
      montant: Number(depotEspMontant),
      mode: 'especes' as const,
      reference: depotEspReference || null,
      notes: null,
    });

    setSavingEsp(false);
    setShowDepotEspModal(false);
    setDepotEspMontant('');
    setDepotEspReference('');
    load();
  };

  // Supprimer un dépôt
  const handleDeleteDepot = async (depot: DepotBanque) => {
    if (!confirm('Supprimer ce dépôt ? Si c\'est un chèque, il retournera dans la caisse.')) return;

    // Si c'est un dépôt de chèque, remettre le règlement en non-déposé
    if (depot.mode === 'cheque' && depot.reference) {
      // Trouver le règlement correspondant (même montant, même nom client, déposé)
      const { data: regs } = await supabase
        .from('reglements')
        .select('id, client:clients(nom_marie_1, prenom_marie_1)')
        .eq('mode', 'cheque')
        .eq('depose', true)
        .eq('montant', depot.montant);

      if (regs && regs.length > 0) {
        // Trouver celui qui correspond par le nom
        const match = regs.find((r: any) => {
          const fullName = `${r.client?.nom_marie_1 || ''} ${r.client?.prenom_marie_1 || ''}`.trim();
          return fullName === depot.reference;
        });
        if (match) {
          await supabase.from('reglements').update({ depose: false, date_depot: null }).eq('id', match.id);
        }
      }
    }

    await supabase.from('depots_banque').delete().eq('id', depot.id);
    load();
  };

  // Toggle sélection chèque
  const toggleCheque = (id: string) => {
    setSelectedCheques(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllCheques = () => {
    if (selectedCheques.size === chequesEnCaisse.length) {
      setSelectedCheques(new Set());
    } else {
      setSelectedCheques(new Set(chequesEnCaisse.map(c => c.id)));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Banque & Caisse</h1>
      </div>

      {/* Filtres période */}
      <div className="flex items-center gap-2 flex-wrap">
        {([['tout', 'Tout'], ['annee', 'Cette année'], ['mois', 'Ce mois'], ['custom', 'Personnalisé']] as [PeriodFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              period === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <span className="text-slate-400 text-sm">&rarr;</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        )}
      </div>

      {/* ===== TABLEAU RÉCAPITULATIF ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600"></th>
                <th className="text-right px-5 py-3 font-semibold text-blue-600">Total encaissé</th>
                <th className="text-right px-5 py-3 font-semibold text-amber-600">En caisse</th>
                <th className="text-right px-5 py-3 font-semibold text-emerald-600">En banque</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-700">Espèces</td>
                <td className="px-5 py-3 text-right font-semibold text-blue-700">{formatCurrency(totalEspEncaisse)}</td>
                <td className={`px-5 py-3 text-right font-semibold ${enCaisseEsp > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(enCaisseEsp)}</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatCurrency(totalEspDepose)}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-700">Chèques</td>
                <td className="px-5 py-3 text-right font-semibold text-blue-700">{formatCurrency(totalChqEncaisse)}</td>
                <td className={`px-5 py-3 text-right font-semibold ${enCaisseChq > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(enCaisseChq)}</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatCurrency(totalChqDepose)}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-700">Virements</td>
                <td className="px-5 py-3 text-right font-semibold text-blue-700">{formatCurrency(totalVirements)}</td>
                <td className="px-5 py-3 text-right text-slate-400">&mdash;</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatCurrency(totalVirements)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300">
                <td className="px-5 py-4 font-bold text-base text-slate-800">TOTAL</td>
                <td className="px-5 py-4 text-right font-bold text-base text-blue-700">{formatCurrency(recapTotalEncaisse)}</td>
                <td className={`px-5 py-4 text-right font-bold text-base ${recapTotalCaisse > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(recapTotalCaisse)}</td>
                <td className="px-5 py-4 text-right font-bold text-base text-emerald-600">{formatCurrency(totalBanque)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===== PANNEAUX CAISSE / BANQUE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── PANNEAU GAUCHE : EN CAISSE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-amber-50">
            <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <span className="text-lg">💵</span> EN CAISSE <span className="text-xs font-normal text-amber-600">(à déposer)</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Section Chèques */}
            <div className="p-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Chèques</h3>

              {chequesEnCaisse.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-2">Aucun chèque en caisse</p>
              ) : (
                <>
                  {/* Liste des chèques */}
                  <div className="space-y-2 mb-3">
                    {chequesEnCaisse.map((cheque) => (
                      <div key={cheque.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleCheque(cheque.id)}
                          className="flex-shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {selectedCheques.has(cheque.id) ? (
                            <CheckSquare size={20} className="text-blue-600" />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-400">{formatDate(cheque.date)}</span>
                            <span className="font-semibold text-slate-800 text-sm truncate">
                              {cheque.nom_marie_1} {cheque.prenom_marie_1}
                            </span>
                          </div>
                        </div>

                        {/* Montant */}
                        <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{formatCurrency(cheque.montant)}</span>

                        {/* Bouton dépôt unitaire */}
                        <button
                          onClick={() => openDepotChequeModal([cheque.id])}
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 transition-colors"
                          title="Déposer ce chèque"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Footer chèques */}
                  <div className="bg-slate-50 rounded-lg px-3 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {chequesEnCaisse.length} chèque{chequesEnCaisse.length !== 1 ? 's' : ''} en caisse
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(totalChequesEnCaisse)}</span>
                  </div>

                  {/* Actions lot */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={toggleAllCheques}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {selectedCheques.size === chequesEnCaisse.length ? 'Tout décocher' : 'Tout sélectionner'}
                    </button>
                    {selectedCheques.size > 0 && (
                      <button
                        onClick={() => openDepotChequeModal(Array.from(selectedCheques))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
                      >
                        <ArrowRight size={14} />
                        Déposer la sélection ({selectedCheques.size})
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Section Espèces */}
            <div className="p-4">
              <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Espèces</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Total en caisse :</span>
                <span className={`text-xl font-bold ${enCaisseEsp > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(enCaisseEsp)}
                </span>
              </div>
              <button
                onClick={() => {
                  setDepotEspMontant('');
                  setDepotEspDate(format(new Date(), 'yyyy-MM-dd'));
                  setDepotEspReference('');
                  setShowDepotEspModal(true);
                }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2"
              >
                <Package size={16} />
                Déposer des espèces en banque
              </button>
            </div>
          </div>
        </div>

        {/* ── PANNEAU DROIT : EN BANQUE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <span className="text-lg">🏦</span> EN BANQUE <span className="text-xs font-normal text-emerald-600">(déposé)</span>
            </h2>
          </div>

          {depots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <p className="text-sm">Aucun dépôt enregistré</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Mode</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Détail</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-slate-600">Montant</th>
                      <th className="px-2 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {depots.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(d.date)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            d.mode === 'especes' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>{d.mode === 'especes' ? 'Espèces' : 'Chèque'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 truncate max-w-[180px]">{d.reference || d.notes || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(d.montant)}</td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => handleDeleteDepot(d)}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Annuler ce dépôt"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">{depots.length} dépôt{depots.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Total déposé :</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(depots.reduce((s, d) => s + Number(d.montant), 0))}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== RAPPORT COMPTABLE MENSUEL ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700">Rapport comptable mensuel</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Période :</span>
            <select
              value={rapportMois}
              onChange={(e) => setRapportMois(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {MOIS_LABELS.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
            <select
              value={rapportAnnee}
              onChange={(e) => setRapportAnnee(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {anneesDisponibles.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {rapportLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rapportDebits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p className="text-sm">Aucun débit enregistré pour {MOIS_LABELS[rapportMois]} {rapportAnnee}</p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* CA Location */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
                Chiffre d&apos;affaires — Location salle
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide">Total TTC</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(locationTotals.totalTTC)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide">Total HT</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(locationTotals.totalHT)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide">TVA collectée</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(locationTotals.totalTVA)}</p>
                </div>
              </div>
            </div>

            {/* Tableau détail des débits */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Détail des débits — {MOIS_LABELS[rapportMois]} {rapportAnnee}
              </h3>
              <div className="overflow-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Client</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Désignation</th>
                      <th className="text-center px-2 py-2.5 text-xs font-semibold text-slate-600">Cat.</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">HT</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">TVA</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapportDebits.map((d, i) => {
                      const ht = d.quantite * d.prix_unitaire_ht;
                      const tva = d.montant_ttc - ht;
                      return (
                        <tr key={d.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                          <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(d.date)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                            {d.nom_marie_1} {d.prenom_marie_1}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{d.designation}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              d.categorie === 'location' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {d.categorie === 'location' ? 'Loc.' : 'Opt.'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(ht)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(tva)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatCurrency(d.montant_ttc)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300">
                      <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(generalTotals.totalHT)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">{formatCurrency(generalTotals.totalTVA)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(generalTotals.totalTTC)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Récap Options */}
            {rapportOptions.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3">
                  Récap Options (pour info)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-purple-500 uppercase tracking-wide">Total TTC</p>
                    <p className="text-lg font-bold text-purple-900">{formatCurrency(optionsTotals.totalTTC)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-500 uppercase tracking-wide">Total HT</p>
                    <p className="text-lg font-bold text-purple-900">{formatCurrency(optionsTotals.totalHT)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-500 uppercase tracking-wide">TVA collectée</p>
                    <p className="text-lg font-bold text-purple-900">{formatCurrency(optionsTotals.totalTVA)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Général */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                Total Général
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-emerald-500 uppercase tracking-wide">CA Total HT</p>
                  <p className="text-xl font-bold text-emerald-900">{formatCurrency(generalTotals.totalHT)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500 uppercase tracking-wide">TVA collectée totale</p>
                  <p className="text-xl font-bold text-emerald-900">{formatCurrency(generalTotals.totalTVA)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500 uppercase tracking-wide">CA Total TTC</p>
                  <p className="text-xl font-bold text-emerald-900">{formatCurrency(generalTotals.totalTTC)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL DÉPÔT CHÈQUE(S) ===== */}
      {showDepotChequeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDepotChequeModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Déposer {depotChequeIds.length > 1 ? `${depotChequeIds.length} chèques` : 'un chèque'}</h3>
              <button onClick={() => setShowDepotChequeModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>

            {/* Résumé */}
            <div className="bg-blue-50 rounded-lg px-4 py-3 space-y-1">
              {depotChequeIds.map(id => {
                const cheque = chequesEnCaisse.find(c => c.id === id);
                return cheque ? (
                  <div key={id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{cheque.nom_marie_1} {cheque.prenom_marie_1}</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(cheque.montant)}</span>
                  </div>
                ) : null;
              })}
              {depotChequeIds.length > 1 && (
                <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between text-sm">
                  <span className="font-bold text-blue-700">Total</span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(depotChequeIds.reduce((s, id) => {
                      const c = chequesEnCaisse.find(ch => ch.id === id);
                      return s + (c?.montant || 0);
                    }, 0))}
                  </span>
                </div>
              )}
            </div>

            {/* Date du dépôt */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date du dépôt</label>
              <input type="date" value={depotChequeDate} onChange={(e) => setDepotChequeDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowDepotChequeModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button onClick={handleDepotCheques} disabled={savingCheque}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                {savingCheque && <Loader2 size={14} className="animate-spin" />}
                Confirmer le dépôt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DÉPÔT ESPÈCES ===== */}
      {showDepotEspModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDepotEspModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Déposer des espèces</h3>
              <button onClick={() => setShowDepotEspModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>

            {/* Info caisse */}
            <div className="bg-amber-50 rounded-lg px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">En caisse actuellement :</span>
                <span className={`font-bold ${enCaisseEsp > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(enCaisseEsp)}</span>
              </div>
            </div>

            {/* Montant */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Montant à déposer (DT)</label>
              <input type="number" min={0} step={0.01} value={depotEspMontant} onChange={(e) => setDepotEspMontant(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date du dépôt</label>
              <input type="date" value={depotEspDate} onChange={(e) => setDepotEspDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Référence */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Référence / N° bordereau</label>
              <input type="text" value={depotEspReference} onChange={(e) => setDepotEspReference(e.target.value)}
                placeholder="N° bordereau de versement"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowDepotEspModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button onClick={handleDepotEspeces} disabled={savingEsp || !depotEspMontant || Number(depotEspMontant) <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                {savingEsp && <Loader2 size={14} className="animate-spin" />}
                Confirmer le dépôt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BanquePage() {
  return <AdminGuard><BanqueContent /></AdminGuard>;
}
