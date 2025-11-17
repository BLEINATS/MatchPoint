-- ============================================================
-- CORREÇÕES DO SCHEMA SUPABASE
-- Execute este script no Supabase Dashboard > SQL Editor
-- ============================================================

-- Adicionar colunas faltantes nas tabelas globais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar colunas faltantes em quadras
ALTER TABLE quadras ADD COLUMN IF NOT EXISTS pricing_rules JSONB DEFAULT '[]'::jsonb;

-- Adicionar colunas faltantes em reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Adicionar colunas faltantes em alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Corrigir tipos UUID em professores, notificacoes, products, credit_transactions
-- (O problema é que arena_id está como TEXT, precisa ser UUID)
-- Estas tabelas já têm arena_id como UUID, então não precisa alterar

-- Adicionar colunas faltantes em turmas
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS "daysOfWeek" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS days_of_week JSONB DEFAULT '[]'::jsonb;

-- Adicionar colunas faltantes em torneios
ALTER TABLE torneios ADD COLUMN IF NOT EXISTS end_date DATE;

-- Adicionar colunas faltantes nas tabelas de gamificação
ALTER TABLE gamification_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gamification_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE gamification_levels ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gamification_levels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE gamification_rewards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gamification_rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE gamification_achievements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gamification_achievements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas com updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_arenas_updated_at ON arenas;
CREATE TRIGGER update_arenas_updated_at BEFORE UPDATE ON arenas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alunos_updated_at ON alunos;
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_settings_updated_at ON gamification_settings;
CREATE TRIGGER update_gamification_settings_updated_at BEFORE UPDATE ON gamification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_levels_updated_at ON gamification_levels;
CREATE TRIGGER update_gamification_levels_updated_at BEFORE UPDATE ON gamification_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_rewards_updated_at ON gamification_rewards;
CREATE TRIGGER update_gamification_rewards_updated_at BEFORE UPDATE ON gamification_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_achievements_updated_at ON gamification_achievements;
CREATE TRIGGER update_gamification_achievements_updated_at BEFORE UPDATE ON gamification_achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ Pronto! Agora o schema está compatível com o localStorage
