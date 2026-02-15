'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users, Euro, Calendar, BookOpen, Home, Settings, Landmark,
  Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X,
  User, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, user, signOut } = useAuth();

  const [clientIds, setClientIds] = useState<string[]>([]);
  const [lastClientId, setLastClientId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; label: string }[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  // Track last visited client from URL
  useEffect(() => {
    const match = pathname.match(/\/clients\/([a-f0-9-]+)/);
    if (match) setLastClientId(match[1]);
  }, [pathname]);

  // Load client IDs once + alert count
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const supabase = createClient();
    supabase
      .from('clients')
      .select('id')
      .eq('archived', false)
      .order('nom_marie_1', { ascending: true })
      .then(({ data }: any) => {
        if (data) setClientIds(data.map((c: any) => c.id));
      });

    // Charger le nombre d'alertes (clients à < 30 jours avec solde > 0)
    const loadAlerts = async () => {
      try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        // 1. D'abord récupérer uniquement les clients concernés
        const { data: alertClients } = await supabase.from('clients').select('id')
          .gte('date_mariage', today).lte('date_mariage', in30Days)
          .not('statut', 'in', '("annule","termine")')
          .eq('archived', false);
        if (!alertClients || alertClients.length === 0) { setAlertCount(0); return; }
        // 2. Charger débits/règlements UNIQUEMENT pour ces clients
        const clientIds30 = alertClients.map((c: any) => c.id);
        const [debitsRes, reglementsRes] = await Promise.all([
          supabase.from('debits').select('client_id, montant_ttc').in('client_id', clientIds30),
          supabase.from('reglements').select('client_id, montant').in('client_id', clientIds30),
        ]);
        const debitsByClient: Record<string, number> = {};
        const reglByClient: Record<string, number> = {};
        (debitsRes.data || []).forEach((d: any) => { debitsByClient[d.client_id] = (debitsByClient[d.client_id] || 0) + Number(d.montant_ttc); });
        (reglementsRes.data || []).forEach((r: any) => { reglByClient[r.client_id] = (reglByClient[r.client_id] || 0) + Number(r.montant); });
        let count = 0;
        clientIds30.forEach((cid: string) => {
          const reste = (debitsByClient[cid] || 0) - (reglByClient[cid] || 0);
          if (reste > 0.01) count++;
        });
        setAlertCount(count);
      } catch { /* ignore alert loading errors */ }
    };
    loadAlerts();
  }, []);

  // Current client index for navigation
  const currentClientId = pathname.match(/\/clients\/([a-f0-9-]+)/)?.[1] || null;
  const currentIndex = currentClientId ? clientIds.indexOf(currentClientId) : -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < clientIds.length - 1;

  const getClientPath = (clientId: string) => {
    if (!currentClientId) return `/clients/${clientId}`;
    const suffix = pathname.replace(`/clients/${currentClientId}`, '');
    return `/clients/${clientId}${suffix}`;
  };

  const goFirst = () => { if (clientIds.length > 0) router.push(getClientPath(clientIds[0])); };
  const goPrev = () => { if (canGoPrev) router.push(getClientPath(clientIds[currentIndex - 1])); };
  const goNext = () => { if (canGoNext) router.push(getClientPath(clientIds[currentIndex + 1])); };
  const goLast = () => { if (clientIds.length > 0) router.push(getClientPath(clientIds[clientIds.length - 1])); };

  // Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('clients')
        .select('id, nom_marie_1, prenom_marie_1, nom_marie_2, prenom_marie_2')
        .eq('archived', false)
        .or(`nom_marie_1.ilike.%${query}%,prenom_marie_1.ilike.%${query}%,nom_marie_2.ilike.%${query}%,telephone_1.ilike.%${query}%,email_1.ilike.%${query}%`)
        .limit(8);
      if (data) {
        setSearchResults(data.map((c: any) => ({
          id: c.id,
          label: `${c.nom_marie_1} ${c.prenom_marie_1}${c.nom_marie_2 ? ` & ${c.nom_marie_2} ${c.prenom_marie_2 || ''}` : ''}`,
        })));
      }
    } catch { /* ignore search errors */ }
  };

  const selectSearchResult = (id: string) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/clients/${id}`);
  };

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  // New client
  const createNewClient = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('clients')
        .insert({ nom_marie_1: '', prenom_marie_1: '' })
        .select('id')
        .single();
      if (data) router.push(`/clients/${data.id}`);
    } catch { /* ignore */ }
  };

  // Compte redirect
  const handleCompteClick = () => {
    if (currentClientId) {
      router.push(`/clients/${currentClientId}/compte`);
    } else if (lastClientId) {
      router.push(`/clients/${lastClientId}/compte`);
    } else if (clientIds.length > 0) {
      router.push(`/clients/${clientIds[0]}/compte`);
    } else {
      router.push('/clients');
    }
  };

  // Active detection
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/clients') return pathname === '/clients' || (pathname.startsWith('/clients/') && !pathname.includes('/compte'));
    if (href === '/planning') return pathname === '/planning';
    if (href === '/recettes') return pathname === '/recettes';
    if (href === '/banque') return pathname === '/banque';
    if (href === '/parametres') return pathname === '/parametres';
    return false;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Main nav */}
      <nav className="bg-blue-500 h-16 flex items-center justify-center gap-1 px-4 shadow-lg">
        {/* Dashboard */}
        <Link href="/dashboard" className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all relative', isActive('/dashboard') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
          <div className="relative">
            <Home className="w-6 h-6 text-white" strokeWidth={1.5} />
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-blue-500 animate-pulse">
                {alertCount}
              </span>
            )}
          </div>
          <span className={cn('text-[10px] font-medium', isActive('/dashboard') ? 'text-white' : 'text-blue-100')}>Dashboard</span>
        </Link>

        {/* Clients */}
        <Link href="/clients" className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all', isActive('/clients') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
          <Users className="w-6 h-6 text-white" strokeWidth={1.5} />
          <span className={cn('text-[10px] font-medium', isActive('/clients') ? 'text-white' : 'text-blue-100')}>Clients</span>
        </Link>

        {/* Compte — admin + secrétaire */}
        <button onClick={handleCompteClick} className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all', pathname.includes('/compte') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
          <Euro className="w-6 h-6 text-white" strokeWidth={1.5} />
          <span className={cn('text-[10px] font-medium', pathname.includes('/compte') ? 'text-white' : 'text-blue-100')}>Compte</span>
        </button>

        {/* Planning */}
        <Link href="/planning" className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all', isActive('/planning') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
          <Calendar className="w-6 h-6 text-white" strokeWidth={1.5} />
          <span className={cn('text-[10px] font-medium', isActive('/planning') ? 'text-white' : 'text-blue-100')}>Planning</span>
        </Link>

        {/* Recettes — admin only */}
        {isAdmin && (
          <Link href="/recettes" className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all', isActive('/recettes') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
            <BookOpen className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className={cn('text-[10px] font-medium', isActive('/recettes') ? 'text-white' : 'text-blue-100')}>Recettes</span>
          </Link>
        )}

        {/* Banque — admin only */}
        {isAdmin && (
          <Link href="/banque" className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all', isActive('/banque') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
            <Landmark className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className={cn('text-[10px] font-medium', isActive('/banque') ? 'text-white' : 'text-blue-100')}>Banque</span>
          </Link>
        )}

        {/* Paramètres — admin only */}
        {isAdmin && (
          <Link href="/parametres" className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all', isActive('/parametres') ? 'bg-blue-700' : 'hover:bg-blue-600')}>
            <Settings className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className={cn('text-[10px] font-medium', isActive('/parametres') ? 'text-white' : 'text-blue-100')}>Paramètres</span>
          </Link>
        )}
      </nav>

      {/* Secondary toolbar */}
      <div className="bg-slate-100 border-b border-slate-200 h-9 flex items-center px-4 gap-1 relative">
        <button onClick={createNewClient} className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors" title="Nouveau client">
          <Plus size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        <button onClick={goFirst} disabled={!canGoPrev} className={cn('p-1.5 rounded transition-colors', canGoPrev ? 'hover:bg-slate-200 text-slate-500' : 'text-slate-300 cursor-not-allowed')} title="Premier client">
          <ChevronsLeft size={16} />
        </button>
        <button onClick={goPrev} disabled={!canGoPrev} className={cn('p-1.5 rounded transition-colors', canGoPrev ? 'hover:bg-slate-200 text-slate-500' : 'text-slate-300 cursor-not-allowed')} title="Précédent">
          <ChevronLeft size={16} />
        </button>
        <button onClick={goNext} disabled={!canGoNext} className={cn('p-1.5 rounded transition-colors', canGoNext ? 'hover:bg-slate-200 text-slate-500' : 'text-slate-300 cursor-not-allowed')} title="Suivant">
          <ChevronRight size={16} />
        </button>
        <button onClick={goLast} disabled={!canGoNext} className={cn('p-1.5 rounded transition-colors', canGoNext ? 'hover:bg-slate-200 text-slate-500' : 'text-slate-300 cursor-not-allowed')} title="Dernier client">
          <ChevronsRight size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        <button onClick={() => setShowSearch(!showSearch)} className={cn('p-1.5 rounded transition-colors', showSearch ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500')} title="Rechercher">
          {showSearch ? <X size={16} /> : <Search size={16} />}
        </button>

        {showSearch && (
          <div className="relative ml-2">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Nom, prénom, tél..."
              className="bg-white border border-slate-300 rounded-md px-3 py-1 text-xs w-56 focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }
                if (e.key === 'Enter' && searchResults.length > 0) selectSearchResult(searchResults[0].id);
              }}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-60 overflow-auto">
                {searchResults.map((r) => (
                  <button key={r.id} onClick={() => selectSearchResult(r.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1" />
        {currentClientId && clientIds.length > 0 && (
          <span className="text-[11px] text-slate-400 mr-2">{currentIndex + 1} / {clientIds.length}</span>
        )}

        {/* User info + Déconnexion */}
        {user && (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <User size={13} className="text-slate-400" />
              <span className="hidden sm:inline max-w-[180px] truncate">{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        )}

        <div className="w-px h-5 bg-slate-300 mx-1" />
        <span className="text-[11px] text-slate-400">AGX Mariage</span>
      </div>
    </header>
  );
}
