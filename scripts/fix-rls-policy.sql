-- Disable RLS Policy Completely
-- Run this in your Supabase SQL Editor to disable all security

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations for anon users" ON public.generated_images;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.generated_images;

-- Disable Row Level Security completely
ALTER TABLE public.generated_images DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'generated_images';
