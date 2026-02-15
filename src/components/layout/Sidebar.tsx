'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Calendar,
  LayoutDashboard,
  Receipt,
  Settings,
  LogOut,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Paramètres', href: '/parametres', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-56 bg-[#1A202C] min-h-screen flex flex-col text-white shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          <div>
            <h1 className="font-bold text-sm tracking-wide">AGX Mariage</h1>
            <p className="text-[10px] text-gray-400">Gestion événementielle</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors',
                isActive
                  ? 'bg-[#2B6CB0] text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="border-t border-gray-700 p-4">
        <div className="text-xs text-gray-400 mb-1">{profile?.full_name || 'Utilisateur'}</div>
        <div className="text-[10px] text-gray-500 mb-3">
          {profile?.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
