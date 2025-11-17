-- ============================================================
-- CORREÇÃO ADICIONAL: Colunas Faltantes
-- Execute este script no Supabase Dashboard > SQL Editor
-- ============================================================

-- Adicionar colunas faltantes em reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS "clientPhone" TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Adicionar colunas faltantes em turmas
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS end_time TIME;

-- Adicionar colunas faltantes em torneios
ALTER TABLE torneios ADD COLUMN IF NOT EXISTS end_time TIME;

-- Corrigir gamification_settings: adicionar id como primary key
ALTER TABLE gamification_settings DROP CONSTRAINT IF EXISTS gamification_settings_pkey;
ALTER TABLE gamification_settings ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE gamification_settings ADD PRIMARY KEY (id);

-- ✅ Pronto! Todas as colunas faltantes foram adicionadas
