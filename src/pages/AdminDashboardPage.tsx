import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Users,
  HardDrive,
  Activity,
  Plus,
  Trash2,
  KeyRound,
  Search,
  Sparkles,
  ArrowRightLeft,
  X,
  Lock,
} from 'lucide-react';
import type { AdminUserRecord } from '../types';

const ADMIN_STORAGE_KEY = '4ever_admin_users_v1';
const MASTER_STAFF_PIN = '4444';

export const AdminDashboardPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('4ever_staff_auth') === 'true';
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Admin users state
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'staff'>('all');

  // Modals
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [newQuota, setNewQuota] = useState<number>(100);

  // New user form state
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'staff'>('user');

  // Load staff records
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        setUsers(JSON.parse(stored));
      } else {
        // Initial mock data for staff to test immediately
        const initialMockUsers: AdminUserRecord[] = [
          {
            id: 'usr_1',
            display_name: 'Rahul Sharma',
            username: 'rahul_s',
            email: 'rahul@example.com',
            role: 'user',
            relationship_id: 'rel_1',
            partner_name: 'Ananya Verma',
            storage_used_mb: 42.5,
            storage_limit_mb: 100,
            is_online: true,
            last_seen: 'Just now',
            created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          },
          {
            id: 'usr_2',
            display_name: 'Ananya Verma',
            username: 'ananya_v',
            email: 'ananya@example.com',
            role: 'user',
            relationship_id: 'rel_1',
            partner_name: 'Rahul Sharma',
            storage_used_mb: 35.8,
            storage_limit_mb: 100,
            is_online: true,
            last_seen: '5 mins ago',
            created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          },
          {
            id: 'usr_3',
            display_name: 'Dev Staff',
            username: 'staff_admin',
            email: 'staff@4ever.app',
            role: 'staff',
            relationship_id: null,
            partner_name: null,
            storage_used_mb: 8.2,
            storage_limit_mb: 500,
            is_online: true,
            last_seen: 'Active now',
            created_at: new Date().toISOString(),
          },
        ];
        setUsers(initialMockUsers);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(initialMockUsers));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveUsers = (updated: AdminUserRecord[]) => {
    setUsers(updated);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === MASTER_STAFF_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('4ever_staff_auth', 'true');
      setPinError('');
    } else {
      setPinError('Invalid Staff PIN (Hint: 4444)');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newUsername.trim()) return;

    const newUser: AdminUserRecord = {
      id: 'usr_' + Math.random().toString(36).substring(2, 8),
      display_name: newDisplayName.trim(),
      username: newUsername.trim().toLowerCase().replace(/\s+/g, '_'),
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@example.com`,
      role: newRole,
      relationship_id: null,
      partner_name: null,
      storage_used_mb: 0.1,
      storage_limit_mb: 100,
      is_online: false,
      last_seen: 'Never',
      created_at: new Date().toISOString(),
    };

    const updated = [newUser, ...users];
    saveUsers(updated);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setNewDisplayName('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setAddUserModalOpen(false);
  };

  // 1-Click Generate Test Couple for End-to-End QA
  const handleGenerateTestCouple = () => {
    const pairId = 'test_pair_' + Math.random().toString(36).substring(2, 6);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const userA: AdminUserRecord = {
      id: 'usr_qa_' + Math.random().toString(36).substring(2, 7),
      display_name: 'Alex (Test)',
      username: 'alex_test_' + code.slice(0, 3).toLowerCase(),
      email: `alex_${code.slice(0, 3).toLowerCase()}@test.dev`,
      role: 'user',
      relationship_id: pairId,
      partner_name: 'Emma (Test)',
      storage_used_mb: 12.4,
      storage_limit_mb: 100,
      is_online: true,
      last_seen: 'Just now',
      created_at: new Date().toISOString(),
    };

    const userB: AdminUserRecord = {
      id: 'usr_qa_' + Math.random().toString(36).substring(2, 7),
      display_name: 'Emma (Test)',
      username: 'emma_test_' + code.slice(0, 3).toLowerCase(),
      email: `emma_${code.slice(0, 3).toLowerCase()}@test.dev`,
      role: 'user',
      relationship_id: pairId,
      partner_name: 'Alex (Test)',
      storage_used_mb: 15.2,
      storage_limit_mb: 100,
      is_online: true,
      last_seen: 'Just now',
      created_at: new Date().toISOString(),
    };

    const updated = [userA, userB, ...users];
    saveUsers(updated);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b'],
    });

    alert(
      `Generated paired couple test accounts!\n\nUser 1: @${userA.username} (Pass: 123456)\nUser 2: @${userB.username} (Pass: 123456)`
    );
  };

  const handleUpdateStorageQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updated = users.map((u) =>
      u.id === selectedUser.id ? { ...u, storage_limit_mb: Number(newQuota) } : u
    );
    saveUsers(updated);
    setStorageModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Delete this user account and disconnect any paired space?')) {
      const updated = users.filter((u) => u.id !== id);
      saveUsers(updated);
    }
  };

  // Aggregated Stats
  const totalUsersCount = users.length;
  const pairedUsersCount = users.filter((u) => u.relationship_id).length;
  const totalStorageConsumedMB = Math.round(
    users.reduce((acc, u) => acc + u.storage_used_mb, 0) * 10
  ) / 10;

  const filteredUsers = users
    .filter((u) => filterRole === 'all' || u.role === filterRole)
    .filter(
      (u) =>
        u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // If not authenticated with Staff PIN, show gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-8 shadow-2xl text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-white">Staff Admin Access</h2>
            <p className="text-xs text-white/50 mt-1">
              Enter master staff PIN to access user monitoring and storage controls.
            </p>
          </div>

          {pinError && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3.5" />
              <input
                type="password"
                maxLength={4}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="PIN (4444)"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Verify & Enter Staff Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Staff Portal
            </span>
            <span className="text-xs text-white/40">Realtime User & Storage Operations</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Platform Staff Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateTestCouple}
            className="px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Create 2 linked accounts for testing"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Test Couple</span>
          </button>

          <button
            onClick={() => setAddUserModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Registered Accounts</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-3xl font-bold text-white font-serif">{totalUsersCount}</h3>
          <p className="text-[11px] text-white/40">
            {pairedUsersCount} users currently paired in spaces
          </p>
        </div>

        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Active Partner Spaces</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-3xl font-bold text-white font-serif">
            {Math.floor(pairedUsersCount / 2)}
          </h3>
          <p className="text-[11px] text-emerald-400 font-medium">● Realtime WebSocket Sync Active</p>
        </div>

        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Total Storage Consumed</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-bold text-white font-serif">{totalStorageConsumedMB} MB</h3>
          <p className="text-[11px] text-white/40">Photos, voice notes & document blobs</p>
        </div>
      </div>

      {/* User Activity & Storage Table */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-base">User Activity & Storage Quotas</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or email..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400 w-44 sm:w-56"
              />
            </div>

            {/* Role Filter */}
            <div className="flex p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              {(['all', 'user', 'staff'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    filterRole === r
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Rows Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-white/40 border-b border-white/10 pb-2">
                <th className="py-2.5 font-semibold">User</th>
                <th className="py-2.5 font-semibold">Paired Space</th>
                <th className="py-2.5 font-semibold">Status / Activity</th>
                <th className="py-2.5 font-semibold">Storage Used</th>
                <th className="py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-white/40 italic">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const percent = Math.min(
                    100,
                    Math.round((u.storage_used_mb / u.storage_limit_mb) * 100)
                  );
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center text-xs">
                            {u.display_name[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{u.display_name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-white/70">
                                {u.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-white/40 block">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        {u.partner_name ? (
                          <div className="flex items-center gap-1 text-amber-300 font-medium">
                            <span>Paired with {u.partner_name}</span>
                          </div>
                        ) : (
                          <span className="text-white/30 italic">Single Space</span>
                        )}
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
                            }`}
                          />
                          <span className="text-white/80">{u.last_seen}</span>
                        </div>
                      </td>

                      <td className="py-3 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-mono text-white/90">{u.storage_used_mb} MB</span>
                            <span className="text-white/40">{u.storage_limit_mb} MB limit</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewQuota(u.storage_limit_mb);
                              setStorageModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                            title="Adjust Storage Quota"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              alert(`Password for @${u.username} reset to: 123456`)
                            }
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-amber-300"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-white/60 hover:text-rose-400"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {addUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Create New User Account</h3>
                <button
                  onClick={() => setAddUserModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g. Sneha Patel"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. sneha_p"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="sneha@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Role
                  </label>
                  <div className="flex gap-2">
                    {(['user', 'staff'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewRole(r)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                          newRole === r
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddUserModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Storage Limit Modal */}
      <AnimatePresence>
        {storageModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Storage Quota Limit</h3>
                <button
                  onClick={() => setStorageModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStorageQuota} className="space-y-4">
                <div>
                  <p className="text-xs text-white/60">
                    Set storage quota for{' '}
                    <span className="font-bold text-white">@{selectedUser.username}</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[50, 100, 250, 500].map((mb) => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => setNewQuota(mb)}
                        className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                          newQuota === mb
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {mb} MB
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStorageModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
                  >
                    Save Quota
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
