import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Client, Debit, Reglement, Parametres } from '@/types/database';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1A202C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2B6CB0',
  },
  companyInfo: {
    fontSize: 8,
    color: '#718096',
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#2B6CB0',
    textAlign: 'right',
  },
  docDate: {
    fontSize: 9,
    color: '#718096',
    textAlign: 'right',
    marginTop: 4,
  },
  clientBox: {
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  clientLabel: {
    fontSize: 7,
    color: '#718096',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: '#4A5568',
    marginBottom: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2B6CB0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  tableRowAlt: {
    backgroundColor: '#F7FAFC',
  },
  cellDate: { width: '12%' },
  cellQty: { width: '8%', textAlign: 'center' },
  cellDesign: { width: '35%' },
  cellPrix: { width: '15%', textAlign: 'right' },
  cellTva: { width: '10%', textAlign: 'right' },
  cellTtc: { width: '20%', textAlign: 'right' },
  cellMode: { width: '20%' },
  cellRef: { width: '30%' },
  cellMontant: { width: '38%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 2,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    width: '20%',
    textAlign: 'right',
  },
  soldeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  soldeLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  soldeValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 7,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 10,
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface DevisProps {
  client: Client;
  debits: Debit[];
  parametres: Parametres;
}

export function DevisPDF({ client, debits, parametres }: DevisProps) {
  const totalHT = debits.reduce(
    (sum, d) => sum + Number(d.quantite) * Number(d.prix_unitaire_ht),
    0
  );
  const totalTTC = debits.reduce((sum, d) => sum + Number(d.montant_ttc), 0);
  const totalTVA = totalTTC - totalHT;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>
              {parametres.nom_entreprise || 'AGX Mariage'}
            </Text>
            {parametres.adresse && (
              <Text style={styles.companyInfo}>{parametres.adresse}</Text>
            )}
            {parametres.telephone && (
              <Text style={styles.companyInfo}>Tél : {parametres.telephone}</Text>
            )}
            {parametres.email && (
              <Text style={styles.companyInfo}>{parametres.email}</Text>
            )}
            {parametres.siret && (
              <Text style={styles.companyInfo}>SIRET : {parametres.siret}</Text>
            )}
          </View>
          <View>
            <Text style={styles.title}>DEVIS</Text>
            <Text style={styles.docDate}>
              Date : {new Date().toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* Client info */}
        <View style={styles.clientBox}>
          <Text style={styles.clientLabel}>Client</Text>
          <Text style={styles.clientName}>
            {client.prenom_marie_1} {client.nom_marie_1}
            {client.nom_marie_2 &&
              ` & ${client.prenom_marie_2} ${client.nom_marie_2}`}
          </Text>
          {client.adresse && (
            <Text style={styles.clientDetail}>{client.adresse}</Text>
          )}
          {(client.code_postal || client.ville) && (
            <Text style={styles.clientDetail}>
              {client.code_postal} {client.ville}
            </Text>
          )}
          {client.email_1 && (
            <Text style={styles.clientDetail}>{client.email_1}</Text>
          )}
          {client.telephone_1 && (
            <Text style={styles.clientDetail}>Tél : {client.telephone_1}</Text>
          )}
          {client.date_mariage && (
            <Text style={styles.clientDetail}>
              Date du mariage : {formatDate(client.date_mariage)}
            </Text>
          )}
        </View>

        {/* Table prestations */}
        <Text style={styles.sectionTitle}>Détail des prestations</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cellDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.cellQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.cellDesign]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderText, styles.cellPrix]}>
              P.U. HT
            </Text>
            <Text style={[styles.tableHeaderText, styles.cellTva]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.cellTtc]}>
              Total TTC
            </Text>
          </View>
          {debits.map((d, i) => (
            <View
              key={d.id}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.cellDate}>{formatDate(d.date)}</Text>
              <Text style={styles.cellQty}>{d.quantite}</Text>
              <Text style={styles.cellDesign}>{d.designation}</Text>
              <Text style={styles.cellPrix}>
                {formatCurrency(d.prix_unitaire_ht)}
              </Text>
              <Text style={styles.cellTva}>{d.taux_tva}%</Text>
              <Text style={styles.cellTtc}>
                {formatCurrency(d.montant_ttc)}
              </Text>
            </View>
          ))}
          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalHT)}</Text>
          </View>
          <View style={[styles.totalRow, { backgroundColor: '#E2E8F0' }]}>
            <Text style={styles.totalLabel}>Total TVA</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalTVA)}</Text>
          </View>
          <View
            style={[styles.totalRow, { backgroundColor: '#2B6CB0' }]}
          >
            <Text style={[styles.totalLabel, { color: 'white' }]}>
              Total TTC
            </Text>
            <Text style={[styles.totalValue, { color: 'white' }]}>
              {formatCurrency(totalTTC)}
            </Text>
          </View>
        </View>

        {/* Conditions */}
        {parametres.conditions_paiement && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Conditions de paiement</Text>
            <Text style={{ fontSize: 8, color: '#4A5568', lineHeight: 1.5 }}>
              {parametres.conditions_paiement}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {parametres.mentions_legales && (
            <Text style={styles.footerText}>{parametres.mentions_legales}</Text>
          )}
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            {parametres.nom_entreprise || 'AGX Mariage'}
            {parametres.siret && ` — SIRET : ${parametres.siret}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

interface FactureProps {
  client: Client;
  debits: Debit[];
  reglements: Reglement[];
  parametres: Parametres;
}

export function FacturePDF({
  client,
  debits,
  reglements,
  parametres,
}: FactureProps) {
  const totalTTC = debits.reduce((sum, d) => sum + Number(d.montant_ttc), 0);
  const totalHT = debits.reduce(
    (sum, d) => sum + Number(d.quantite) * Number(d.prix_unitaire_ht),
    0
  );
  const totalTVA = totalTTC - totalHT;
  const totalPaye = reglements.reduce((sum, r) => sum + Number(r.montant), 0);
  const solde = totalTTC - totalPaye;

  const modePaiementLabels: Record<string, string> = {
    cb: 'CB',
    virement: 'Virement',
    especes: 'Espèces',
    cheque: 'Chèque',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>
              {parametres.nom_entreprise || 'AGX Mariage'}
            </Text>
            {parametres.adresse && (
              <Text style={styles.companyInfo}>{parametres.adresse}</Text>
            )}
            {parametres.telephone && (
              <Text style={styles.companyInfo}>Tél : {parametres.telephone}</Text>
            )}
            {parametres.email && (
              <Text style={styles.companyInfo}>{parametres.email}</Text>
            )}
            {parametres.siret && (
              <Text style={styles.companyInfo}>SIRET : {parametres.siret}</Text>
            )}
          </View>
          <View>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.docDate}>
              Date : {new Date().toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* Client info */}
        <View style={styles.clientBox}>
          <Text style={styles.clientLabel}>Client</Text>
          <Text style={styles.clientName}>
            {client.prenom_marie_1} {client.nom_marie_1}
            {client.nom_marie_2 &&
              ` & ${client.prenom_marie_2} ${client.nom_marie_2}`}
          </Text>
          {client.adresse && (
            <Text style={styles.clientDetail}>{client.adresse}</Text>
          )}
          {(client.code_postal || client.ville) && (
            <Text style={styles.clientDetail}>
              {client.code_postal} {client.ville}
            </Text>
          )}
          {client.email_1 && (
            <Text style={styles.clientDetail}>{client.email_1}</Text>
          )}
          {client.date_mariage && (
            <Text style={styles.clientDetail}>
              Date du mariage : {formatDate(client.date_mariage)}
            </Text>
          )}
        </View>

        {/* Table prestations */}
        <Text style={styles.sectionTitle}>Prestations</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.cellDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.cellQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.cellDesign]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderText, styles.cellPrix]}>
              P.U. HT
            </Text>
            <Text style={[styles.tableHeaderText, styles.cellTva]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.cellTtc]}>
              Total TTC
            </Text>
          </View>
          {debits.map((d, i) => (
            <View
              key={d.id}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.cellDate}>{formatDate(d.date)}</Text>
              <Text style={styles.cellQty}>{d.quantite}</Text>
              <Text style={styles.cellDesign}>{d.designation}</Text>
              <Text style={styles.cellPrix}>
                {formatCurrency(d.prix_unitaire_ht)}
              </Text>
              <Text style={styles.cellTva}>{d.taux_tva}%</Text>
              <Text style={styles.cellTtc}>
                {formatCurrency(d.montant_ttc)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalHT)}</Text>
          </View>
          <View style={[styles.totalRow, { backgroundColor: '#E2E8F0' }]}>
            <Text style={styles.totalLabel}>Total TVA</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalTVA)}</Text>
          </View>
          <View style={[styles.totalRow, { backgroundColor: '#2B6CB0' }]}>
            <Text style={[styles.totalLabel, { color: 'white' }]}>
              Total TTC
            </Text>
            <Text style={[styles.totalValue, { color: 'white' }]}>
              {formatCurrency(totalTTC)}
            </Text>
          </View>
        </View>

        {/* Règlements */}
        {reglements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Règlements effectués</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.cellDate]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderText, styles.cellMode]}>
                  Mode
                </Text>
                <Text style={[styles.tableHeaderText, styles.cellRef]}>
                  Référence
                </Text>
                <Text style={[styles.tableHeaderText, styles.cellMontant]}>
                  Montant
                </Text>
              </View>
              {reglements.map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    styles.tableRow,
                    i % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={styles.cellDate}>{formatDate(r.date)}</Text>
                  <Text style={styles.cellMode}>
                    {modePaiementLabels[r.mode] || r.mode}
                  </Text>
                  <Text style={styles.cellRef}>{r.reference || '-'}</Text>
                  <Text style={styles.cellMontant}>
                    {formatCurrency(r.montant)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total payé</Text>
                <Text style={[styles.totalValue, { color: '#38A169' }]}>
                  {formatCurrency(totalPaye)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Solde */}
        <View
          style={[
            styles.soldeBox,
            {
              backgroundColor: solde > 0 ? '#FFF5F5' : '#F0FFF4',
              border: solde > 0 ? '1px solid #FEB2B2' : '1px solid #9AE6B4',
            },
          ]}
        >
          <Text style={styles.soldeLabel}>Solde restant dû</Text>
          <Text
            style={[
              styles.soldeValue,
              { color: solde > 0 ? '#E53E3E' : '#38A169' },
            ]}
          >
            {formatCurrency(solde)}
          </Text>
        </View>

        {/* Conditions */}
        {parametres.conditions_paiement && (
          <View style={{ marginTop: 5 }}>
            <Text style={styles.sectionTitle}>Conditions de paiement</Text>
            <Text style={{ fontSize: 8, color: '#4A5568', lineHeight: 1.5 }}>
              {parametres.conditions_paiement}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {parametres.mentions_legales && (
            <Text style={styles.footerText}>{parametres.mentions_legales}</Text>
          )}
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            {parametres.nom_entreprise || 'AGX Mariage'}
            {parametres.siret && ` — SIRET : ${parametres.siret}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
