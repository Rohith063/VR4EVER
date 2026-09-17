-- ==============================================================================
-- 4EVER PLATFORM DATABASE SCHEMA & ROW LEVEL SECURITY POLICIES
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM ('couple', 'bestfriends', 'siblings');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE relationship_status AS ENUM ('pending', 'active', 'paused', 'disconnected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'location', 'audio', 'system_event');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RELATIONSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relation_type relationship_type NOT NULL DEFAULT 'couple',
    status relationship_status NOT NULL DEFAULT 'active',
    start_date DATE,
    custom_nickname_1 TEXT,
    custom_nickname_2 TEXT,
    budget_limit NUMERIC(12,2) DEFAULT 5000.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_pair UNIQUE (user_1, user_2)
);

-- 4. RELATIONSHIP REQUESTS (PAIRING / FRIEND REQUESTS)
CREATE TABLE IF NOT EXISTS public.relationship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relation_type relationship_type NOT NULL DEFAULT 'couple',
    start_date DATE,
    message TEXT,
    pair_code TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. REAL-TIME CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type message_type NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_relationship ON public.messages(relationship_id, created_at DESC);

-- 6. LIVE GEOLOCATION & CHECK-INS
CREATE TABLE IF NOT EXISTS public.user_locations (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    battery_level INTEGER,
    is_sharing BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. MEMORIES & STORIES JOURNAL
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    story TEXT,
    tag TEXT DEFAULT 'Memory',
    memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photos TEXT[] DEFAULT '{}',
    location_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EXPENSES & SPLIT CALCULATOR
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    category TEXT NOT NULL,
    split_type TEXT DEFAULT 'equal',
    receipt_url TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. MILESTONES & TRIP GOALS
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    milestone_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(10,2) NOT NULL,
    saved_amount NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. STUDY PLANNER
CREATE TABLE IF NOT EXISTS public.study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    duration TEXT DEFAULT '30min',
    category TEXT DEFAULT 'today',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. CALENDAR MARKS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL,
    note TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_date_relationship UNIQUE (relationship_id, event_date)
);

-- 12. STICKY NOTES BOARD
CREATE TABLE IF NOT EXISTS public.sticky_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    color TEXT DEFAULT 'golden',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a member of the relationship
CREATE OR REPLACE FUNCTION public.is_relationship_member(rel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.relationships
        WHERE id = rel_id AND (user_1 = auth.uid() OR user_2 = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: anyone authenticated can view profiles, users can update their own
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Relationships: visible only to the 2 partners
CREATE POLICY "Users can view their own relationships" ON public.relationships
    FOR SELECT TO authenticated USING (user_1 = auth.uid() OR user_2 = auth.uid());

CREATE POLICY "Users can insert relationships" ON public.relationships
    FOR INSERT TO authenticated WITH CHECK (user_1 = auth.uid() OR user_2 = auth.uid());

CREATE POLICY "Users can update their own relationships" ON public.relationships
    FOR UPDATE TO authenticated USING (user_1 = auth.uid() OR user_2 = auth.uid());

CREATE POLICY "Users can delete their own relationships" ON public.relationships
    FOR DELETE TO authenticated USING (user_1 = auth.uid() OR user_2 = auth.uid());

-- Requests: visible to sender and receiver
CREATE POLICY "Users can view their requests" ON public.relationship_requests
    FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create requests" ON public.relationship_requests
    FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update requests directed to them" ON public.relationship_requests
    FOR UPDATE TO authenticated USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- Relationship child tables policies (Messages, Expenses, Memories, Study, Notes, etc.)
CREATE POLICY "Relationship members can manage messages" ON public.messages
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage locations" ON public.user_locations
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage memories" ON public.memories
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage expenses" ON public.expenses
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage milestones" ON public.milestones
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage goals" ON public.goals
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage study tasks" ON public.study_tasks
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage calendar events" ON public.calendar_events
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

CREATE POLICY "Relationship members can manage sticky notes" ON public.sticky_notes
    FOR ALL TO authenticated USING (is_relationship_member(relationship_id));

-- Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    derived_username TEXT;
BEGIN
    derived_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 4));
    INSERT INTO public.profiles (id, email, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        derived_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Realtime replication for messages, locations, and sticky notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sticky_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.relationship_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.relationships;
