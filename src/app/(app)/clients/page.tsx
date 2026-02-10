'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Client, StatutDossier } from '@/types/database';
import { STATUT_LABELS, STATUT_COLORS, formatDate, formatCurrency, cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Archive, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Suspense } from 'react';

function ClientsPageInner() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutDossier | ''>('');
  const [filterImpayes, setFilterImpayes] = useState(false);
  const [filterMariage, setFilterMariage] = useState<'' | 'futur' | 'passe'>('');
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [soldes, setSoldes] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<'nom' | 'date_mariage' | 'statut' | 'reste'>('date_mariage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Lire le paramètre ?filtre=impayes au chargement
  useEffect(() => {
    if (searchParams.get('filtre') === 'impayes') {
      setFilterImpayes(true);
    }
  }, [searchParams]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('clients')
      .select('*')
      .eq('archived', showArchived)
      .order('created_at', { ascending: false });
    if (filterStatut) query = query.eq('statut', filterStatut);
    const { data } = await query;
    if (data) setClients(data);

    // Charger les soldes (débits - règlements) pour chaque client
    const [debitsRes, reglementsRes] = await Promise.all([
      supabase.from('debits').select('client_id, montant_ttc'),
      supabase.from('reglements').select('client_id, montant'),
    ]);

    const debitsByClient: Record<string, number> = {};
    const reglByClient: Record<string, number> = {};
    (debitsRes.data || []).forEach((d: any) => {
      debitsByClient[d.client_id] = (debitsByClient[d.client_id] || 0) + Number(d.montant_ttc);
    });
    (reglementsRes.data || []).forEach((r: any) => {
      reglByClient[r.client_id] = (reglByClient[r.client_id] || 0) + Number(r.montant);
    });

    const soldesMap: Record<string, number> = {};
    const allClientIds = new Set([...Object.keys(debitsByClient), ...Object.keys(reglByClient)]);
    allClientIds.forEach((cid) => {
      soldesMap[cid] = (debitsByClient[cid] || 0) - (reglByClient[cid] || 0);
    });
    setSoldes(soldesMap);

    setLoading(false);
  }, [showArchived, filterStatut]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const today = new Date().toISOString().split('T')[0];

  const filteredClients = clients.filter((c) => {
    // Filtre impayés (dette > 0.01 pour éviter les arrondis)
    if (filterImpayes && (soldes[c.id] || 0) < 0.01) return false;

    // Filtre mariage passé / futur
    if (filterMariage === 'futur' && (!c.date_mariage || c.date_mariage < today)) return false;
    if (filterMariage === 'passe' && (!c.date_mariage || c.date_mariage >= today)) return false;

    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.nom_marie_1.toLowerCase().includes(s) ||
      c.prenom_marie_1.toLowerCase().includes(s) ||
      c.nom_marie_2?.toLowerCase().includes(s) ||
      c.prenom_marie_2?.toLowerCase().includes(s) ||
      c.telephone_1?.includes(search) ||
      c.email_1?.toLowerCase().includes(s)
    );
  });

  const toggleSort = (col: 'nom' | 'date_mariage' | 'statut' | 'reste') => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'reste' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
  };

  const sortedClients = [...filteredClients].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'nom': {
        const nameA = `${a.nom_marie_1} ${a.prenom_marie_1}`.trim().toUpperCase();
        const nameB = `${b.nom_marie_1} ${b.prenom_marie_1}`.trim().toUpperCase();
        return nameA.localeCompare(nameB) * dir;
      }
      case 'date_mariage': {
        const dA = a.date_mariage || '';
        const dB = b.date_mariage || '';
        if (!dA && !dB) return 0;
        if (!dA) return 1;
        if (!dB) return -1;
        return dA.localeCompare(dB) * dir;
      }
      case 'statut': {
        return a.statut.localeCompare(b.statut) * dir;
      }
      case 'reste': {
        const sA = soldes[a.id] || 0;
        const sB = soldes[b.id] || 0;
        return (sA - sB) * dir;
      }
      default:
        return 0;
    }
  });

  const createNewClient = async () => {
    if (creating) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('clients')
      .insert({ nom_marie_1: '', prenom_marie_1: '' })
      .select('id')
      .single();
    if (data) {
      router.push(`/clients/${data.id}`);
    } else {
      console.error('Erreur création client:', error);
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            {showArchived ? ' (archivés)' : ''}
            {filterImpayes ? ' — Dette clients' : ''}
            {filterMariage === 'futur' ? ' — Mariages futurs' : ''}
            {filterMariage === 'passe' ? ' — Mariages passés' : ''}
          </p>
        </div>
        <button
          onClick={createNewClient}
          disabled={creating}
          className={cn(
            'bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
            creating && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus size={16} />
          {creating ? 'Création...' : 'Nouveau client'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value as StatutDossier | '')}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => { setFilterImpayes(!filterImpayes); }}
          className={cn(
            'border rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors',
            filterImpayes
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          💰 Dette clients
        </button>
        <button
          onClick={() => setFilterMariage(filterMariage === 'futur' ? '' : 'futur')}
          className={cn(
            'border rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors',
            filterMariage === 'futur'
              ? 'bg-pink-600 text-white border-pink-600'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          💒 Futur
        </button>
        <button
          onClick={() => setFilterMariage(filterMariage === 'passe' ? '' : 'passe')}
          className={cn(
            'border rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors',
            filterMariage === 'passe'
              ? 'bg-slate-600 text-white border-slate-600'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          ✅ Passé
        </button>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={cn(
            'border rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors',
            showArchived
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Archive size={14} />
          {showArchived ? 'Voir actifs' : 'Archives'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Users size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Aucun client trouvé</p>
            {!filterImpayes && (
              <button
                onClick={createNewClient}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Créer un premier client
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    <button onClick={() => toggleSort('nom')} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                      Nom <SortIcon col="nom" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tél</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    <button onClick={() => toggleSort('date_mariage')} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                      Date mariage <SortIcon col="date_mariage" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    <button onClick={() => toggleSort('statut')} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                      Statut <SortIcon col="statut" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">
                    <button onClick={() => toggleSort('reste')} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors ml-auto">
                      Reste à payer <SortIcon col="reste" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((c) => {
                  const solde = soldes[c.id] || 0;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/clients/${c.id}`)}
                      className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {c.nom_marie_1 || c.prenom_marie_1
                          ? `${c.nom_marie_1} ${c.prenom_marie_1}`.trim()
                          : 'Nouveau client'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.telephone_1 || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(c.date_mariage)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUT_COLORS[c.statut])}>
                          {STATUT_LABELS[c.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {solde > 0.01 ? (
                          <span className="text-red-600 font-bold">{formatCurrency(solde)}</span>
                        ) : solde < -0.01 ? (
                          <span className="text-blue-600 font-semibold">+{formatCurrency(Math.abs(solde))}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">{formatCurrency(0)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ClientsPageInner />
    </Suspense>
  );
}
