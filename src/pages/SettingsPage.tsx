import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { useTheme } from '../context/ThemeContext';
import { useAppLock } from '../context/AppLockContext';
import { resizeAndCompressImage } from '../lib/utils';

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

  // Storage Stats
  const [storageLimitMB] = useState(100);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Delete account confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const settingsAvatarInputRef = useRef<HTMLInputElement>(null);
  const settingsCoverInputRef = useRef<HTMLInputElement>(null);

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
      bio: bio.trim() || undefined,
      avatar_url: avatarUrl || undefined,
      cover_url: coverUrl || undefined,
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

  const handleClearStorageCache = () => {
    try {
      // Clear non-essential cached media items
      localStorage.removeItem('4ever_cached_media');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    await disconnectRelationship();
    await signOut();
    navigate('/auth');
  };

  // Mock computed storage breakdown for illustration
  const usedMB = 38.4;
  const storagePercent = Math.min(100, Math.round((usedMB / storageLimitMB) * 100));

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
            <span>{Math.round(storageLimitMB - usedMB)} MB free</span>
          </div>
        </div>

        {/* Breakdown items */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-pink-400" /> Photos
            </span>
            <p className="text-white font-bold">18.2 MB</p>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-blue-400" /> Videos
            </span>
            <p className="text-white font-bold">14.6 MB</p>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-amber-400" /> Audio
            </span>
            <p className="text-white font-bold">3.8 MB</p>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-white/40 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Docs/PDFs
            </span>
            <p className="text-white font-bold">1.8 MB</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {cacheCleared && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-4 h-4" /> Cached media cleared!
            </span>
          )}
          <button
            type="button"
            onClick={handleClearStorageCache}
            className="ml-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
          >
            Clear Cached Files
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
