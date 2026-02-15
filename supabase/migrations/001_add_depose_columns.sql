-- ============================================
-- Migration: Ajout colonnes depose/date_depot sur reglements
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================

-- Ajout des colonnes
ALTER TABLE reglements ADD COLUMN IF NOT EXISTS depose BOOLEAN DEFAULT false;
ALTER TABLE reglements ADD COLUMN IF NOT EXISTS date_depot DATE;
