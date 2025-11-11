-- Add current_session_id column to users table for session management
ALTER TABLE "users" ADD COLUMN "current_session_id" text;
