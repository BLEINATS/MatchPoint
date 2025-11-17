-- ================================================
-- FIX DATABASE SCHEMA - MATCHPLAY
-- ================================================
-- Corrige todas as incompatibilidades e insere dados padrões
-- Criado: 2025-11-17

-- ================================================
-- 1. ADICIONAR COLUNAS FALTANTES
-- ================================================

-- Adicionar created_at em plans e subscriptions (se não existir)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar recurringEndDate em reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS recurringEndDate DATE;

-- Tornar client_name opcional em reservas (para reservas de aula)
ALTER TABLE reservas ALTER COLUMN client_name DROP NOT NULL;

-- Tornar schedule opcional em turmas
ALTER TABLE turmas ALTER COLUMN schedule DROP NOT NULL;

-- ================================================
-- 2. CRIAR TABELAS FALTANTES
-- ================================================

-- Torneios
CREATE TABLE IF NOT EXISTS torneios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('torneio', 'campeonato', 'clinica', 'evento_especial')),
  status TEXT NOT NULL CHECK (status IN ('planejado', 'inscricoes_abertas', 'em_andamento', 'concluido', 'cancelado')),
  modality TEXT NOT NULL CHECK (modality IN ('individual', 'duplas', 'equipes')),
  team_size INTEGER,
  description TEXT,
  categories JSONB DEFAULT '[]'::jsonb,
  participants JSONB DEFAULT '[]'::jsonb,
  matches JSONB DEFAULT '[]'::jsonb,
  expenses JSONB DEFAULT '[]'::jsonb,
  sponsors JSONB DEFAULT '[]'::jsonb,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_torneios_arena_id ON torneios(arena_id);
CREATE INDEX IF NOT EXISTS idx_torneios_status ON torneios(status);

-- Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('festa', 'corporativo', 'aniversario', 'show', 'outro')),
  status TEXT NOT NULL CHECK (status IN ('orcamento', 'pendente', 'confirmado', 'realizado', 'concluido', 'cancelado')),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  court_start_time TIME,
  court_end_time TIME,
  expected_guests INTEGER NOT NULL,
  charge_per_guest BOOLEAN DEFAULT false,
  price_per_guest DECIMAL(10,2),
  quadras_ids UUID[] DEFAULT ARRAY[]::UUID[],
  additional_spaces TEXT[] DEFAULT ARRAY[]::TEXT[],
  services JSONB DEFAULT '[]'::jsonb,
  total_price DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  final_price DECIMAL(10,2),
  final_price_paid BOOLEAN DEFAULT false,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_arena_id ON eventos(arena_id);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);

-- Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_arena_id ON notificacoes(arena_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_read ON notificacoes(read);

-- Products (Loja)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_arena_id ON products(arena_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_arena_id ON credit_transactions(arena_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_aluno_id ON credit_transactions(aluno_id);

-- Gamification Settings
CREATE TABLE IF NOT EXISTS gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  points_per_reservation DECIMAL(10,2) DEFAULT 10,
  points_per_real_spent DECIMAL(10,2) DEFAULT 1,
  points_per_referral DECIMAL(10,2) DEFAULT 50,
  points_per_tournament_participation DECIMAL(10,2) DEFAULT 25,
  points_per_tournament_win DECIMAL(10,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_settings_arena_id ON gamification_settings(arena_id);

-- Gamification Levels
CREATE TABLE IF NOT EXISTS gamification_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_points DECIMAL(10,2) NOT NULL,
  icon TEXT,
  color TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_levels_arena_id ON gamification_levels(arena_id);

-- Gamification Rewards
CREATE TABLE IF NOT EXISTS gamification_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_cost DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discount', 'free_court', 'product', 'other')),
  value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_rewards_arena_id ON gamification_rewards(arena_id);

-- Gamification Achievements
CREATE TABLE IF NOT EXISTS gamification_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_reward DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_achievements_arena_id ON gamification_achievements(arena_id);

-- Aluno Achievements
CREATE TABLE IF NOT EXISTS aluno_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aluno_achievements_aluno_id ON aluno_achievements(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_achievements_achievement_id ON aluno_achievements(achievement_id);

-- Gamification Point Transactions
CREATE TABLE IF NOT EXISTS gamification_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  points DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_point_transactions_arena_id ON gamification_point_transactions(arena_id);
CREATE INDEX IF NOT EXISTS idx_gamification_point_transactions_aluno_id ON gamification_point_transactions(aluno_id);

-- Redeemed Vouchers
CREATE TABLE IF NOT EXISTS redeemed_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES gamification_rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_redeemed_vouchers_arena_id ON redeemed_vouchers(arena_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_vouchers_aluno_id ON redeemed_vouchers(aluno_id);

-- Finance Transactions
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_arena_id ON finance_transactions(arena_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date);

-- ================================================
-- 3. INSERIR DADOS PADRÕES
-- ================================================

-- Inserir Planos de Aula Padrões (apenas se não existirem)
-- Nota: Estes serão inseridos automaticamente pelo código quando o admin acessar a aba
-- Mas vamos garantir que a estrutura está correta

-- ================================================
-- 4. VERIFICAÇÃO FINAL
-- ================================================

-- Listar todas as tabelas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
