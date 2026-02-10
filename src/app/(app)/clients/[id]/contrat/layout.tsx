'use client';
export default function ContratLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#f1f5f9', overflow: 'auto' }}>
      {children}
    </div>
  );
}
