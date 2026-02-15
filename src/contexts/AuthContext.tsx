'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
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
  const [profileChecked, setProfileChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  useEffect(() => {
    // Prevent double init in React strict mode
    if (initDone.current) return;
    initDone.current = true;

    const supabase = createClient();

    const finishLoading = (p?: any) => {
      if (p) setProfile(p);
      setProfileChecked(true);
      setLoading(false);
    };

    // SAFETY: force loading=false after 3 seconds no matter what
    setTimeout(() => {
      setProfileChecked((prev) => {
        if (!prev) {
          console.warn('[Auth] Timeout — forcing loading=false');
          setLoading(false);
          return true;
        }
        return prev;
      });
    }, 3000);

    // Check session + load profile
    supabase.auth.getSession()
      .then(({ data: { session } }: any) => {
        console.log('[Auth] Session:', session ? session.user.email : 'none');
        const u = session?.user ?? null;
        setUser(u);

        if (!u) {
          finishLoading();
          return;
        }

        // Load profile — with catch to ALWAYS finish loading
        supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single()
          .then(({ data, error }: any) => {
            console.log('[Auth] Profile:', data?.role ?? 'no profile', error?.message || '');
            finishLoading(data || null);
          })
          .catch((err: any) => {
            console.error('[Auth] Profile error:', err);
            finishLoading();
          });
      })
      .catch((err: any) => {
        console.error('[Auth] Session error:', err);
        finishLoading();
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        console.log('[Auth] State change:', _event);
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .single()
            .then(({ data }: any) => {
              if (data) setProfile(data);
              setProfileChecked(true);
            })
            .catch(() => setProfileChecked(true));
        } else {
          setProfile(null);
          setProfileChecked(true);
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      supabase.auth.signOut().catch(() => {});
    } catch {}
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  // Si profil vérifié → utiliser son rôle. Si pas de profil trouvé → admin par défaut.
  const role: UserRole | null = profileChecked
    ? (profile?.role ?? 'admin')
    : null;
  const isAdmin = role === 'admin';
  const isSecretaire = role === 'secretaire';

  console.log('[Auth] Role:', role, '| email:', user?.email, '| isAdmin:', isAdmin, '| loading:', loading);

  return (
    <AuthContext.Provider value={{ user, profile, loading, role, isAdmin, isSecretaire, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
