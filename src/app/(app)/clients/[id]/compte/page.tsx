'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Check, FileText, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import type { Client, Debit, Reglement, ModePaiement, CategorieDebit } from '@/types/database';
import { formatDate, formatCurrency, MODE_PAIEMENT_LABELS } from '@/lib/utils';

const EMPTY_DEBIT = {
  date: new Date().toISOString().split('T')[0],
  quantite: 1,
  designation: '',
  prix_unitaire_ht: 0,
  taux_tva: 19,
  categorie: 'location' as CategorieDebit,
};

const EMPTY_REGLEMENT = {
  date: new Date().toISOString().split('T')[0],
  mode: 'cb' as ModePaiement,
  reference: '',
  montant: 0,
};

export default function ComptePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [debits, setDebits] = useState<Debit[]>([]);
  const [reglements, setReglements] = useState<Reglement[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDebit, setSavingDebit] = useState(false);
  const [savingReglement, setSavingReglement] = useState(false);
  const [errorDebit, setErrorDebit] = useState('');
  const [errorReglement, setErrorReglement] = useState('');

  const [showDebitForm, setShowDebitForm] = useState(false);
  const [showReglementForm, setShowReglementForm] = useState(false);

  const [newDebit, setNewDebit] = useState(EMPTY_DEBIT);
  const [newReglement, setNewReglement] = useState(EMPTY_REGLEMENT);

  const loadData = useCallback(async () => {
    const [clientRes, debitsRes, reglementsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('debits').select('*').eq('client_id', clientId).order('date', { ascending: true }),
      supabase.from('reglements').select('*').eq('client_id', clientId).order('date', { ascending: true }),
    ]);

    if (clientRes.data) setClient(clientRes.data);
    setDebits(debitsRes.data || []);
    setReglements(reglementsRes.data || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Computed ---
  const totalDebit = debits.reduce((sum, d) => sum + Number(d.montant_ttc), 0);
  const totalPaye = reglements.reduce((sum, r) => sum + Number(r.montant), 0);
  const solde = totalDebit - totalPaye;

  // Montant TTC preview pour le formulaire d'ajout
  const previewTTC = newDebit.quantite * newDebit.prix_unitaire_ht * (1 + newDebit.taux_tva / 100);

  // --- Actions ---
  const addDebit = async () => {
    if (!newDebit.designation || newDebit.prix_unitaire_ht <= 0) return;
    setSavingDebit(true);
    setErrorDebit('');

    // NE PAS envoyer montant_ttc — c'est une colonne GENERATED ALWAYS dans PostgreSQL
    const { error } = await supabase.from('debits').insert({
      client_id: clientId,
      date: newDebit.date,
      quantite: newDebit.quantite,
      designation: newDebit.designation,
      prix_unitaire_ht: newDebit.prix_unitaire_ht,
      taux_tva: newDebit.taux_tva,
      categorie: newDebit.categorie,
    });

    if (error) {
      console.error('Erreur ajout débit:', error);
      setErrorDebit(error.message || 'Erreur lors de l\'ajout');
    } else {
      setNewDebit(EMPTY_DEBIT);
      setShowDebitForm(false);
      await loadData();
    }
    setSavingDebit(false);
  };

  const addReglement = async () => {
    if (newReglement.montant <= 0) return;
    setSavingReglement(true);
    setErrorReglement('');

    const { error } = await supabase.from('reglements').insert({
      client_id: clientId,
      date: newReglement.date,
      mode: newReglement.mode,
      reference: newReglement.reference || null,
      montant: newReglement.montant,
    });

    if (error) {
      console.error('Erreur ajout règlement:', error);
      setErrorReglement(error.message || 'Erreur lors de l\'ajout');
    } else {
      setNewReglement(EMPTY_REGLEMENT);
      setShowReglementForm(false);
      await loadData();
    }
    setSavingReglement(false);
  };

  const deleteDebit = async (id: string) => {
    const { error } = await supabase.from('debits').delete().eq('id', id);
    if (!error) loadData();
  };

  const deleteReglement = async (id: string) => {
    const { error } = await supabase.from('reglements').delete().eq('id', id);
    if (!error) loadData();
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-400 text-sm">Client introuvable</p>
      </div>
    );
  }

  const clientName = `${client.prenom_marie_1} ${client.nom_marie_1}${client.nom_marie_2 ? ` & ${client.prenom_marie_2} ${client.nom_marie_2}` : ''}`.trim();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${clientId}`}
            className="w-9 h-9 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{clientName || 'Client'}</h1>
            <p className="text-xs text-slate-500">
              {client.formule || 'Aucune formule'} &mdash; Fiche Compte
            </p>
          </div>
        </div>

        {/* Financial summary badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Du</p>
            <p className="text-sm font-bold text-slate-800">{formatCurrency(totalDebit)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Regle</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaye)}</p>
          </div>
          <div
            className={`rounded-lg px-3 py-1.5 text-center ${
              solde > 0.01
                ? 'bg-red-50 border border-red-200'
                : solde < -0.01
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
              {solde < -0.01 ? 'Credit' : 'Solde'}
            </p>
            <p className={`text-sm font-bold ${
              solde > 0.01 ? 'text-red-600' : solde < -0.01 ? 'text-blue-600' : 'text-emerald-600'
            }`}>
              {solde < -0.01
                ? `+${formatCurrency(Math.abs(solde))}`
                : solde > 0.01
                  ? formatCurrency(solde)
                  : formatCurrency(0)
              }
            </p>
          </div>
        </div>
      </div>

      {/* ===== TWO COLUMNS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---------- LEFT: DEBITS ---------- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Debits (prestations)</h2>
            <button
              onClick={() => { setShowDebitForm(!showDebitForm); setErrorDebit(''); }}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              {showDebitForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Date</th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold text-slate-600">Qte</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Designation</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">PU HT</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">TTC</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {/* Inline add form */}
                {showDebitForm && (
                  <>
                    <tr className="bg-blue-50/50 border-b border-blue-100">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={newDebit.date}
                          onChange={(e) => setNewDebit({ ...newDebit, date: e.target.value })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          value={newDebit.quantite}
                          onChange={(e) => setNewDebit({ ...newDebit, quantite: Math.max(1, Number(e.target.value)) })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-14 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Ex: Location salle, DJ..."
                          value={newDebit.designation}
                          onChange={(e) => setNewDebit({ ...newDebit, designation: e.target.value })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                        />
                        {/* Category selector */}
                        <div className="flex items-center gap-4 mt-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="categorie"
                              value="location"
                              checked={newDebit.categorie === 'location'}
                              onChange={(e) => setNewDebit({ ...newDebit, categorie: e.target.value as CategorieDebit })}
                              className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-600">Location salle</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="categorie"
                              value="option"
                              checked={newDebit.categorie === 'option'}
                              onChange={(e) => setNewDebit({ ...newDebit, categorie: e.target.value as CategorieDebit })}
                              className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-xs text-slate-600">Option</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={newDebit.prix_unitaire_ht || ''}
                          onChange={(e) => setNewDebit({ ...newDebit, prix_unitaire_ht: Number(e.target.value) })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-24 text-right"
                        />
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-slate-400">TVA</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={newDebit.taux_tva}
                            onChange={(e) => setNewDebit({ ...newDebit, taux_tva: Number(e.target.value) })}
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-14 text-center"
                          />
                          <span className="text-[10px] text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-sm font-bold text-slate-700">
                          {previewTTC > 0 ? formatCurrency(previewTTC) : '-'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={addDebit}
                          disabled={!newDebit.designation || newDebit.prix_unitaire_ht <= 0 || savingDebit}
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                        >
                          {savingDebit ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {errorDebit && (
                      <tr>
                        <td colSpan={6} className="px-4 py-2 text-xs text-red-600 bg-red-50">
                          {errorDebit}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {debits.length === 0 && !showDebitForm && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                      Aucun debit enregistre
                    </td>
                  </tr>
                )}

                {debits.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-blue-50 border-b border-slate-100 transition-colors group"
                  >
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {formatDate(d.date)}
                    </td>
                    <td className="px-2 py-2.5 text-center text-slate-600">{d.quantite}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-slate-800 font-medium">{d.designation}</span>
                      {d.categorie === 'location' && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                          Location
                        </span>
                      )}
                      {d.categorie === 'option' && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                          Option
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {formatCurrency(Number(d.prix_unitaire_ht))}
                      <div className="text-[10px] text-slate-400">TVA {d.taux_tva}%</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                      {formatCurrency(Number(d.montant_ttc))}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => deleteDebit(d.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Debit total */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Debits
            </span>
            <span className="text-sm font-bold text-slate-800">{formatCurrency(totalDebit)}</span>
          </div>
        </div>

        {/* ---------- RIGHT: REGLEMENTS ---------- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Reglements</h2>
            <button
              onClick={() => { setShowReglementForm(!showReglementForm); setErrorReglement(''); }}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              {showReglementForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Mode</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">Reference</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">Montant</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {/* Inline add form */}
                {showReglementForm && (
                  <>
                    <tr className="bg-blue-50/50 border-b border-blue-100">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={newReglement.date}
                          onChange={(e) => setNewReglement({ ...newReglement, date: e.target.value })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={newReglement.mode}
                          onChange={(e) =>
                            setNewReglement({ ...newReglement, mode: e.target.value as ModePaiement })
                          }
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                        >
                          {(Object.entries(MODE_PAIEMENT_LABELS) as [ModePaiement, string][]).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="N cheque, ref..."
                          value={newReglement.reference}
                          onChange={(e) => setNewReglement({ ...newReglement, reference: e.target.value })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={newReglement.montant || ''}
                          onChange={(e) =>
                            setNewReglement({ ...newReglement, montant: Number(e.target.value) })
                          }
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={addReglement}
                          disabled={newReglement.montant <= 0 || savingReglement}
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                        >
                          {savingReglement ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {errorReglement && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-xs text-red-600 bg-red-50">
                          {errorReglement}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {reglements.length === 0 && !showReglementForm && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                      Aucun reglement enregistre
                    </td>
                  </tr>
                )}

                {reglements.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50 border-b border-slate-100 transition-colors group"
                  >
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {MODE_PAIEMENT_LABELS[r.mode]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{r.reference || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
                      {formatCurrency(Number(r.montant))}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => deleteReglement(r.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reglement total */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Reglements
            </span>
            <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaye)}</span>
          </div>
        </div>
      </div>

      {/* ===== SOLDE DISPLAY ===== */}
      <div
        className={`rounded-xl p-4 flex items-center justify-between ${
          solde > 0.01
            ? 'bg-red-50 border border-red-200'
            : solde < -0.01
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-emerald-50 border border-emerald-200'
        }`}
      >
        <span className="text-sm font-semibold text-slate-700">
          {solde < -0.01 ? 'Credit client' : 'Solde restant du'}
        </span>
        <span
          className={`text-2xl font-bold ${
            solde > 0.01 ? 'text-red-600' : solde < -0.01 ? 'text-blue-600' : 'text-emerald-600'
          }`}
        >
          {solde < -0.01
            ? `+${formatCurrency(Math.abs(solde))}`
            : solde > 0.01
              ? formatCurrency(solde)
              : formatCurrency(0)
          }
        </span>
      </div>

      {/* ===== PDF BUTTONS ===== */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.open(`/clients/${clientId}/facture`, '_blank')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          Facture PDF
        </button>
      </div>
    </div>
  );
}
