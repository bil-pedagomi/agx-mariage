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
  montant_ttc_saisie: 0,
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  // Calcul HT a partir du TTC saisi : HT = TTC / (1 + TVA/100)
  const computedHT = newDebit.montant_ttc_saisie / (1 + newDebit.taux_tva / 100);
  const computedTVA = newDebit.montant_ttc_saisie - computedHT;

  // --- Actions ---
  const addDebit = async () => {
    if (!newDebit.designation || newDebit.montant_ttc_saisie <= 0) return;
    setSavingDebit(true);
    setErrorDebit('');

    // On saisit le TTC, on calcule le HT pour l'envoyer a Supabase
    // prix_unitaire_ht = TTC / (1 + taux_tva/100) — quantite toujours 1
    const prixUnitaireHT = newDebit.montant_ttc_saisie / (1 + newDebit.taux_tva / 100);

    const { error } = await supabase.from('debits').insert({
      client_id: clientId,
      date: new Date().toISOString().split('T')[0],
      quantite: 1,
      designation: newDebit.designation,
      prix_unitaire_ht: Math.round(prixUnitaireHT * 100) / 100,
      taux_tva: newDebit.taux_tva,
      categorie: newDebit.categorie,
    });

    if (error) {
      console.error('Erreur ajout debit:', error);
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
      console.error('Erreur ajout reglement:', error);
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
    setConfirmDeleteId(null);
  };

  const deleteReglement = async (id: string) => {
    const { error } = await supabase.from('reglements').delete().eq('id', id);
    if (!error) loadData();
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500 text-base">Client introuvable</p>
      </div>
    );
  }

  const clientName = `${client.prenom_marie_1} ${client.nom_marie_1}${client.nom_marie_2 ? ` & ${client.prenom_marie_2} ${client.nom_marie_2}` : ''}`.trim();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${clientId}`}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{clientName || 'Client'}</h1>
            <p className="text-sm text-slate-500">
              {client.formule || 'Aucune formule'} &mdash; Fiche Compte
            </p>
          </div>
        </div>

        {/* Financial summary badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Du</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalDebit)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Regle</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaye)}</p>
          </div>
          <div
            className={`rounded-xl px-4 py-2 text-center ${
              solde > 0.01
                ? 'bg-red-50 border border-red-200'
                : solde < -0.01
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
              {solde < -0.01 ? 'Credit' : 'Solde'}
            </p>
            <p className={`text-lg font-bold ${
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

        {/* ========== LEFT: DEBITS ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-800">Debits (prestations)</h2>
              {showDebitForm && (
                <button
                  onClick={() => { setShowDebitForm(false); setErrorDebit(''); }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bouton Ajouter une prestation */}
            {!showDebitForm && (
              <button
                onClick={() => { setShowDebitForm(true); setErrorDebit(''); setNewDebit(EMPTY_DEBIT); }}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-base font-semibold transition-colors min-h-[48px]"
              >
                <Plus className="w-5 h-5" />
                Ajouter une prestation
              </button>
            )}
          </div>

          {/* ===== FORMULAIRE CARTE VERTICALE ===== */}
          {showDebitForm && (
            <div className="p-5 border-b border-slate-200 bg-blue-50/30">
              <h3 className="text-base font-bold text-slate-800 mb-4">Nouvelle prestation</h3>

              <div className="space-y-4">
                {/* Designation */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : Location salle principale, DJ..."
                    value={newDebit.designation}
                    onChange={(e) => setNewDebit({ ...newDebit, designation: e.target.value })}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Categorie — gros boutons toggle */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Categorie
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewDebit({ ...newDebit, categorie: 'location' })}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold border-2 transition-all min-h-[48px] ${
                        newDebit.categorie === 'location'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Location salle
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDebit({ ...newDebit, categorie: 'option' })}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold border-2 transition-all min-h-[48px] ${
                        newDebit.categorie === 'option'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Option
                    </button>
                  </div>
                </div>

                {/* Montant TTC + TVA */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Montant TTC (DT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newDebit.montant_ttc_saisie || ''}
                      onChange={(e) => setNewDebit({ ...newDebit, montant_ttc_saisie: Number(e.target.value) })}
                      className="w-full bg-white border-2 border-blue-400 rounded-xl px-4 py-3 text-xl font-bold text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      TVA %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={newDebit.taux_tva}
                      onChange={(e) => setNewDebit({ ...newDebit, taux_tva: Number(e.target.value) })}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-xl text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* HT calcule — lecture seule */}
                {newDebit.montant_ttc_saisie > 0 && (
                  <div className="bg-slate-100 rounded-xl px-4 py-3">
                    <span className="text-sm text-slate-500">HT calcule : </span>
                    <span className="text-base font-semibold text-slate-700">{formatCurrency(computedHT)}</span>
                    <span className="text-sm text-slate-400 ml-2">(TVA : {formatCurrency(computedTVA)})</span>
                  </div>
                )}

                {/* Erreur */}
                {errorDebit && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {errorDebit}
                  </div>
                )}

                {/* Bouton VALIDER */}
                <button
                  onClick={addDebit}
                  disabled={!newDebit.designation || newDebit.montant_ttc_saisie <= 0 || savingDebit}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-6 py-4 text-lg font-bold transition-colors min-h-[56px]"
                >
                  {savingDebit ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      VALIDER
                    </>
                  )}
                </button>

                {/* Annuler */}
                <button
                  onClick={() => { setShowDebitForm(false); setErrorDebit(''); }}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* ===== LISTE DES DEBITS ===== */}
          <div className="flex-1">
            {debits.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-base text-slate-400">Aucun debit enregistre</p>
              </div>
            ) : (
              <>
                {/* MOBILE: Cartes empilees */}
                <div className="md:hidden divide-y divide-slate-100">
                  {debits.map((d) => (
                    <div key={d.id} className="px-5 py-4 relative">
                      {/* Bouton supprimer */}
                      {confirmDeleteId === d.id ? (
                        <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <span className="text-xs text-red-700 font-medium">Supprimer ?</span>
                          <button
                            onClick={() => deleteDebit(d.id)}
                            className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold min-h-[32px]"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold min-h-[32px]"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(d.id)}
                          className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Ligne 1 : Designation + Badge */}
                      <div className="flex items-start gap-2 pr-12">
                        <span className="text-base font-bold text-slate-900">{d.designation}</span>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          d.categorie === 'location'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {d.categorie === 'location' ? 'Location' : 'Option'}
                        </span>
                      </div>

                      {/* Ligne 2 : Date */}
                      <p className="text-sm text-slate-500 mt-1">{formatDate(d.date)}</p>

                      {/* Ligne 3 : HT | TVA | TTC */}
                      <div className="flex items-baseline gap-3 mt-2">
                        <span className="text-sm text-slate-500">
                          HT : {formatCurrency(Number(d.prix_unitaire_ht))}
                        </span>
                        <span className="text-sm text-slate-400">TVA {d.taux_tva}%</span>
                        <span className="ml-auto text-xl font-bold text-slate-900">
                          {formatCurrency(Number(d.montant_ttc))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP: Tableau simplifie 4 colonnes */}
                <div className="hidden md:block">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">Designation</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">HT</th>
                        <th className="text-center px-3 py-3 text-sm font-semibold text-slate-600">TVA</th>
                        <th className="text-right px-5 py-3 text-sm font-semibold text-slate-600">TTC</th>
                        <th className="w-14" />
                      </tr>
                    </thead>
                    <tbody>
                      {debits.map((d) => (
                        <tr
                          key={d.id}
                          className="hover:bg-blue-50/50 border-b border-slate-100 transition-colors group"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-slate-900">{d.designation}</span>
                              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                d.categorie === 'location'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {d.categorie === 'location' ? 'Location' : 'Option'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-0.5">{formatDate(d.date)}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-base text-slate-600">
                            {formatCurrency(Number(d.prix_unitaire_ht))}
                          </td>
                          <td className="px-3 py-3 text-center text-base text-slate-500">
                            {d.taux_tva}%
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-lg font-bold text-slate-900">{formatCurrency(Number(d.montant_ttc))}</span>
                          </td>
                          <td className="px-3 py-3">
                            {confirmDeleteId === d.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteDebit(d.id)}
                                  className="bg-red-600 text-white rounded-lg px-2 py-1 text-xs font-semibold min-h-[32px]"
                                >
                                  Oui
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="bg-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs font-semibold min-h-[32px]"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(d.id)}
                                className="w-10 h-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Debit total */}
          <div className="px-5 py-4 border-t-2 border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Total Debits
            </span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(totalDebit)}</span>
          </div>
        </div>

        {/* ========== RIGHT: REGLEMENTS ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Reglements</h2>
            <button
              onClick={() => { setShowReglementForm(!showReglementForm); setErrorReglement(''); }}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              {showReglementForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Mode</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Reference</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Montant</th>
                  <th className="w-12" />
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
                          className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={newReglement.mode}
                          onChange={(e) =>
                            setNewReglement({ ...newReglement, mode: e.target.value as ModePaiement })
                          }
                          className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
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
                          className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
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
                          className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none w-full text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={addReglement}
                          disabled={newReglement.montant <= 0 || savingReglement}
                          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                        >
                          {savingReglement ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {errorReglement && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-sm text-red-600 bg-red-50">
                          {errorReglement}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {reglements.length === 0 && !showReglementForm && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-base text-slate-400">
                      Aucun reglement enregistre
                    </td>
                  </tr>
                )}

                {reglements.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50 border-b border-slate-100 transition-colors group"
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
                        {MODE_PAIEMENT_LABELS[r.mode]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.reference || '-'}</td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-emerald-600">
                      {formatCurrency(Number(r.montant))}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => deleteReglement(r.id)}
                        className="w-10 h-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reglement total */}
          <div className="px-5 py-4 border-t-2 border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Total Reglements
            </span>
            <span className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaye)}</span>
          </div>
        </div>
      </div>

      {/* ===== SOLDE DISPLAY ===== */}
      <div
        className={`rounded-xl p-5 flex items-center justify-between ${
          solde > 0.01
            ? 'bg-red-50 border-2 border-red-200'
            : solde < -0.01
              ? 'bg-blue-50 border-2 border-blue-200'
              : 'bg-emerald-50 border-2 border-emerald-200'
        }`}
      >
        <span className="text-base font-bold text-slate-700">
          {solde < -0.01 ? 'Credit client' : 'Solde restant du'}
        </span>
        <span
          className={`text-3xl font-bold ${
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
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-base font-semibold transition-colors min-h-[48px]"
        >
          <FileText className="w-5 h-5" />
          Facture PDF
        </button>
      </div>

      {/* ===== MODAL CONFIRMATION SUPPRESSION (mobile overlay) ===== */}
      {confirmDeleteId && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-50 flex items-end justify-center" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-t-2xl w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold text-slate-900 text-center">Supprimer cette prestation ?</p>
            <p className="text-sm text-slate-500 text-center">Cette action est irreversible.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-base min-h-[48px]"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteDebit(confirmDeleteId)}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-base min-h-[48px]"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
