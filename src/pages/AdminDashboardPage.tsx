import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  HardDrive,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  LogOut,
  Layers,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  Check,
  X,
  Radio,
  UserCheck,
  UserX,
  Download,
  Heart,
  Image as ImageIcon,
  Send,
  Edit,
  Database,
  Upload,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  REGISTERED_PROFILES_KEY,
  TOMBSTONE_KEY,
  saveToRegisteredProfiles,
} from '../context/AuthContext';
import type {
  AdminUserRecord,
  DirectusAssetRecord,
  StaffMemberRecord,
  StaffRole,
  FeedPost,
  Relationship,
  Profile,
} from '../types';

const CMS_STAFF_STORAGE_KEY = '4ever_cms_staff_list_v4';
const CMS_SESSION_KEY = '4ever_cms_session_v4';
const CMS_USERS_CACHE_KEY = '4ever_cms_users_cache_v4';
const CMS_POSTS_CACHE_KEY = '4ever_cms_posts_cache_v4';
const CMS_RELS_CACHE_KEY = '4ever_cms_rels_cache_v4';
const MASTER_ROOT_PIN = '4444';
const MASTER_ROOT_PIN_KEY = '4ever_cms_master_pin_v1';

// Default Super Admin Root Account
const DEFAULT_ROOT_ADMIN: StaffMemberRecord = {
  id: 'staff_super_admin',
  name: 'Platform Root Administrator',
  email: 'admin@4ever.app',
  password: 'admin',
  role: 'super_admin',
  permissions: ['all'],
  status: 'active',
  created_at: new Date('2026-01-01').toISOString(),
  last_login: new Date().toISOString(),
};

