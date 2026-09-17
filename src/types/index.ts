export type RelationshipType = 'couple' | 'bestfriends' | 'siblings';
export type RelationshipStatus = 'pending' | 'active' | 'paused' | 'disconnected';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'system_event';

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  posts_count?: number;
  friends_count?: number;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
  relationship_partner_username?: string | null;
  relationship_partner_name?: string | null;
  relationship_role?: 'girlfriend' | 'boyfriend' | 'partner' | null;
  is_private_account?: boolean;
}

export interface Relationship {
  id: string;
  user_1: string;
  user_2: string;
  relation_type: RelationshipType;
  status: RelationshipStatus;
  start_date: string;
  custom_nickname_1?: string | null;
  custom_nickname_2?: string | null;
  budget_limit: number;
  created_at: string;
  updated_at?: string;
}

export interface RelationshipRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  relation_type: RelationshipType;
  start_date?: string;
  message?: string;
  pair_code?: string;
  status: RequestStatus;
  created_at: string;
  sender_profile?: Profile;
  receiver_profile?: Profile;
}

export interface Message {
  id: string;
  relationship_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  media_url?: string | null;
  metadata?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    duration?: number;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  } | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface UserLocation {
  user_id: string;
  relationship_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery_level?: number;
  is_sharing: boolean;
  updated_at: string;
}

export interface Memory {
  id: string;
  relationship_id: string;
  created_by: string;
  title: string;
  story: string;
  tag: string;
  memory_date: string;
  photos: string[];
  location_name?: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  relationship_id: string;
  paid_by: string; // user id or 'A' | 'B' | 'both'
  title: string;
  amount: number;
  category: 'food' | 'chai' | 'transport' | 'auto' | 'groceries' | 'fun' | 'books' | 'trip' | 'other';
  split_type: 'equal' | 'full_a' | 'full_b';
  expense_date: string;
  receipt_url?: string | null;
  created_at?: string;
}

export interface Milestone {
  id: string;
  relationship_id: string;
  title: string;
  milestone_date?: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  relationship_id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  created_at?: string;
}

export interface StudyTask {
  id: string;
  relationship_id: string;
  assigned_to?: string | null; // null = both
  title: string;
  duration: '30min' | '1hr' | '2hr' | 'flex';
  category: 'today' | 'tomorrow' | 'week';
  is_completed: boolean;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  relationship_id: string;
  event_date: string; // YYYY-MM-DD
  event_type: 'college' | 'date' | 'special';
  note?: string;
  created_by?: string;
  created_at?: string;
}

export interface StickyNote {
  id: string;
  relationship_id: string;
  author_id: string;
  author_name: string;
  content: string;
  color: 'golden' | 'rose' | 'sky' | 'mint';
  is_pinned?: boolean;
  created_at: string;
}

export interface AppLockConfig {
  isEnabled: boolean;
  pin: string;
  autoLockMinutes: number;
}

export interface StorageStats {
  imagesMB: number;
  videosMB: number;
  audioMB: number;
  docsMB: number;
  totalMB: number;
  limitMB: number;
}

export type StaffRole = 'super_admin' | 'operations' | 'moderator' | 'support';

export interface StaffMemberRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
  avatar?: string | null;
  permissions: string[];
  status: 'active' | 'suspended';
  created_at: string;
  last_login?: string;
}

export interface AdminUserRecord {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  role: 'user' | 'staff' | 'admin';
  relationship_id?: string | null;
  partner_name?: string | null;
  storage_used_mb: number;
  storage_limit_mb: number;
  is_online: boolean;
  is_banned?: boolean;
  last_seen: string;
  created_at: string;
}

export interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar?: string | null;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  likes_count: number;
  is_liked_by_me: boolean;
  comments_count: number;
  tag?: string | null;
  visibility?: 'public' | 'private' | 'friends';
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar?: string | null;
  content: string;
  created_at: string;
}

export interface FriendshipRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface DirectusAssetRecord {
  id: string;
  title: string;
  filename: string;
  filesize_kb: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  url: string;
}

export interface DirectChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string | null;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'location';
  media_url?: string | null;
  metadata?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    audio_duration?: number;
  };
  is_read: boolean;
  created_at: string;
}

export interface DirectChatThread {
  id: string;
  participant: Profile;
  is_couple: boolean;
  couple_role?: 'girlfriend' | 'boyfriend' | 'partner';
  last_message?: DirectChatMessage | null;
  unread_count: number;
}

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'couple_request' | 'like' | 'comment';
  from_user_id: string;
  from_user_name: string;
  from_user_username: string;
  from_user_avatar?: string | null;
  content: string;
  created_at: string;
  is_read: boolean;
  request_status?: 'pending' | 'accepted' | 'declined';
  request_id?: string;
}

