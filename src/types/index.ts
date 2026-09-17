export type RelationshipType = 'couple' | 'bestfriends' | 'siblings';
export type RelationshipStatus = 'pending' | 'active' | 'paused' | 'disconnected';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type MessageType = 'text' | 'image' | 'location' | 'audio' | 'system_event';

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
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
