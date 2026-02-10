'use client';

// Override the (app) layout to hide TopNav for the facture print page
export default function FactureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#f1f5f9', overflow: 'auto' }}>
      {children}
    </div>
  );
}
