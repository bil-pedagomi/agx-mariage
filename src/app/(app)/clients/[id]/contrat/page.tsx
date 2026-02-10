'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { numberToWords } from '@/lib/utils';
import type { Client, Debit, Reglement, Parametres, Contrat } from '@/types/database';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' DT';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ContratContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const type = searchParams.get('type') as 'location' | 'options' | null;
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [debits, setDebits] = useState<Debit[]>([]);
  const [reglements, setReglements] = useState<Reglement[]>([]);
  const [parametres, setParametres] = useState<Parametres | null>(null);
  const [contratNumero, setContratNumero] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const categorie = type === 'options' ? 'option' : 'location';

    const [cRes, dRes, rRes, pRes, ctRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('debits').select('*').eq('client_id', clientId).eq('categorie', categorie).order('date'),
      supabase.from('reglements').select('*').eq('client_id', clientId).order('date'),
      supabase.from('parametres').select('*').limit(1).single(),
      supabase.from('contrats').insert({ client_id: clientId, type: type || 'location' }).select('numero').single(),
    ]);

    if (cRes.data) setClient(cRes.data as Client);
    if (dRes.data) setDebits(dRes.data as Debit[]);
    if (rRes.data) setReglements(rRes.data as Reglement[]);
    if (pRes.data) setParametres(pRes.data as Parametres);
    if (ctRes.data) setContratNumero((ctRes.data as { numero: number }).numero);
    setLoading(false);
  }, [clientId, type]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <p style={{ color: '#64748b' }}>Chargement du contrat...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <p style={{ color: '#ef4444' }}>Client introuvable</p>
      </div>
    );
  }

  const totalTTC = debits.reduce((s, d) => s + Number(d.montant_ttc), 0);
  const totalPaye = reglements.reduce((s, r) => s + Number(r.montant), 0);

  const clientName = `${client.prenom_marie_1 || ''} ${client.nom_marie_1 || ''}${client.nom_marie_2 ? ` & ${client.prenom_marie_2 || ''} ${client.nom_marie_2}` : ''}`.trim();
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const numeroFormatted = contratNumero !== null ? String(contratNumero).padStart(5, '0') : '00000';

  const isLocation = type !== 'options';
  const contratTitle = isLocation ? 'Contrat Location' : 'Contrat Options';
  const prestationsTitle = isLocation ? 'PRESTATIONS DE LOCATION :' : 'OPTIONS ET PRESTATIONS COMPLÉMENTAIRES :';

  // Determine checked payment modes from reglements
  const modes = new Set(reglements.map(r => r.mode));
  const hasCheque = modes.has('cheque');
  const hasEspeces = modes.has('especes');
  const hasVirement = modes.has('virement');

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm; size: A4; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: #f1f5f9; }
      `}</style>

      {/* ── TOP TOOLBAR ─────────────────────────────────── */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1e293b', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 600 }}>
          {contratTitle} — {clientName}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'system-ui',
            }}
          >
            Imprimer / PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              background: '#475569', color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'system-ui',
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ── DOCUMENT ────────────────────────────────────── */}
      <div style={{
        maxWidth: 800, margin: '0 auto', background: 'white',
        padding: '40px 48px', marginTop: 60, marginBottom: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.06)',
        borderRadius: 8, minHeight: '297mm',
      }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJFfZzMgy_0YMANm1WzuNKGX4gbLb1Sq9ihg&s"
              alt="Logo"
              style={{ width: 80, height: 80, objectFit: 'contain' }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', letterSpacing: 2 }}>CONTRAT</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>N° {numeroFormatted}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Tunis, le {today}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, fontVariant: 'small-caps', color: '#94a3b8', letterSpacing: 2, marginBottom: 28 }}>
          BANQUETS - RÉCEPTIONS - ÉVÉNEMENTS
        </div>

        {/* ── ENTRE SECTION ───────────────────────────────── */}
        <div style={{ marginBottom: 28, fontSize: 12, lineHeight: 2, color: '#334155' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Entre :</div>
          <div style={{ paddingLeft: 16 }}>
            {parametres?.nom_entreprise && <div>{parametres.nom_entreprise}</div>}
            {parametres?.adresse && <div>Adresse : {parametres.adresse}</div>}
            {parametres?.telephone && <div>Tél : {parametres.telephone}</div>}
            {parametres?.email && <div>Email : {parametres.email}</div>}
            {parametres?.nom_gerant && <div>représenté par {parametres.nom_gerant}</div>}
          </div>

          <div style={{ marginTop: 12, marginBottom: 12, fontStyle: 'italic', color: '#64748b' }}>
            d&apos;une part, et
          </div>

          <div style={{ paddingLeft: 16 }}>
            <div>
              <span style={{ fontWeight: 600 }}>Nom Client : </span>
              {client.prenom_marie_1} {client.nom_marie_1}
              {client.nom_marie_2 ? ` & ${client.prenom_marie_2 || ''} ${client.nom_marie_2}` : ''}
            </div>
            {client.cin_passeport && (
              <div><span style={{ fontWeight: 600 }}>N° CIN ou Passeport : </span>{client.cin_passeport}</div>
            )}
            <div>
              <span style={{ fontWeight: 600 }}>Téléphone : </span>
              {client.telephone_1 || '-'}{client.telephone_2 ? ` / ${client.telephone_2}` : ''}
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Adresse : </span>
              {[client.adresse, [client.code_postal, client.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
            </div>
            {client.email_1 && (
              <div><span style={{ fontWeight: 600 }}>Adresse E-Mail : </span>{client.email_1}</div>
            )}
          </div>
        </div>

        {/* ── EVENT DETAILS ───────────────────────────────── */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '16px 20px', marginBottom: 28, fontSize: 12, lineHeight: 2, color: '#334155',
        }}>
          <div>
            <span style={{ fontWeight: 600 }}>Type de Réception : </span>
            {client.type_prestation && client.type_prestation.length > 0 ? client.type_prestation.join(', ') : '-'}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Nom de la Salle : </span>
            {client.lieu_reception || '-'}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Date d&apos;événement : </span>
            {client.date_mariage ? fmtDate(client.date_mariage) : '-'}
            <span style={{ marginLeft: 32, fontWeight: 600 }}>Horaires de : </span>
            {client.heure_debut || '-'} à {client.heure_fin || '-'}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Nombre de Personnes : </span>
            {client.nombre_invites ?? '-'}
          </div>
        </div>

        {/* ── PRESTATIONS TABLE ───────────────────────────── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          {prestationsTitle}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#2563eb' }}>
              <th style={thStyle}>Qté</th>
              <th style={thStyle}>Désignation</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            {debits.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 1 ? '#f8fafc' : 'white' }}>
                <td style={tdStyle}>{d.quantite}</td>
                <td style={tdStyle}>{d.designation}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(d.montant_ttc)}</td>
              </tr>
            ))}
            {debits.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '20px 8px' }}>
                  Aucune prestation enregistrée
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#2563eb' }}>
              <td colSpan={2} style={{ ...thStyle, fontWeight: 700, textAlign: 'right' }}>TOTAL</td>
              <td style={{ ...thStyle, textAlign: 'right', fontWeight: 700 }}>{fmt(totalTTC)}</td>
            </tr>
          </tfoot>
        </table>

        {/* ── TARIF ───────────────────────────────────────── */}
        <div style={{
          marginTop: 24, marginBottom: 28, fontSize: 12, lineHeight: 2.2, color: '#334155',
        }}>
          <div>
            <span style={{ fontWeight: 700 }}>Tarif : </span>
            {fmt(totalTTC)} — {numberToWords(totalTTC)}
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>Mode de Paiement : </span>
            50% à la signature du contrat et 50% restants 30 jours avant l&apos;événement.
          </div>

          <div style={{ marginTop: 4 }}>
            <span style={{ fontWeight: 700 }}>Type de Paiement : </span>
            {hasCheque ? '☑' : '☐'} Chèque{'  '}
            {hasEspeces ? '☑' : '☐'} Espèces{'  '}
            {hasVirement ? '☑' : '☐'} Virement Bancaire
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>Acompte versé : </span>
            {fmt(totalPaye)}
          </div>
        </div>

        {/* ── SIGNATURE SECTION ───────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 48, marginBottom: 48,
          fontSize: 12, color: '#334155',
        }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ fontWeight: 600, marginBottom: 48 }}>Service commercial</div>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: '#64748b' }}>(Signature + cachet)</div>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ fontWeight: 600, marginBottom: 48 }}>MME / MR</div>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: '#64748b' }}>(Signature client)</div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 40,
          textAlign: 'center', fontSize: 9, color: '#94a3b8', lineHeight: 1.8,
        }}>
          <div style={{ marginBottom: 6, fontStyle: 'italic' }}>
            Le présent contrat est sujet aux conditions générales figurant en annexe.
          </div>
          <div>
            {[parametres?.nom_entreprise, parametres?.adresse, parametres?.telephone, parametres?.email]
              .filter(Boolean)
              .join(' - ')}
          </div>
          {parametres?.siret && <div>{parametres.siret}</div>}
        </div>
      </div>
    </>
  );
}

export default function ContratPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <p style={{ color: '#64748b' }}>Chargement...</p>
      </div>
    }>
      <ContratContent />
    </Suspense>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'white', letterSpacing: 0.5,
};
const tdStyle: React.CSSProperties = {
  padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#334155',
};
