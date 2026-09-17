import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { FeedPost, PostComment, Profile, RelationshipType } from '../types';
import { useAuth } from './AuthContext';
import { useRelationship } from './RelationshipContext';

interface SocialContextType {
  posts: FeedPost[];
  createPost: (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null, tag?: string | null) => void;
  deletePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  getComments: (postId: string) => PostComment[];
  addComment: (postId: string, content: string) => void;
  allUsers: Profile[];
  searchUsers: (query: string) => Profile[];
  friends: string[]; // array of user IDs
  pendingSentFriendIds: string[];
  pendingReceivedFriendIds: string[];
  sendFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (targetUserId: string) => void;
  declineFriendRequest: (targetUserId: string) => void;
  getFriendshipStatus: (targetUserId: string) => 'none' | 'pending_sent' | 'pending_received' | 'friends';
  sendDirectRelationshipProposal: (targetUserId: string, type: RelationshipType) => Promise<{ success: boolean; message: string }>;
  updateMyProfile: (updates: Partial<Profile>) => void;
  userPosts: (userId: string) => FeedPost[];
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

const LOCAL_STORAGE_POSTS = '4ever_social_posts_v2';
const LOCAL_STORAGE_COMMENTS = '4ever_social_comments_v2';
const LOCAL_STORAGE_FRIENDS = '4ever_social_friends_v2';
const LOCAL_STORAGE_USERS = '4ever_social_directory_v2';

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

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const { createSpace } = useRelationship();

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_POSTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_FEED_POSTS;
  });

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

  const [allUsers] = useState<Profile[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_DIRECTORY_USERS;
  });

  const [friends, setFriends] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FRIENDS);
      if (stored) return JSON.parse(stored).friends || ['usr_ananya'];
    } catch {
      // ignore
    }
    return ['usr_ananya'];
  });

  const [pendingSentFriendIds, setPendingSentFriendIds] = useState<string[]>([]);
  const [pendingReceivedFriendIds, setPendingReceivedFriendIds] = useState<string[]>(['usr_priya']);

  // Sync to localStorage
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

  // Create a new post
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

  const getComments = useCallback((postId: string): PostComment[] => {
    return comments[postId] || [];
  }, [comments]);

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

  const getFriendshipStatus = useCallback(
    (targetUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'friends' => {
      if (friends.includes(targetUserId)) return 'friends';
      if (pendingSentFriendIds.includes(targetUserId)) return 'pending_sent';
      if (pendingReceivedFriendIds.includes(targetUserId)) return 'pending_received';
      return 'none';
    },
    [friends, pendingSentFriendIds, pendingReceivedFriendIds]
  );

  // 1-Click Code-less Relationship linking
  const sendDirectRelationshipProposal = async (
    targetUserId: string,
    type: RelationshipType
  ): Promise<{ success: boolean; message: string }> => {
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    const partnerDisplayName = targetUser?.display_name || 'Partner';

    // Direct connect: Create space immediately with the targeted user
    await createSpace(type, partnerDisplayName, new Date().toISOString().slice(0, 10));

    // Also automatically make them friends if not already
    if (!friends.includes(targetUserId)) {
      setFriends((prev) => [...prev, targetUserId]);
    }

    return {
      success: true,
      message: `You and @${targetUser?.username || 'partner'} are now connected in a ${type} space!`,
    };
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

  return (
    <SocialContext.Provider
      value={{
        posts,
        createPost,
        deletePost,
        toggleLike,
        getComments,
        addComment,
        allUsers,
        searchUsers,
        friends,
        pendingSentFriendIds,
        pendingReceivedFriendIds,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        getFriendshipStatus,
        sendDirectRelationshipProposal,
        updateMyProfile,
        userPosts,
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
