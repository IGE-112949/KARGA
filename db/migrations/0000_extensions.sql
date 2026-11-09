-- Extensões necessárias: PostGIS (localização) e btree_gist (constraint de exclusão das reservas).
-- Instaladas no schema "extensions" (convenção do Supabase).
CREATE SCHEMA IF NOT EXISTS extensions;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
