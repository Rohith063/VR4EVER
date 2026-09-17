import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string, username?: string) => Promise<{ error: Error | null }>;
  signInAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else {
        // Fallback default profile if table doesn't exist yet or user row missing
        const fallbackProfile: Profile = {
          id: userId,
          email: email || '',
          username: email ? email.split('@')[0] : 'user',
          display_name: email ? email.split('@')[0] : 'User',
          is_online: true,
          last_seen: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
      }
    } catch {
      // Local fallback for offline/demo mode
      const localName = localStorage.getItem('4ever_username') || (email ? email.split('@')[0] : 'User');
      setProfile({
        id: userId,
        email: email || '',
        username: localName.toLowerCase().replace(/\s+/g, '_'),
        display_name: localName,
        is_online: true,
      });
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        const storedGuest = localStorage.getItem('4ever_guest_user');
        if (storedGuest) {
          try {
            const parsed = JSON.parse(storedGuest);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, displayName: string, username?: string) => {
    try {
      const uname = username || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username: uname,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { error };

      if (data.user) {
        localStorage.setItem('4ever_username', displayName);
        await fetchProfile(data.user.id, data.user.email);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signInAsGuest = (name = 'Lovebird') => {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      id: guestId,
      email: `${name.toLowerCase()}@local.dev`,
      app_metadata: {},
      user_metadata: { display_name: name },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    const guestProfile: Profile = {
      id: guestId,
      email: `${name.toLowerCase()}@local.dev`,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      display_name: name,
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    localStorage.setItem('4ever_guest_user', JSON.stringify({ user: guestUser, profile: guestProfile }));
    setUser(guestUser);
    setProfile(guestProfile);
    setLoading(false);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem('4ever_guest_user');
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    } catch {
      // ignore
    }
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
