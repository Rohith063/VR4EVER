import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type {
  FeedPost,
  PostComment,
  Profile,
  RelationshipType,
  DirectChatMessage,
  DirectChatThread,
  AppNotification,
} from '../types';
import { useAuth } from './AuthContext';
import { useRelationship } from './RelationshipContext';

interface SocialContextType {
  // Feed posts
  posts: FeedPost[];
  createPost: (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    tag?: string | null
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

const LOCAL_STORAGE_POSTS = '4ever_social_posts_v3';
const LOCAL_STORAGE_COMMENTS = '4ever_social_comments_v3';
const LOCAL_STORAGE_FRIENDS = '4ever_social_friends_v3';
const LOCAL_STORAGE_USERS = '4ever_social_directory_v3';
const LOCAL_STORAGE_DM_MESSAGES = '4ever_social_dm_msgs_v3';
const LOCAL_STORAGE_NOTIFS = '4ever_social_notifs_v3';

const INITIAL_DIRECTORY_USERS: Profile[] = [
  {
    id: 'usr_ananya',
    email: 'ananya@example.com',
    username: 'ananya_v',
    display_name: 'Ananya Verma',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
    bio: 'Finding art in every sunset & tea in every rainy afternoon ☕✨',
    posts_count: 14,
    friends_count: 28,
    is_online: true,
    relationship_partner_username: 'arjun_m',
    relationship_partner_name: 'Arjun Mehta',
    relationship_role: 'girlfriend',
  },
  {
    id: 'usr_rahul',
    email: 'rahul@example.com',
    username: 'rahul_s',
    display_name: 'Rahul Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    bio: 'Architecture student | Coffee addict | Capturing little moments 📷',
    posts_count: 8,
    friends_count: 19,
    is_online: true,
    relationship_role: null,
  },
  {
    id: 'usr_priya',
    email: 'priya@example.com',
    username: 'priya_k',
    display_name: 'Priya Kapoor',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80',
    bio: 'Music enthusiast & mountain lover 🏔️ Always humming a melody.',
    posts_count: 22,
    friends_count: 45,
    is_online: false,
    relationship_role: null,
  },
  {
    id: 'usr_arjun',
    email: 'arjun@example.com',
    username: 'arjun_m',
    display_name: 'Arjun Mehta',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    bio: 'Coder by day, street photographer by night 🌃 Let’s connect!',
    posts_count: 11,
    friends_count: 34,
    is_online: true,
    relationship_partner_username: 'ananya_v',
    relationship_partner_name: 'Ananya Verma',
    relationship_role: 'boyfriend',
  },
  {
    id: 'usr_sneha',
    email: 'sneha@example.com',
    username: 'sneha_d',
    display_name: 'Sneha Das',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    cover_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80',
    bio: 'Books, poetry & spontaneous road trips 📖✨',
    posts_count: 19,
    friends_count: 52,
    is_online: false,
    relationship_role: null,
  },
];

const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: 'post_1',
    author_id: 'usr_ananya',
    author_name: 'Ananya Verma',
    author_username: 'ananya_v',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Weekend getaway by the lake with the one who makes everyday feel golden 🌅💛 Grateful for these calm moments.',
    media_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    likes_count: 34,
    is_liked_by_me: false,
    comments_count: 5,
    tag: '#love',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'post_2',
    author_id: 'usr_rahul',
    author_name: 'Rahul Sharma',
    author_username: 'rahul_s',
    author_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    content: 'Just finished our couple study goal for the week! 📚 12 hours clocked together on 4EVER notes. Hard work always pays off.',
    media_url: null,
    media_type: null,
    likes_count: 19,
    is_liked_by_me: true,
    comments_count: 2,
    tag: '#milestone',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'post_3',
    author_id: 'usr_priya',
    author_name: 'Priya Kapoor',
    author_username: 'priya_k',
    author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    content: 'Made our favorite chocolate pancake breakfast this morning! Nothing beats cozy Sunday mornings 🥞☕',
    media_url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    likes_count: 48,
    is_liked_by_me: false,
    comments_count: 8,
    tag: '#date',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'post_4',
    author_id: 'usr_arjun',
    author_name: 'Arjun Mehta',
    author_username: 'arjun_m',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Night strolls in old town. The ambient city lights make everything feel cinematic ✨',
    media_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    likes_count: 27,
    is_liked_by_me: false,
    comments_count: 3,
    tag: '#thoughts',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'couple_request',
    from_user_id: 'usr_priya',
    from_user_name: 'Priya Kapoor',
    from_user_username: 'priya_k',
    from_user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    content: 'wants to connect with you in a dedicated Couple Space ❤️',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    is_read: false,
    request_status: 'pending',
  },
  {
    id: 'notif_2',
    type: 'friend_request',
    from_user_id: 'usr_arjun',
    from_user_name: 'Arjun Mehta',
    from_user_username: 'arjun_m',
    from_user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'sent you a friend request 👋',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    is_read: false,
    request_status: 'pending',
  },
  {
    id: 'notif_3',
    type: 'like',
    from_user_id: 'usr_ananya',
    from_user_name: 'Ananya Verma',
    from_user_username: 'ananya_v',
    from_user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'liked your recent feed post ✨',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    is_read: true,
  },
];

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const { relationship, partnerProfile, createSpace } = useRelationship();

  // Posts state
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_POSTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_FEED_POSTS;
  });

  // Comments state
  const [comments, setComments] = useState<Record<string, PostComment[]>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_COMMENTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      post_1: [
        {
          id: 'c_1',
          post_id: 'post_1',
          author_id: 'usr_rahul',
          author_name: 'Rahul Sharma',
          author_username: 'rahul_s',
          author_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
          content: 'Such a peaceful view! Have a wonderful weekend 🙌',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
      ],
    };
  });

  // User Directory state
  const [allUsers] = useState<Profile[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_DIRECTORY_USERS;
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
    return ['usr_ananya', 'usr_rahul'];
  });

  const [pendingSentFriendIds, setPendingSentFriendIds] = useState<string[]>([]);
  const [pendingReceivedFriendIds, setPendingReceivedFriendIds] = useState<string[]>(['usr_arjun']);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTIFS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
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
    return {
      thread_couple: [
        {
          id: 'dm_init_1',
          thread_id: 'thread_couple',
          sender_id: 'partner',
          sender_name: 'My Love',
          sender_username: 'sweetheart',
          content: 'Hey babe! Can’t wait for dinner later tonight ❤️',
          type: 'text',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        },
      ],
      thread_usr_ananya: [
        {
          id: 'dm_init_2',
          thread_id: 'thread_usr_ananya',
          sender_id: 'usr_ananya',
          sender_name: 'Ananya Verma',
          sender_username: 'ananya_v',
          sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: 'Hey! Loved the photos you posted earlier ✨',
          type: 'text',
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
      ],
      thread_usr_rahul: [
        {
          id: 'dm_init_3',
          thread_id: 'thread_usr_rahul',
          sender_id: 'usr_rahul',
          sender_name: 'Rahul Sharma',
          sender_username: 'rahul_s',
          sender_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
          content: 'Yo! Are we meeting for coffee this Sunday? ☕',
          type: 'text',
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
      ],
    };
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>('thread_couple');
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);

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

  // Feed Post Actions
  const createPost = (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    tag?: string | null
  ) => {
    const newPost: FeedPost = {
      id: 'post_' + Date.now(),
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
      created_at: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
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
  };

  const acceptFriendRequest = (targetUserId: string) => {
    setPendingReceivedFriendIds((prev) => prev.filter((id) => id !== targetUserId));
    setFriends((prev) => (prev.includes(targetUserId) ? prev : [...prev, targetUserId]));
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

  // Direct relationship proposal
  const sendDirectRelationshipProposal = async (
    targetUserId: string,
    type: RelationshipType
  ): Promise<{ success: boolean; message: string }> => {
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    const partnerDisplayName = targetUser?.display_name || 'Partner';

    await createSpace(type, partnerDisplayName, new Date().toISOString().slice(0, 10));

    if (!friends.includes(targetUserId)) {
      setFriends((prev) => [...prev, targetUserId]);
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    return {
      success: true,
      message: `You and @${targetUser?.username || 'partner'} are now connected in a ${type} space!`,
    };
  };

  const openUserProfile = (userId: string) => {
    setSelectedUserProfileId(userId);
  };

  const closeUserProfile = () => {
    setSelectedUserProfileId(null);
  };

  const updateMyProfile = (updates: Partial<Profile>) => {
    updateProfile(updates);
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
      await sendDirectRelationshipProposal(notif.from_user_id, 'couple');
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

  // Direct Threads computation
  const directThreads = useMemo<DirectChatThread[]>(() => {
    const list: DirectChatThread[] = [];

    // 1. Partner Couple thread (always top priority if partner or mock partner exists)
    const partnerInfo: Profile = partnerProfile || {
      id: 'partner',
      email: 'partner@4ever.app',
      username: 'sweetheart',
      display_name: 'My Love',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_online: true,
      relationship_role: 'girlfriend',
      relationship_partner_username: profile?.username || 'me',
    };

    const coupleMsgs = dmStore['thread_couple'] || [];
    const lastCoupleMsg = coupleMsgs.length > 0 ? coupleMsgs[coupleMsgs.length - 1] : null;

    list.push({
      id: 'thread_couple',
      participant: partnerInfo,
      is_couple: true,
      couple_role: (partnerInfo.relationship_role as any) || 'girlfriend',
      last_message: lastCoupleMsg,
      unread_count: 0,
    });

    // 2. Friends threads
    for (const friendId of friends) {
      const friendProfile = allUsers.find((u) => u.id === friendId);
      if (!friendProfile) continue;

      const threadId = `thread_${friendId}`;
      const msgs = dmStore[threadId] || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const unread = msgs.filter((m) => !m.is_read && m.sender_id !== (user?.id || 'me')).length;

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
  }, [partnerProfile, dmStore, friends, allUsers, profile, user]);

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

    const newMsg: DirectChatMessage = {
      id: 'dm_msg_' + Date.now(),
      thread_id: threadId,
      sender_id: user?.id || 'me',
      sender_name: profile?.display_name || 'My Name',
      sender_username: profile?.username || 'me',
      sender_avatar: profile?.avatar_url || null,
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

    // Simulate smart partner response in couple thread
    if (threadId === 'thread_couple') {
      setTimeout(() => {
        const responses = [
          'Aww love you so much! ❤️',
          'Thinking about you too baby 🥰',
          'Can’t wait to see you soon! ✨',
          'Sending you a big warm hug 🤗❤️',
        ];
        const randomReply = responses[Math.floor(Math.random() * responses.length)];
        const replyMsg: DirectChatMessage = {
          id: 'dm_reply_' + Date.now(),
          thread_id: 'thread_couple',
          sender_id: partnerProfile?.id || 'partner',
          sender_name: partnerProfile?.display_name || 'My Love',
          sender_username: partnerProfile?.username || 'sweetheart',
          sender_avatar: partnerProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: randomReply,
          type: 'text',
          is_read: true,
          created_at: new Date().toISOString(),
        };
        setDmStore((prev) => ({
          ...prev,
          thread_couple: [...(prev['thread_couple'] || []), replyMsg],
        }));
      }, 1400);
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
