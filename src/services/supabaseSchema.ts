export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- ANGEL SUPABASE SCHEMA DEFINITIONS (STAGE 3 — PERSISTENT MEMORY & CONTEXT)
-- Run this in your Supabase SQL Editor to enable full cloud persistence & memory
-- ==============================================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"theme": "system", "language": "en", "intelligence_level": "standard"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create long-term memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'preference', -- 'identity'|'preference'|'communication'|'project'|'work'|'education'|'interest'|'routine'|'goal'|'decision'|'relationship'|'technical'|'task'|'other'
  confidence TEXT NOT NULL DEFAULT 'high', -- 'high'|'medium'|'low'
  importance TEXT NOT NULL DEFAULT 'normal', -- 'low'|'normal'|'high'|'critical'
  source TEXT NOT NULL DEFAULT 'user_explicit', -- 'user_explicit'|'conversation'|'profile'|'project'|'system'|'imported_data'
  expiration_type TEXT NOT NULL DEFAULT 'persistent', -- 'persistent'|'temporary'|'expiring'|'session_only'
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  conversation_id TEXT,
  project_id TEXT,
  last_used_at TIMESTAMPTZ,
  last_confirmed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active', -- 'active'|'completed'|'paused'|'archived'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create project memories table
CREATE TABLE IF NOT EXISTS public.project_memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'decision', -- 'purpose'|'goal'|'decision'|'milestone'|'technical'|'note'
  importance TEXT NOT NULL DEFAULT 'normal',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create conversation summaries table
CREATE TABLE IF NOT EXISTS public.conversation_summaries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  user_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  decisions_made TEXT[] DEFAULT ARRAY[]::TEXT[],
  unresolved_questions TEXT[] DEFAULT ARRAY[]::TEXT[],
  key_facts TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id TEXT PRIMARY KEY,
  memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_extract_memory BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_name TEXT,
  communication_style TEXT NOT NULL DEFAULT 'balanced', -- 'concise'|'balanced'|'detailed'|'direct'
  custom_instructions TEXT,
  occupation TEXT,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- STAGE 4: TOOL ECOSYSTEM, CAPABILITIES & WORKSPACE ITEMS
-- ==============================================================================

-- 9. Create task runs table (Multi-step capability execution)
CREATE TABLE IF NOT EXISTS public.task_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- 'running'|'completed'|'failed'|'cancelled'
  steps JSONB DEFAULT '[]'::jsonb,
  active_step_index INTEGER NOT NULL DEFAULT 0,
  selected_tools TEXT[] DEFAULT ARRAY[]::TEXT[],
  output_artifacts JSONB DEFAULT '[]'::jsonb,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  side_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Create tool calls & results log table
CREATE TABLE IF NOT EXISTS public.tool_calls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_run_id TEXT REFERENCES public.task_runs(id) ON DELETE SET NULL,
  conversation_id TEXT,
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed', -- 'running'|'completed'|'failed'|'cancelled'
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Create tool permissions & access control table
CREATE TABLE IF NOT EXISTS public.tool_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'prompt', -- 'granted'|'temporary'|'prompt'|'denied'|'revoked'|'expired'
  granted_scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  access_type TEXT NOT NULL DEFAULT 'none', -- 'temporary'|'persistent'|'none'
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- 12. Create connected services table
CREATE TABLE IF NOT EXISTS public.connected_services (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_connected', -- 'connected'|'not_connected'|'needs_auth'|'unavailable'
  account_email TEXT,
  account_name TEXT,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  granted_scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  access_type TEXT NOT NULL DEFAULT 'none',
  last_used TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, id)
);

-- 13. Create workspace artifacts & generated items table
CREATE TABLE IF NOT EXISTS public.workspace_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  conversation_id TEXT REFERENCES public.conversations(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'document'|'code'|'spreadsheet'|'research'|'image'|'diagram'|'presentation'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_items ENABLE ROW LEVEL SECURITY;

-- 15. Create RLS Policies
DROP POLICY IF EXISTS "Public & User conversations policy" ON public.conversations;
CREATE POLICY "Public & User conversations policy" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User messages policy" ON public.messages;
CREATE POLICY "Public & User messages policy" ON public.messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User profiles policy" ON public.profiles;
CREATE POLICY "Public & User profiles policy" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User memories policy" ON public.memories;
CREATE POLICY "Public & User memories policy" ON public.memories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User projects policy" ON public.projects;
CREATE POLICY "Public & User projects policy" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User project_memories policy" ON public.project_memories;
CREATE POLICY "Public & User project_memories policy" ON public.project_memories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User conversation_summaries policy" ON public.conversation_summaries;
CREATE POLICY "Public & User conversation_summaries policy" ON public.conversation_summaries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User user_preferences policy" ON public.user_preferences;
CREATE POLICY "Public & User user_preferences policy" ON public.user_preferences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User task_runs policy" ON public.task_runs;
CREATE POLICY "Public & User task_runs policy" ON public.task_runs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User tool_calls policy" ON public.tool_calls;
CREATE POLICY "Public & User tool_calls policy" ON public.tool_calls FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User tool_permissions policy" ON public.tool_permissions;
CREATE POLICY "Public & User tool_permissions policy" ON public.tool_permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User connected_services policy" ON public.connected_services;
CREATE POLICY "Public & User connected_services policy" ON public.connected_services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & User workspace_items policy" ON public.workspace_items;
CREATE POLICY "Public & User workspace_items policy" ON public.workspace_items FOR ALL USING (true) WITH CHECK (true);

-- 16. Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_memories_user_active ON public.memories(user_id, is_active, category);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON public.memories(user_id, importance, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_project_memories_project ON public.project_memories(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conv ON public.conversation_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_task_runs_conv ON public.task_runs(conversation_id, status);
CREATE INDEX IF NOT EXISTS idx_tool_calls_user ON public.tool_calls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_items_user ON public.workspace_items(user_id, created_at DESC);

`;
