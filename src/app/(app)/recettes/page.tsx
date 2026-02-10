'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { formatDate, formatCurrency, MODE_PAIEMENT_LABELS } from '@/lib/utils';
import type { ModePaiement } from '@/types/database';
import { ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, subWeeks, addMonths, subMonths, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Suspense } from 'react';

type ViewMode = 'jour' | 'semaine' | 'mois';

const MODE_COLORS: Record<string, string> = {
  cheque: 'bg-blue-100 text-blue-700 border-blue-300',
  virement: 'bg-orange-100 text-orange-700 border-orange-300',
  especes: 'bg-red-100 text-red-700 border-red-300',
  cb: 'bg-slate-100 text-slate-700 border-slate-300',
};

const MODE_ACTIVE_COLORS: Record<string, string> = {
  cheque: 'bg-blue-600 text-white border-blue-600',
  virement: 'bg-orange-500 text-white border-orange-500',
  especes: 'bg-red-600 text-white border-red-600',
  cb: 'bg-slate-600 text-white border-slate-600',
};

interface RecetteLine {
  id: string;
  date: string;
  mode: ModePaiement;
  reference: string | null;
  montant: number;
  client_id: string;
  nom_marie_1: string;
  prenom_marie_1: string;
  nom_marie_2: string | null;
}

function RecettesPageInner() {
  const [recettes, setRecettes] = useState<RecetteLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('semaine');
  const [refDate, setRefDate] = useState(new Date());
  const [initialized, setInitialized] = useState(false);
  const [filterMode, setFilterMode] = useState<ModePaiement | ''>('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lire le paramètre ?mois=2025-01 au chargement
  useEffect(() => {
    const moisParam = searchParams.get('mois');
    if (moisParam && /^\d{4}-\d{2}$/.test(moisParam)) {
      const [year, month] = moisParam.split('-').map(Number);
      setRefDate(new Date(year, month - 1, 1));
      setView('mois');
    }
    setInitialized(true);
  }, [searchParams]);

  const getRange = useCallback(() => {
    // Si filtre par date personnalisé, on utilise ces dates
    if (dateDebut && dateFin) {
      return { start: dateDebut, end: dateFin };
    }
    if (dateDebut) {
      return { start: dateDebut, end: '2099-12-31' };
    }
    if (dateFin) {
      return { start: '2000-01-01', end: dateFin };
    }
    if (view === 'jour') return { start: format(refDate, 'yyyy-MM-dd'), end: format(refDate, 'yyyy-MM-dd') };
    if (view === 'semaine') {
      const s = startOfWeek(refDate, { weekStartsOn: 1 });
      return { start: format(s, 'yyyy-MM-dd'), end: format(endOfWeek(refDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
    }
    const s = startOfMonth(refDate);
    return { start: format(s, 'yyyy-MM-dd'), end: format(endOfMonth(refDate), 'yyyy-MM-dd') };
  }, [view, refDate, dateDebut, dateFin]);

  const load = useCallback(async () => {
    if (!initialized) return;
    setLoading(true);
    const { start, end } = getRange();
    let query = supabase
      .from('reglements')
      .select('id, date, mode, reference, montant, client_id, client:clients(nom_marie_1, prenom_marie_1, nom_marie_2)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (filterMode) {
      query = query.eq('mode', filterMode);
    }

    const { data } = await query;

    if (data) {
      setRecettes(data.map((r: any) => ({
        id: r.id, date: r.date, mode: r.mode, reference: r.reference, montant: Number(r.montant), client_id: r.client_id,
        nom_marie_1: r.client?.nom_marie_1 || '', prenom_marie_1: r.client?.prenom_marie_1 || '', nom_marie_2: r.client?.nom_marie_2 || null,
      })));
    }
    setLoading(false);
  }, [getRange, initialized, filterMode]);

  useEffect(() => { load(); }, [load]);

  const total = recettes.reduce((s, r) => s + r.montant, 0);

  const prev = () => {
    if (dateDebut || dateFin) return; // Pas de navigation si filtre date actif
    if (view === 'jour') setRefDate(subDays(refDate, 1));
    else if (view === 'semaine') setRefDate(subWeeks(refDate, 1));
    else setRefDate(subMonths(refDate, 1));
  };
  const next = () => {
    if (dateDebut || dateFin) return;
    if (view === 'jour') setRefDate(addDays(refDate, 1));
    else if (view === 'semaine') setRefDate(addWeeks(refDate, 1));
    else setRefDate(addMonths(refDate, 1));
  };

  const { start, end } = getRange();
  const hasDateFilter = dateDebut || dateFin;
  const periodLabel = hasDateFilter
    ? `${dateDebut ? format(new Date(dateDebut + 'T00:00:00'), 'd MMM yyyy', { locale: fr }) : '...'} → ${dateFin ? format(new Date(dateFin + 'T00:00:00'), 'd MMM yyyy', { locale: fr }) : '...'}`
    : view === 'jour' ? format(refDate, 'EEEE d MMMM yyyy', { locale: fr })
    : view === 'semaine' ? `${format(new Date(start), 'd MMM', { locale: fr })} au ${format(new Date(end), 'd MMM yyyy', { locale: fr })}`
    : format(refDate, 'MMMM yyyy', { locale: fr });

  const toggleMode = (mode: ModePaiement) => {
    setFilterMode(filterMode === mode ? '' : mode);
  };

  const clearFilters = () => {
    setFilterMode('');
    setDateDebut('');
    setDateFin('');
    setShowFilters(false);
  };

  const hasActiveFilters = filterMode || dateDebut || dateFin;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Recettes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
            Filtres
            {hasActiveFilters && <span className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{(filterMode ? 1 : 0) + (dateDebut || dateFin ? 1 : 0)}</span>}
          </button>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {(['jour', 'semaine', 'mois'] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => { setView(v); setDateDebut(''); setDateFin(''); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${view === v && !hasDateFilter ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          {/* Mode de règlement */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Mode de règlement</label>
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.keys(MODE_PAIEMENT_LABELS) as ModePaiement[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => toggleMode(mode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filterMode === mode ? MODE_ACTIVE_COLORS[mode] : MODE_COLORS[mode]
                  }`}
                >
                  {MODE_PAIEMENT_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Plage de dates */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Plage de dates</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-slate-400 text-sm">→</span>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Period nav */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3">
        <button onClick={prev} disabled={!!hasDateFilter} className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${hasDateFilter ? 'opacity-30 cursor-not-allowed' : ''}`}><ChevronLeft size={18} className="text-slate-500" /></button>
        <p className="text-sm font-semibold text-slate-700 capitalize">{periodLabel}</p>
        <button onClick={next} disabled={!!hasDateFilter} className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${hasDateFilter ? 'opacity-30 cursor-not-allowed' : ''}`}><ChevronRight size={18} className="text-slate-500" /></button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
        ) : recettes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400"><p className="text-sm">Aucune recette sur cette période</p></div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Mode</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Référence</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recettes.map((r) => (
                  <tr key={r.id} onClick={() => router.push(`/clients/${r.client_id}/compte`)} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {r.nom_marie_1} {r.prenom_marie_1}{r.nom_marie_2 ? ` & ${r.nom_marie_2}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.mode === 'cheque' ? 'bg-blue-100 text-blue-700' :
                        r.mode === 'virement' ? 'bg-orange-100 text-orange-700' :
                        r.mode === 'especes' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>{MODE_PAIEMENT_LABELS[r.mode]}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{r.reference || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(r.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">{recettes.length} règlement{recettes.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Total :</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RecettesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <RecettesPageInner />
    </Suspense>
  );
}
