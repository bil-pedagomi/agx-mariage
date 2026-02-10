'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  FileText,
  Save,
  Archive,
  Trash2,
  Plus,
  Check,
  X,
  CalendarDays,
  CreditCard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import type { Client, Echeance, StatutDossier, TypePrestation } from '@/types/database';
import {
  cn,
  STATUT_LABELS,
  STATUT_COLORS,
  TYPES_PRESTATION,
  formatDate,
  formatCurrency,
} from '@/lib/utils';

type ClientForm = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

const emptyEcheance = {
  date_echeance: new Date().toISOString().split('T')[0],
  libelle: '',
  montant: 0,
  payee: false,
};

export default function FicheClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [newEcheance, setNewEcheance] = useState(emptyEcheance);
  const [showAddEcheance, setShowAddEcheance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Load client ───────────────────────────────────────────────────────
  const loadClient = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Erreur chargement client:', error);
      return;
    }

    setClient(data as Client);
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = data as Client;
    setForm(rest as ClientForm);
  }, [id, supabase]);

  // ── Load echeances ────────────────────────────────────────────────────
  const loadEcheances = useCallback(async () => {
    const { data, error } = await supabase
      .from('echeances')
      .select('*')
      .eq('client_id', id)
      .order('date_echeance', { ascending: true });

    if (error) {
      console.error('Erreur chargement echeances:', error);
      return;
    }

    setEcheances((data as Echeance[]) ?? []);
  }, [id, supabase]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadClient(), loadEcheances()]);
      setLoading(false);
    }
    init();
  }, [loadClient, loadEcheances]);

  // ── Field update helper ───────────────────────────────────────────────
  function updateField<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
    setHasChanges(true);
  }

  // ── Toggle prestation ─────────────────────────────────────────────────
  function togglePrestation(prestation: string) {
    if (!form) return;
    const current = form.type_prestation ?? [];
    const next = current.includes(prestation)
      ? current.filter((p) => p !== prestation)
      : [...current, prestation];
    updateField('type_prestation', next);
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form) return;
    setSaving(true);

    const { error } = await supabase
      .from('clients')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erreur sauvegarde:', error);
    } else {
      setHasChanges(false);
      await loadClient();
    }
    setSaving(false);
  }

  // ── Archive ───────────────────────────────────────────────────────────
  async function handleArchive() {
    const { error } = await supabase
      .from('clients')
      .update({ archived: !client?.archived, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) await loadClient();
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm('Supprimer ce client ? Cette action est irréversible.')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) router.push('/clients');
  }

  // ── Echeance actions ──────────────────────────────────────────────────
  async function addEcheance() {
    const { error } = await supabase.from('echeances').insert({
      client_id: id,
      ...newEcheance,
    });

    if (!error) {
      setNewEcheance(emptyEcheance);
      setShowAddEcheance(false);
      await loadEcheances();
    }
  }

  async function togglePayee(echeance: Echeance) {
    const { error } = await supabase
      .from('echeances')
      .update({ payee: !echeance.payee })
      .eq('id', echeance.id);

    if (!error) await loadEcheances();
  }

  async function deleteEcheance(echeanceId: string) {
    if (!confirm('Supprimer cette échéance ?')) return;
    const { error } = await supabase.from('echeances').delete().eq('id', echeanceId);
    if (!error) await loadEcheances();
  }

  // ── Render helpers ────────────────────────────────────────────────────
  const inputClass =
    'bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full';

  const cardClass = 'bg-white rounded-xl shadow-sm border border-slate-200 p-6';

  function renderField(label: string, key: keyof ClientForm, type = 'text') {
    if (!form) return null;
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input
          type={type}
          className={inputClass}
          value={(form[key] as string | number) ?? ''}
          onChange={(e) =>
            updateField(
              key,
              type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value
            )
          }
        />
      </div>
    );
  }

  // ── Loading / not found ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!client || !form) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-slate-500 text-lg">Client introuvable</p>
        <button
          onClick={() => router.push('/clients')}
          className="text-blue-600 hover:underline text-sm"
        >
          Retour a la liste
        </button>
      </div>
    );
  }

  const displayName = [client.prenom_marie_1, client.nom_marie_1]
    .filter(Boolean)
    .join(' ');

  // ── Page ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* ─── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/clients')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{displayName || 'Nouveau client'}</h1>

          {/* Status badge */}
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              STATUT_COLORS[form.statut]
            )}
          >
            {STATUT_LABELS[form.statut]}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/clients/${id}/contrat?type=location`, '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <FileText size={16} />
            Contrat Location
          </button>
          <button
            onClick={() => window.open(`/clients/${id}/contrat?type=options`, '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <FileText size={16} />
            Contrat Options
          </button>
          <button
            onClick={() => window.open(`/clients/${id}/facture`, '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <FileText size={16} />
            Facture
          </button>
        </div>
      </div>

      {/* ─── Status select ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Statut :</label>
        <select
          className={cn(inputClass, 'w-auto')}
          value={form.statut}
          onChange={(e) => updateField('statut', e.target.value as StatutDossier)}
        >
          {(Object.keys(STATUT_LABELS) as StatutDossier[]).map((s) => (
            <option key={s} value={s}>
              {STATUT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Two-column layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Identite */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Identite</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Civilite</label>
              <select
                className={inputClass}
                value={(form as Record<string, unknown>).civilite as string ?? ''}
                onChange={(e) => updateField('nom_marie_1' as keyof ClientForm, e.target.value)}
              >
                <option value="">-</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="M. & Mme">M. &amp; Mme</option>
              </select>
            </div>
            <div /> {/* spacer */}
            {renderField('Nom marie(e) 1', 'nom_marie_1')}
            {renderField('Prenom marie(e) 1', 'prenom_marie_1')}
            {renderField('Nom marie(e) 2', 'nom_marie_2')}
            {renderField('Prenom marie(e) 2', 'prenom_marie_2')}
            <div className="sm:col-span-2">
              {renderField('Adresse', 'adresse')}
            </div>
            {renderField('Code postal', 'code_postal')}
            {renderField('Ville', 'ville')}
            {renderField('Telephone 1', 'telephone_1', 'tel')}
            {renderField('Telephone 2', 'telephone_2', 'tel')}
            {renderField('Email 1', 'email_1', 'email')}
            {renderField('Email 2', 'email_2', 'email')}
            {renderField('CIN ou Passeport', 'cin_passeport')}
          </div>
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          {/* Mariage card */}
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Mariage</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderField('Date du mariage', 'date_mariage', 'date')}
              {renderField('Heure debut', 'heure_debut', 'time')}
              {renderField('Heure fin', 'heure_fin', 'time')}
              {renderField('Lieu de ceremonie', 'lieu_ceremonie')}
              {renderField('Lieu de reception', 'lieu_reception')}
              {renderField("Nombre d'invites", 'nombre_invites', 'number')}
              {renderField('Formule', 'formule')}
              {renderField('Referent', 'referent')}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Date d&apos;inscription
                </label>
                <input
                  type="date"
                  className={cn(inputClass, 'bg-slate-50')}
                  value={form.date_inscription?.split('T')[0] ?? ''}
                  readOnly
                />
              </div>

              {/* Type prestation toggle buttons */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  Type de prestation
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYPES_PRESTATION.map((tp) => {
                    const active = (form.type_prestation ?? []).includes(tp);
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => togglePrestation(tp)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold border transition',
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                        )}
                      >
                        {tp}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Memo card */}
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Memo</h2>
            <textarea
              className={cn(inputClass, 'min-h-[120px] resize-y')}
              placeholder="Notes libres..."
              value={form.memo ?? ''}
              onChange={(e) => updateField('memo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─── Echeances table ─────────────────────────────────────────── */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Echeances</h2>
          <button
            onClick={() => setShowAddEcheance(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Libelle</th>
                <th className="pb-3 pr-4 text-right">Montant</th>
                <th className="pb-3 pr-4 text-center">Payee</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {echeances.map((ech) => (
                <tr key={ech.id} className="group">
                  <td className="py-3 pr-4 text-slate-700">{formatDate(ech.date_echeance)}</td>
                  <td className="py-3 pr-4 text-slate-700">{ech.libelle || '-'}</td>
                  <td className="py-3 pr-4 text-right font-medium text-slate-900">
                    {formatCurrency(ech.montant)}
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <button
                      onClick={() => togglePayee(ech)}
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full transition',
                        ech.payee
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                    >
                      {ech.payee ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => deleteEcheance(ech.id)}
                      className="text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {echeances.length === 0 && !showAddEcheance && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Aucune echeance enregistree
                  </td>
                </tr>
              )}

              {/* Add row */}
              {showAddEcheance && (
                <tr>
                  <td className="py-3 pr-4">
                    <input
                      type="date"
                      className={inputClass}
                      value={newEcheance.date_echeance}
                      onChange={(e) =>
                        setNewEcheance({ ...newEcheance, date_echeance: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="text"
                      placeholder="Libelle"
                      className={inputClass}
                      value={newEcheance.libelle}
                      onChange={(e) =>
                        setNewEcheance({ ...newEcheance, libelle: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={cn(inputClass, 'text-right')}
                      value={newEcheance.montant || ''}
                      onChange={(e) =>
                        setNewEcheance({
                          ...newEcheance,
                          montant: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <button
                      onClick={() =>
                        setNewEcheance({ ...newEcheance, payee: !newEcheance.payee })
                      }
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full transition',
                        newEcheance.payee
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {newEcheance.payee ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </td>
                  <td className="py-3 text-right space-x-1">
                    <button
                      onClick={addEcheance}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setShowAddEcheance(false);
                        setNewEcheance(emptyEcheance);
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Action links ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/clients/${id}/compte`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
        >
          <CreditCard size={16} />
          Compte
        </button>
        <button
          onClick={() => router.push(`/planning?client=${id}`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
        >
          <CalendarDays size={16} />
          Planning
        </button>
      </div>

      {/* ─── Bottom action bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleArchive}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <Archive size={16} />
            {client.archived ? 'Desarchiver' : 'Archiver'}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition"
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition',
              saving
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </div>
    </div>
  );
}
