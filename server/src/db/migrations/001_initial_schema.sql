-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  org_id uuid NOT NULL REFERENCES organizations(id),
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  tier text NOT NULL CHECK (tier IN ('creator', 'pro', 'team', 'enterprise')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  org_id uuid NOT NULL REFERENCES organizations(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'research', 'prompting', 'analysis', 'complete')),
  artist_name text,
  concept jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Concept Conversations table
CREATE TABLE concept_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  messages jsonb DEFAULT '[]',
  extracted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Instrument1 Reports table
CREATE TABLE instrument1_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  version integer DEFAULT 1,
  report jsonb DEFAULT '{}',
  confidence jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Instrument2 Prompts table
CREATE TABLE instrument2_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  report_id uuid REFERENCES instrument1_reports(id),
  version integer DEFAULT 1,
  style_profile jsonb DEFAULT '{}',
  vocalist_persona jsonb DEFAULT '{}',
  tracks jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Instrument3 Analyses table
CREATE TABLE instrument3_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  report_id uuid REFERENCES instrument1_reports(id),
  track_title text,
  audio_file_key text,
  analysis jsonb DEFAULT '{}',
  success_score jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  target_alignment jsonb,
  created_at timestamptz DEFAULT now()
);

-- Audio Files table
CREATE TABLE audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  user_id uuid NOT NULL REFERENCES users(id),
  filename text NOT NULL,
  storage_key text NOT NULL,
  format text NOT NULL,
  duration_ms integer,
  file_size_bytes bigint,
  features jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_concept_conversations_project_id ON concept_conversations(project_id);
CREATE INDEX idx_instrument1_reports_project_id ON instrument1_reports(project_id);
CREATE INDEX idx_instrument2_prompts_project_id ON instrument2_prompts(project_id);
CREATE INDEX idx_instrument2_prompts_report_id ON instrument2_prompts(report_id);
CREATE INDEX idx_instrument3_analyses_project_id ON instrument3_analyses(project_id);
CREATE INDEX idx_instrument3_analyses_report_id ON instrument3_analyses(report_id);
CREATE INDEX idx_audio_files_project_id ON audio_files(project_id);
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
