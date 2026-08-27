-- ====================================================================
-- ANGEL STAGE 2: VOICE ARCHITECTURE DATABASE MIGRATION
-- Target: Supabase (PostgreSQL with Row Level Security)
-- ====================================================================

-- 1. USER VOICE PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_voice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL DEFAULT 'unique',
  language TEXT NOT NULL DEFAULT 'auto',
  regional_accent TEXT DEFAULT 'automatic',
  speaking_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  emotion_delivery TEXT NOT NULL DEFAULT 'natural',
  auto_language_detection BOOLEAN NOT NULL DEFAULT TRUE,
  captions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for voice preferences
ALTER TABLE public.user_voice_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice preferences"
  ON public.user_voice_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice preferences"
  ON public.user_voice_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice preferences"
  ON public.user_voice_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice preferences"
  ON public.user_voice_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 2. VOICE SESSIONS METADATA TABLE (Optional audit/history)
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL DEFAULT 'unique',
  language TEXT NOT NULL DEFAULT 'auto',
  turns_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for voice sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions"
  ON public.voice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions"
  ON public.voice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions"
  ON public.voice_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
