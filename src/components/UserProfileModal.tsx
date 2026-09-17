import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  MessageCircle,
  UserMinus,
  UserPlus,
  Sparkles,
  Grid,
  Lock,
  Check,
  Share2,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';

export const UserProfileModal: React.FC = () => {
  const { user } = useAuth();
  const { relationship } = useRelationship();
  const {
    selectedUserProfileId,
    closeUserProfile,
    getUserProfileById,
    userPosts,
    getFriendshipStatus,
    sendFriendRequest,
    deleteFriendship,
    sendDirectRelationshipProposal,
    openDirectChatWithUser,
  } = useSocial();

  const [confirmDeleteFriend, setConfirmDeleteFriend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'details'>('posts');

  if (!selectedUserProfileId) return null;

  const targetProfile = getUserProfileById(selectedUserProfileId);
  if (!targetProfile) return null;

  const isMe = user && targetProfile.id === user.id;
  const friendshipStatus = getFriendshipStatus(targetProfile.id);
  const posts = userPosts(targetProfile.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + '/profile/' + targetProfile.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveFriend = () => {
    deleteFriendship(targetProfile.id);
    setConfirmDeleteFriend(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#121319] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto text-white flex flex-col max-h-[90vh]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#14161f]/80 backdrop-blur-md z-10 sticky top-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-white/90">
                @{targetProfile.username}
              </span>
              {targetProfile.relationship_role && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-rose-300" />
                  {targetProfile.relationship_role === 'girlfriend'
                    ? 'Girlfriend'
                    : targetProfile.relationship_role === 'boyfriend'
                    ? 'Boyfriend'
                    : 'In Love'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Share Profile"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={closeUserProfile}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* Cover Banner */}
            <div className="h-32 sm:h-40 w-full relative bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-600/20">
              {targetProfile.cover_url ? (
                <img
                  src={targetProfile.cover_url}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-30">
                  <Sparkles className="w-12 h-12 text-amber-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121319] via-transparent to-transparent" />
            </div>

            {/* Profile Info Header */}
            <div className="px-5 sm:px-6 pb-4 relative -mt-14">
              <div className="flex items-end justify-between">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-[#121319] overflow-hidden bg-white/10 shadow-xl">
                    {targetProfile.avatar_url ? (
                      <img
                        src={targetProfile.avatar_url}
                        alt={targetProfile.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-amber-300">
                        {targetProfile.display_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {targetProfile.is_online && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#121319]" />
                  )}
                </div>

                {/* Quick Action Buttons */}
                {!isMe && (
                  <div className="flex items-center space-x-2 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeUserProfile();
                        openDirectChatWithUser(targetProfile.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>

                    {friendshipStatus === 'friends' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFriend(true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-white/70 hover:text-rose-300 text-xs transition-all cursor-pointer"
                        title="Remove Friend"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    ) : friendshipStatus === 'pending_sent' ? (
                      <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs">
                        Requested
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendFriendRequest(targetProfile.id)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Friend</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Name & Bio */}
              <div className="mt-3">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
                  {targetProfile.display_name}
                </h2>
                <p className="text-xs text-white/50">@{targetProfile.username}</p>

                {/* DEDICATED RELATIONSHIP STATUS CALLOUT */}
                <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-rose-500/15 via-purple-500/10 to-amber-500/15 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                      <Heart className="w-4 h-4 fill-rose-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-rose-200">
                        {targetProfile.relationship_role === 'girlfriend'
                          ? `Girlfriend of @${targetProfile.relationship_partner_username || 'lover'}`
                          : targetProfile.relationship_role === 'boyfriend'
                          ? `Boyfriend of @${targetProfile.relationship_partner_username || 'lover'}`
                          : targetProfile.relationship_partner_username
                          ? `In Love with @${targetProfile.relationship_partner_username}`
                          : 'Single'}
                      </p>
                      <p className="text-[10px] text-white/50">
                        {targetProfile.relationship_partner_name
                          ? `Connected with ${targetProfile.relationship_partner_name}`
                          : '4EVER Verified Profile'}
                      </p>
                    </div>
                  </div>

                  {!isMe && !relationship && !targetProfile.relationship_partner_username && (
                    <button
                      type="button"
                      onClick={() => sendDirectRelationshipProposal(targetProfile.id, 'couple')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Heart className="w-3 h-3 fill-rose-300" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>

                {targetProfile.bio && (
                  <p className="mt-3 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                    {targetProfile.bio}
                  </p>
                )}
              </div>

              {/* Stats Bar */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-around text-center">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{posts.length}</p>
                  <p className="text-[11px] text-white/50">Posts</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{targetProfile.friends_count || 12}</p>
                  <p className="text-[11px] text-white/50">Friends</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <p className="text-base sm:text-lg font-bold text-amber-300">Active</p>
                  <p className="text-[11px] text-white/50">Status</p>
                </div>
              </div>
            </div>

            {/* Remove Friend Confirmation Banner */}
            {confirmDeleteFriend && (
              <div className="mx-5 mb-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex flex-col space-y-2 text-xs">
                <p className="font-semibold text-rose-200">
                  Remove @{targetProfile.username} from your friends?
                </p>
                <p className="text-white/60 text-[11px]">
                  They will no longer appear in your friends list or direct messages.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRemoveFriend}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    Yes, Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteFriend(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-t border-white/10 flex">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'posts'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Posts ({posts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>About</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-5">
              {activeTab === 'posts' ? (
                posts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10"
                      >
                        {post.media_url ? (
                          <img
                            src={post.media_url}
                            alt="Post Media"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="p-3 w-full h-full flex flex-col justify-between text-left text-xs bg-gradient-to-br from-white/5 to-white/10">
                            <p className="line-clamp-4 text-white/80 font-sans">{post.content}</p>
                            <span className="text-[10px] text-amber-300/80 font-medium">{post.tag}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 text-white text-xs font-semibold">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {post.comments_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-white/40">
                    <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No posts shared yet</p>
                  </div>
                )
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <p className="text-[11px] text-white/40 uppercase font-mono tracking-wider">Username</p>
                    <p className="font-medium text-white">@{targetProfile.username}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <p className="text-[11px] text-white/40 uppercase font-mono tracking-wider">Account Role</p>
                    <p className="font-medium text-amber-300">
                      {targetProfile.relationship_role
                        ? targetProfile.relationship_role.toUpperCase()
                        : 'MEMBER'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <p className="text-[11px] text-white/40 uppercase font-mono tracking-wider">Privacy</p>
                    <p className="font-medium text-white/80 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      4EVER Protected Profile
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
