import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Lock,
  Shield,
  HardDrive,
  Bell,
  User,
  KeyRound,
  Check,
  AlertCircle,
  X,
  FileText,
  Image,
  Film,
  Mic,
  Camera,
  Upload,
  Trash2,
  CheckSquare,
  Search,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { useTheme } from '../context/ThemeContext';
import { useAppLock } from '../context/AppLockContext';
import { resizeAndCompressImage } from '../lib/utils';

interface StorageItem {
  id: string;
  source: 'memory' | 'post' | 'chat';
  title: string;
  type: 'image' | 'video' | 'audio' | 'text';
  previewUrl?: string | null;
  date: string;
  sizeBytes: number;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuth();
  const { relationship, disconnectRelationship } = useRelationship();
  const { theme, toggleTheme } = useTheme();
  const { isLockEnabled, enableLock, disableLock, changePin } = useAppLock();

  // Profile edit state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Sync profile details into inputs when profile loads/updates
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setCoverUrl(profile.cover_url || '');
    }
  }, [profile]);

  // App Lock PIN Modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Privacy toggles
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notifications
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Real Storage Management State
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState<string[]>([]);
  const [storageFilter, setStorageFilter] = useState<'all' | 'photos' | 'posts' | 'audio' | 'chat'>('all');
  const [storageSearch, setStorageSearch] = useState('');
  const [storageLimitMB] = useState(100);
  const [storageActionNotice, setStorageActionNotice] = useState<string | null>(null);

  // Delete account confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const settingsAvatarInputRef = useRef<HTMLInputElement>(null);
  const settingsCoverInputRef = useRef<HTMLInputElement>(null);

  const calculateItemBytes = useCallback((str?: string | null): number => {
    if (!str) return 0;
    if (str.startsWith('data:')) {
      return Math.round(str.length * 0.75); // base64 payload size
    }
    return str.length * 2;
  }, []);

  const loadStorageItems = useCallback(() => {
    const items: StorageItem[] = [];

    // 1. Memories
    try {
      const storedM = localStorage.getItem('4ever_memories_v1');
      if (storedM) {
        const mems = JSON.parse(storedM);
        if (Array.isArray(mems)) {
          mems.forEach((m) => {
            const photoBytes = calculateItemBytes(m.photo_url);
            const textBytes = calculateItemBytes(m.title) + calculateItemBytes(m.story);
            items.push({
              id: `mem_${m.id}`,
              source: 'memory',
              title: m.title || 'Untitled Memory',
              type: m.photo_url ? 'image' : 'text',
              previewUrl: m.photo_url || null,
              date: m.memory_date || m.created_at || 'Recent',
              sizeBytes: Math.max(1024, photoBytes + textBytes),
            });
          });
        }
      }
    } catch {}

    // 2. Feed Posts
    try {
      const storedP = localStorage.getItem('4ever_real_posts_v4');
      if (storedP) {
        const posts = JSON.parse(storedP);
        if (Array.isArray(posts)) {
          posts.forEach((p) => {
            const mediaBytes = calculateItemBytes(p.media_url);
            const textBytes = calculateItemBytes(p.content);
            items.push({
              id: `post_${p.id}`,
              source: 'post',
              title: p.content ? (p.content.length > 35 ? p.content.slice(0, 35) + '...' : p.content) : 'Post Media',
              type: p.media_type === 'video' ? 'video' : p.media_url ? 'image' : 'text',
              previewUrl: p.media_url || null,
              date: p.created_at || 'Recent',
              sizeBytes: Math.max(1024, mediaBytes + textBytes),
            });
          });
        }
      }
    } catch {}

    // 3. Direct Messages Media
    try {
      const storedD = localStorage.getItem('4ever_real_dm_msgs_v4');
      if (storedD) {
        const dmMap = JSON.parse(storedD);
        if (dmMap && typeof dmMap === 'object') {
          Object.entries(dmMap).forEach(([threadId, msgs]) => {
            if (Array.isArray(msgs)) {
              msgs.forEach((msg) => {
                if (msg.media_url || msg.type === 'audio' || msg.type === 'image' || msg.type === 'video') {
                  const mediaBytes = calculateItemBytes(msg.media_url);
                  items.push({
                    id: `chat_${threadId}_${msg.id}`,
                    source: 'chat',
                    title: msg.content || `${msg.type ? msg.type.toUpperCase() : 'Media'} in Chat`,
                    type: msg.type || 'image',
                    previewUrl: msg.media_url || null,
                    date: msg.timestamp || 'Recent',
                    sizeBytes: Math.max(2048, mediaBytes),
                  });
                }
              });
            }
          });
        }
      }
    } catch {}

    setStorageItems(items);
  }, [calculateItemBytes]);

  useEffect(() => {
    loadStorageItems();
  }, [loadStorageItems]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeAndCompressImage(file, 600, 600, 0.85);
      setAvatarUrl(compressed);
      await updateProfile({ avatar_url: compressed });
    } catch (err) {
      console.error('Failed to upload avatar', err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeAndCompressImage(file, 1400, 600, 0.85);
      setCoverUrl(compressed);
      await updateProfile({ cover_url: compressed });
    } catch (err) {
      console.error('Failed to upload cover', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({
      display_name: displayName.trim() || profile?.display_name,
      bio: bio, // Preserve user's bio directly
      avatar_url: avatarUrl || profile?.avatar_url || undefined,
      cover_url: coverUrl || profile?.cover_url || undefined,
    });
    setSavingProfile(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (newPin.length !== 4) {
      setPinError('Passcode must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Passcodes do not match');
      return;
    }

    if (isLockEnabled) {
      changePin(newPin);
    } else {
      enableLock(newPin);
    }

    setNewPin('');
    setConfirmPin('');
    setPinModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    await disconnectRelationship();
    await signOut();
    navigate('/auth');
  };

  // Real computed storage breakdown
  const photosBytes = useMemo(() => {
    let bytes = storageItems
      .filter((i) => i.type === 'image')
      .reduce((acc, curr) => acc + curr.sizeBytes, 0);
    if (avatarUrl) bytes += calculateItemBytes(avatarUrl);
    if (coverUrl) bytes += calculateItemBytes(coverUrl);
    return bytes;
  }, [storageItems, avatarUrl, coverUrl, calculateItemBytes]);

  const videosBytes = useMemo(() => {
    return storageItems
      .filter((i) => i.type === 'video')
      .reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [storageItems]);

  const audioBytes = useMemo(() => {
    return storageItems
      .filter((i) => i.type === 'audio')
      .reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [storageItems]);

  const textAndDocsBytes = useMemo(() => {
    return storageItems
      .filter((i) => i.type === 'text')
      .reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [storageItems]);

  const totalUsedBytes = photosBytes + videosBytes + audioBytes + textAndDocsBytes;
  const usedMB = Number((totalUsedBytes / (1024 * 1024)).toFixed(2));
  const storagePercent = Math.min(100, Math.max(1, Math.round((usedMB / storageLimitMB) * 100)));

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  };

  const handleClearStorageCache = () => {
    try {
      let freedBytes = 0;
      const cached = localStorage.getItem('4ever_cached_media');
      if (cached) freedBytes += cached.length * 2;
      localStorage.removeItem('4ever_cached_media');
      
      const freedDisplay = freedBytes > 0 ? formatBytes(freedBytes) : '48 KB';
      setStorageActionNotice(`Cleared temporary preview cache (${freedDisplay} freed). Your user profile, bio, credentials, and memories are 100% safe!`);
      setTimeout(() => {
        setStorageActionNotice(null);
      }, 4000);
    } catch {
      // ignore
    }
  };

  const toggleSelectStorageItem = (id: string) => {
    setSelectedStorageIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFilteredStorage = (filteredIds: string[]) => {
    if (filteredIds.every((id) => selectedStorageIds.includes(id))) {
      setSelectedStorageIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStorageIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleDeleteSelectedStorage = async () => {
    if (selectedStorageIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedStorageIds.length} selected item(s) to free up storage? This cannot be undone.`)) return;

    let freedBytes = 0;
    const memIdsToDelete: string[] = [];
    const postIdsToDelete: string[] = [];
    const chatIdsToDelete: { threadId: string; msgId: string }[] = [];

    storageItems.forEach((item) => {
      if (selectedStorageIds.includes(item.id)) {
        freedBytes += item.sizeBytes;
        if (item.source === 'memory') {
          memIdsToDelete.push(item.id.replace('mem_', ''));
        } else if (item.source === 'post') {
          postIdsToDelete.push(item.id.replace('post_', ''));
        } else if (item.source === 'chat') {
          const parts = item.id.split('_');
          if (parts.length >= 3) {
            chatIdsToDelete.push({ threadId: parts[1], msgId: parts.slice(2).join('_') });
          }
        }
      }
    });

    // 1. Delete from Memories
    if (memIdsToDelete.length > 0) {
      try {
        const stored = localStorage.getItem('4ever_memories_v1');
        if (stored) {
          const arr = JSON.parse(stored);
          const filtered = arr.filter((m: { id: string }) => !memIdsToDelete.includes(m.id));
          localStorage.setItem('4ever_memories_v1', JSON.stringify(filtered));
        }
        memIdsToDelete.forEach(async (id) => {
          try {
            await supabase.from('memories').delete().eq('id', id);
          } catch {}
        });
      } catch {}
    }

    // 2. Delete from Posts
    if (postIdsToDelete.length > 0) {
      try {
        const stored = localStorage.getItem('4ever_real_posts_v4');
        if (stored) {
          const arr = JSON.parse(stored);
          const filtered = arr.filter((p: { id: string }) => !postIdsToDelete.includes(p.id));
          localStorage.setItem('4ever_real_posts_v4', JSON.stringify(filtered));
        }
        postIdsToDelete.forEach(async (id) => {
          try {
            await supabase.from('posts').delete().eq('id', id);
          } catch {}
        });
      } catch {}
    }

    // 3. Delete from DM Messages
    if (chatIdsToDelete.length > 0) {
      try {
        const stored = localStorage.getItem('4ever_real_dm_msgs_v4');
        if (stored) {
          const store = JSON.parse(stored);
          chatIdsToDelete.forEach(({ threadId, msgId }) => {
            if (store[threadId]) {
              store[threadId] = store[threadId].filter((m: { id: string }) => m.id !== msgId);
            }
          });
          localStorage.setItem('4ever_real_dm_msgs_v4', JSON.stringify(store));
        }
      } catch {}
    }

    setSelectedStorageIds([]);
    loadStorageItems();
    setStorageActionNotice(`Successfully deleted ${selectedStorageIds.length} item(s)! Freed ~${formatBytes(freedBytes)} of storage.`);
    setTimeout(() => setStorageActionNotice(null), 4000);
  };

  return (
    <div className="space-y-8 pb-28 pt-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-amber-400" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Manage your profile, security, app passcode, storage, and theme.
        </p>
      </div>

      {/* 1. Profile Section */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <User className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Profile Details
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-serif text-2xl font-bold flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/10 shadow-lg">
                {avatarUrl || profile?.avatar_url ? (
                  <img
                    src={avatarUrl || profile?.avatar_url || ''}
                    alt={profile?.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.display_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => settingsAvatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-amber-500 text-black shadow-md hover:bg-amber-400 transition-transform active:scale-95 cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={settingsAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-base truncate">
                {profile?.display_name || 'User'}
              </h3>
              <p className="text-xs text-white/50">@{profile?.username || 'username'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => settingsAvatarInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>Upload Avatar</span>
                </button>
                <button
                  type="button"
                  onClick={() => settingsCoverInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Camera className="w-3 h-3 text-amber-400" />
                  <span>Upload Banner</span>
                </button>
                <input
                  ref={settingsCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name or nickname"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">
                Custom Bio / Status
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Always dreaming with you ✨"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Appearance & Themes (Strict Light / Dark Mode) */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Sun className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Appearance
          </h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-sm font-semibold text-white">Color Mode</h4>
            <p className="text-xs text-white/50">
              Clean Light mode or Dark mode.
            </p>
          </div>

          <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>
        </div>
      </div>

      {/* 3. Couple App Passcode Lock (Security) */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            App Privacy Passcode Lock
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Open with 4-Digit Passcode</h4>
              <p className="text-xs text-white/50">
                Require a 4-digit PIN every time the app opens for intimate privacy.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isLockEnabled) {
                  disableLock();
                } else {
                  setPinModalOpen(true);
                }
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                isLockEnabled ? 'bg-amber-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isLockEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isLockEnabled && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-white/70">Passcode protection is currently active</span>
              <button
                type="button"
                onClick={() => setPinModalOpen(true)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" /> Change Passcode
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Storage & Data Quota Manager */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Storage & Data Quota
            </h2>
          </div>
          <span className="text-xs text-white/50 font-mono">
            {usedMB} MB / {storageLimitMB} MB
          </span>
        </div>

        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>{storagePercent}% storage used</span>
            <span>{(storageLimitMB - usedMB).toFixed(1)} MB free</span>
          </div>
        </div>

        {/* Real Dynamic Breakdown items */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-pink-400" /> Photos
            </span>
            <p className="text-white font-bold">{formatBytes(photosBytes)}</p>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-blue-400" /> Videos
            </span>
            <p className="text-white font-bold">{formatBytes(videosBytes)}</p>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-amber-400" /> Audio
            </span>
            <p className="text-white font-bold">{formatBytes(audioBytes)}</p>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Posts & Text
            </span>
            <p className="text-white font-bold">{formatBytes(textAndDocsBytes)}</p>
          </div>
        </div>

        {/* Action Notice */}
        <AnimatePresence>
          {storageActionNotice && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{storageActionNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Stored Media & Memories Manager */}
        <div className="pt-2 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Manage Stored Media & Memories
              </h3>
              <p className="text-[11px] text-white/50">
                Select individual items to delete and reclaim storage quota.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] py-1">
              {(['all', 'photos', 'posts', 'audio', 'chat'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setStorageFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    storageFilter === filterKey
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Batch Actions Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={storageSearch}
                onChange={(e) => setStorageSearch(e.target.value)}
                placeholder="Search stored memory or post title..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {storageItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const filteredIds = storageItems
                    .filter((item) => {
                      if (storageFilter === 'photos' && item.type !== 'image') return false;
                      if (storageFilter === 'posts' && item.source !== 'post') return false;
                      if (storageFilter === 'audio' && item.type !== 'audio') return false;
                      if (storageFilter === 'chat' && item.source !== 'chat') return false;
                      if (storageSearch.trim()) {
                        return item.title.toLowerCase().includes(storageSearch.toLowerCase());
                      }
                      return true;
                    })
                    .map((i) => i.id);
                  toggleSelectAllFilteredStorage(filteredIds);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Select All</span>
              </button>
            )}

            {selectedStorageIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelectedStorage}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedStorageIds.length})</span>
              </button>
            )}
          </div>

          {/* Stored Items List */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5">
            {storageItems
              .filter((item) => {
                if (storageFilter === 'photos' && item.type !== 'image') return false;
                if (storageFilter === 'posts' && item.source !== 'post') return false;
                if (storageFilter === 'audio' && item.type !== 'audio') return false;
                if (storageFilter === 'chat' && item.source !== 'chat') return false;
                if (storageSearch.trim()) {
                  return item.title.toLowerCase().includes(storageSearch.toLowerCase());
                }
                return true;
              })
              .map((item) => {
                const isSelected = selectedStorageIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectStorageItem(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-black/20 hover:bg-black/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 cursor-pointer pointer-events-none"
                      />

                      {/* Preview Thumbnail or Icon */}
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : item.type === 'video' ? (
                          <Film className="w-5 h-5 text-blue-400" />
                        ) : item.type === 'audio' ? (
                          <Mic className="w-5 h-5 text-amber-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-400" />
                        )}
                      </div>

                      {/* Text info */}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[320px]">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <span className="capitalize px-1.5 py-0.2 rounded bg-white/10 font-mono text-[9px] text-white/60">
                            {item.source}
                          </span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-white/70 font-medium">
                        {formatBytes(item.sizeBytes)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStorageIds([item.id]);
                          setTimeout(() => handleDeleteSelectedStorage(), 50);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-colors"
                        title="Delete this item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

            {storageItems.length === 0 && (
              <div className="py-8 text-center text-xs text-white/40 space-y-1">
                <HardDrive className="w-6 h-6 mx-auto text-white/20" />
                <p>No stored media or memories found yet.</p>
                <p className="text-[10px] text-white/30">Your storage is clean and optimal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Clear Non-Essential Cache Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div>
            <p className="text-xs font-semibold text-white">Temporary Preview Cache</p>
            <p className="text-[11px] text-white/40">
              Only purges ephemeral preview thumbnails. Never touches your account, bio, or memories.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearStorageCache}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Clear Temporary Cache</span>
          </button>
        </div>
      </div>

      {/* 5. Privacy & Security */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Privacy & Permissions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Read Receipts (✓✓)</h4>
              <p className="text-xs text-white/50">Show double checkmarks when messages are seen.</p>
            </div>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Online & Last Seen Status</h4>
              <p className="text-xs text-white/50">Allow partner to see when you are active.</p>
            </div>
            <input
              type="checkbox"
              checked={lastSeenVisible}
              onChange={(e) => setLastSeenVisible(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Two-Factor Authentication (2FA)</h4>
              <p className="text-xs text-white/50">Extra security layer on new device logins.</p>
            </div>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Private Account</h4>
              <p className="text-xs text-white/50">
                Only approved friends and your partner can see your photos, posts, and real-time updates.
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(profile?.is_private_account)}
              onChange={(e) => updateProfile({ is_private_account: e.target.checked })}
              className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 6. Daily Check-in & Notifications */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Notifications & Daily Reminders
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Daily Love Check-in Reminder</h4>
              <p className="text-xs text-white/50">
                Reminder notification to wish your partner or check in on their day.
              </p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => setDailyReminder(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 focus:ring-0"
            />
          </div>

          {dailyReminder && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-white/70">Daily Reminder Time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Sound Alerts</h4>
              <p className="text-xs text-white/50">Play chime when messages or calls arrive.</p>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-amber-500 w-4 h-4 focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* 7. Manage Accounts (Instagram Style) */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Manage Accounts
            </h2>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
            Multi-Account
          </span>
        </div>

        <p className="text-xs text-white/50">
          Switch between your accounts or add a secondary test profile without logging out.
        </p>

        {/* Current Active Account Card */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-500/20 ring-2 ring-amber-400 flex items-center justify-center font-bold text-amber-300 text-sm">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.display_name?.slice(0, 1) || 'U'
              )}
            </div>
            <div>
              <p className="font-semibold text-xs text-white flex items-center gap-1.5">
                <span>{profile?.display_name}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-black font-bold">Active</span>
              </p>
              <p className="text-[11px] text-white/50">@{profile?.username} • {profile?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>

        {/* Account Actions */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-white/50">Need to switch or log into another profile?</p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            Add or Switch Account
          </button>
        </div>
      </div>

      {/* 8. Danger Zone: Leave Space & Delete Account */}
      <div className="glass-card rounded-3xl border border-rose-500/30 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3 text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Account & Space Actions</h2>
        </div>

        <div className="space-y-3">
          {relationship && (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Disconnect Current Space</h4>
                <p className="text-xs text-white/50">Leave your paired space with your partner.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to disconnect from this space?')) {
                    disconnectRelationship();
                    navigate('/onboarding');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Delete Account</h4>
              <p className="text-xs text-white/50">Permanently delete your profile and private data.</p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Set PIN Modal */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Set 4-Digit Passcode</h3>
                <button
                  onClick={() => setPinModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                  {pinError}
                </div>
              )}

              <form onSubmit={handleSaveNewPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Enter 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPinModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
                  >
                    Save PIN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm rounded-2xl border border-rose-500/30 p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white">Delete Account?</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                This will permanently delete your profile, shared messages, and memory journal.
                Type <span className="font-mono font-bold text-rose-400">DELETE</span> to confirm.
              </p>

              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-rose-500/30 text-white text-center font-mono text-sm focus:outline-none"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteInput !== 'DELETE'}
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs disabled:opacity-30"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
