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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CURRENT_PROFILE_KEY = '4ever_current_profile';
export const REGISTERED_PROFILES_KEY = '4ever_registered_profiles_v1';
export const TOMBSTONE_KEY = '4ever_deleted_users_tombstone_v1';
export const ACTIVE_AUTH_USER_KEY = '4ever_active_auth_user_v1';

export const saveToRegisteredProfiles = (p: Profile) => {
  try {
    const tombRaw = localStorage.getItem(TOMBSTONE_KEY);
    const tombList: string[] = tombRaw ? JSON.parse(tombRaw) : [];
    if (tombList.includes(p.id) || (p.email && tombList.includes(p.email.toLowerCase()))) {
      return; // Never re-save purged users
    }
    const raw = localStorage.getItem(REGISTERED_PROFILES_KEY);
    const list: Profile[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((item) => item.id === p.id || (p.email && item.email === p.email));
    if (index >= 0) {
      list[index] = { ...list[index], ...p };
    } else {
      list.unshift(p);
    }
    localStorage.setItem(REGISTERED_PROFILES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_PROFILE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (
    userId: string,
    email?: string,
    metadata?: Record<string, unknown>
  ) => {
    // 1. Immediately load matching cached profile if available to avoid any blank flicker
    let cached: Profile | null = null;
    try {
      const stored = localStorage.getItem(`4ever_profile_${userId}`) || localStorage.getItem(CURRENT_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === userId) {
          cached = parsed;
          setProfile(cached);
        }
      }
    } catch {
      // ignore
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        // Merge Supabase data with cached profile (preserving non-empty fields like bio if remote has null)
        const merged: Profile = {
          ...cached,
          ...(data as Profile),
          bio: (data as Profile).bio || cached?.bio || '',
          avatar_url: (data as Profile).avatar_url || cached?.avatar_url || null,
          cover_url: (data as Profile).cover_url || cached?.cover_url || null,
          is_online: true,
          last_seen: new Date().toISOString(),
        };
        setProfile(merged);
        localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(merged));
        localStorage.setItem(`4ever_profile_${userId}`, JSON.stringify(merged));
        saveToRegisteredProfiles(merged);
      } else {
        // Fallback default profile from user metadata (e.g. Google OAuth or email)
        const metaName =
          (metadata?.full_name as string) ||
          (metadata?.name as string) ||
          (metadata?.display_name as string);
        const displayName = cached?.display_name || metaName || (email ? email.split('@')[0] : 'User');
        const username = cached?.username || (
          email ? email.split('@')[0] : 'user_' + userId.slice(0, 5)
        )
          .toLowerCase()
          .replace(/\s+/g, '_');
        const avatarUrl =
          cached?.avatar_url ||
          (metadata?.avatar_url as string) ||
          (metadata?.picture as string) ||
          null;

        const newProfile: Profile = {
          id: userId,
          email: email || cached?.email || '',
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
          cover_url: cached?.cover_url || null,
          bio: cached?.bio || '',
          is_online: true,
          last_seen: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
        } catch {
          // ignore if table doesn't exist yet or RLS prevents direct insert
        }

        setProfile(newProfile);
        localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(newProfile));
        localStorage.setItem(`4ever_profile_${userId}`, JSON.stringify(newProfile));
        saveToRegisteredProfiles(newProfile);
      }
    } catch {
      // Local fallback for offline/demo mode
      const metaName =
        (metadata?.full_name as string) || (metadata?.name as string);
      const localName =
        cached?.display_name ||
        localStorage.getItem('4ever_username') ||
        metaName ||
        (email ? email.split('@')[0] : 'User');
      const fallbackProfile: Profile = {
        id: userId,
        email: email || cached?.email || '',
        username: cached?.username || localName.toLowerCase().replace(/\s+/g, '_'),
        display_name: localName,
        bio: cached?.bio || '',
        avatar_url: cached?.avatar_url || null,
        cover_url: cached?.cover_url || null,
        is_online: true,
      };
      setProfile(fallbackProfile);
      localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(fallbackProfile));
      localStorage.setItem(`4ever_profile_${userId}`, JSON.stringify(fallbackProfile));
      saveToRegisteredProfiles(fallbackProfile);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        // Fallback to active local auth user (for unconfirmed Supabase accounts)
        const storedActive = localStorage.getItem(ACTIVE_AUTH_USER_KEY);
        if (storedActive) {
          try {
            const parsed = JSON.parse(storedActive);
            if (parsed.user && parsed.profile) {
              setUser(parsed.user);
              setProfile(parsed.profile);
              setLoading(false);
              return;
            }
          } catch {}
        }

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
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        const storedActive = localStorage.getItem(ACTIVE_AUTH_USER_KEY);
        if (storedActive) {
          try {
            const parsed = JSON.parse(storedActive);
            if (parsed.user && parsed.profile) {
              setUser(parsed.user);
              setProfile(parsed.profile);
              setLoading(false);
              return;
            }
          } catch {}
        }
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

      if (error) {
        // If Supabase returns 'Email not confirmed', auto-activate the session
        if (error.message.toLowerCase().includes('email not confirmed')) {
          const regRaw = localStorage.getItem(REGISTERED_PROFILES_KEY);
          const regList: Profile[] = regRaw ? JSON.parse(regRaw) : [];
          const found = regList.find((p) => p.email?.toLowerCase() === email.toLowerCase());

          const fallbackId = found?.id || ('usr_' + Math.random().toString(36).substring(2, 9));
          const fallbackName = found?.display_name || email.split('@')[0];
          const autoUser = {
            id: fallbackId,
            email: email.toLowerCase(),
            aud: 'authenticated',
            user_metadata: {
              display_name: fallbackName,
              username: found?.username || email.split('@')[0],
            },
            created_at: new Date().toISOString(),
          } as unknown as User;

          const activeProfile: Profile = found || {
            id: fallbackId,
            email: email.toLowerCase(),
            username: email.split('@')[0].toLowerCase().replace(/\s+/g, '_'),
            display_name: fallbackName,
            bio: '',
            is_online: true,
            last_seen: new Date().toISOString(),
          };

          localStorage.setItem(ACTIVE_AUTH_USER_KEY, JSON.stringify({ user: autoUser, profile: activeProfile }));
          localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(activeProfile));
          setUser(autoUser);
          setProfile(activeProfile);
          saveToRegisteredProfiles(activeProfile);
          return { error: null };
        }
        return { error };
      }

      if (data.user) {
        localStorage.removeItem(ACTIVE_AUTH_USER_KEY);
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) return { error };
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

      const targetUserId = data.user?.id || ('usr_' + Math.random().toString(36).substring(2, 9));
      const autoUser = {
        id: targetUserId,
        email: email.toLowerCase(),
        aud: 'authenticated',
        user_metadata: {
          display_name: displayName,
          username: uname,
        },
        created_at: new Date().toISOString(),
      } as unknown as User;

      const newProf: Profile = {
        id: targetUserId,
        email: email.toLowerCase(),
        username: uname,
        display_name: displayName,
        bio: '',
        is_online: true,
        last_seen: new Date().toISOString(),
      };

      localStorage.setItem('4ever_username', displayName);
      localStorage.setItem(ACTIVE_AUTH_USER_KEY, JSON.stringify({ user: autoUser, profile: newProf }));
      localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(newProf));
      setUser(autoUser);
      setProfile(newProf);
      saveToRegisteredProfiles(newProf);

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
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
    localStorage.removeItem(ACTIVE_AUTH_USER_KEY);
    localStorage.removeItem(CURRENT_PROFILE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const current = profile || ({ id: user.id, email: user.email || '' } as Profile);
    const updated: Profile = {
      ...current,
      ...updates,
      id: user.id,
      email: user.email || current.email || '',
      last_seen: new Date().toISOString(),
    };

    // 1. Immediately update in-memory React state
    setProfile(updated);

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(updated));
      localStorage.setItem(`4ever_profile_${user.id}`, JSON.stringify(updated));
      saveToRegisteredProfiles(updated);
    } catch {
      // ignore
    }

    // 3. Upsert to Supabase profiles table
    try {
      const { error } = await supabase.from('profiles').upsert([updated], { onConflict: 'id' });
      if (error) {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      }
    } catch (err) {
      console.warn('Failed to upsert profile to Supabase:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
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
        signInWithGoogle,
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
