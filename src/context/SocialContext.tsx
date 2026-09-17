import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import type {
  FeedPost,
  PostComment,
  Profile,
  RelationshipType,
  DirectChatMessage,
  DirectChatThread,
  AppNotification,
} from '../types';
import { useAuth, TOMBSTONE_KEY } from './AuthContext';
import { useRelationship } from './RelationshipContext';

interface SocialContextType {
  // Feed posts
  posts: FeedPost[];
  createPost: (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    tag?: string | null,
    visibility?: 'public' | 'private' | 'friends'
  ) => void;
  deletePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  getComments: (postId: string) => PostComment[];
  addComment: (postId: string, content: string) => void;
  userPosts: (userId: string) => FeedPost[];

  // Directory & Search
  allUsers: Profile[];
  searchUsers: (query: string) => Profile[];
  getUserProfileById: (userId: string) => Profile | null;

  // Friendships
  friends: string[]; // array of user IDs
  pendingSentFriendIds: string[];
  pendingReceivedFriendIds: string[];
  sendFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (targetUserId: string) => void;
  declineFriendRequest: (targetUserId: string) => void;
  deleteFriendship: (targetUserId: string) => void;
  getFriendshipStatus: (targetUserId: string) => 'none' | 'pending_sent' | 'pending_received' | 'friends';

  // 1-Click Couple Relationship
  sendDirectRelationshipProposal: (
    targetUserId: string,
    type: RelationshipType
  ) => Promise<{ success: boolean; message: string }>;

  // Profile modal viewing
  selectedUserProfileId: string | null;
  openUserProfile: (userId: string) => void;
  closeUserProfile: () => void;
  updateMyProfile: (updates: Partial<Profile>) => void;

  // Direct Messages
  directThreads: DirectChatThread[];
  activeThreadId: string | null;
  setActiveThreadId: (threadId: string | null) => void;
  getMessagesForThread: (threadId: string) => DirectChatMessage[];
  sendDirectMessage: (
    threadId: string,
    content: string,
    type?: 'text' | 'image' | 'video' | 'audio' | 'location',
    mediaUrl?: string | null,
    metadata?: DirectChatMessage['metadata']
  ) => void;
  openDirectChatWithUser: (userId: string) => void;
  isMessagesOpen: boolean;
  setIsMessagesOpen: (open: boolean) => void;
  unreadMessagesCount: number;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  markAllNotificationsRead: () => void;
  acceptNotificationRequest: (notificationId: string) => Promise<void>;
  declineNotificationRequest: (notificationId: string) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

// Local Storage Keys (v4 clean slate: NO BOTS, REAL USERS ONLY)
const LOCAL_STORAGE_POSTS = '4ever_real_posts_v4';
const LOCAL_STORAGE_COMMENTS = '4ever_real_comments_v4';
const LOCAL_STORAGE_FRIENDS = '4ever_real_friends_v4';
const LOCAL_STORAGE_USERS = '4ever_real_users_v4';
const LOCAL_STORAGE_DM_MESSAGES = '4ever_real_dm_msgs_v4';
const LOCAL_STORAGE_NOTIFS = '4ever_real_notifs_v4';

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const {
    relationship,
    partnerProfile,
    sendPairRequest,
    acceptRequest: acceptPairRequest,
  } = useRelationship();

