import React, { useState, useEffect } from 'react';
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
  Sparkles,
  FileText,
  Layers,
  Activity,
  Video,
  AlertCircle,
} from 'lucide-react';
import type { AdminUserRecord, DirectusAssetRecord } from '../types';

const ADMIN_STORAGE_KEY = '4ever_directus_users_v3';
const ASSETS_STORAGE_KEY = '4ever_directus_assets_v3';
const MASTER_PIN = '4444';

export const AdminDashboardPage: React.FC = () => {
  // Authentication gate for Directus
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('4ever_directus_auth') === 'true';
  });
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Directus active module
  const [activeModule, setActiveModule] = useState<'insights' | 'collections' | 'files' | 'users' | 'settings'>('insights');
  const [activeCollection, setActiveCollection] = useState<'users' | 'relationships' | 'posts' | 'files'>('users');

  // Directus Users state
  const [users, setUsers] = useState<AdminUserRecord[]>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'usr_ananya',
        display_name: 'Ananya Verma',
        username: 'ananya_v',
        email: 'ananya@example.com',
        role: 'user',
        relationship_id: 'space_01',
        partner_name: 'Rahul Sharma',
        storage_used_mb: 48.2,
        storage_limit_mb: 100,
        is_online: true,
        last_seen: 'Active now',
        created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      },
      {
        id: 'usr_rahul',
        display_name: 'Rahul Sharma',
        username: 'rahul_s',
        email: 'rahul@example.com',
        role: 'user',
        relationship_id: 'space_01',
        partner_name: 'Ananya Verma',
        storage_used_mb: 37.6,
        storage_limit_mb: 100,
        is_online: true,
        last_seen: '5 mins ago',
        created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      },
      {
        id: 'usr_priya',
        display_name: 'Priya Kapoor',
        username: 'priya_k',
        email: 'priya@example.com',
        role: 'user',
        relationship_id: null,
        partner_name: null,
        storage_used_mb: 12.1,
        storage_limit_mb: 100,
        is_online: false,
        last_seen: '2 hours ago',
        created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
      {
        id: 'usr_admin',
        display_name: 'Directus Root Admin',
        username: 'admin',
        email: 'admin@4ever.app',
        role: 'admin',
        relationship_id: null,
        partner_name: null,
        storage_used_mb: 5.4,
        storage_limit_mb: 500,
        is_online: true,
        last_seen: 'Managing Directus',
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      },
    ];
  });

  // Directus Asset Files state
  const [assets, setAssets] = useState<DirectusAssetRecord[]>(() => {
    try {
      const stored = localStorage.getItem(ASSETS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'file_01',
        title: 'Sunset at Lake Anniversary',
        filename: 'lake_date_sunset.jpg',
        filesize_kb: 2450,
        mime_type: 'image/jpeg',
        uploaded_by: 'ananya_v',
        uploaded_at: '2026-09-15',
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'file_02',
        title: 'Coffee Morning Walk',
        filename: 'sunday_coffee.jpg',
        filesize_kb: 1890,
        mime_type: 'image/jpeg',
        uploaded_by: 'rahul_s',
        uploaded_at: '2026-09-16',
        url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'file_03',
        title: 'Couple Budget September Sheet',
        filename: 'september_expenses.pdf',
        filesize_kb: 420,
        mime_type: 'application/pdf',
        uploaded_by: 'ananya_v',
        uploaded_at: '2026-09-14',
        url: '#',
      },
      {
        id: 'file_04',
        title: 'Road Trip Clip Moments',
        filename: 'hills_trip.mp4',
        filesize_kb: 14200,
        mime_type: 'video/mp4',
        uploaded_by: 'rahul_s',
        uploaded_at: '2026-09-12',
        url: '#',
      },
    ];
  });

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [newQuotaValue, setNewQuotaValue] = useState<number>(100);

  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'staff' | 'admin'>('user');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPin === MASTER_PIN || authPin.toLowerCase() === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('4ever_directus_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Access PIN (Hint: default master PIN is 4444)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('4ever_directus_auth');
  };

  const handleGenerateTestCouple = () => {
    const spaceId = 'space_test_' + Math.floor(Math.random() * 899 + 100);
    const userA: AdminUserRecord = {
      id: 'usr_' + Date.now(),
      display_name: 'Alex Rivera (Test)',
      username: 'alex_test',
      email: 'alex.test@4ever.app',
      role: 'user',
      relationship_id: spaceId,
      partner_name: 'Emma Watson (Test)',
      storage_used_mb: 28.4,
      storage_limit_mb: 100,
      is_online: true,
      last_seen: 'Online now',
      created_at: new Date().toISOString(),
    };
    const userB: AdminUserRecord = {
      id: 'usr_' + (Date.now() + 1),
      display_name: 'Emma Watson (Test)',
      username: 'emma_test',
      email: 'emma.test@4ever.app',
      role: 'user',
      relationship_id: spaceId,
      partner_name: 'Alex Rivera (Test)',
      storage_used_mb: 21.0,
      storage_limit_mb: 100,
      is_online: true,
      last_seen: 'Online now',
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [userA, userB, ...prev]);
    confetti({ particleCount: 70, spread: 60, colors: ['#6644ff', '#7952ff', '#00d284'] });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const created: AdminUserRecord = {
      id: 'usr_' + Date.now(),
      display_name: newUserName.trim(),
      username: newUserName.trim().toLowerCase().replace(/\s+/g, '_'),
      email: newUserEmail.trim(),
      role: newUserRole,
      relationship_id: null,
      partner_name: null,
      storage_used_mb: 0,
      storage_limit_mb: 100,
      is_online: true,
      last_seen: 'Created just now',
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [created, ...prev]);
    setUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
  };

  const handleUpdateQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, storage_limit_mb: newQuotaValue } : u))
    );
    setQuotaModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Delete this user from the Directus platform?')) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const handleDeleteAsset = (fileId: string) => {
    if (confirm('Delete asset from storage?')) {
      setAssets((prev) => prev.filter((a) => a.id !== fileId));
    }
  };

  const totalStorageConsumed = users.reduce((acc, u) => acc + u.storage_used_mb, 0);
  const totalUsersCount = users.length;
  const activeSpacesCount = new Set(users.map((u) => u.relationship_id).filter(Boolean)).size;

  // Directus Login Screen
  if (!isAuthenticated) {
    return (
      <div className="w-screen min-h-screen bg-[#101217] flex items-center justify-center p-4 font-sans text-slate-200">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#181a20] border border-[#2b2e3b] rounded-3xl p-8 shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6644ff] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#6644ff]/30">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>VR4EVER</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#6644ff]/20 text-[#a088ff] border border-[#6644ff]/40 font-mono">
                  Directus CMS
                </span>
              </h1>
              <p className="text-xs text-slate-400">Isolated Headless Admin & Storage Manager</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Master PIN or Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  placeholder="Enter master PIN (e.g. 4444)"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#22252e] border border-[#2e3240] text-white text-sm focus:outline-none focus:border-[#6644ff] placeholder-slate-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default staff key: 4444</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#6644ff] hover:bg-[#7952ff] text-white font-semibold text-sm transition-all shadow-lg shadow-[#6644ff]/30 cursor-pointer"
            >
              Sign In to Directus Portal
            </button>
          </form>

          <div className="pt-2 border-t border-[#2b2e3b] text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              &larr; Return to Consumer App
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authentic Directus Admin Dashboard Layout
  return (
    <div className="w-screen min-h-screen bg-[#0f1116] text-slate-200 flex font-sans overflow-x-hidden selection:bg-[#6644ff]/40 selection:text-white">
      {/* Directus Left Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-[#16181f] border-r border-[#242733] flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Directus Brand Header */}
          <div className="h-16 flex items-center gap-3 px-4 md:px-6 border-b border-[#242733]">
            <div className="w-9 h-9 rounded-xl bg-[#6644ff] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-[#6644ff]/30">
              D
            </div>
            <div className="hidden md:block min-w-0">
              <h2 className="text-sm font-bold text-white truncate">VR4EVER Cloud</h2>
              <span className="text-[10px] text-emerald-400 font-mono block">v10.12 • Live</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveModule('insights')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeModule === 'insights'
                  ? 'bg-[#6644ff] text-white shadow-md shadow-[#6644ff]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232d]'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Insights & KPIs</span>
            </button>

            <button
              onClick={() => setActiveModule('collections')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeModule === 'collections'
                  ? 'bg-[#6644ff] text-white shadow-md shadow-[#6644ff]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232d]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Content Collections</span>
            </button>

            <button
              onClick={() => setActiveModule('files')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeModule === 'files'
                  ? 'bg-[#6644ff] text-white shadow-md shadow-[#6644ff]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232d]'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">File Library & Quotas</span>
            </button>

            <button
              onClick={() => setActiveModule('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeModule === 'users'
                  ? 'bg-[#6644ff] text-white shadow-md shadow-[#6644ff]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232d]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Users & Directory</span>
            </button>

            <button
              onClick={() => setActiveModule('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeModule === 'settings'
                  ? 'bg-[#6644ff] text-white shadow-md shadow-[#6644ff]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232d]'
              }`}
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Project Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#242733] space-y-2">
          <a
            href="/"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#20232d] transition-all"
            title="Go to App"
          >
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Open App View</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Directus Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Directus Working Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#12141a]">
        {/* Directus Top App Bar */}
        <header className="h-16 bg-[#16181f] border-b border-[#242733] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white capitalize flex items-center gap-2">
              <span>{activeModule}</span>
              {activeModule === 'collections' && (
                <span className="text-xs text-slate-400 font-normal">/ {activeCollection}</span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateTestCouple}
              className="px-3.5 py-1.5 rounded-xl bg-[#6644ff]/20 hover:bg-[#6644ff]/30 border border-[#6644ff]/40 text-[#b5a3ff] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a088ff]" />
              <span className="hidden sm:inline">1-Click Test Couple</span>
            </button>

            <button
              onClick={() => setUserModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#6644ff] hover:bg-[#7952ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#6644ff]/30 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>
        </header>

        {/* Content View per Module */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeModule === 'insights' && (
            /* Insights & Metrics Dashboard */
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#181a22] border border-[#272b38] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>TOTAL REGISTERED USERS</span>
                    <Users className="w-4 h-4 text-[#a088ff]" />
                  </div>
                  <div className="text-3xl font-bold text-white">{totalUsersCount}</div>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span>↑ 100% active retention</span>
                  </p>
                </div>

                <div className="bg-[#181a22] border border-[#272b38] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>ACTIVE RELATIONSHIP SPACES</span>
                    <Layers className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{activeSpacesCount}</div>
                  <p className="text-[11px] text-slate-400">Synced spaces</p>
                </div>

                <div className="bg-[#181a22] border border-[#272b38] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>STORAGE CONSUMPTION</span>
                    <HardDrive className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-amber-300">
                    {totalStorageConsumed.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 1,000 MB</span>
                  </div>
                  <div className="w-full bg-[#272b38] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (totalStorageConsumed / 1000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Server System Health */}
              <div className="bg-[#181a22] border border-[#272b38] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Directus System & API Status</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#20232e]">
                    <span className="text-slate-400 block">Database</span>
                    <span className="font-semibold text-emerald-400">Connected (PostgreSQL)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#20232e]">
                    <span className="text-slate-400 block">Auth Driver</span>
                    <span className="font-semibold text-white">JWT + 4EVER PIN</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#20232e]">
                    <span className="text-slate-400 block">Storage Driver</span>
                    <span className="font-semibold text-white">Directus S3 / Local</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#20232e]">
                    <span className="text-slate-400 block">Vercel Deployment</span>
                    <span className="font-semibold text-emerald-400">Ready (SPA rewrites)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'collections' && (
            /* Directus Collection Explorer */
            <div className="space-y-4">
              {/* Collection Tabs */}
              <div className="flex items-center gap-2 border-b border-[#242733] pb-3">
                {(['users', 'relationships', 'posts', 'files'] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => setActiveCollection(col)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                      activeCollection === col
                        ? 'bg-[#6644ff] text-white shadow-md'
                        : 'bg-[#181a22] text-slate-400 hover:text-white'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>

              {/* Data Table */}
              <div className="bg-[#181a22] border border-[#272b38] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#1e212b] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#272b38]">
                      <tr>
                        <th className="py-3 px-4">Identifier</th>
                        <th className="py-3 px-4">Primary Attribute</th>
                        <th className="py-3 px-4">Status / Role</th>
                        <th className="py-3 px-4">Metadata</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#272b38]">
                      {activeCollection === 'users' &&
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-[#20232d] transition-colors">
                            <td className="py-3 px-4 font-mono text-[#a088ff]">{u.id}</td>
                            <td className="py-3 px-4 font-semibold text-white">
                              {u.display_name} <span className="text-slate-500 font-normal">(@{u.username})</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#6644ff]/20 text-[#b5a3ff] border border-[#6644ff]/40">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              Storage: {u.storage_used_mb}MB / {u.storage_limit_mb}MB
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewQuotaValue(u.storage_limit_mb);
                                  setQuotaModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#272b38] hover:bg-[#343847] text-white text-[11px] mr-2"
                              >
                                Quota
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                      {activeCollection === 'relationships' && (
                        <tr className="hover:bg-[#20232d]">
                          <td className="py-3 px-4 font-mono text-amber-300">space_01</td>
                          <td className="py-3 px-4 font-semibold text-white">Rahul & Ananya</td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">Active Couple</td>
                          <td className="py-3 px-4 text-slate-400">Since 2024 • Unlimited Chat & Media</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">Live</td>
                        </tr>
                      )}

                      {activeCollection === 'posts' && (
                        <tr className="hover:bg-[#20232d]">
                          <td className="py-3 px-4 font-mono text-[#a088ff]">post_1</td>
                          <td className="py-3 px-4 font-semibold text-white">Weekend getaway by the lake</td>
                          <td className="py-3 px-4 text-amber-400 font-semibold">#love</td>
                          <td className="py-3 px-4 text-slate-400">34 likes • 5 comments</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">Published</td>
                        </tr>
                      )}

                      {activeCollection === 'files' &&
                        assets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-[#20232d]">
                            <td className="py-3 px-4 font-mono text-[#a088ff]">{asset.id}</td>
                            <td className="py-3 px-4 font-semibold text-white">{asset.title}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{asset.mime_type}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {(asset.filesize_kb / 1024).toFixed(2)} MB • by @{asset.uploaded_by}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'files' && (
            /* Directus File Library & Storage Asset Browser */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Storage Asset Browser</h3>
                  <p className="text-xs text-slate-400">
                    Manage uploads, preview media, and enforce per-user storage restrictions
                  </p>
                </div>
                <div className="text-xs font-mono text-amber-300 bg-[#181a22] border border-[#272b38] px-3.5 py-1.5 rounded-xl">
                  Total Consumption: {totalStorageConsumed.toFixed(1)} MB
                </div>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {assets.map((file) => (
                  <div
                    key={file.id}
                    className="bg-[#181a22] border border-[#272b38] rounded-2xl overflow-hidden shadow-lg hover:border-[#6644ff]/50 transition-all flex flex-col justify-between"
                  >
                    <div className="h-36 bg-[#13151b] flex items-center justify-center relative overflow-hidden">
                      {file.mime_type.startsWith('image') ? (
                        <img src={file.url} alt={file.title} className="w-full h-full object-cover" />
                      ) : file.mime_type.startsWith('video') ? (
                        <Video className="w-10 h-10 text-slate-600" />
                      ) : (
                        <FileText className="w-10 h-10 text-slate-600" />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                        {(file.filesize_kb / 1024).toFixed(1)} MB
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      <div>
                        <h5 className="text-xs font-semibold text-white truncate">{file.title}</h5>
                        <p className="text-[10px] text-slate-500 truncate font-mono">{file.filename}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#272b38] text-[10px] text-slate-400">
                        <span>@{file.uploaded_by}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(file.id)}
                          className="text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'users' && (
            /* User Directory & Quota Management */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">User Accounts & Quotas</h3>
                  <p className="text-xs text-slate-400">Assign storage quotas and generate test users</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="bg-[#181a22] border border-[#272b38] rounded-2xl p-4 shadow-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{u.display_name}</h4>
                        <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#6644ff]/20 text-[#a088ff] text-[10px] font-bold uppercase">
                        {u.role}
                      </span>
                    </div>

                    {/* Storage progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Storage Allocated</span>
                        <span className="font-mono text-white">
                          {u.storage_used_mb}MB / {u.storage_limit_mb}MB
                        </span>
                      </div>
                      <div className="w-full bg-[#272b38] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            u.storage_used_mb / u.storage_limit_mb > 0.8
                              ? 'bg-rose-500'
                              : 'bg-[#6644ff]'
                          }`}
                          style={{
                            width: `${Math.min(100, (u.storage_used_mb / u.storage_limit_mb) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#272b38] text-xs">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewQuotaValue(u.storage_limit_mb);
                          setQuotaModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#272b38] hover:bg-[#343847] text-white font-medium text-xs transition-colors"
                      >
                        Adjust Quota
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'settings' && (
            /* Directus Project Settings */
            <div className="max-w-xl bg-[#181a22] border border-[#272b38] rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-[#a088ff]" />
                <span>Directus Project Settings</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    disabled
                    value="VR4EVER Relationship Data Platform"
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#272b38] text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">CORS & Host Allowed</label>
                  <input
                    type="text"
                    disabled
                    value="localhost:*, *.vercel.app"
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#272b38] text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Default User Quota</label>
                  <input
                    type="text"
                    disabled
                    value="100 MB per user"
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#272b38] text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Adjust Quota Modal */}
      <AnimatePresence>
        {quotaModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#181a22] border border-[#272b38] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <h4 className="text-sm font-bold text-white">
                Set Storage Limit: {selectedUser.display_name}
              </h4>
              <form onSubmit={handleUpdateQuota} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Storage Quota (in Megabytes)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((mb) => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => setNewQuotaValue(mb)}
                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                          newQuotaValue === mb
                            ? 'bg-[#6644ff] text-white border-[#6644ff]'
                            : 'bg-[#20232e] border-[#2e3344] text-slate-400'
                        }`}
                      >
                        {mb}MB
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuotaModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-[#20232e] text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#6644ff] text-white text-xs font-semibold"
                  >
                    Save Quota
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#181a22] border border-[#272b38] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-xs"
            >
              <h4 className="text-sm font-bold text-white">Add User Account</h4>
              <form onSubmit={handleSaveUser} className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Rohith Kumar"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#2e3344] text-white focus:outline-none focus:border-[#6644ff]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#2e3344] text-white focus:outline-none focus:border-[#6644ff]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#2e3344] text-white focus:outline-none focus:border-[#6644ff]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'user' | 'staff' | 'admin')}
                    className="w-full px-3 py-2 rounded-xl bg-[#20232e] border border-[#2e3344] text-white"
                  >
                    <option value="user">User (Standard)</option>
                    <option value="staff">Staff Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-[#20232e] text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#6644ff] text-white font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
