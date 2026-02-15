'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Profile, UserRole } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isSecretaire: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: null,
  isAdmin: false,
  isSecretaire: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    // SAFETY: force loading=false after 3 seconds no matter what
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Timeout — forcing loading=false');
        setLoading(false);
      }
    }, 3000);

    // Check session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (!mounted) return;
      console.log('[Auth] Session:', session ? session.user.email : 'none');
      setUser(session?.user ?? null);
      setLoading(false);

      // Load profile in background (non-blocking)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }: any) => {
            if (!mounted) return;
            console.log('[Auth] Profile:', data ? data.role : 'none', error?.message || '');
            if (data) setProfile(data);
          });
      }
    }).catch((err: any) => {
      if (!mounted) return;
      console.error('[Auth] Session error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (!mounted) return;
        console.log('[Auth] State change:', _event);
        setUser(session?.user ?? null);
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }: any) => {
              if (mounted && data) setProfile(data);
            });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  // Default to 'admin' when no profile loaded yet
  const role: UserRole | null = profile?.role ?? 'admin';
  const isAdmin = role === 'admin';
  const isSecretaire = role === 'secretaire';

  console.log('[Auth] Render:', { email: user?.email, role, isAdmin, loading });

  return (
    <AuthContext.Provider value={{ user, profile, loading, role, isAdmin, isSecretaire, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
