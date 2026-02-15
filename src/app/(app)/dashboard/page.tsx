'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Client } from '@/types/database';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Calendar, AlertTriangle, Heart, DollarSign, Users, ChevronLeft, ChevronRight, Landmark, Eye, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ caMois: 0, caAnnee: 0, mariagesMois: 0, impayesCount: 0, impayesMontant: 0 });
  const [prochains, setProchains] = useState<Client[]>([]);
  const [caParMois, setCaParMois] = useState<number[]>(new Array(12).fill(0));
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [chartLoading, setChartLoading] = useState(false);
  const [mariagesParMois, setMariagesParMois] = useState<number[]>(new Array(12).fill(0));
  const [mariagesYear, setMariagesYear] = useState(new Date().getFullYear());
  const [mariagesLoading, setMariagesLoading] = useState(false);
  const [caisse, setCaisse] = useState({ especes: 0, cheques: 0, total: 0 });
  const [alertes, setAlertes] = useState<{ id: string; nom: string; date_mariage: string; jours: number; totalDu: number; totalPaye: number; reste: number }[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startMonth = new Date(year, month, 1).toISOString().split('T')[0];
    const endMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const startYear = `${year}-01-01`;
    const endYear = `${year}-12-31`;

    const today = now.toISOString().split('T')[0];
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [regMois, regAnnee, mariages, prochainsRes, allDebits, allReglements, mariagesAnnee, regEspeces, regCheques, depotsEspeces, depotsCheques, alerteClientsRes] = await Promise.all([
      supabase.from('reglements').select('montant').gte('date', startMonth).lte('date', endMonth),
      supabase.from('reglements').select('montant, date').gte('date', startYear).lte('date', endYear),
      supabase.from('clients').select('id', { count: 'exact' }).neq('statut', 'annule').gte('date_mariage', startMonth).lte('date_mariage', endMonth),
      supabase.from('clients').select('*').gte('date_mariage', today).eq('archived', false).order('date_mariage').limit(5),
      supabase.from('debits').select('client_id, montant_ttc'),
      supabase.from('reglements').select('client_id, montant'),
      supabase.from('clients').select('date_mariage').neq('statut', 'annule').gte('date_mariage', startYear).lte('date_mariage', endYear),
      // Caisse: total encaissé espèces & chèques
      supabase.from('reglements').select('montant').eq('mode', 'especes'),
      supabase.from('reglements').select('montant').eq('mode', 'cheque'),
      // Caisse: total déposé en banque
      supabase.from('depots_banque').select('montant').eq('mode', 'especes'),
      supabase.from('depots_banque').select('montant').eq('mode', 'cheque'),
      // Alertes: clients à moins de 30 jours, non annulés/terminés, non archivés
      supabase.from('clients').select('id, nom_marie_1, prenom_marie_1, date_mariage, statut')
        .gte('date_mariage', today).lte('date_mariage', in30Days)
        .not('statut', 'in', '("annule","termine")')
        .eq('archived', false)
        .order('date_mariage', { ascending: true }),
    ]);

    const caMois = (regMois.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0);
    const caAnnee = (regAnnee.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0);

    // CA par mois
    const monthly = new Array(12).fill(0);
    (regAnnee.data || []).forEach((r: any) => {
      const m = new Date(r.date).getMonth();
      monthly[m] += Number(r.montant);
    });
    setCaParMois(monthly);

    // Mariages par mois
    const mariagesMonthly = new Array(12).fill(0);
    (mariagesAnnee.data || []).forEach((c: any) => {
      if (c.date_mariage) {
        const m = new Date(c.date_mariage).getMonth();
        mariagesMonthly[m]++;
      }
    });
    setMariagesParMois(mariagesMonthly);

    // Impayés: clients where total debits > total reglements
    const debitsByClient: Record<string, number> = {};
    const reglByClient: Record<string, number> = {};
    (allDebits.data || []).forEach((d: any) => { debitsByClient[d.client_id] = (debitsByClient[d.client_id] || 0) + Number(d.montant_ttc); });
    (allReglements.data || []).forEach((r: any) => { reglByClient[r.client_id] = (reglByClient[r.client_id] || 0) + Number(r.montant); });
    let impayesCount = 0;
    let impayesMontant = 0;
    Object.keys(debitsByClient).forEach((cid) => {
      const solde = debitsByClient[cid] - (reglByClient[cid] || 0);
      if (solde > 0) { impayesCount++; impayesMontant += solde; }
    });

    // Caisse
    const totalEspEncaisse = (regEspeces.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0);
    const totalChqEncaisse = (regCheques.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0);
    const totalEspDepose = (depotsEspeces.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0);
    const totalChqDepose = (depotsCheques.data || []).reduce((s: number, r: any) => s + Number(r.montant), 0);
    const enCaisseEsp = totalEspEncaisse - totalEspDepose;
    const enCaisseChq = totalChqEncaisse - totalChqDepose;
    setCaisse({ especes: enCaisseEsp, cheques: enCaisseChq, total: enCaisseEsp + enCaisseChq });

    // Alertes paiements: clients à < 30 jours avec solde > 0
    const alertesList: typeof alertes = [];
    (alerteClientsRes.data || []).forEach((c: any) => {
      const totalDu = debitsByClient[c.id] || 0;
      const totalPaye = reglByClient[c.id] || 0;
      const reste = totalDu - totalPaye;
      if (reste > 0.01) {
        const mariageDate = new Date(c.date_mariage + 'T00:00:00');
        const diffMs = mariageDate.getTime() - now.getTime();
        const jours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        alertesList.push({
          id: c.id,
          nom: `${c.nom_marie_1} ${c.prenom_marie_1}`.trim(),
          date_mariage: c.date_mariage,
          jours,
          totalDu,
          totalPaye,
          reste,
        });
      }
    });
    setAlertes(alertesList);

    setStats({ caMois, caAnnee, mariagesMois: mariages.count || 0, impayesCount, impayesMontant });
    setProchains(prochainsRes.data || []);
    setLoading(false);
  };

  // Charger le CA mensuel pour une année donnée
  const loadChartYear = useCallback(async (year: number) => {
    setChartLoading(true);
    const startYear = `${year}-01-01`;
    const endYear = `${year}-12-31`;
    const { data } = await supabase.from('reglements').select('montant, date').gte('date', startYear).lte('date', endYear);
    const monthly = new Array(12).fill(0);
    (data || []).forEach((r: any) => {
      const m = new Date(r.date).getMonth();
      monthly[m] += Number(r.montant);
    });
    setCaParMois(monthly);
    setChartLoading(false);
  }, []);

  // Charger les mariages par mois pour une année donnée
  const loadMariagesYear = useCallback(async (year: number) => {
    setMariagesLoading(true);
    const startYear = `${year}-01-01`;
    const endYear = `${year}-12-31`;
    const { data } = await supabase.from('clients').select('date_mariage').neq('statut', 'annule').gte('date_mariage', startYear).lte('date_mariage', endYear);
    const monthly = new Array(12).fill(0);
    (data || []).forEach((c: any) => {
      if (c.date_mariage) {
        const m = new Date(c.date_mariage).getMonth();
        monthly[m]++;
      }
    });
    setMariagesParMois(monthly);
    setMariagesLoading(false);
  }, []);

  const changeMariagesYear = (delta: number) => {
    const newYear = mariagesYear + delta;
    setMariagesYear(newYear);
    loadMariagesYear(newYear);
  };

  // Quand on change d'année sur le graphique
  const changeChartYear = (delta: number) => {
    const newYear = chartYear + delta;
    setChartYear(newYear);
    loadChartYear(newYear);
  };

  const maxCa = Math.max(...caParMois, 1);
  const maxMariages = Math.max(...mariagesParMois, 1);
  const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const chartTotal = caParMois.reduce((s, v) => s + v, 0);
  const totalMariages = mariagesParMois.reduce((s, v) => s + v, 0);

  // Nombre de jours par mois pour l'année du graphique mariages
  const joursParMois = Array.from({ length: 12 }, (_, i) => new Date(mariagesYear, i + 1, 0).getDate());

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.caMois)}</p><p className="text-xs text-slate-500">CA ce mois (TTC)</p></div>
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.caAnnee)}</p><p className="text-xs text-slate-500">CA annuel (TTC)</p></div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center"><Heart className="w-5 h-5 text-pink-500" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{stats.mariagesMois}</p><p className="text-xs text-slate-500">Mariages ce mois</p></div>
          </div>
        </div>
        {isAdmin && (
          <Link href="/clients?filtre=impayes" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-red-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <div><p className="text-2xl font-bold text-slate-900">{stats.impayesCount}</p><p className="text-xs text-slate-500">Dette clients ({formatCurrency(stats.impayesMontant)})</p></div>
            </div>
          </Link>
        )}
      </div>

      {/* Alertes paiements */}
      {alertes.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-red-800">
              Alertes — {alertes.length} événement{alertes.length > 1 ? 's' : ''} à moins de 30 jours non soldé{alertes.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {alertes.map((a) => {
              const urgenceColor = a.jours < 7
                ? { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'URGENT' }
                : a.jours < 15
                  ? { dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'ATTENTION' }
                  : { dot: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'À SURVEILLER' };
              return (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${urgenceColor.dot}`} />
                        <span className="text-sm font-bold text-slate-900">{a.nom}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgenceColor.bg} ${urgenceColor.border} border ${urgenceColor.text}`}>
                          {urgenceColor.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 ml-[18px]">
                        Mariage le {formatDate(a.date_mariage)} — dans {a.jours} jour{a.jours > 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-4 mt-2 ml-[18px]">
                        <span className="text-xs text-slate-500">Dû : <strong className="text-slate-700">{formatCurrency(a.totalDu)}</strong></span>
                        <span className="text-xs text-slate-500">Payé : <strong className="text-emerald-600">{formatCurrency(a.totalPaye)}</strong></span>
                        <span className="text-xs text-slate-500">Reste : <strong className="text-red-600">{formatCurrency(a.reste)}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/clients/${a.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Fiche
                      </Link>
                      <Link
                        href={`/clients/${a.id}/compte`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Compte
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <span className="text-lg">✅</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Aucune alerte</p>
            <p className="text-xs text-emerald-600">Tous les événements à moins de 30 jours sont soldés.</p>
          </div>
        </div>
      )}

      {/* Caisse — admin only */}
      {isAdmin && <Link href="/banque" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all block">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><Landmark className="w-5 h-5 text-indigo-600" /></div>
          <h2 className="text-sm font-semibold text-slate-700">Caisse</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Espèces</p>
            <p className={`text-lg font-bold ${caisse.especes > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(caisse.especes)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Chèques</p>
            <p className={`text-lg font-bold ${caisse.cheques > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(caisse.cheques)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">À déposer</p>
            <p className={`text-xl font-bold ${caisse.total > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(caisse.total)}</p>
          </div>
        </div>
      </Link>}

      {/* Prochains mariages */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Calendar size={15} className="text-slate-400" /> Prochains mariages</h2>
          <Link href="/clients" className="text-xs text-blue-500 hover:underline">Voir tout</Link>
        </div>
        {prochains.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">Aucun mariage à venir</p> : (
          <div>{prochains.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
              <div><p className="text-sm font-medium text-slate-800">{c.nom_marie_1} {c.prenom_marie_1}{c.nom_marie_2 ? ` & ${c.nom_marie_2}` : ''}</p><p className="text-xs text-slate-400">{c.lieu_ceremonie || 'Lieu non défini'}</p></div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{formatDate(c.date_mariage)}</span>
            </Link>
          ))}</div>
        )}
      </div>

      {/* Graphique CA mensuel — admin only */}
      {isAdmin && <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Chiffre d&apos;affaires mensuel (TTC)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total : {formatCurrency(chartTotal)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeChartYear(-1)}
              className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-center">{chartYear}</span>
            <button
              onClick={() => changeChartYear(1)}
              disabled={chartYear >= new Date().getFullYear()}
              className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
        {chartLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-2" style={{ height: '200px' }}>
              {caParMois.map((val, i) => (
                <div key={i} className="flex-1 group relative" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  {val > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {formatCurrency(val)}
                    </div>
                  )}
                  <div
                    onClick={() => router.push(`/recettes?mois=${chartYear}-${String(i + 1).padStart(2, '0')}`)}
                    className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600 cursor-pointer"
                    style={{ height: maxCa > 0 ? `${Math.max((val / maxCa) * 100, val > 0 ? 2 : 0)}%` : '0%' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {caParMois.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => router.push(`/recettes?mois=${chartYear}-${String(i + 1).padStart(2, '0')}`)}
                >
                  <span className="text-[10px] text-slate-400 block">{moisLabels[i]}</span>
                  {val > 0 && <span className="text-[9px] text-slate-500 font-medium block">{(val / 1000).toFixed(0)}k</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>}

      {/* Graphique Mariages par mois + taux de remplissage */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Mariages par mois</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total : {totalMariages} mariage{totalMariages !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMariagesYear(-1)}
              className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-center">{mariagesYear}</span>
            <button
              onClick={() => changeMariagesYear(1)}
              disabled={mariagesYear >= new Date().getFullYear() + 1}
              className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
        {mariagesLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-2" style={{ height: '200px' }}>
              {mariagesParMois.map((val, i) => {
                const taux = Math.round((val / joursParMois[i]) * 100);
                return (
                  <div key={i} className="flex-1 group relative" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    {val > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {val} mariage{val > 1 ? 's' : ''} — {taux}% remplissage
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: maxMariages > 0 ? `${Math.max((val / maxMariages) * 100, val > 0 ? 3 : 0)}%` : '0%',
                        backgroundColor: taux >= 50 ? '#dc2626' : taux >= 25 ? '#f59e0b' : '#ec4899',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              {mariagesParMois.map((val, i) => {
                const taux = joursParMois[i] > 0 ? Math.round((val / joursParMois[i]) * 100) : 0;
                return (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[10px] text-slate-400 block">{moisLabels[i]}</span>
                    {val > 0 && (
                      <>
                        <span className="text-[10px] text-slate-700 font-semibold block">{val}</span>
                        <span className={`text-[9px] font-medium block ${taux >= 50 ? 'text-red-500' : taux >= 25 ? 'text-amber-500' : 'text-pink-500'}`}>{taux}%</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
