'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { Client, Debit, Reglement, Parametres } from '@/types/database';

const MODE_LABELS: Record<string, string> = {
  cb: 'CB', virement: 'Virement', especes: 'Espèces', cheque: 'Chèque',
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' DT';
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FacturePage() {
  const params = useParams();
  const clientId = params.id as string;
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [debits, setDebits] = useState<Debit[]>([]);
  const [reglements, setReglements] = useState<Reglement[]>([]);
  const [parametres, setParametres] = useState<Parametres | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [cRes, dRes, rRes, pRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('debits').select('*').eq('client_id', clientId).order('date'),
      supabase.from('reglements').select('*').eq('client_id', clientId).order('date'),
      supabase.from('parametres').select('*').limit(1).single(),
    ]);
    if (cRes.data) setClient(cRes.data as Client);
    if (dRes.data) setDebits(dRes.data as Debit[]);
    if (rRes.data) setReglements(rRes.data as Reglement[]);
    if (pRes.data) setParametres(pRes.data as Parametres);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <p style={{ color: '#64748b' }}>Chargement de la facture...</p>
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

  const totalHT = debits.reduce((s, d) => s + Number(d.quantite) * Number(d.prix_unitaire_ht), 0);
  const totalTTC = debits.reduce((s, d) => s + Number(d.montant_ttc), 0);
  const totalTVA = totalTTC - totalHT;
  const totalPaye = reglements.reduce((s, r) => s + Number(r.montant), 0);
  const solde = totalTTC - totalPaye;

  const clientName = `${client.prenom_marie_1 || ''} ${client.nom_marie_1 || ''}${client.nom_marie_2 ? ` & ${client.prenom_marie_2 || ''} ${client.nom_marie_2}` : ''}`.trim();
  const entreprise = parametres?.nom_entreprise || '';
  const today = new Date().toLocaleDateString('fr-FR');
  const factureNum = `F-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${clientId.slice(0, 6).toUpperCase()}`;

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

      {/* Print button bar */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1e293b', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: 'white', fontFamily: 'system-ui', fontSize: 14, fontWeight: 600 }}>
          Facture — {clientName}
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

      {/* Page content */}
      <div style={{
        maxWidth: 800, margin: '0 auto', background: 'white',
        padding: '40px 48px', marginTop: 60, marginBottom: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.06)',
        borderRadius: 8, minHeight: '297mm',
      }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJFfZzMgy_0YMANm1WzuNKGX4gbLb1Sq9ihg&s"
              alt="Logo"
              style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: 8 }}
            />
            <div>
              {parametres?.adresse && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{parametres.adresse}</div>}
              {parametres?.telephone && <div style={{ fontSize: 11, color: '#64748b' }}>Tel: {parametres.telephone}</div>}
              {parametres?.email && <div style={{ fontSize: 11, color: '#64748b' }}>{parametres.email}</div>}
              {parametres?.siret && <div style={{ fontSize: 11, color: '#64748b' }}>SIRET: {parametres.siret}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', letterSpacing: 2 }}>FACTURE</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>N° {factureNum}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Date : {today}</div>
          </div>
        </div>

        {/* ── Client box ──────────────────────────────────────── */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '16px 20px', marginBottom: 28,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Facturer a
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{clientName}</div>
          {client.adresse && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{client.adresse}</div>}
          {(client.code_postal || client.ville) && (
            <div style={{ fontSize: 11, color: '#475569' }}>{client.code_postal} {client.ville}</div>
          )}
          {client.telephone_1 && <div style={{ fontSize: 11, color: '#475569' }}>Tel: {client.telephone_1}</div>}
          {client.email_1 && <div style={{ fontSize: 11, color: '#475569' }}>{client.email_1}</div>}
          {client.date_mariage && (
            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 6 }}>
              Date du mariage : {fmtDate(client.date_mariage)}
            </div>
          )}
        </div>

        {/* ── Debits table ────────────────────────────────────── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          Prestations
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#2563eb' }}>
              <th style={thStyle}>Date</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Qte</th>
              <th style={thStyle}>Designation</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>P.U. HT</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>TVA</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {debits.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 1 ? '#f8fafc' : 'white' }}>
                <td style={tdStyle}>{fmtDate(d.date)}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{d.quantite}</td>
                <td style={tdStyle}>{d.designation}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(d.prix_unitaire_ht)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{d.taux_tva}%</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(d.montant_ttc)}</td>
              </tr>
            ))}
            {debits.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '20px 8px' }}>
                  Aucune prestation enregistree
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Totals ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{ width: 260 }}>
            <div style={totLineStyle}>
              <span>Total HT</span><span>{fmt(totalHT)}</span>
            </div>
            <div style={totLineStyle}>
              <span>Total TVA</span><span>{fmt(totalTVA)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 12px',
              background: '#2563eb', color: 'white', borderRadius: 6, fontWeight: 700, fontSize: 13,
            }}>
              <span>Total TTC</span><span>{fmt(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* ── Reglements ──────────────────────────────────────── */}
        {reglements.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              Reglements recus
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#059669' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Mode</th>
                  <th style={thStyle}>Reference</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {reglements.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 1 ? '#f0fdf4' : 'white' }}>
                    <td style={tdStyle}>{fmtDate(r.date)}</td>
                    <td style={tdStyle}>{MODE_LABELS[r.mode] || r.mode}</td>
                    <td style={tdStyle}>{r.reference || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(r.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
              <div style={{
                padding: '8px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#059669',
              }}>
                Total paye : {fmt(totalPaye)}
              </div>
            </div>
          </>
        )}

        {/* ── Solde ───────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderRadius: 8, marginBottom: 28,
          background: solde > 0 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${solde > 0 ? '#fecaca' : '#bbf7d0'}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Solde restant du</span>
          <span style={{
            fontSize: 18, fontWeight: 800,
            color: solde > 0 ? '#dc2626' : '#059669',
          }}>
            {fmt(solde)}
          </span>
        </div>

        {/* ── Conditions ──────────────────────────────────────── */}
        {parametres?.conditions_paiement && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Conditions de paiement</div>
            <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6 }}>{parametres.conditions_paiement}</div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 40,
          textAlign: 'center', fontSize: 9, color: '#94a3b8', lineHeight: 1.8,
        }}>
          {parametres?.mentions_legales && <div>{parametres.mentions_legales}</div>}
          {(entreprise || parametres?.siret) && <div>{entreprise}{parametres?.siret ? `${entreprise ? ' — ' : ''}SIRET : ${parametres.siret}` : ''}</div>}
        </div>
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'white', letterSpacing: 0.5,
};
const tdStyle: React.CSSProperties = {
  padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#334155',
};
const totLineStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
  fontSize: 12, color: '#475569', borderBottom: '1px solid #e2e8f0',
};