  // Posts state (Start with clean empty array)
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_POSTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  // Comments state
  const [comments, setComments] = useState<Record<string, PostComment[]>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_COMMENTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {};
  });

  // Real users directory
  const [allUsers, setAllUsers] = useState<Profile[]>(() => {
    try {
      const tombRaw = localStorage.getItem(TOMBSTONE_KEY);
      const tombList: string[] = tombRaw ? JSON.parse(tombRaw) : [];
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS);
      if (stored) {
        const parsed: Profile[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (u) => !tombList.includes(u.id) && (!u.email || !tombList.includes(u.email.toLowerCase()))
          );
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Friends state
  const [friends, setFriends] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FRIENDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.friends)) return parsed.friends;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [pendingSentFriendIds, setPendingSentFriendIds] = useState<string[]>([]);
  const [pendingReceivedFriendIds, setPendingReceivedFriendIds] = useState<string[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTIFS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Direct Messages state
  const [dmStore, setDmStore] = useState<Record<string, DirectChatMessage[]>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DM_MESSAGES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {};
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);

  // Realtime Supabase Broadcast Channel reference
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep allUsers updated with current user
  useEffect(() => {
    if (profile && profile.id) {
      setAllUsers((prev) => {
        const index = prev.findIndex((u) => u.id === profile.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...profile };
          return updated;
        }
        return [profile, ...prev];
      });
    }
  }, [profile]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_POSTS, JSON.stringify(posts));
    } catch {
      // ignore
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_COMMENTS, JSON.stringify(comments));
    } catch {
      // ignore
    }
  }, [comments]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(allUsers));
    } catch {
      // ignore
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_FRIENDS,
        JSON.stringify({ friends, pendingSentFriendIds, pendingReceivedFriendIds })
      );
    } catch {
      // ignore
    }
  }, [friends, pendingSentFriendIds, pendingReceivedFriendIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DM_MESSAGES, JSON.stringify(dmStore));
    } catch {
      // ignore
    }
  }, [dmStore]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Connect to Supabase Realtime Broadcast network
  useEffect(() => {
    const channel = supabase.channel('4ever_realtime_network', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'social_event' }, ({ payload }) => {
        if (!payload) return;

        // 1. Another real user announced presence
        if (payload.type === 'user_presence' && payload.profile) {
          const incoming: Profile = payload.profile;
          const tombRaw = localStorage.getItem(TOMBSTONE_KEY);
          const tombList: string[] = tombRaw ? JSON.parse(tombRaw) : [];
          if (tombList.includes(incoming.id) || (incoming.email && tombList.includes(incoming.email.toLowerCase()))) {
            return;
          }
          const myId = user?.id || profile?.id;
          const myUname = profile?.username?.toLowerCase();
          if (incoming.id === myId || (myUname && incoming.username?.toLowerCase() === myUname)) {
            return; // Never add self to allUsers
          }

          setAllUsers((prev) => {
            const incomingUname = incoming.username?.toLowerCase();
            const incomingEmail = incoming.email?.toLowerCase();
            const existsIndex = prev.findIndex(
              (u) =>
                u.id === incoming.id ||
                (incomingUname && u.username?.toLowerCase() === incomingUname) ||
                (incomingEmail && u.email && u.email.toLowerCase() === incomingEmail)
            );
            if (existsIndex >= 0) {
              const updated = [...prev];
              updated[existsIndex] = { ...updated[existsIndex], ...incoming };
              return updated;
            }
            return [...prev, incoming];
          });
        }

        // 2. Someone requested presence announcements
        if (payload.type === 'request_presence') {
          if (profile && profile.id) {
            channel.send({
              type: 'broadcast',
              event: 'social_event',
              payload: { type: 'user_presence', profile },
            });
          }
        }

        // 3. New real feed post published
        if (payload.type === 'new_post' && payload.post) {
          const incomingPost: FeedPost = payload.post;
          setPosts((prev) => {
            if (prev.some((p) => p.id === incomingPost.id)) return prev;
            return [incomingPost, ...prev];
          });
        }

        // 4. Friend request received
        if (payload.type === 'friend_request' && payload.targetUserId === (user?.id || profile?.id)) {
          const sender: Profile = payload.sender;
          setPendingReceivedFriendIds((prev) => (prev.includes(sender.id) ? prev : [...prev, sender.id]));
          const newNotif: AppNotification = {
            id: 'notif_fr_' + Date.now(),
            type: 'friend_request',
            from_user_id: sender.id,
            from_user_name: sender.display_name,
            from_user_username: sender.username,
            from_user_avatar: sender.avatar_url,
            content: 'sent you a friend request 👋',
            created_at: new Date().toISOString(),
            is_read: false,
            request_status: 'pending',
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }

        // 5. Friend request accepted by other person
        if (payload.type === 'friend_accepted' && payload.targetUserId === (user?.id || profile?.id)) {
          const sender: Profile = payload.sender;
          setPendingSentFriendIds((prev) => prev.filter((id) => id !== sender.id));
          setFriends((prev) => (prev.includes(sender.id) ? prev : [...prev, sender.id]));
        }

        // 6. Couple request received
        if (payload.type === 'couple_request' && payload.targetUserId === (user?.id || profile?.id)) {
          const sender: Profile = payload.sender;
          const newNotif: AppNotification = {
            id: 'notif_cr_' + Date.now(),
            type: 'couple_request',
            from_user_id: sender.id,
            from_user_name: sender.display_name,
            from_user_username: sender.username,
            from_user_avatar: sender.avatar_url,
            content: `wants to connect with you in a dedicated ${payload.relationType || 'couple'} space ❤️`,
            created_at: new Date().toISOString(),
            is_read: false,
            request_status: 'pending',
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }

        // 6b. Couple request accepted by partner!
        if (payload.type === 'couple_accepted' && payload.targetUserId === (user?.id || profile?.id)) {
          const partner: Profile = payload.partnerProfile || payload.sender;
          if (partner) {
            const newNotif: AppNotification = {
              id: 'notif_ca_' + Date.now(),
              type: 'couple_request',
              from_user_id: partner.id,
              from_user_name: partner.display_name,
              from_user_username: partner.username,
              from_user_avatar: partner.avatar_url,
              content: `accepted your couple request! You are now connected ❤️`,
              created_at: new Date().toISOString(),
              is_read: false,
              request_status: 'accepted',
            };
            setNotifications((prev) => [newNotif, ...prev]);
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          }
        }

        // 7. Direct chat message received
        if (payload.type === 'dm_message') {
          const myId = user?.id || profile?.id;
          if (myId && payload.targetUserId === myId) {
            const msg: DirectChatMessage = payload.message;
            const incomingMsg: DirectChatMessage = {
              ...msg,
              is_read: false,
            };
            const senderId = payload.senderId || msg.sender_id;
            const threadId = payload.isCouple ? 'thread_couple' : `thread_${senderId}`;

            setDmStore((prev) => ({
              ...prev,
              [threadId]: [...(prev[threadId] || []), incomingMsg],
            }));

            // Message arrival audio chime
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch {}
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce own presence & request network profiles
          if (profile && profile.id) {
            channel.send({
              type: 'broadcast',
              event: 'social_event',
              payload: { type: 'user_presence', profile },
            });
          }
          channel.send({
            type: 'broadcast',
            event: 'social_event',
            payload: { type: 'request_presence' },
          });
        }
      });

    realtimeChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, profile]);

  // Feed Post Actions
  const createPost = (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    tag?: string | null,
    visibility: 'public' | 'private' | 'friends' = 'public'
  ) => {
    const newPost: FeedPost = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      author_id: user?.id || 'me',
      author_name: profile?.display_name || 'My Name',
      author_username: profile?.username || 'me',
      author_avatar: profile?.avatar_url || null,
      content,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      likes_count: 0,
      is_liked_by_me: false,
      comments_count: 0,
      tag: tag || '#daily',
      visibility,
      created_at: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);

    // Broadcast in real-time across devices
    realtimeChannelRef.current?.send({
      type: 'broadcast',
      event: 'social_event',
      payload: { type: 'new_post', post: newPost },
    });
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.is_liked_by_me;
          return {
            ...p,
            is_liked_by_me: isLiked,
            likes_count: isLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
          };
        }
        return p;
      })
    );
  };

  const getComments = useCallback(
    (postId: string): PostComment[] => {
      return comments[postId] || [];
    },
    [comments]
  );

  const addComment = (postId: string, content: string) => {
    if (!content.trim()) return;
    const newComment: PostComment = {
      id: 'comment_' + Date.now(),
      post_id: postId,
      author_id: user?.id || 'me',
      author_name: profile?.display_name || 'My Name',
      author_username: profile?.username || 'me',
      author_avatar: profile?.avatar_url || null,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    );
  };

  const searchUsers = useCallback(
    (query: string): Profile[] => {
      const q = query.trim().toLowerCase().replace(/^@/, '');
      if (!q) return allUsers;
      return allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.display_name.toLowerCase().includes(q) ||
          (u.bio && u.bio.toLowerCase().includes(q))
      );
    },
    [allUsers]
  );

  const getUserProfileById = useCallback(
    (userId: string): Profile | null => {
      if (userId === 'me' || (user && userId === user.id)) {
        return {
          id: user?.id || 'me',
          email: user?.email || 'me@example.com',
          username: profile?.username || 'me',
          display_name: profile?.display_name || 'My Name',
          avatar_url: profile?.avatar_url || null,
          cover_url: profile?.cover_url || null,
          bio: profile?.bio || 'Living my best life ✨',
          posts_count: posts.filter((p) => p.author_id === 'me' || p.author_id === user?.id).length,
          friends_count: friends.length,
          relationship_partner_username: partnerProfile?.username || null,
          relationship_partner_name: partnerProfile?.display_name || null,
          relationship_role: relationship ? 'girlfriend' : null,
        };
      }
      if (partnerProfile && (userId === partnerProfile.id || userId === 'partner')) {
        return {
          ...partnerProfile,
          relationship_partner_username: profile?.username || 'me',
          relationship_partner_name: profile?.display_name || 'My Name',
          relationship_role: partnerProfile.relationship_role || 'girlfriend',
        };
      }
      return allUsers.find((u) => u.id === userId) || null;
    },
    [user, profile, partnerProfile, relationship, posts, friends, allUsers]
  );

  // Friendship Actions
  const sendFriendRequest = (targetUserId: string) => {
    setPendingSentFriendIds((prev) => (prev.includes(targetUserId) ? prev : [...prev, targetUserId]));

    // Broadcast friend request over Supabase Realtime
    if (profile) {
      realtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'social_event',
        payload: {
          type: 'friend_request',
          sender: profile,
          targetUserId,
        },
      });
    }
  };

  const acceptFriendRequest = (targetUserId: string) => {
    setPendingReceivedFriendIds((prev) => prev.filter((id) => id !== targetUserId));
    setFriends((prev) => (prev.includes(targetUserId) ? prev : [...prev, targetUserId]));

    // Broadcast acceptance
    if (profile) {
      realtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'social_event',
        payload: {
          type: 'friend_accepted',
          sender: profile,
          targetUserId,
        },
      });
    }
  };

  const declineFriendRequest = (targetUserId: string) => {
    setPendingReceivedFriendIds((prev) => prev.filter((id) => id !== targetUserId));
  };

  const deleteFriendship = (targetUserId: string) => {
    setFriends((prev) => prev.filter((id) => id !== targetUserId));
    setPendingSentFriendIds((prev) => prev.filter((id) => id !== targetUserId));
    setPendingReceivedFriendIds((prev) => prev.filter((id) => id !== targetUserId));
  };

  const getFriendshipStatus = useCallback(
    (targetUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'friends' => {
      if (friends.includes(targetUserId)) return 'friends';
      if (pendingSentFriendIds.includes(targetUserId)) return 'pending_sent';
      if (pendingReceivedFriendIds.includes(targetUserId)) return 'pending_received';
      return 'none';
    },
    [friends, pendingSentFriendIds, pendingReceivedFriendIds]
  );

  // 1-Click Couple Request Linking
  const sendDirectRelationshipProposal = async (
    targetUserId: string,
    type: RelationshipType
  ): Promise<{ success: boolean; message: string }> => {
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, message: 'Target user not found' };
    }

    const res = await sendPairRequest(targetUser.id, type);
    if (res.success) {
      return {
        success: true,
        message: `Couple request sent to @${targetUser.username}! Waiting for them to accept ❤️`,
      };
    } else {
      return {
        success: false,
        message: res.error || 'Failed to send couple request',
      };
    }
  };

  const openUserProfile = (userId: string) => {
    setSelectedUserProfileId(userId);
  };

  const closeUserProfile = () => {
    setSelectedUserProfileId(null);
  };

  const updateMyProfile = (updates: Partial<Profile>) => {
    updateProfile(updates);
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      realtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'social_event',
        payload: { type: 'user_presence', profile: updatedProfile },
      });
    }
  };

  const userPosts = useCallback(
    (userId: string): FeedPost[] => {
      if (userId === 'me' || (user && userId === user.id)) {
        return posts.filter((p) => p.author_id === 'me' || (user && p.author_id === user.id));
      }
      return posts.filter((p) => p.author_id === userId);
    },
    [posts, user]
  );

  // Notifications logic
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const acceptNotificationRequest = async (notificationId: string) => {
    const notif = notifications.find((n) => n.id === notificationId);
    if (!notif) return;

    if (notif.type === 'couple_request') {
      await acceptPairRequest(notif.request_id || notif.id);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else if (notif.type === 'friend_request') {
      acceptFriendRequest(notif.from_user_id);
      confetti({ particleCount: 50, spread: 60 });
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, request_status: 'accepted' } : n))
    );
  };

  const declineNotificationRequest = (notificationId: string) => {
    const notif = notifications.find((n) => n.id === notificationId);
    if (!notif) return;

    if (notif.type === 'friend_request') {
      declineFriendRequest(notif.from_user_id);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, request_status: 'declined' } : n))
    );
  };

  // Direct Threads computation (ONLY REAL USERS - NO BOTS - ZERO DUPLICATES)
  const directThreads = useMemo<DirectChatThread[]>(() => {
    const list: DirectChatThread[] = [];
    const seenUserIds = new Set<string>();

    const myId = user?.id || profile?.id;
    const myUname = profile?.username?.toLowerCase();

    // 1. Partner Couple thread (ONLY IF IN AN ACTIVE RELATIONSHIP OR PARTNER PROFILE EXISTS)
    if (relationship && partnerProfile && partnerProfile.id) {
      seenUserIds.add(partnerProfile.id);
      if (partnerProfile.username) seenUserIds.add(partnerProfile.username.toLowerCase());
      if (partnerProfile.email) seenUserIds.add(partnerProfile.email.toLowerCase());

      const coupleMsgs = dmStore['thread_couple'] || [];
      const lastCoupleMsg = coupleMsgs.length > 0 ? coupleMsgs[coupleMsgs.length - 1] : null;

      list.push({
        id: 'thread_couple',
        participant: partnerProfile,
        is_couple: true,
        couple_role: (partnerProfile.relationship_role as any) || 'girlfriend',
        last_message: lastCoupleMsg,
        unread_count: 0,
      });
    }

    // 2. Real Friends threads (Deduplicated, strictly omitting the partner and self!)
    const uniqueFriends = Array.from(new Set(friends));
    for (const friendId of uniqueFriends) {
      if (seenUserIds.has(friendId)) continue;
      if (myId && friendId === myId) continue;

      const friendProfile = allUsers.find(
        (u) => u.id === friendId || (u.username && u.username.toLowerCase() === friendId.toLowerCase())
      );
      if (!friendProfile) continue;

      if (myId && friendProfile.id === myId) continue;
      if (myUname && friendProfile.username?.toLowerCase() === myUname) continue;
      if (seenUserIds.has(friendProfile.id)) continue;
      if (friendProfile.username && seenUserIds.has(friendProfile.username.toLowerCase())) continue;

      seenUserIds.add(friendProfile.id);
      if (friendProfile.username) seenUserIds.add(friendProfile.username.toLowerCase());

      const threadId = `thread_${friendProfile.id}`;
      const msgs = dmStore[threadId] || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const unread = msgs.filter((m) => !m.is_read && m.sender_id !== (user?.id || profile?.id || 'me')).length;

      list.push({
        id: threadId,
        participant: friendProfile,
        is_couple: false,
        couple_role: friendProfile.relationship_role || undefined,
        last_message: lastMsg,
        unread_count: unread,
      });
    }

    return list;
  }, [relationship, partnerProfile, dmStore, friends, allUsers, user, profile]);

  const getMessagesForThread = useCallback(
    (threadId: string): DirectChatMessage[] => {
      return dmStore[threadId] || [];
    },
    [dmStore]
  );

  const sendDirectMessage = (
    threadId: string,
    content: string,
    type: 'text' | 'image' | 'video' | 'audio' | 'location' = 'text',
    mediaUrl?: string | null,
    metadata?: DirectChatMessage['metadata']
  ) => {
    if (!content.trim() && !mediaUrl && !metadata) return;

    const myId = user?.id || profile?.id || 'usr_me';
    const myName = profile?.display_name || 'User';
    const myUsername = profile?.username || 'user';
    const myAvatar = profile?.avatar_url || null;

    const newMsg: DirectChatMessage = {
      id: 'dm_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      thread_id: threadId,
      sender_id: myId,
      sender_name: myName,
      sender_username: myUsername,
      sender_avatar: myAvatar,
      content: content.trim(),
      type,
      media_url: mediaUrl || null,
      metadata,
      is_read: true,
      created_at: new Date().toISOString(),
    };

    setDmStore((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg],
    }));

    // Broadcast message to the real recipient over Supabase Realtime
    let targetUserId: string | null = null;
    let isCouple = false;

    if (threadId === 'thread_couple') {
      targetUserId = partnerProfile?.id || null;
      isCouple = true;
    } else if (threadId.startsWith('thread_')) {
      targetUserId = threadId.replace('thread_', '');
    }

    if (targetUserId) {
      realtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'social_event',
        payload: {
          type: 'dm_message',
          message: newMsg,
          targetUserId,
          senderId: myId,
          isCouple,
        },
      });
    }

    // Also persist couple messages to Supabase messages table if active relationship exists
    if (threadId === 'thread_couple' && relationship?.id) {
      try {
        supabase.from('messages').insert([{
          id: newMsg.id,
          relationship_id: relationship.id,
          sender_id: myId,
          type: type === 'location' ? 'location' : type === 'audio' ? 'voice' : type,
          content: newMsg.content,
          media_url: newMsg.media_url,
          metadata: newMsg.metadata,
          created_at: newMsg.created_at,
        }]).then();
      } catch {}
    }
  };

  const openDirectChatWithUser = (userId: string) => {
    if (partnerProfile && (userId === partnerProfile.id || userId === 'partner')) {
      setActiveThreadId('thread_couple');
    } else {
      const threadId = `thread_${userId}`;
      setActiveThreadId(threadId);
    }
    setIsMessagesOpen(true);
  };

  const unreadMessagesCount = useMemo(() => {
    let count = 0;
    Object.keys(dmStore).forEach((threadId) => {
      const msgs = dmStore[threadId] || [];
      count += msgs.filter((m) => !m.is_read && m.sender_id !== (user?.id || 'me')).length;
    });
    return count;
  }, [dmStore, user]);

  return (
    <SocialContext.Provider
      value={{
        posts,
        createPost,
        deletePost,
        toggleLike,
        getComments,
        addComment,
        userPosts,
        allUsers,
        searchUsers,
        getUserProfileById,
        friends,
        pendingSentFriendIds,
        pendingReceivedFriendIds,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        deleteFriendship,
        getFriendshipStatus,
        sendDirectRelationshipProposal,
        selectedUserProfileId,
        openUserProfile,
        closeUserProfile,
        updateMyProfile,
        directThreads,
        activeThreadId,
        setActiveThreadId,
        getMessagesForThread,
        sendDirectMessage,
        openDirectChatWithUser,
        isMessagesOpen,
        setIsMessagesOpen,
        unreadMessagesCount,
        notifications,
        unreadNotificationsCount,
        isNotificationsOpen,
        setIsNotificationsOpen,
        markAllNotificationsRead,
        acceptNotificationRequest,
        declineNotificationRequest,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return ctx;
};
