'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { formatDate, formatCurrency, MODE_PAIEMENT_LABELS } from '@/lib/utils';
import { Loader2, Plus, X, Banknote, FileText, Landmark, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PeriodFilter = 'tout' | 'annee' | 'mois' | 'custom';

interface Depot {
  id: string;
  date: string;
  montant: number;
  mode: 'especes' | 'cheque';
  reference: string | null;
  notes: string | null;
}

interface Encaissement {
  id: string;
  date: string;
  montant: number;
  mode: string;
  client_id: string;
  nom_marie_1: string;
  prenom_marie_1: string;
}

export default function BanquePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [totalEspEncaisse, setTotalEspEncaisse] = useState(0);
  const [totalEspDepose, setTotalEspDepose] = useState(0);
  const [totalChqEncaisse, setTotalChqEncaisse] = useState(0);
  const [totalChqDepose, setTotalChqDepose] = useState(0);
  const [totalVirements, setTotalVirements] = useState(0);

  // Filtres période
  const [period, setPeriod] = useState<PeriodFilter>('tout');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Modal nouveau dépôt
  const [showModal, setShowModal] = useState(false);
  const [newDepot, setNewDepot] = useState({ date: format(new Date(), 'yyyy-MM-dd'), montant: '', mode: 'especes' as 'especes' | 'cheque', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

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

    const [regEsp, regChq, regVir, depotsRes, encRes] = await Promise.all([
      // Total encaissé espèces
      supabase.from('reglements').select('montant').eq('mode', 'especes').gte('date', start).lte('date', end),
      // Total encaissé chèques
      supabase.from('reglements').select('montant').eq('mode', 'cheque').gte('date', start).lte('date', end),
      // Total virements
      supabase.from('reglements').select('montant').eq('mode', 'virement').gte('date', start).lte('date', end),
      // Dépôts en banque
      supabase.from('depots_banque').select('*').gte('date', start).lte('date', end).order('date', { ascending: false }),
      // Encaissements espèces + chèques (pour le tableau détail)
      supabase.from('reglements')
        .select('id, date, montant, mode, client_id, client:clients(nom_marie_1, prenom_marie_1)')
        .in('mode', ['especes', 'cheque'])
        .gte('date', start).lte('date', end)
        .order('date', { ascending: false }),
    ]);

    setTotalEspEncaisse((regEsp.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));
    setTotalChqEncaisse((regChq.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));
    setTotalVirements((regVir.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0));

    const allDepots = (depotsRes.data || []) as Depot[];
    setDepots(allDepots);
    setTotalEspDepose(allDepots.filter(d => d.mode === 'especes').reduce((s, d) => s + Number(d.montant), 0));
    setTotalChqDepose(allDepots.filter(d => d.mode === 'cheque').reduce((s, d) => s + Number(d.montant), 0));

    setEncaissements((encRes.data || []).map((r: any) => ({
      id: r.id, date: r.date, montant: Number(r.montant), mode: r.mode, client_id: r.client_id,
      nom_marie_1: r.client?.nom_marie_1 || '', prenom_marie_1: r.client?.prenom_marie_1 || '',
    })));

    setLoading(false);
  }, [getDateRange]);

  useEffect(() => { load(); }, [load]);

  const enCaisseEsp = totalEspEncaisse - totalEspDepose;
  const enCaisseChq = totalChqEncaisse - totalChqDepose;
  const totalBanque = totalEspDepose + totalChqDepose + totalVirements;
  const totalDepots = depots.reduce((s, d) => s + Number(d.montant), 0);
  const totalEncaissements = encaissements.reduce((s, e) => s + e.montant, 0);

  const handleSaveDepot = async () => {
    if (!newDepot.montant || Number(newDepot.montant) <= 0) return;
    setSaving(true);
    await supabase.from('depots_banque').insert({
      date: newDepot.date,
      montant: Number(newDepot.montant),
      mode: newDepot.mode,
      reference: newDepot.reference || null,
      notes: newDepot.notes || null,
    });
    setShowModal(false);
    setNewDepot({ date: format(new Date(), 'yyyy-MM-dd'), montant: '', mode: 'especes', reference: '', notes: '' });
    setSaving(false);
    load();
  };

  const handleDeleteDepot = async (id: string) => {
    if (!confirm('Supprimer ce dépôt ?')) return;
    await supabase.from('depots_banque').delete().eq('id', id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
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
            <span className="text-slate-400 text-sm">→</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        )}
      </div>

      {/* Cards de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Caisse Espèces */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Banknote className="w-4 h-4 text-red-500" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Caisse Espèces</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Encaissé</span><span className="font-medium text-slate-900">{formatCurrency(totalEspEncaisse)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Déposé</span><span className="font-medium text-slate-900">{formatCurrency(totalEspDepose)}</span></div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="font-semibold text-slate-700">En caisse</span>
              <span className={`font-bold ${enCaisseEsp > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(enCaisseEsp)}</span>
            </div>
          </div>
        </div>

        {/* Caisse Chèques */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-500" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Caisse Chèques</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Encaissé</span><span className="font-medium text-slate-900">{formatCurrency(totalChqEncaisse)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Déposé</span><span className="font-medium text-slate-900">{formatCurrency(totalChqDepose)}</span></div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="font-semibold text-slate-700">En caisse</span>
              <span className={`font-bold ${enCaisseChq > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(enCaisseChq)}</span>
            </div>
          </div>
        </div>

        {/* Total Banque */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Landmark className="w-4 h-4 text-emerald-600" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Total Banque</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Dépôts espèces</span><span className="font-medium text-slate-900">{formatCurrency(totalEspDepose)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Dépôts chèques</span><span className="font-medium text-slate-900">{formatCurrency(totalChqDepose)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Virements</span><span className="font-medium text-slate-900">{formatCurrency(totalVirements)}</span></div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="font-semibold text-slate-700">Total en banque</span>
              <span className="font-bold text-emerald-600">{formatCurrency(totalBanque)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des dépôts */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Dépôts en banque</h2>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5">
            <Plus size={14} /> Nouveau dépôt
          </button>
        </div>
        {depots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400"><p className="text-sm">Aucun dépôt enregistré</p></div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Mode</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Référence</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Notes</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Montant</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {depots.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{formatDate(d.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        d.mode === 'especes' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{d.mode === 'especes' ? 'Espèces' : 'Chèque'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.reference || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{d.notes || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(d.montant)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteDepot(d.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">{depots.length} dépôt{depots.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Total déposé :</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalDepots)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tableau des encaissements */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Détail des encaissements (espèces + chèques)</h2>
        </div>
        {encaissements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400"><p className="text-sm">Aucun encaissement sur cette période</p></div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Mode</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Montant</th>
                </tr>
              </thead>
              <tbody>
                {encaissements.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{e.nom_marie_1} {e.prenom_marie_1}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        e.mode === 'especes' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{e.mode === 'especes' ? 'Espèces' : 'Chèque'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(e.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">{encaissements.length} encaissement{encaissements.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Total encaissé :</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(totalEncaissements)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Nouveau dépôt */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Enregistrer un dépôt en banque</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>

            {/* Mode */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewDepot({ ...newDepot, mode: 'especes' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    newDepot.mode === 'especes' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Espèces
                </button>
                <button
                  onClick={() => setNewDepot({ ...newDepot, mode: 'cheque' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    newDepot.mode === 'cheque' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Chèque
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date</label>
              <input type="date" value={newDepot.date} onChange={(e) => setNewDepot({ ...newDepot, date: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Montant */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Montant (DT)</label>
              <input type="number" min={0} step={0.01} value={newDepot.montant} onChange={(e) => setNewDepot({ ...newDepot, montant: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Référence */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Référence</label>
              <input type="text" value={newDepot.reference} onChange={(e) => setNewDepot({ ...newDepot, reference: e.target.value })}
                placeholder="N° bordereau ou N° chèque"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Notes</label>
              <textarea value={newDepot.notes} onChange={(e) => setNewDepot({ ...newDepot, notes: e.target.value })}
                placeholder="Texte libre..."
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button onClick={handleSaveDepot} disabled={saving || !newDepot.montant}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