export const AdminDashboardPage: React.FC = () => {
  // -------------------------------------------------------------
  // 1. Staff & Authentication State
  // -------------------------------------------------------------
  const [staffList, setStaffList] = useState<StaffMemberRecord[]>(() => {
    try {
      const stored = localStorage.getItem(CMS_STAFF_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [DEFAULT_ROOT_ADMIN];
  });

  const [currentStaff, setCurrentStaff] = useState<StaffMemberRecord | null>(() => {
    try {
      const stored = sessionStorage.getItem(CMS_SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // -------------------------------------------------------------
  // 2. Navigation Modules State
  // -------------------------------------------------------------
  const [activeModule, setActiveModule] = useState<
    'insights' | 'users' | 'relationships' | 'posts' | 'broadcast' | 'assets' | 'storage' | 'staff' | 'settings'
  >('insights');

  // -------------------------------------------------------------
  // 3. Live Database Data State (Users, Relationships, Posts, Messages)
  // -------------------------------------------------------------
  const [users, setUsers] = useState<AdminUserRecord[]>(() => {
    try {
      const stored = localStorage.getItem(CMS_USERS_CACHE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [relationships, setRelationships] = useState<Relationship[]>(() => {
    try {
      const stored = localStorage.getItem(CMS_RELS_CACHE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const stored = localStorage.getItem(CMS_POSTS_CACHE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [totalMessagesCount, setTotalMessagesCount] = useState<number>(0);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'staff' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'online' | 'banned'>('all');
  const [postsFilter, setPostsFilter] = useState<'all' | 'public' | 'private'>('all');

  // -------------------------------------------------------------
  // 4. Modals State
  // -------------------------------------------------------------
  const [editUserModal, setEditUserModal] = useState<{ open: boolean; user: AdminUserRecord | null }>({
    open: false,
    user: null,
  });
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createStaffModalOpen, setCreateStaffModalOpen] = useState(false);
  const [createPairModalOpen, setCreatePairModalOpen] = useState(false);
  const [assetPreviewModal, setAssetPreviewModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: '',
  });

  // Create User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserQuota, setNewUserQuota] = useState(100);

  // Create Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('moderator');
  const [newStaffPermissions, setNewStaffPermissions] = useState<string[]>([
    'manage_users',
    'manage_posts',
  ]);

  // Create Pair Form State
  const [pairUser1, setPairUser1] = useState('');
  const [pairUser2, setPairUser2] = useState('');
  const [pairType, setPairType] = useState<'couple' | 'bestfriends' | 'siblings'>('couple');
  const [pairBudget, setPairBudget] = useState(15000);

  // Global Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Platform Settings State
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true);
  const [maxUploadMB, setMaxUploadMB] = useState<number>(25);

  // Master Admin Credentials & Password in Settings
  const [adminDisplayName, setAdminDisplayName] = useState(currentStaff?.name || 'Platform Root Administrator');
  const [adminEmail, setAdminEmail] = useState(currentStaff?.email || 'admin@4ever.app');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminMasterPin, setAdminMasterPin] = useState(() => localStorage.getItem(MASTER_ROOT_PIN_KEY) || MASTER_ROOT_PIN);
  const [adminSavedNotice, setAdminSavedNotice] = useState<string | null>(null);
  const [sqlCopiedNotice, setSqlCopiedNotice] = useState(false);
  const [editUserPassword, setEditUserPassword] = useState('');

  useEffect(() => {
    if (currentStaff) {
      setAdminDisplayName(currentStaff.name);
      setAdminEmail(currentStaff.email);
    }
  }, [currentStaff]);

  // -------------------------------------------------------------
  // 5. Persistence
  // -------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem(CMS_STAFF_STORAGE_KEY, JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    if (currentStaff) {
      sessionStorage.setItem(CMS_SESSION_KEY, JSON.stringify(currentStaff));
    } else {
      sessionStorage.removeItem(CMS_SESSION_KEY);
    }
  }, [currentStaff]);

  useEffect(() => {
    localStorage.setItem(CMS_USERS_CACHE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(CMS_RELS_CACHE_KEY, JSON.stringify(relationships));
  }, [relationships]);

  useEffect(() => {
    localStorage.setItem(CMS_POSTS_CACHE_KEY, JSON.stringify(posts));
  }, [posts]);

  // -------------------------------------------------------------
  // 6. Live Supabase Data Fetcher
  // -------------------------------------------------------------
  const fetchAllLiveData = async () => {
    setIsLoadingLive(true);
    let connected = true;

    try {
      const usersMap = new Map<string, AdminUserRecord>();

      let tombList: string[] = [];
      try {
        const tombRaw = localStorage.getItem(TOMBSTONE_KEY);
        if (tombRaw) tombList = JSON.parse(tombRaw);
      } catch {}

      const isPurged = (id?: string, email?: string, uname?: string) => {
        if (!id && !email && !uname) return false;
        if (id && tombList.includes(id)) return true;
        if (email && tombList.includes(email.toLowerCase())) return true;
        if (uname && tombList.includes(uname.toLowerCase())) return true;
        return false;
      };

      const toAdminRecord = (p: Profile, _source = 'live'): AdminUserRecord => ({
        id: p.id,
        display_name: p.display_name || 'User',
        username: p.username || (p.email ? p.email.split('@')[0] : 'user_' + p.id.slice(0, 5)),
        email: p.email || 'No email provided',
        avatar_url: p.avatar_url || null,
        cover_url: p.cover_url || null,
        bio: p.bio || null,
        role: (p as unknown as { role?: 'user' | 'staff' | 'admin' }).role || 'user',
        relationship_id: (p as unknown as { relationship_id?: string }).relationship_id || null,
        partner_name: p.relationship_partner_name || null,
        storage_used_mb: (p as unknown as { storage_used_mb?: number }).storage_used_mb || 14,
        storage_limit_mb: 100,
        is_online: p.is_online ?? true,
        is_banned: (p as unknown as { is_banned?: boolean }).is_banned ?? false,
        last_seen: p.last_seen || 'Recently',
        created_at: p.created_at || new Date().toISOString(),
      });

      // 0. Load CMS Users Cache (Admin-created users and edits)
      try {
        const cmsCacheRaw = localStorage.getItem(CMS_USERS_CACHE_KEY);
        if (cmsCacheRaw) {
          const parsed = JSON.parse(cmsCacheRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((u: AdminUserRecord) => {
              if (u && u.id && !isPurged(u.id, u.email, u.username)) {
                usersMap.set(u.id, u);
              }
            });
          }
        }
      } catch {}

      // A. Load registered profiles registry (Synced from all web/mobile signins)
      try {
        const regRaw = localStorage.getItem(REGISTERED_PROFILES_KEY);
        if (regRaw) {
          const parsed = JSON.parse(regRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: Profile) => {
              if (p && p.id && !isPurged(p.id, p.email, p.username)) {
                const existing = usersMap.get(p.id);
                usersMap.set(p.id, {
                  ...toAdminRecord(p, 'registry'),
                  ...(existing || {}),
                });
              }
            });
          }
        }
      } catch {}

      // B. Load Social Context users
      try {
        const socRaw = localStorage.getItem('4ever_real_users_v4');
        if (socRaw) {
          const parsed = JSON.parse(socRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: Profile) => {
              if (p && p.id && !isPurged(p.id, p.email, p.username) && !usersMap.has(p.id)) {
                usersMap.set(p.id, toAdminRecord(p, 'social'));
              }
            });
          }
        }
      } catch {}

      // C. Load Current User Profile
      try {
        const currRaw = localStorage.getItem('4ever_current_profile');
        if (currRaw) {
          const p = JSON.parse(currRaw);
          if (p && p.id && !isPurged(p.id, p.email, p.username)) {
            usersMap.set(p.id, toAdminRecord(p, 'current'));
          }
        }
      } catch {}

      // D. Query active Supabase Auth Session (Detects live logged-in user in Supabase Auth)
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const authUser = sessionRes?.session?.user;
        if (authUser && !isPurged(authUser.id, authUser.email, authUser.user_metadata?.username)) {
          const existing = usersMap.get(authUser.id);
          const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.display_name || authUser.user_metadata?.name;
          const liveRecord: AdminUserRecord = {
            id: authUser.id,
            display_name: existing?.display_name || metaName || (authUser.email ? authUser.email.split('@')[0] : 'Active Live User'),
            username: existing?.username || authUser.user_metadata?.username || (authUser.email ? authUser.email.split('@')[0] : 'user_' + authUser.id.slice(0, 5)),
            email: authUser.email || existing?.email || 'Authenticated User',
            avatar_url: existing?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
            cover_url: existing?.cover_url || null,
            bio: existing?.bio || null,
            role: 'user',
            relationship_id: existing?.relationship_id || null,
            partner_name: existing?.partner_name || null,
            storage_used_mb: existing?.storage_used_mb || 15,
            storage_limit_mb: 100,
            is_online: true,
            is_banned: false,
            last_seen: 'Online Live Now',
            created_at: authUser.created_at || new Date().toISOString(),
          };
          usersMap.set(authUser.id, liveRecord);
        }
      } catch {}

      // E. 1. Fetch live Profiles table from Supabase
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profilesError && profilesData && profilesData.length > 0) {
        profilesData.forEach((p: Profile) => {
          if (isPurged(p.id, p.email, p.username)) return;
          const existing = usersMap.get(p.id);
          usersMap.set(p.id, {
            ...toAdminRecord(p, 'supabase'),
            bio: p.bio || existing?.bio || null,
            avatar_url: p.avatar_url || existing?.avatar_url || null,
            cover_url: p.cover_url || existing?.cover_url || null,
            display_name: p.display_name || existing?.display_name || 'User',
            email: p.email || existing?.email || 'No email provided',
          });
        });
      } else if (profilesError) {
        connected = false;
      }

      const mergedUsers = Array.from(usersMap.values()).filter(
        (u) => !isPurged(u.id, u.email, u.username)
      );
      setUsers(mergedUsers);
      localStorage.setItem(CMS_USERS_CACHE_KEY, JSON.stringify(mergedUsers));

      // 2. Fetch live Relationships
      const { data: relsData, error: relsError } = await supabase
        .from('relationships')
        .select('*');

      if (!relsError && relsData) {
        setRelationships(relsData as Relationship[]);
      }

      // 3. Fetch live Posts (Merge with local posts if Supabase has none)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!postsError && postsData && postsData.length > 0) {
        setPosts(postsData as FeedPost[]);
      } else {
        try {
          const storedP = localStorage.getItem('4ever_real_posts_v4');
          if (storedP) {
            const parsed = JSON.parse(storedP);
            if (Array.isArray(parsed) && parsed.length > 0) setPosts(parsed);
          }
        } catch {}
      }

      // 4. Fetch live Messages count
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        setTotalMessagesCount(count);
      } else {
        try {
          const storedD = localStorage.getItem('4ever_real_dm_msgs_v4');
          if (storedD) {
            const parsed = JSON.parse(storedD);
            const total = Object.values(parsed).reduce((acc: number, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
            setTotalMessagesCount(total);
          }
        } catch {}
      }

      setSupabaseConnected(connected);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Supabase live fetch error:', err);
      setSupabaseConnected(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Initial fetch on staff login
  useEffect(() => {
    if (currentStaff) {
      fetchAllLiveData();
    }
  }, [currentStaff]);

  // -------------------------------------------------------------
  // 7. Authentication Handlers
  // -------------------------------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = loginIdentifier.trim().toLowerCase();
    const secret = loginPassword.trim();
    const activeMasterPin = localStorage.getItem(MASTER_ROOT_PIN_KEY) || MASTER_ROOT_PIN;
    const rootAdmin = staffList.find((s) => s.role === 'super_admin') || DEFAULT_ROOT_ADMIN;

    // 1. Check Root Master PIN or admin password
    if (
      secret === activeMasterPin ||
      (query === 'admin' && (secret === rootAdmin.password || secret === 'admin')) ||
      (query === rootAdmin.email.toLowerCase() && (secret === rootAdmin.password || secret === activeMasterPin))
    ) {
      const activeRoot = { ...rootAdmin, last_login: new Date().toISOString() };
      setCurrentStaff(activeRoot);
      confetti({ particleCount: 60, spread: 60, colors: ['#6366f1', '#a855f7', '#10b981'] });
      return;
    }

    // 2. Check registered staff accounts
    const matchedStaff = staffList.find(
      (s) => s.email.toLowerCase() === query || s.name.toLowerCase() === query
    );

    if (matchedStaff) {
      if (matchedStaff.status === 'suspended') {
        setLoginError('This staff account has been suspended by the Super Admin.');
        return;
      }
      if (matchedStaff.password === secret || secret === activeMasterPin) {
        const updatedStaff = { ...matchedStaff, last_login: new Date().toISOString() };
        setCurrentStaff(updatedStaff);
        setStaffList((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));
        confetti({ particleCount: 60, spread: 60, colors: ['#6366f1', '#a855f7', '#10b981'] });
        return;
      }
    }

    setLoginError(`Invalid Staff Credentials or Master PIN. (Default PIN: ${activeMasterPin} or admin/admin)`);
  };

  const handleLogout = () => {
    setCurrentStaff(null);
    sessionStorage.removeItem(CMS_SESSION_KEY);
  };

  // -------------------------------------------------------------
  // 8. Staff Management Handlers (Super Admin Only)
  // -------------------------------------------------------------
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) return;

    const newStaff: StaffMemberRecord = {
      id: 'staff_' + Date.now(),
      name: newStaffName.trim(),
      email: newStaffEmail.trim().toLowerCase(),
      password: newStaffPassword.trim(),
      role: newStaffRole,
      permissions: newStaffPermissions,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    setStaffList((prev) => [...prev, newStaff]);
    setCreateStaffModalOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    confetti({ particleCount: 70, spread: 60 });
  };

  const handleToggleStaffStatus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          if (s.role === 'super_admin') return s; // Cannot suspend root
          return { ...s, status: s.status === 'active' ? 'suspended' : 'active' };
        }
        return s;
      })
    );
  };

  const handleDeleteStaff = (staffId: string) => {
    const target = staffList.find((s) => s.id === staffId);
    if (target?.role === 'super_admin') {
      alert('The Platform Root Administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to remove staff member "${target?.name}"?`)) {
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    }
  };

  // -------------------------------------------------------------
  // 9. Users & Relationships Handlers
  // -------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUserId = 'usr_' + Date.now();
    const uname = newUserUsername.trim() || newUserName.trim().toLowerCase().replace(/\s+/g, '_');
    const email = newUserEmail.trim().toLowerCase();

    // 1. Remove from tombstone blacklist if previously purged
    try {
      const tombRaw = localStorage.getItem(TOMBSTONE_KEY);
      if (tombRaw) {
        let tombList: string[] = JSON.parse(tombRaw);
        tombList = tombList.filter(
          (item) => item !== newUserId && item !== email && item !== uname.toLowerCase()
        );
        localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombList));
      }
    } catch {}

    const createdRecord: AdminUserRecord = {
      id: newUserId,
      display_name: newUserName.trim(),
      username: uname,
      email: email,
      role: 'user',
      storage_used_mb: 0,
      storage_limit_mb: newUserQuota,
      is_online: true,
      is_banned: false,
      last_seen: 'Just created',
      created_at: new Date().toISOString(),
    };

    const newProfile: Profile = {
      id: newUserId,
      display_name: createdRecord.display_name,
      username: uname,
      email: email,
      bio: '',
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // 2. Add to React state and CMS cache
    setUsers((prev) => {
      const updated = [createdRecord, ...prev.filter((u) => u.id !== newUserId)];
      localStorage.setItem(CMS_USERS_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    // 3. Persist to registered profiles registry
    saveToRegisteredProfiles(newProfile);

    // 4. Persist to real users context cache
    try {
      const socRaw = localStorage.getItem('4ever_real_users_v4');
      const socList: Profile[] = socRaw ? JSON.parse(socRaw) : [];
      socList.unshift(newProfile);
      localStorage.setItem('4ever_real_users_v4', JSON.stringify(socList));
      localStorage.setItem(`4ever_profile_${newUserId}`, JSON.stringify(newProfile));
    } catch {}

    // 5. Live Supabase upsert
    try {
      await supabase.from('profiles').upsert([
        {
          id: newUserId,
          display_name: createdRecord.display_name,
          username: createdRecord.username,
          email: createdRecord.email,
          is_online: true,
          last_seen: new Date().toISOString(),
        },
      ], { onConflict: 'id' });
    } catch (err) {
      console.error('Failed to insert user to Supabase:', err);
    }

    setCreateUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal.user) return;

    const updated = editUserModal.user;
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === updated.id ? updated : u));
      localStorage.setItem(CMS_USERS_CACHE_KEY, JSON.stringify(next));
      return next;
    });

    // Sync to local registered profiles registry
    try {
      const regRaw = localStorage.getItem(REGISTERED_PROFILES_KEY);
      if (regRaw) {
        const list = JSON.parse(regRaw);
        const idx = list.findIndex((item: { id: string }) => item.id === updated.id);
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            display_name: updated.display_name,
            username: updated.username,
            bio: updated.bio,
            storage_limit_mb: updated.storage_limit_mb,
          };
          localStorage.setItem(REGISTERED_PROFILES_KEY, JSON.stringify(list));
        }
      }
    } catch {}

    // Update individual profile cache
    try {
      const cached = localStorage.getItem(`4ever_profile_${updated.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        localStorage.setItem(`4ever_profile_${updated.id}`, JSON.stringify({ ...parsed, ...updated }));
      }
    } catch {}

    try {
      await supabase
        .from('profiles')
        .upsert({
          id: updated.id,
          display_name: updated.display_name,
          username: updated.username,
          bio: updated.bio,
        }, { onConflict: 'id' });
    } catch (err) {
      console.error('Failed to update user in Supabase:', err);
    }

    if (editUserPassword.trim()) {
      try {
        await supabase.auth.updateUser({ password: editUserPassword.trim() });
      } catch {}
      alert(`User profile & password successfully updated for "${updated.display_name}"!`);
      setEditUserPassword('');
    }

    setEditUserModal({ open: false, user: null });
  };

  const handleToggleBanUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const newStatus = !target.is_banned;
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, is_banned: newStatus } : u));
      localStorage.setItem(CMS_USERS_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('profiles').update({ is_banned: newStatus }).eq('id', userId);
    } catch (err) {
      console.error('Failed to toggle ban in Supabase:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    const targetName = target?.display_name || 'this user';
    const targetUname = target?.username ? ` (@${target.username})` : '';

    if (confirm(`Permanently purge user account "${targetName}"${targetUname} and all their data from the platform?`)) {
      // 1. Add to tombstone blacklist
      try {
        const tombRaw = localStorage.getItem(TOMBSTONE_KEY);
        const tombList: string[] = tombRaw ? JSON.parse(tombRaw) : [];
        if (!tombList.includes(userId)) tombList.push(userId);
        if (target?.email && !tombList.includes(target.email.toLowerCase())) {
          tombList.push(target.email.toLowerCase());
        }
        if (target?.username && !tombList.includes(target.username.toLowerCase())) {
          tombList.push(target.username.toLowerCase());
        }
        localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombList));
      } catch {}

      // 2. Update React state and CMS cache
      setUsers((prev) => {
        const updated = prev.filter((u) => u.id !== userId);
        localStorage.setItem(CMS_USERS_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      // 3. Remove from registered profiles registry
      try {
        const regRaw = localStorage.getItem(REGISTERED_PROFILES_KEY);
        if (regRaw) {
          const list: Profile[] = JSON.parse(regRaw);
          const filtered = list.filter((p) => p.id !== userId && p.email?.toLowerCase() !== target?.email?.toLowerCase());
          localStorage.setItem(REGISTERED_PROFILES_KEY, JSON.stringify(filtered));
        }
      } catch {}

      // 4. Remove from real users cache
      try {
        const socRaw = localStorage.getItem('4ever_real_users_v4');
        if (socRaw) {
          const list: Profile[] = JSON.parse(socRaw);
          const filtered = list.filter((p) => p.id !== userId && p.email?.toLowerCase() !== target?.email?.toLowerCase());
          localStorage.setItem('4ever_real_users_v4', JSON.stringify(filtered));
        }
        localStorage.removeItem(`4ever_profile_${userId}`);
      } catch {}

      // 5. Remove from relationships
      setRelationships((prev) => {
        const updated = prev.filter((r) => r.user_1 !== userId && r.user_2 !== userId);
        localStorage.setItem(CMS_RELS_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      // 6. Delete from Supabase
      try {
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (err) {
        console.error('Failed to delete user in Supabase:', err);
      }
    }
  };

  const handleCreatePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairUser1 || !pairUser2 || pairUser1 === pairUser2) {
      alert('Please select two different users to connect.');
      return;
    }

    const u1 = users.find((u) => u.id === pairUser1);
    const u2 = users.find((u) => u.id === pairUser2);
    const newRelId = 'rel_' + Date.now();

    const newRel: Relationship = {
      id: newRelId,
      user_1: pairUser1,
      user_2: pairUser2,
      relation_type: pairType,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      budget_limit: pairBudget,
      created_at: new Date().toISOString(),
    };

    setRelationships((prev) => [newRel, ...prev]);

    // Update partner names in local user state
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === pairUser1) return { ...u, relationship_id: newRelId, partner_name: u2?.display_name };
        if (u.id === pairUser2) return { ...u, relationship_id: newRelId, partner_name: u1?.display_name };
        return u;
      })
    );

    // Live Supabase sync
    try {
      await supabase.from('relationships').insert([newRel]);
      await supabase.from('profiles').update({ relationship_partner_name: u2?.display_name }).eq('id', pairUser1);
      await supabase.from('profiles').update({ relationship_partner_name: u1?.display_name }).eq('id', pairUser2);
    } catch (err) {
      console.error('Failed to sync relationship to Supabase:', err);
    }

    setCreatePairModalOpen(false);
    confetti({ particleCount: 70, spread: 70, colors: ['#f43f5e', '#ec4899', '#fbbf24'] });
  };

  const handleDisconnectRelationship = async (relId: string) => {
    if (confirm('Disconnect this relationship space?')) {
      const rel = relationships.find((r) => r.id === relId);
      setRelationships((prev) => prev.filter((r) => r.id !== relId));

      if (rel) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === rel.user_1 || u.id === rel.user_2
              ? { ...u, relationship_id: null, partner_name: null }
              : u
          )
        );
      }

      try {
        await supabase.from('relationships').delete().eq('id', relId);
      } catch (err) {
        console.error('Failed to delete relationship in Supabase:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // 10. Posts & Content Moderation Handlers
  // -------------------------------------------------------------
  const handleDeletePost = async (postId: string) => {
    if (confirm('Delete this post permanently from all user feeds?')) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      try {
        await supabase.from('posts').delete().eq('id', postId);
      } catch (err) {
        console.error('Failed to delete post in Supabase:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // 11. Realtime Global Broadcast
  // -------------------------------------------------------------
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      const broadcastChannel = supabase.channel('4ever_realtime_network');
      await broadcastChannel.send({
        type: 'broadcast',
        event: 'system_announcement',
        payload: {
          id: 'ann_' + Date.now(),
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          sender_name: currentStaff?.name || 'Administrator',
          created_at: new Date().toISOString(),
        },
      });

      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      confetti({ particleCount: 80, spread: 70 });
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    }
  };

  // -------------------------------------------------------------
  // 11b. Admin Account & Credentials Management Handlers
  // -------------------------------------------------------------
  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSavedNotice(null);

    // 1. Update Master Root PIN
    if (adminMasterPin.trim().length >= 4) {
      localStorage.setItem(MASTER_ROOT_PIN_KEY, adminMasterPin.trim());
    }

    // 2. Update staff object
    const updatedStaff: StaffMemberRecord = {
      ...(currentStaff || DEFAULT_ROOT_ADMIN),
      name: adminDisplayName.trim() || currentStaff?.name || 'Platform Root Administrator',
      email: adminEmail.trim() || currentStaff?.email || 'admin@4ever.app',
      password: adminNewPassword.trim() ? adminNewPassword.trim() : (currentStaff?.password || 'admin'),
      last_login: new Date().toISOString(),
    };

    setCurrentStaff(updatedStaff);
    sessionStorage.setItem(CMS_SESSION_KEY, JSON.stringify(updatedStaff));

    setStaffList((prev) => {
      const exists = prev.some((s) => s.id === updatedStaff.id || s.role === 'super_admin');
      if (exists) {
        return prev.map((s) => (s.id === updatedStaff.id || s.role === 'super_admin' ? updatedStaff : s));
      }
      return [updatedStaff, ...prev];
    });

    // 3. If Supabase auth session exists, update user password too
    if (adminNewPassword.trim()) {
      try {
        await supabase.auth.updateUser({ password: adminNewPassword.trim() });
      } catch {}
      setAdminNewPassword('');
    }

    setAdminSavedNotice('Admin profile, password & Master PIN saved successfully!');
    setTimeout(() => setAdminSavedNotice(null), 4000);
    confetti({ particleCount: 50, spread: 60, colors: ['#6366f1', '#10b981', '#f59e0b'] });
  };

  const handlePushUsersToSupabase = async () => {
    setIsLoadingLive(true);
    let pushed = 0;
    try {
      for (const u of users) {
        const payload = {
          id: u.id,
          display_name: u.display_name,
          username: u.username,
          email: u.email,
          bio: u.bio || '',
          avatar_url: u.avatar_url,
          cover_url: u.cover_url,
          is_online: u.is_online,
          last_seen: new Date().toISOString(),
        };
        const { error } = await supabase.from('profiles').upsert([payload], { onConflict: 'id' });
        if (!error) pushed++;
      }
      alert(`Synchronized ${pushed} user profile(s) to Supabase cloud database!`);
      await fetchAllLiveData();
    } catch (err) {
      alert('Failed to push users: ' + String(err));
    } finally {
      setIsLoadingLive(false);
    }
  };

  const copySupabaseSqlSnippet = () => {
    const sql = `-- 4EVER Complete Supabase Schema & Public RLS Policies
-- Run this in your Supabase Project -> SQL Editor to enable full sync across all devices!

create table if not exists public.profiles (
  id text primary key,
  email text,
  username text,
  display_name text,
  avatar_url text,
  cover_url text,
  bio text,
  relationship_partner_name text,
  is_online boolean default true,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Allow public read access to profiles (Crucial for Social Search, Friends & CMS)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

-- Allow authenticated users and clients to insert or update their profiles
drop policy if exists "Users can insert or update profiles" on public.profiles;
create policy "Users can insert or update profiles" on public.profiles for all using (true) with check (true);

-- Relationships Table
create table if not exists public.relationships (
  id text primary key,
  user_1 text,
  user_2 text,
  relation_type text,
  status text default 'active',
  start_date text,
  budget_limit numeric default 15000,
  custom_nickname_1 text,
  custom_nickname_2 text,
  created_at timestamptz default now()
);
alter table public.relationships enable row level security;
drop policy if exists "Relationships are accessible" on public.relationships;
create policy "Relationships are accessible" on public.relationships for all using (true) with check (true);

-- Posts Table
create table if not exists public.posts (
  id text primary key,
  author_id text,
  author_name text,
  author_avatar text,
  content text,
  media_url text,
  media_type text,
  likes_count integer default 0,
  comments_count integer default 0,
  visibility text default 'public',
  created_at timestamptz default now()
);
alter table public.posts enable row level security;
drop policy if exists "Posts are accessible" on public.posts;
create policy "Posts are accessible" on public.posts for all using (true) with check (true);
`;
    navigator.clipboard.writeText(sql);
    setSqlCopiedNotice(true);
    setTimeout(() => setSqlCopiedNotice(false), 3000);
  };

  // -------------------------------------------------------------
  // 12. Computed Assets Library from users and posts
  // -------------------------------------------------------------
  const assets: DirectusAssetRecord[] = useMemo(() => {
    const list: DirectusAssetRecord[] = [];

    posts.forEach((p, idx) => {
      if (p.media_url) {
        list.push({
          id: 'asset_post_' + p.id,
          title: `Post Attachment #${idx + 1}`,
          filename: `post_media_${p.id.slice(0, 6)}.jpg`,
          filesize_kb: Math.floor(Math.random() * 400 + 80),
          mime_type: p.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
          uploaded_by: p.author_name,
          uploaded_at: p.created_at,
          url: p.media_url,
        });
      }
    });

    users.forEach((u) => {
      if (u.avatar_url) {
        list.push({
          id: 'asset_avatar_' + u.id,
          title: `${u.display_name} Avatar`,
          filename: `avatar_${u.username}.jpg`,
          filesize_kb: 48,
          mime_type: 'image/jpeg',
          uploaded_by: u.display_name,
          uploaded_at: u.created_at,
          url: u.avatar_url,
        });
      }
      if (u.cover_url) {
        list.push({
          id: 'asset_cover_' + u.id,
          title: `${u.display_name} Cover Banner`,
          filename: `banner_${u.username}.jpg`,
          filesize_kb: 120,
          mime_type: 'image/jpeg',
          uploaded_by: u.display_name,
          uploaded_at: u.created_at,
          url: u.cover_url,
        });
      }
    });

    return list;
  }, [posts, users]);

  // -------------------------------------------------------------
  // 13. Metrics & Calculations
  // -------------------------------------------------------------
  const totalStorageUsedMB = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.storage_used_mb || 0), 0);
  }, [users]);

  const totalSystemQuotaMB = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.storage_limit_mb || 100), 0) || 5000;
  }, [users]);

  const storageUsagePercent = Math.min(100, Math.round((totalStorageUsedMB / totalSystemQuotaMB) * 100)) || 2;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'online' && u.is_online) ||
        (userStatusFilter === 'banned' && u.is_banned);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, userRoleFilter, userStatusFilter]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (postsFilter === 'public') return p.visibility === 'public';
      if (postsFilter === 'private') return p.visibility === 'private';
      return true;
    });
  }, [posts, postsFilter]);

  // JSON Data Backup Exporter
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      staff: staffList.map((s) => ({ ...s, password: '[PROTECTED]' })),
      users,
      relationships,
      posts,
      total_messages_count: totalMessagesCount,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4ever_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // 14. Unauthenticated: Staff & Admin CMS Login Screen
  // -------------------------------------------------------------
  if (!currentStaff) {
    return (
      <div className="w-screen min-h-screen bg-[#0d0f14] flex items-center justify-center p-4 font-sans text-slate-200">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#161922] border border-[#262b3a] rounded-3xl p-8 shadow-2xl space-y-6"
        >
          {/* CMS Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/30">
              CMS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">VR4EVER</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold uppercase">
                  Studio v4
                </span>
              </div>
              <p className="text-xs text-slate-400">Headless Staff Portal & Database Studio</p>
            </div>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Staff Email or Master Username
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="admin@4ever.app or staff email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1d222e] border border-[#2d3548] text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password or Master PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter PIN (e.g. 4444) or password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1d222e] border border-[#2d3548] text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Default Master PIN: <strong className="text-slate-300">4444</strong></span>
                <span>Default Password: <strong className="text-slate-300">admin</strong></span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authenticate into Directus Studio</span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#262b3a] flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Database Access</span>
            </span>
            <span>Multi-Staff RBAC Protected</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 15. Authenticated CMS Dashboard Layout
  // -------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#0c0e14] text-slate-200 font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#212636] bg-[#141721] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
            CMS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">VR4EVER CMS Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {currentStaff.role === 'super_admin' ? '👑 Super Admin' : '🛡️ ' + currentStaff.role}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{supabaseConnected ? 'Live Supabase Connected' : 'Local Fallback'}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Last Sync: {lastSyncTime}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={fetchAllLiveData}
            disabled={isLoadingLive}
            className="px-3 py-1.5 rounded-xl bg-[#1d222e] hover:bg-[#282f42] border border-[#2d3548] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh database live from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">{isLoadingLive ? 'Syncing...' : 'Sync Live DB'}</span>
          </button>

          {/* Current Staff Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#262b3a]">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">{currentStaff.name}</p>
              <p className="text-[10px] text-slate-400">{currentStaff.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
              title="Sign out of Admin CMS"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container with Sidebar & Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#11131a] border-r border-[#212636] flex-shrink-0 p-3 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Collections & Data
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveModule('insights')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'insights'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Insights & Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('users')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'users'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Users & Profiles</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono font-normal">
                  {users.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('relationships')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'relationships'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Relationships</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono font-normal">
                  {relationships.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('posts')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'posts'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4" />
                  <span>Posts & Feeds</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono font-normal">
                  {posts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('broadcast')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'broadcast'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Global Broadcast</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('assets')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'assets'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-4 h-4" />
                  <span>Asset Files</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono font-normal">
                  {assets.length}
                </span>
              </button>
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
              System & Administration
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveModule('storage')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'storage'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Storage Quota Engine</span>
              </button>

              {/* Staff Management - Visible to Super Admin only */}
              {currentStaff.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => setActiveModule('staff')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeModule === 'staff'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Staff & Roles Manager</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono font-normal">
                    {staffList.length}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveModule('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeModule === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#1c202d]'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Platform Settings</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full">
          {/* ======================================================== */}
          {/* MODULE 1: INSIGHTS & OVERVIEW                            */}
          {/* ======================================================== */}
          {activeModule === 'insights' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Platform Insights</h2>
                <p className="text-xs text-slate-400">Live operational telemetry & database volume</p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#151821] border border-[#232838] shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Users</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{users.length}</p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span>●</span> {users.filter((u) => u.is_online).length} Active Online
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#151821] border border-[#232838] shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Couple Pairings</span>
                    <Heart className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{relationships.length}</p>
                  <p className="text-[11px] text-rose-400">100% Shared Spaces Connected</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#151821] border border-[#232838] shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Feed Posts</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{posts.length}</p>
                  <p className="text-[11px] text-slate-400">Public & Private Content</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#151821] border border-[#232838] shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Storage Consumed</span>
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{totalStorageUsedMB.toFixed(1)} MB</p>
                  <p className="text-[11px] text-cyan-400 font-medium">
                    {storageUsagePercent}% of {totalSystemQuotaMB} MB Allocated
                  </p>
                </div>
              </div>

              {/* Storage Gauge & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-lg space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Storage Distribution</h3>
                      <p className="text-xs text-slate-400">Visual storage utilization across user profiles and media</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {totalStorageUsedMB.toFixed(1)} / {totalSystemQuotaMB} MB
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="w-full h-3.5 bg-[#212638] rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${Math.max(5, storageUsagePercent)}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>0 MB</span>
                      <span>50%</span>
                      <span>{totalSystemQuotaMB} MB</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#232838] text-center">
                    <div>
                      <p className="text-xs text-slate-400">Total Media Assets</p>
                      <p className="text-lg font-bold text-white mt-1">{assets.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Direct Chat Messages</p>
                      <p className="text-lg font-bold text-white mt-1">{totalMessagesCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Staff Administrators</p>
                      <p className="text-lg font-bold text-white mt-1">{staffList.length}</p>
                    </div>
                  </div>
                </div>

                {/* Quick CMS Action Shortcuts */}
                <div className="p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-lg space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setCreateUserModalOpen(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Provision New User Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatePairModalOpen(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Connect Couple Pair Instantly</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('broadcast')}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Send Global Announcement</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#212638] hover:bg-[#2c334a] border border-[#31384e] text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Complete DB Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 2: USERS & PROFILES MANAGEMENT                    */}
          {/* ======================================================== */}
          {activeModule === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">User Management</h2>
                  <p className="text-xs text-slate-400">All registered profiles stored in Supabase</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, @username, email, or user ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161922] border border-[#272d3e] text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as 'all' | 'user' | 'staff' | 'admin')}
                    className="px-3 py-2.5 rounded-xl bg-[#161922] border border-[#272d3e] text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as 'all' | 'online' | 'banned')}
                    className="px-3 py-2.5 rounded-xl bg-[#161922] border border-[#272d3e] text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="online">Online Now</option>
                    <option value="banned">Banned / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-[#232838] bg-[#141721] overflow-x-auto shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1a1e2b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#232838]">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Partner / Space</th>
                      <th className="py-3.5 px-4">Storage (MB)</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No users found matching query
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#1a1e2b]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 border border-white/10">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                                ) : (
                                  u.display_name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-white leading-tight">{u.display_name}</p>
                                <p className="text-[11px] text-slate-500">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{u.email}</td>
                          <td className="py-3.5 px-4">
                            {u.partner_name ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-300 font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                                <Heart className="w-3 h-3 fill-rose-300" />
                                <span>{u.partner_name}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] text-cyan-300 font-semibold">
                              {u.storage_used_mb} MB
                            </span>
                            <span className="text-slate-500 text-[10px]"> / {u.storage_limit_mb} MB</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : u.role === 'staff'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-700/30 text-slate-400'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.is_banned ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                                Banned
                              </span>
                            ) : u.is_online ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Offline</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditUserModal({ open: true, user: u })}
                                className="p-1.5 rounded-lg bg-[#212638] hover:bg-[#2d344d] text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit User"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBanUser(u.id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  u.is_banned
                                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                }`}
                                title={u.is_banned ? 'Unban User' : 'Ban User'}
                              >
                                {u.is_banned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 3: RELATIONSHIPS & SPACES                         */}
          {/* ======================================================== */}
          {activeModule === 'relationships' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Relationships & Spaces</h2>
                  <p className="text-xs text-slate-400">All coupled and paired connections</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatePairModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-rose-600/30 cursor-pointer w-fit"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Connect 2 Users</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relationships.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-[#141721] rounded-3xl border border-[#232838]">
                    No paired relationships yet. Click "Connect 2 Users" above to create one.
                  </div>
                ) : (
                  relationships.map((rel) => {
                    const u1 = users.find((u) => u.id === rel.user_1);
                    const u2 = users.find((u) => u.id === rel.user_2);

                    return (
                      <div
                        key={rel.id}
                        className="p-5 rounded-3xl bg-[#151821] border border-[#232838] shadow-lg space-y-4 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold uppercase">
                            {rel.relation_type} Space
                          </span>
                          <span className="text-[11px] text-emerald-400 font-medium">Active</span>
                        </div>

                        {/* Partners Row */}
                        <div className="flex items-center justify-center gap-4 py-2">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center mx-auto border-2 border-white/10 shadow-md">
                              {u1?.avatar_url ? (
                                <img src={u1.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                u1?.display_name?.slice(0, 2).toUpperCase() || 'U1'
                              )}
                            </div>
                            <p className="text-xs font-semibold text-white mt-1.5 truncate max-w-[90px]">
                              {u1?.display_name || 'Partner 1'}
                            </p>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <Heart className="w-4 h-4 fill-rose-400" />
                          </div>

                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-400 to-indigo-600 text-white font-bold flex items-center justify-center mx-auto border-2 border-white/10 shadow-md">
                              {u2?.avatar_url ? (
                                <img src={u2.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                u2?.display_name?.slice(0, 2).toUpperCase() || 'U2'
                              )}
                            </div>
                            <p className="text-xs font-semibold text-white mt-1.5 truncate max-w-[90px]">
                              {u2?.display_name || 'Partner 2'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#232838] flex items-center justify-between text-[11px] text-slate-400">
                          <span>Since: {rel.start_date}</span>
                          <span>Budget: ₹{rel.budget_limit}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDisconnectRelationship(rel.id)}
                          className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Disconnect Pairing
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 4: POSTS & FEEDS MODERATION                       */}
          {/* ======================================================== */}
          {activeModule === 'posts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Feed Posts & Moderation</h2>
                  <p className="text-xs text-slate-400">Moderate community feeds, captions, and media attachments</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPostsFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      postsFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-[#1a1e2b] text-slate-400'
                    }`}
                  >
                    All Posts ({posts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostsFilter('public')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      postsFilter === 'public' ? 'bg-indigo-600 text-white' : 'bg-[#1a1e2b] text-slate-400'
                    }`}
                  >
                    Public Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostsFilter('private')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      postsFilter === 'private' ? 'bg-indigo-600 text-white' : 'bg-[#1a1e2b] text-slate-400'
                    }`}
                  >
                    Private Only
                  </button>
                </div>
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-[#141721] rounded-3xl border border-[#232838]">
                    No feed posts found.
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-3xl bg-[#151821] border border-[#232838] shadow-lg space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                              {post.author_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">{post.author_name}</p>
                              <p className="text-[10px] text-slate-500">@{post.author_username}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${
                              post.visibility === 'public'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {post.visibility || 'public'}
                          </span>
                        </div>

                        {/* Media Thumbnail */}
                        {post.media_url && (
                          <div
                            onClick={() =>
                              setAssetPreviewModal({
                                open: true,
                                url: post.media_url!,
                                title: `Post by ${post.author_name}`,
                              })
                            }
                            className="h-36 w-full rounded-2xl overflow-hidden bg-black/40 relative group cursor-pointer border border-white/5"
                          >
                            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="w-4 h-4" />
                              <span>Preview Media</span>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-300 line-clamp-3">{post.content}</p>
                      </div>

                      <div className="pt-2 border-t border-[#232838] flex items-center justify-between text-[11px] text-slate-400">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 5: REALTIME GLOBAL BROADCAST                     */}
          {/* ======================================================== */}
          {activeModule === 'broadcast' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Global Broadcast Announcement</h2>
                <p className="text-xs text-slate-400">
                  Send a realtime pop-up announcement to all connected mobile and desktop users
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Broadcast successfully dispatched to the Supabase Realtime Network!</span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Platform Maintenance / Special Valentine Event"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1c202d] border border-[#2d344d] text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type the message you want all live users to see..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1c202d] border border-[#2d344d] text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Broadcast to All Active Users Now</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 6: FILE & ASSET LIBRARY                           */}
          {/* ======================================================== */}
          {activeModule === 'assets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">File & Media Assets Library</h2>
                <p className="text-xs text-slate-400">All user-uploaded avatars, cover banners, and feed media</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assets.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 bg-[#141721] rounded-3xl border border-[#232838]">
                    No files or media stored yet.
                  </div>
                ) : (
                  assets.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setAssetPreviewModal({ open: true, url: file.url, title: file.title })}
                      className="p-2.5 rounded-2xl bg-[#151821] border border-[#232838] hover:border-indigo-500/50 transition-all space-y-2 cursor-pointer group"
                    >
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-black/40 relative">
                        <img src={file.url} alt={file.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="text-[11px]">
                        <p className="font-semibold text-white truncate">{file.title}</p>
                        <p className="text-slate-500 text-[10px]">{file.filesize_kb} KB</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 7: STORAGE & QUOTA ENGINE                         */}
          {/* ======================================================== */}
          {activeModule === 'storage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Storage Quota Engine</h2>
                <p className="text-xs text-slate-400">Enforce data limits, monitor consumption, and free up cache</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Consumers</h3>
                  <div className="space-y-3">
                    {users
                      .sort((a, b) => b.storage_used_mb - a.storage_used_mb)
                      .slice(0, 5)
                      .map((u) => {
                        const pct = Math.min(100, Math.round((u.storage_used_mb / u.storage_limit_mb) * 100));
                        return (
                          <div key={u.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-white">{u.display_name} (@{u.username})</span>
                              <span className="text-cyan-400 font-mono">{u.storage_used_mb} MB / {u.storage_limit_mb} MB</span>
                            </div>
                            <div className="w-full h-2 bg-[#212638] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-cyan-500 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('4ever_cached_media');
                      alert('Expired cache purged successfully!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Purge Temporary Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 8: STAFF & ROLES MANAGER (Super Admin Only)      */}
          {/* ======================================================== */}
          {activeModule === 'staff' && currentStaff.role === 'super_admin' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Staff & Roles Manager</h2>
                  <p className="text-xs text-slate-400">
                    Control multiple staff accounts, assign granular roles, and manage system access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateStaffModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Staff Account</span>
                </button>
              </div>

              {/* Staff Table */}
              <div className="rounded-2xl border border-[#232838] bg-[#141721] overflow-x-auto shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1a1e2b] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#232838]">
                    <tr>
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Assigned Role</th>
                      <th className="py-3.5 px-4">Permissions</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {staffList.map((st) => (
                      <tr key={st.id} className="hover:bg-[#1a1e2b]/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            {st.name[0]}
                          </span>
                          <div>
                            <p>{st.name}</p>
                            <p className="text-[10px] text-slate-500">Created: {new Date(st.created_at).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{st.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-semibold ${
                              st.role === 'super_admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : st.role === 'operations'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : st.role === 'moderator'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {st.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {st.permissions.join(', ') || 'Standard'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              st.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {st.role !== 'super_admin' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleStaffStatus(st.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#212638] text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                              >
                                {st.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(st.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 9: PLATFORM SETTINGS & SYSTEM CONFIG             */}
          {/* ======================================================== */}
          {activeModule === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Platform & Admin Settings</h2>
                <p className="text-xs text-slate-400">Manage administrator credentials, Supabase database synchronization, and core engine</p>
              </div>

              {/* 1. Admin Account & Security Credentials */}
              <div className="p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#232838] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Admin Account & Security</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold uppercase border border-amber-500/30">
                    {currentStaff?.role || 'Super Admin'}
                  </span>
                </div>

                <AnimatePresence>
                  {adminSavedNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium"
                    >
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{adminSavedNotice}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSaveAdminCredentials} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Admin Display Name</label>
                      <input
                        type="text"
                        value={adminDisplayName}
                        onChange={(e) => setAdminDisplayName(e.target.value)}
                        placeholder="Platform Administrator"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Admin Email Address</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@4ever.app"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Change Admin Password</label>
                      <input
                        type="password"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="•••••••• (Leave blank to keep current)"
                        className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                      />
                      <span className="text-[10px] text-slate-500">Updates root admin login password</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Root Master PIN (Default: 4444)</label>
                      <input
                        type="text"
                        maxLength={8}
                        value={adminMasterPin}
                        onChange={(e) => setAdminMasterPin(e.target.value)}
                        placeholder="4444"
                        className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs font-mono font-bold tracking-widest"
                      />
                      <span className="text-[10px] text-slate-500">Instant 1-click root bypass PIN for emergency access</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    Save Admin Credentials & Master PIN
                  </button>
                </form>
              </div>

              {/* 2. Supabase Cloud Database & RLS Schema Setup */}
              <div className="p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#232838] pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Supabase Cloud Database & RLS Setup</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-400 font-mono font-medium">
                      {supabaseConnected ? 'Supabase Connected' : 'Local Fallback'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2 text-xs text-slate-300">
                  <p className="font-medium text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Live Users Detected in CMS: <b className="text-cyan-400 font-mono">{users.length} registered accounts</b></span>
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    VR4EVER merges live Supabase Auth sessions, the Supabase <code className="text-cyan-300">profiles</code> table, and synchronized local registries. If user accounts created on mobile or other browsers are not appearing, execute the SQL schema below once in your Supabase SQL Editor to grant public read permission.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={copySupabaseSqlSnippet}
                    className="flex-1 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-600/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{sqlCopiedNotice ? 'Copied to Clipboard!' : 'Copy Supabase SQL Setup (Fix RLS)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushUsersToSupabase}
                    className="flex-1 w-full py-2.5 rounded-xl bg-[#212638] hover:bg-[#2c334b] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#303853]"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Push All Local Users to Supabase</span>
                  </button>
                </div>
              </div>

              {/* 3. Core Engine & Maintenance Controls */}
              <div className="p-6 rounded-3xl bg-[#151821] border border-[#232838] shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#232838]">
                  <div>
                    <h4 className="text-sm font-bold text-white">Maintenance Mode</h4>
                    <p className="text-xs text-slate-400">Lock non-admin access while updating</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      maintenanceMode ? 'bg-amber-500 text-black' : 'bg-[#212638] text-slate-400'
                    }`}
                  >
                    {maintenanceMode ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#232838]">
                  <div>
                    <h4 className="text-sm font-bold text-white">Allow Public Registrations</h4>
                    <p className="text-xs text-slate-400">Enable or disable new user signups</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowRegistration(!allowRegistration)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      allowRegistration ? 'bg-emerald-500 text-black' : 'bg-[#212638] text-slate-400'
                    }`}
                  >
                    {allowRegistration ? 'Open' : 'Closed'}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#232838]">
                  <div>
                    <h4 className="text-sm font-bold text-white">Max Media Upload Limit</h4>
                    <p className="text-xs text-slate-400">Current max file size limit for pictures/videos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-cyan-300 font-bold">{maxUploadMB} MB</span>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={maxUploadMB}
                      onChange={(e) => setMaxUploadMB(Number(e.target.value))}
                      className="accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Platform Database Export (JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS SECTION                                           */}
      {/* ======================================================== */}

      {/* 1. Edit User Modal */}
      <AnimatePresence>
        {editUserModal.open && editUserModal.user && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#161922] border border-[#272d3e] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Edit User Profile</h3>
                <button
                  onClick={() => setEditUserModal({ open: false, user: null })}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editUserModal.user.display_name}
                    onChange={(e) =>
                      setEditUserModal((prev) =>
                        prev.user ? { ...prev, user: { ...prev.user, display_name: e.target.value } } : prev
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={editUserModal.user.username}
                    onChange={(e) =>
                      setEditUserModal((prev) =>
                        prev.user ? { ...prev, user: { ...prev.user, username: e.target.value } } : prev
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Storage Quota Limit (MB)</label>
                  <input
                    type="number"
                    value={editUserModal.user.storage_limit_mb}
                    onChange={(e) =>
                      setEditUserModal((prev) =>
                        prev.user ? { ...prev, user: { ...prev.user, storage_limit_mb: Number(e.target.value) } } : prev
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Set / Reset User Password</label>
                  <input
                    type="password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    placeholder="Enter new password (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500">Leave blank to keep existing user password</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditUserModal({ open: false, user: null })}
                    className="flex-1 py-2.5 rounded-xl bg-[#212638] text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Save Updates
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Create User Modal */}
      <AnimatePresence>
        {createUserModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#161922] border border-[#272d3e] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Provision New User Account</h3>
                <button onClick={() => setCreateUserModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Display Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Rohith Kumar"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. rohith_k"
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Storage Limit (MB)</label>
                  <input
                    type="number"
                    value={newUserQuota}
                    onChange={(e) => setNewUserQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateUserModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#212638] text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Create Staff Modal (Super Admin Only) */}
      <AnimatePresence>
        {createStaffModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#161922] border border-[#272d3e] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Create New Staff Member</h3>
                <button onClick={() => setCreateStaffModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Staff Full Name</label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Staff Email</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="staff@4ever.app"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => {
                      const role = e.target.value as StaffRole;
                      setNewStaffRole(role);
                      if (role === 'super_admin') setNewStaffPermissions(['all']);
                      else if (role === 'operations') setNewStaffPermissions(['manage_users', 'manage_relationships', 'manage_storage']);
                      else if (role === 'moderator') setNewStaffPermissions(['manage_posts', 'manage_broadcast']);
                      else setNewStaffPermissions(['view_users', 'view_relationships']);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  >
                    <option value="moderator">Content Moderator (Posts & Chat)</option>
                    <option value="operations">Operations Manager (Users & Storage)</option>
                    <option value="support">Customer Support (User Lookup)</option>
                    <option value="super_admin">Super Admin (Full Root Access)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateStaffModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#212638] text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Create Staff
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Create Pair Modal */}
      <AnimatePresence>
        {createPairModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#161922] border border-[#272d3e] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Connect 2 Users in a Shared Space</h3>
                <button onClick={() => setCreatePairModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePairing} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Partner 1</label>
                  <select
                    value={pairUser1}
                    onChange={(e) => setPairUser1(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  >
                    <option value="">-- Choose User 1 --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select Partner 2</label>
                  <select
                    value={pairUser2}
                    onChange={(e) => setPairUser2(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  >
                    <option value="">-- Choose User 2 --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Relationship Type</label>
                  <select
                    value={pairType}
                    onChange={(e) => setPairType(e.target.value as 'couple' | 'bestfriends' | 'siblings')}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs"
                  >
                    <option value="couple">Couple Space 💕</option>
                    <option value="bestfriends">Best Friends Space 🌟</option>
                    <option value="siblings">Siblings Space 🤝</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly Shared Budget (₹)</label>
                  <input
                    type="number"
                    value={pairBudget}
                    onChange={(e) => setPairBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d222e] border border-[#2d344d] text-white text-xs font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreatePairModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#212638] text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Link Users
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Asset Preview Modal */}
      <AnimatePresence>
        {assetPreviewModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#161922] border border-[#272d3e] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate">{assetPreviewModal.title}</h3>
                <button
                  onClick={() => setAssetPreviewModal({ open: false, url: '', title: '' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center border border-[#272d3e]">
                <img src={assetPreviewModal.url} alt="" className="max-h-[70vh] w-auto object-contain" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
