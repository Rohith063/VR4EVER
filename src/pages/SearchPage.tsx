import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Search,
  UserPlus,
  Heart,
  Sparkles,
  Users,
  Check,
  Clock,
  X,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import type { Profile, RelationshipType } from '../types';

export const SearchPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { relationship } = useRelationship();
  const {
    allUsers,
    searchUsers,
    friends,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendshipStatus,
    sendDirectRelationshipProposal,
    openUserProfile,
    openDirectChatWithUser,
  } = useSocial();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'friends'>('all');
  const [selectedUserForModal, setSelectedUserForModal] = useState<Profile | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>('couple');
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const searchResults = searchUsers(query).filter(
    (u) => u.id !== user?.id && u.username !== profile?.username
  );

  const friendsList = allUsers.filter((u) => friends.includes(u.id));

  const handleConnectRelationship = async (targetUser: Profile) => {
    setConnectingUserId(targetUser.id);
    try {
      const res = await sendDirectRelationshipProposal(targetUser.id, selectedRelationType);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#f43f5e', '#10b981'],
      });
      setSuccessToast(res.message);
      setSelectedUserForModal(null);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch {
      // ignore
    } finally {
      setConnectingUserId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 pt-4 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
          Explore & Connect
        </h1>
        <p className="text-xs text-white/50">
          Find friends by username, view profiles, and connect spaces without codes
        </p>
      </div>

      {/* Success Notification Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by @username, full name, or bio..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl glass-card border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400/50 shadow-xl"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3.5 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          All Users ({searchResults.length})
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'friends'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          My Friends ({friendsList.length})
        </button>
      </div>

      {/* User Results List */}
      <div className="space-y-3">
        {(activeTab === 'all' ? searchResults : friendsList).length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl border border-white/10 space-y-2">
            <Users className="w-10 h-10 text-white/30 mx-auto" />
            <p className="text-sm text-white/70 font-medium">No users found matching &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-white/40">Try searching for &ldquo;ananya&rdquo;, &ldquo;rahul&rdquo;, or &ldquo;priya&rdquo;</p>
          </div>
        ) : (
          (activeTab === 'all' ? searchResults : friendsList).map((targetUser) => {
            const status = getFriendshipStatus(targetUser.id);
            const isAlreadyPaired = relationship && (relationship.user_1 === targetUser.id || relationship.user_2 === targetUser.id);

            return (
              <motion.div
                key={targetUser.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl border border-white/10 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-white/20"
              >
                {/* User Info */}
                <div
                  className="flex items-center gap-3.5 cursor-pointer flex-1"
                  onClick={() => openUserProfile(targetUser.id)}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/30 to-amber-300/10 border border-amber-400/30 flex items-center justify-center text-sm font-bold text-amber-300 overflow-hidden shrink-0 shadow-md">
                    {targetUser.avatar_url ? (
                      <img
                        src={targetUser.avatar_url}
                        alt={targetUser.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      targetUser.display_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate hover:text-amber-300 transition-colors">
                        {targetUser.display_name}
                      </h4>
                      {targetUser.is_online && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                      )}
                    </div>
                    <p className="text-xs text-white/50 truncate">@{targetUser.username}</p>
                    {targetUser.bio && (
                      <p className="text-xs text-white/70 line-clamp-1 mt-0.5">{targetUser.bio}</p>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Quick Message Button */}
                  <button
                    type="button"
                    onClick={() => openDirectChatWithUser(targetUser.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                    title="Send Direct Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  {/* Friend Button */}
                  {status === 'friends' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Friends</span>
                    </span>
                  ) : status === 'pending_sent' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Requested</span>
                    </span>
                  ) : status === 'pending_received' ? (
                    <button
                      type="button"
                      onClick={() => acceptFriendRequest(targetUser.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendFriendRequest(targetUser.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add Friend</span>
                    </button>
                  )}

                  {/* Connect Relationship Space Button (Code-less) */}
                  {isAlreadyPaired ? (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                      <span>Partnered</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedUserForModal(targetUser)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-black" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* User Profile Preview & 1-Click Connection Modal */}
      <AnimatePresence>
        {selectedUserForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md rounded-3xl border border-white/15 shadow-2xl overflow-hidden"
            >
              {/* Cover photo banner */}
              <div className="h-28 w-full bg-gradient-to-r from-amber-600/30 to-rose-600/30 relative overflow-hidden">
                {selectedUserForModal.cover_url && (
                  <img
                    src={selectedUserForModal.cover_url}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
                <button
                  onClick={() => setSelectedUserForModal(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card Body */}
              <div className="p-6 pt-0 relative space-y-4">
                {/* Avatar */}
                <div className="relative -mt-10 flex items-end justify-between">
                  <div className="w-20 h-20 rounded-full border-4 border-[#12131a] bg-gradient-to-tr from-amber-500 to-amber-700 text-black text-2xl font-bold flex items-center justify-center overflow-hidden shadow-xl">
                    {selectedUserForModal.avatar_url ? (
                      <img
                        src={selectedUserForModal.avatar_url}
                        alt={selectedUserForModal.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedUserForModal.display_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedUserForModal.display_name}
                  </h3>
                  <p className="text-xs text-white/50 font-mono">@{selectedUserForModal.username}</p>
                  {selectedUserForModal.bio && (
                    <p className="text-xs text-white/80 mt-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {selectedUserForModal.bio}
                    </p>
                  )}
                </div>

                {/* Direct Relationship Proposal Box (NO PAIR CODE NEEDED!) */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                    <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Direct Relationship Connection</span>
                  </div>
                  <p className="text-[11px] text-white/60">
                    Connect directly with @{selectedUserForModal.username} into a shared space. No key pairs or codes required!
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(
                      [
                        { id: 'couple', label: 'Couple', icon: Heart },
                        { id: 'bestfriends', label: 'Besties', icon: Sparkles },
                        { id: 'siblings', label: 'Siblings', icon: Users },
                      ] as const
                    ).map((t) => {
                      const Icon = t.icon;
                      const isSelected = selectedRelationType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedRelationType(t.id)}
                          className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={connectingUserId === selectedUserForModal.id}
                    onClick={() => handleConnectRelationship(selectedUserForModal)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-black" />
                    <span>
                      {connectingUserId === selectedUserForModal.id
                        ? 'Connecting...'
                        : `Connect as ${selectedRelationType.toUpperCase()}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
