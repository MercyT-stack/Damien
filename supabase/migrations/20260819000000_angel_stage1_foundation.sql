-- ====================================================================
-- ANGEL STAGE 1: FOUNDATION DATABASE MIGRATION
-- Target: Supabase (PostgreSQL with Row Level Security)
-- ====================================================================

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"theme": "system", "language": "en", "intelligence_level": "standard"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Message policies
CREATE POLICY "Users can view messages of their own conversations"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages into their own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- 4. MEMORIES ARCHITECTURE FOUNDATION (Prepared for Stage 2+)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  confidence NUMERIC(3, 2) DEFAULT 1.00,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for memories
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(category);

-- Enable RLS for memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
  ON public.memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.memories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.memories FOR DELETE
  USING (auth.uid() = user_id);

-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, display_name, preferences)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '{"theme": "system", "language": "en", "intelligence_level": "standard"}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
