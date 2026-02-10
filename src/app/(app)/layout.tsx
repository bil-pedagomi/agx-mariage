import TopNav from '@/components/layout/TopNav';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="pt-25">{children}</main>
    </div>
  );
}
