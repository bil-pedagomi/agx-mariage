'use client';

import TopNav from '@/components/layout/TopNav';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Loading state — show spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Chargement...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — hard redirect to /login (cross route group)
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Redirection...</span>
        </div>
      </div>
    );
  }

  // Authenticated — render the app
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="pt-25">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}
