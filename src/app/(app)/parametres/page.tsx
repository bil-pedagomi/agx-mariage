'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Parametres } from '@/types/database';
import { Save, CheckCircle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ParametresPage() {
  const [parametres, setParametres] = useState<Parametres | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();
  const { profile, signOut } = useAuth();

  useEffect(() => { loadParametres(); }, []);

  const loadParametres = async () => {
    const { data } = await supabase.from('parametres').select('*').limit(1).single();
    if (data) setParametres(data);
    setLoading(false);
  };

  const update = (field: keyof Parametres, value: string) => {
    if (!parametres) return;
    setParametres({ ...parametres, [field]: value });
    setSaved(false);
  };

  const saveParametres = async () => {
    if (!parametres) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('parametres').update({
        nom_entreprise: parametres.nom_entreprise, adresse: parametres.adresse,
        telephone: parametres.telephone, email: parametres.email,
        siret: parametres.siret, logo_url: parametres.logo_url, nom_gerant: parametres.nom_gerant,
        conditions_paiement: parametres.conditions_paiement, mentions_legales: parametres.mentions_legales,
      }).eq('id', parametres.id);
      if (error) {
        console.error('Erreur sauvegarde:', error);
        alert('Erreur lors de la sauvegarde: ' + error.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  const fields: { label: string; field: keyof Parametres; type?: string }[] = [
    { label: 'Nom entreprise', field: 'nom_entreprise' },
    { label: 'Adresse', field: 'adresse' },
    { label: 'Téléphone', field: 'telephone' },
    { label: 'Email', field: 'email', type: 'email' },
    { label: 'SIRET', field: 'siret' },
    { label: 'URL du logo', field: 'logo_url' },
    { label: 'Nom du gérant', field: 'nom_gerant' },
  ];

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
        <button onClick={saveParametres} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-700">Informations entreprise</h2></div>
        <div className="p-5">
          {fields.map((f) => (
            <div key={f.field} className="flex items-center gap-4 py-2">
              <label className="w-36 text-sm font-medium text-slate-500 flex-shrink-0">{f.label}</label>
              <input
                type={f.type || 'text'}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={(parametres?.[f.field] as string) || ''}
                onChange={(e) => update(f.field, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-700">Documents (Devis / Factures)</h2></div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Conditions de paiement</label>
            <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={4} value={parametres?.conditions_paiement || ''} onChange={(e) => update('conditions_paiement', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Mentions légales</label>
            <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={4} value={parametres?.mentions_legales || ''} onChange={(e) => update('mentions_legales', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-700">Compte utilisateur</h2></div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{profile?.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-slate-500">{profile?.role === 'admin' ? 'Administrateur' : 'Collaborateur'}</p>
          </div>
          <button onClick={signOut} className="border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
