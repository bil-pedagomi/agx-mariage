'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Evenement, TypeEvenement } from '@/types/database';
import { TYPE_EVENEMENT_LABELS, TYPE_EVENEMENT_COLORS, cn } from '@/lib/utils';
import {
  addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, isSameDay, isSameMonth, parseISO, addWeeks, subWeeks,
  addMonths, subMonths, getDay, eachDayOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Loader2, Plus, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ViewMode = 'jour' | 'semaine' | 'mois';

// Extended event type that can also represent a wedding from client data
interface PlanningEvent extends Evenement {
  _isWedding?: boolean;  // true = auto-generated from client.date_mariage
  _clientLabel?: string; // "Nom1 Prénom1 & Nom2"
  _paymentStatus?: 'paid' | 'unpaid' | 'cancelled'; // payment status for color coding
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h → 20h
const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none';

export default function PlanningPage() {
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('semaine');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);
  const [clients, setClients] = useState<{ id: string; label: string }[]>([]);
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    titre: '', type: 'rdv_preparation' as TypeEvenement,
    date_debut: format(new Date(), 'yyyy-MM-dd'), heure_debut: '09:00',
    date_fin: format(new Date(), 'yyyy-MM-dd'), heure_fin: '10:00',
    couleur: TYPE_EVENEMENT_COLORS.rdv_preparation, notes: '', client_id: '',
  });

  // ── Date ranges ────────────────────────────────────────────
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Calendar grid for month view (always start on Monday)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // ── Data range for query ───────────────────────────────────
  const getQueryRange = useCallback(() => {
    if (view === 'jour') {
      return { start: format(currentDate, 'yyyy-MM-dd'), end: format(addDays(currentDate, 1), 'yyyy-MM-dd') };
    }
    if (view === 'semaine') {
      return { start: format(weekStart, 'yyyy-MM-dd'), end: format(addDays(weekStart, 7), 'yyyy-MM-dd') };
    }
    // mois: include full calendar grid
    return { start: format(calendarStart, 'yyyy-MM-dd'), end: format(addDays(calendarEnd, 1), 'yyyy-MM-dd') };
  }, [view, currentDate.toISOString()]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getQueryRange();
    const [eventsRes, clientsRes, weddingsRes, allDebitsRes, allReglementsRes] = await Promise.all([
      supabase.from('evenements').select('*').gte('date_debut', start).lt('date_debut', end).order('date_debut'),
      supabase.from('clients').select('id, nom_marie_1, prenom_marie_1, nom_marie_2').eq('archived', false).order('nom_marie_1'),
      // Fetch clients whose wedding date falls in the visible range (include cancelled)
      supabase.from('clients')
        .select('id, nom_marie_1, prenom_marie_1, nom_marie_2, prenom_marie_2, date_mariage, lieu_ceremonie, lieu_reception, statut')
        .not('date_mariage', 'is', null)
        .gte('date_mariage', start)
        .lt('date_mariage', end),
      // Fetch all debits & reglements for payment status
      supabase.from('debits').select('client_id, montant_ttc'),
      supabase.from('reglements').select('client_id, montant'),
    ]);

    // Compute soldes per client
    const debitsByClient: Record<string, number> = {};
    const reglByClient: Record<string, number> = {};
    (allDebitsRes.data || []).forEach((d: any) => { debitsByClient[d.client_id] = (debitsByClient[d.client_id] || 0) + Number(d.montant_ttc); });
    (allReglementsRes.data || []).forEach((r: any) => { reglByClient[r.client_id] = (reglByClient[r.client_id] || 0) + Number(r.montant); });

    // Build real events
    const realEvents: PlanningEvent[] = (eventsRes.data || []) as PlanningEvent[];

    // Build virtual wedding events from client.date_mariage
    const weddingEvents: PlanningEvent[] = (weddingsRes.data || []).map((c: any) => {
      const label = `${c.nom_marie_1} ${c.prenom_marie_1}${c.nom_marie_2 ? ` & ${c.nom_marie_2} ${c.prenom_marie_2 || ''}` : ''}`.trim();
      const lieu = c.lieu_ceremonie || c.lieu_reception || '';
      const solde = (debitsByClient[c.id] || 0) - (reglByClient[c.id] || 0);
      const isCancelled = c.statut === 'annule';
      const paymentStatus: 'paid' | 'unpaid' | 'cancelled' = isCancelled ? 'cancelled' : solde > 0 ? 'unpaid' : 'paid';
      const color = isCancelled ? '#9ca3af' : solde > 0 ? '#dc2626' : '#16a34a'; // gris / rouge / vert
      return {
        id: `wedding-${c.id}`,
        client_id: c.id,
        titre: `Mariage ${label}`,
        type: 'mariage' as TypeEvenement,
        date_debut: `${c.date_mariage}T10:00:00`,
        date_fin: `${c.date_mariage}T23:00:00`,
        couleur: color,
        notes: lieu ? `Lieu: ${lieu}` : null,
        created_at: '',
        _isWedding: true,
        _clientLabel: label,
        _paymentStatus: paymentStatus,
      };
    });

    // Merge & sort by date_debut
    const allEvents = [...realEvents, ...weddingEvents].sort(
      (a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime()
    );
    setEvents(allEvents);

    if (clientsRes.data) setClients(clientsRes.data.map((c: any) => ({ id: c.id, label: `${c.nom_marie_1} ${c.prenom_marie_1}${c.nom_marie_2 ? ` & ${c.nom_marie_2}` : ''}` })));
    setLoading(false);
  }, [getQueryRange]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Navigation ─────────────────────────────────────────────
  const goPrev = () => {
    if (view === 'jour') setCurrentDate(subDays(currentDate, 1));
    else if (view === 'semaine') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const goNext = () => {
    if (view === 'jour') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'semaine') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // ── Period label ───────────────────────────────────────────
  const periodLabel = (() => {
    if (view === 'jour') return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
    if (view === 'semaine') return `${format(weekStart, 'd MMM', { locale: fr })} — ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}`;
    return format(currentDate, 'MMMM yyyy', { locale: fr });
  })();

  // ── Event actions ──────────────────────────────────────────
  const openNew = (day: Date, hour?: number) => {
    const d = format(day, 'yyyy-MM-dd');
    const h = hour ?? 9;
    setForm({
      titre: '', type: 'rdv_preparation', date_debut: d,
      heure_debut: `${String(h).padStart(2, '0')}:00`,
      date_fin: d, heure_fin: `${String(h + 1).padStart(2, '0')}:00`,
      couleur: TYPE_EVENEMENT_COLORS.rdv_preparation, notes: '', client_id: '',
    });
    setSelectedEvent(null);
    setShowModal(true);
  };

  const openEdit = (ev: PlanningEvent) => {
    // Wedding events from client data → navigate to client fiche
    if (ev._isWedding && ev.client_id) {
      router.push(`/clients/${ev.client_id}`);
      return;
    }
    const d = parseISO(ev.date_debut);
    const f = parseISO(ev.date_fin);
    setForm({
      titre: ev.titre, type: ev.type,
      date_debut: format(d, 'yyyy-MM-dd'), heure_debut: format(d, 'HH:mm'),
      date_fin: format(f, 'yyyy-MM-dd'), heure_fin: format(f, 'HH:mm'),
      couleur: ev.couleur, notes: ev.notes || '', client_id: ev.client_id || '',
    });
    setSelectedEvent(ev);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.titre) return;
    const payload = {
      titre: form.titre, type: form.type,
      date_debut: `${form.date_debut}T${form.heure_debut}:00`,
      date_fin: `${form.date_fin}T${form.heure_fin}:00`,
      couleur: form.couleur, notes: form.notes || null,
      client_id: form.client_id || null,
    };
    if (selectedEvent) await supabase.from('evenements').update(payload).eq('id', selectedEvent.id);
    else await supabase.from('evenements').insert(payload);
    setShowModal(false);
    loadData();
  };

  const deleteEv = async () => {
    if (!selectedEvent || selectedEvent._isWedding || !confirm('Supprimer cet événement ?')) return;
    await supabase.from('evenements').delete().eq('id', selectedEvent.id);
    setShowModal(false);
    loadData();
  };

  // ── Helpers ────────────────────────────────────────────────
  const eventsForSlot = (day: Date, hour: number) =>
    events.filter((e) => { const s = parseISO(e.date_debut); return isSameDay(s, day) && s.getHours() === hour; });

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.date_debut), day));

  const evHeight = (ev: Evenement) =>
    Math.max((parseISO(ev.date_fin).getTime() - parseISO(ev.date_debut).getTime()) / 3600000, 0.5);

  // ── Time grid (shared between jour & semaine) ──────────────
  const renderTimeGrid = (days: Date[]) => (
    <div className="flex min-h-full">
      {/* Time column */}
      <div className="w-14 flex-shrink-0 border-r border-slate-200 bg-white sticky left-0 z-10">
        <div className="h-11 border-b border-slate-200" />
        {HOURS.map((h) => (
          <div key={h} className="h-16 border-b border-slate-100 pr-2 pt-1 text-right">
            <span className="text-[11px] font-medium text-slate-400">{String(h).padStart(2, '0')}h</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day) => {
        const isToday = isSameDay(day, new Date());
        const isSun = day.getDay() === 0;
        return (
          <div key={day.toISOString()} className={cn('flex-1 border-r border-slate-100', days.length === 1 && 'min-w-0')} style={{ minWidth: days.length > 1 ? 130 : undefined, background: isSun ? '#fafafa' : 'white' }}>
            {/* Day header */}
            <div className={cn('h-11 flex flex-col items-center justify-center border-b border-slate-200', isToday && 'bg-blue-50')}>
              <span className={cn('text-[10px] font-medium uppercase', isToday ? 'text-blue-600' : 'text-slate-400')}>
                {format(day, 'EEE', { locale: fr })}
              </span>
              <span className={cn('text-sm font-bold', isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : 'text-slate-700')}>
                {format(day, 'd')}
              </span>
            </div>
            {/* Hour slots */}
            {HOURS.map((hour) => {
              const slotEv = eventsForSlot(day, hour);
              return (
                <div
                  key={hour}
                  className="h-16 border-b border-slate-50 relative cursor-pointer hover:bg-blue-50/40 transition-colors"
                  onClick={() => { if (!slotEv.length) openNew(day, hour); }}
                >
                  {slotEv.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                      className={cn(
                        'absolute left-1 right-1 top-0.5 rounded-md px-2 py-1 cursor-pointer overflow-hidden z-10 border-l-[3px]',
                        (ev as PlanningEvent)._isWedding && (ev as PlanningEvent)._paymentStatus !== 'cancelled' && 'ring-1',
                        (ev as PlanningEvent)._paymentStatus === 'paid' && 'ring-emerald-300',
                        (ev as PlanningEvent)._paymentStatus === 'unpaid' && 'ring-red-300',
                      )}
                      style={{
                        height: `${evHeight(ev) * 64 - 4}px`,
                        backgroundColor: (ev as PlanningEvent)._paymentStatus === 'cancelled'
                          ? 'repeating-linear-gradient(135deg, #f1f5f9, #f1f5f9 4px, #e2e8f0 4px, #e2e8f0 8px)'
                          : (ev.couleur || '#3b82f6') + '18',
                        borderLeftColor: ev.couleur || '#3b82f6',
                        ...(((ev as PlanningEvent)._paymentStatus === 'cancelled') ? { background: 'repeating-linear-gradient(135deg, #f1f5f9, #f1f5f9 4px, #e2e8f0 4px, #e2e8f0 8px)' } : {}),
                      }}
                    >
                      <p className={cn('text-[11px] font-semibold truncate flex items-center gap-1', (ev as PlanningEvent)._paymentStatus === 'cancelled' && 'line-through opacity-60')} style={{ color: ev.couleur || '#3b82f6' }}>
                        {(ev as PlanningEvent)._isWedding && <Heart size={10} className="flex-shrink-0 fill-current" />}
                        {ev.titre}
                      </p>
                      <p className={cn('text-[9px] text-slate-500 truncate', (ev as PlanningEvent)._paymentStatus === 'cancelled' && 'line-through opacity-60')}>
                        {(ev as PlanningEvent)._isWedding ? (ev as PlanningEvent)._clientLabel : TYPE_EVENEMENT_LABELS[ev.type]}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  // ── Month grid ─────────────────────────────────────────────
  const renderMonthGrid = () => {
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className="flex flex-col flex-1">
        {/* Day names header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {dayNames.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
          ))}
        </div>
        {/* Weeks */}
        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-slate-100">
              {week.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayEvents = eventsForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-r border-slate-100 p-1 min-h-[80px] cursor-pointer hover:bg-blue-50/30 transition-colors',
                      !isCurrentMonth && 'bg-slate-50/50'
                    )}
                    onClick={() => {
                      if (dayEvents.length === 0) openNew(day);
                    }}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentDate(day); setView('jour'); }}
                        className={cn(
                          'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium transition-colors',
                          isToday ? 'bg-blue-500 text-white' : isCurrentMonth ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-400'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] text-slate-400">{dayEvents.length}</span>
                      )}
                    </div>
                    {/* Events (max 3 visible) */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                          className={cn(
                            'rounded px-1.5 py-0.5 truncate text-[10px] font-medium cursor-pointer border-l-2 flex items-center gap-1',
                            (ev as PlanningEvent)._isWedding && (ev as PlanningEvent)._paymentStatus !== 'cancelled' && 'ring-1',
                            (ev as PlanningEvent)._paymentStatus === 'paid' && 'ring-emerald-300',
                            (ev as PlanningEvent)._paymentStatus === 'unpaid' && 'ring-red-300',
                          )}
                          style={{
                            backgroundColor: (ev as PlanningEvent)._paymentStatus === 'cancelled'
                              ? undefined
                              : (ev.couleur || '#3b82f6') + '18',
                            borderLeftColor: ev.couleur || '#3b82f6',
                            color: ev.couleur || '#3b82f6',
                            ...(((ev as PlanningEvent)._paymentStatus === 'cancelled') ? { background: 'repeating-linear-gradient(135deg, #f8fafc, #f8fafc 3px, #e2e8f0 3px, #e2e8f0 6px)' } : {}),
                          }}
                        >
                          {(ev as PlanningEvent)._isWedding && <Heart size={8} className="flex-shrink-0 fill-current" />}
                          <span className={cn('truncate', (ev as PlanningEvent)._paymentStatus === 'cancelled' && 'line-through opacity-60')}>
                            {(ev as PlanningEvent)._isWedding ? (ev as PlanningEvent)._clientLabel : `${format(parseISO(ev.date_debut), 'HH:mm')} ${ev.titre}`}
                          </span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] text-slate-400 pl-1">+{dayEvents.length - 3} de plus</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Planning</h1>
          <p className="text-xs text-slate-500 capitalize">{periodLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            {(['jour', 'semaine', 'mois'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                  view === v ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="bg-white border border-slate-300 rounded-lg p-2 hover:bg-slate-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goToday} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors">
              Aujourd&apos;hui
            </button>
            <button onClick={goNext} className="bg-white border border-slate-300 rounded-lg p-2 hover:bg-slate-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* New event button */}
          <button
            onClick={() => openNew(currentDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 transition-colors"
            title="Nouvel événement"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : view === 'mois' ? (
          renderMonthGrid()
        ) : view === 'jour' ? (
          renderTimeGrid([currentDate])
        ) : (
          renderTimeGrid(weekDays)
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{selectedEvent ? 'Modifier' : 'Nouvel événement'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-slate-100">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Titre</label>
                <input className={INPUT} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Titre de l'événement" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                  <select className={INPUT} value={form.type} onChange={(e) => { const t = e.target.value as TypeEvenement; setForm({ ...form, type: t, couleur: TYPE_EVENEMENT_COLORS[t] }); }}>
                    {Object.entries(TYPE_EVENEMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
                  <select className={INPUT} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">— Aucun —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Date début</label><input type="date" className={INPUT} value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Heure début</label><input type="time" className={INPUT} value={form.heure_debut} onChange={(e) => setForm({ ...form, heure_debut: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Date fin</label><input type="date" className={INPUT} value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Heure fin</label><input type="time" className={INPUT} value={form.heure_fin} onChange={(e) => setForm({ ...form, heure_fin: e.target.value })} /></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Couleur</label>
                <input type="color" className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea className={INPUT} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                {selectedEvent && <button onClick={deleteEv} className="border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm hover:bg-red-50 transition-colors">Supprimer</button>}
                {selectedEvent?.client_id && <button onClick={() => router.push(`/clients/${selectedEvent.client_id}`)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 transition-colors">Voir fiche</button>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="border border-slate-300 rounded-lg px-4 py-2 text-sm hover:bg-slate-50 transition-colors">Annuler</button>
                <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">{selectedEvent ? 'Modifier' : 'Créer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
