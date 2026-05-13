-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create database if not exists (Postgres will already have fansly_crm from env)
SELECT 'Database fansly_crm ready' as status;