-- ============================================================
-- CORREÇÃO FINAL: Desabilitar RLS + Colunas Faltantes
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 🔓 DESABILITAR RLS TEMPORARIAMENTE (para permitir migração)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE arenas DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards DISABLE ROW LEVEL SECURITY;

-- Tabelas por arena
ALTER TABLE quadras DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservas DISABLE ROW LEVEL SECURITY;
ALTER TABLE alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE professores DISABLE ROW LEVEL SECURITY;
ALTER TABLE turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE torneios DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE rental_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE duration_discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE atletas_aluguel DISABLE ROW LEVEL SECURITY;
ALTER TABLE planos_aula DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_point_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE redeemed_vouchers DISABLE ROW LEVEL SECURITY;

-- 📋 ADICIONAR COLUNAS FALTANTES

-- Quadras
ALTER TABLE quadras ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Turmas
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS start_time TIME;

-- Torneios
ALTER TABLE torneios ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- Products - permitir NULL em stock temporariamente
ALTER TABLE products ALTER COLUMN stock DROP NOT NULL;

-- ✅ Pronto! Agora você pode migrar sem erros de RLS

-- ⚠️ IMPORTANTE: Após a migração, reative o RLS:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE arenas ENABLE ROW LEVEL SECURITY;
-- ... (faça isso depois de confirmar que a migração funcionou)

-- Colunas adicionais que estavam faltando
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS "originalCreditUsed" NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS original_credit_used NUMERIC DEFAULT 0;

ALTER TABLE torneios ADD COLUMN IF NOT EXISTS quadras_ids JSONB DEFAULT '[]'::jsonb;
