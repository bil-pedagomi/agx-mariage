import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AGX Mariage - Gestion événementielle',
  description: "Application de gestion d'événements de mariage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
