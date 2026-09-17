import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Heart,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  Settings as SettingsIcon,
  X,
  Check,
  Camera,
  LogOut,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { useSocial } from '../context/SocialContext';
import { calculateRelationshipTime, resizeAndCompressImage } from '../lib/utils';

export const ProfilePage: React.FC = () => {
  const { profile, signOut, updateProfile } = useAuth();
  const { relationship, partnerProfile } = useRelationship();
  const { userPosts, updateMyProfile, friends } = useSocial();

  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync profile into edit form when profile loads or modal opens
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setCoverUrl(profile.cover_url || '');
    }
  }, [profile, editModalOpen]);

  // File input refs for uploading images directly from device
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalCoverInputRef = useRef<HTMLInputElement>(null);

  const handleDirectBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeAndCompressImage(file, 1400, 600, 0.85);
      setCoverUrl(compressed);
      await updateProfile({ cover_url: compressed });
      updateMyProfile({ cover_url: compressed });
    } catch (err) {
      console.error('Failed to process banner image', err);
    }
  };

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeAndCompressImage(file, 600, 600, 0.85);
      setAvatarUrl(compressed);
      await updateProfile({ avatar_url: compressed });
      updateMyProfile({ avatar_url: compressed });
    } catch (err) {
      console.error('Failed to process avatar image', err);
    }
  };

  const handleModalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeAndCompressImage(file, 600, 600, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error('Failed to process avatar image', err);
    }
  };

  const handleModalCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeAndCompressImage(file, 1400, 600, 0.85);
      setCoverUrl(compressed);
    } catch (err) {
      console.error('Failed to process banner image', err);
    }
  };

  const myPosts = userPosts('me');

  const partnerName =
    relationship?.custom_nickname_2 || partnerProfile?.display_name || 'Partner';

  const time = relationship?.start_date
    ? calculateRelationshipTime(relationship.start_date)
    : null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates = {
      display_name: displayName.trim() || profile?.display_name,
      username: username.trim().toLowerCase().replace(/\s+/g, '_') || profile?.username,
      bio: bio,
      avatar_url: avatarUrl.trim() || profile?.avatar_url || null,
      cover_url: coverUrl.trim() || profile?.cover_url || null,
    };
    await updateProfile(updates);
    updateMyProfile(updates);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditModalOpen(false);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 pt-4 px-2 sm:px-0">
      {/* Profile Header Banner & Avatar (Instagram style) */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Cover Photo */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-amber-600/30 via-rose-600/20 to-purple-600/30 relative overflow-hidden group">
          {profile?.cover_url ? (
            <img
              src={profile.cover_url}
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
              <span>Tap 'Upload Banner' to personalize cover</span>
            </div>
          )}

          {/* Quick upload banner button */}
          <button
            type="button"
            onClick={() => bannerFileInputRef.current?.click()}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 transition-all border border-white/15 active:scale-95 cursor-pointer shadow-lg"
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>{profile?.cover_url ? 'Change Banner' : 'Upload Banner'}</span>
          </button>
          <input
            ref={bannerFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleDirectBannerUpload}
          />

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Link
              to="/settings"
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/80 hover:text-white transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Profile Details Body */}
        <div className="p-5 sm:p-6 pt-0 relative space-y-5">
          {/* Avatar and Edit Button row */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-16">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#0c0d11] bg-gradient-to-tr from-amber-400 to-amber-600 text-black text-3xl font-bold flex items-center justify-center overflow-hidden shadow-2xl">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.display_name?.slice(0, 2).toUpperCase() || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-amber-500 text-black shadow-lg hover:bg-amber-400 transition-transform active:scale-95 cursor-pointer"
                title="Upload Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDirectAvatarUpload}
              />
            </div>

            <button
              onClick={() => {
                setDisplayName(profile?.display_name || '');
                setUsername(profile?.username || '');
                setBio(profile?.bio || '');
                setAvatarUrl(profile?.avatar_url || '');
                setCoverUrl(profile?.cover_url || '');
                setEditModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Names and Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-white">
                {profile?.display_name || 'My Name'}
              </h2>
              {relationship && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-rose-400" />
                  <span className="capitalize">{relationship.relation_type}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 font-mono">@{profile?.username || 'username'}</p>
            {profile?.bio ? (
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed pt-1 whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs text-white/40 italic pt-1">
                No bio yet. Tap &ldquo;Edit Profile&rdquo; to add your interests & love notes!
              </p>
            )}
          </div>

          {/* Relationship Capsule */}
          {relationship ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
                  <Heart className="w-4 h-4 fill-rose-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Coupled with {partnerName}
                  </span>
                  <span className="text-[11px] text-white/50">
                    {time ? `${time.totalDays} days together` : 'Connected'}
                  </span>
                </div>
              </div>
              <Link
                to="/"
                className="text-xs font-semibold text-amber-300 hover:text-amber-200"
              >
                Space &rarr;
              </Link>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-white/60">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Single • Connect with a partner anytime</span>
              </div>
              <Link
                to="/search"
                className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium"
              >
                Find Partner
              </Link>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-white/5">
              <div className="font-bold text-base text-white">{myPosts.length}</div>
              <div className="text-[11px] text-white/50">Posts</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <div className="font-bold text-base text-white">{friends.length}</div>
              <div className="text-[11px] text-white/50">Friends</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <div className="font-bold text-base text-amber-300 font-mono">
                {time?.totalDays || 1}
              </div>
              <div className="text-[11px] text-white/50">Days Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'posts'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>My Posts ({myPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'about'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>About & Space</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' ? (
        myPosts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl border border-white/10 space-y-3">
            <ImageIcon className="w-10 h-10 text-white/30 mx-auto" />
            <p className="text-sm text-white/70 font-medium">You haven&apos;t posted anything yet</p>
            <Link
              to="/feeds"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs"
            >
              <span>Create First Post</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="glass-card rounded-2xl border border-white/10 p-4 space-y-3 overflow-hidden"
              >
                {post.media_url && (
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40">
                    <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-white/90 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" /> {post.likes_count}
                  </span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* About Tab */
        <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-5">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Space Information
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/50">Username</span>
              <span className="text-white font-mono">@{profile?.username || 'user'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/50">Email</span>
              <span className="text-white">{profile?.email || 'private'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/50">Partner Space</span>
              <span className="text-amber-300 font-semibold">
                {relationship ? `${partnerName} (${relationship.relation_type})` : 'None'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/50">Anniversary</span>
              <span className="text-white">
                {relationship?.start_date
                  ? new Date(relationship.start_date).toLocaleDateString()
                  : 'Not set'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={signOut}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 text-white/60 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-3xl border border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-full text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/70 mb-1 font-medium">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/40">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))
                      }
                      required
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your friends something sweet..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50 resize-none"
                  />
                </div>

                {/* Avatar Direct File Upload */}
                <div className="space-y-1.5">
                  <label className="block text-white/70 font-medium">Profile Photo (Avatar)</label>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center text-amber-300 font-bold border border-white/10">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => modalAvatarInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 border border-white/10 text-xs transition-all cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      ref={modalAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleModalAvatarUpload}
                    />
                  </div>
                </div>

                {/* Banner Direct File Upload */}
                <div className="space-y-1.5">
                  <label className="block text-white/70 font-medium">Profile Banner (Cover)</label>
                  <div className="space-y-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                    {coverUrl ? (
                      <div className="h-20 w-full rounded-xl overflow-hidden relative border border-white/10">
                        <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCoverUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 hover:bg-rose-500/80 text-white transition-all cursor-pointer"
                          title="Remove Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-14 w-full rounded-xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center text-white/40 text-[11px]">
                        No banner uploaded yet
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => modalCoverInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Banner</span>
                      </button>
                    </div>
                    <input
                      ref={modalCoverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleModalCoverUpload}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Save Changes
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
