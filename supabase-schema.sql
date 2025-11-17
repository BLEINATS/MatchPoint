-- ================================================
-- MATCHPLAY - SUPABASE DATABASE SCHEMA
-- ================================================
-- Complete schema for 30+ tables migrating from localStorage
-- Created: 2025-11-17

-- ================================================
-- GLOBAL TABLES
-- ================================================

-- Profiles (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('cliente', 'admin_arena', 'professor', 'atleta', 'funcionario', 'super_admin')),
  arena_id UUID,
  phone TEXT,
  client_type TEXT CHECK (client_type IN ('cliente', 'aluno', 'mensalista')),
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'nao_informado')),
  cpf TEXT,
  cpf_cnpj TEXT,
  asaas_customer_id TEXT,
  notification_preferences JSONB DEFAULT '{"game_invites": true, "friend_requests": true, "arena_news": true}'::jsonb,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_arena_id ON profiles(arena_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Credit Cards (stored separately for security)
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last4 TEXT NOT NULL,
  brand TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  asaas_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_cards_profile_id ON credit_cards(profile_id);

-- Plans (Subscription Plans for Super Admin)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  duration_days INTEGER,
  trial_days INTEGER,
  max_quadras INTEGER,
  max_team_members INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true
);

-- Arenas
CREATE TABLE IF NOT EXISTS arenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  main_image TEXT,
  cnpj_cpf TEXT,
  responsible_name TEXT,
  contact_phone TEXT,
  public_email TEXT,
  cep TEXT,
  address TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  google_maps_link TEXT,
  cancellation_policy TEXT,
  terms_of_use TEXT,
  privacy_policy TEXT,
  asaas_api_key TEXT,
  asaas_customer_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  plan_id UUID REFERENCES plans(id),
  billing_day INTEGER,
  billing_grace_period_value INTEGER,
  billing_grace_period_unit TEXT CHECK (billing_grace_period_unit IN ('hours', 'days')),
  billing_warning_1_enabled BOOLEAN DEFAULT true,
  billing_warning_2_enabled BOOLEAN DEFAULT true,
  billing_warning_3_enabled BOOLEAN DEFAULT true,
  single_booking_payment_window_minutes INTEGER,
  credit_expiration_days INTEGER,
  class_cancellation_deadline_value INTEGER,
  class_cancellation_deadline_unit TEXT CHECK (class_cancellation_deadline_unit IN ('hours', 'minutes')),
  class_booking_deadline_value INTEGER,
  class_booking_deadline_unit TEXT CHECK (class_booking_deadline_unit IN ('hours', 'minutes')),
  athlete_booking_deadline_hours INTEGER,
  athlete_cancellation_deadline_hours INTEGER,
  athlete_payment_window_minutes INTEGER,
  available_sports TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_arenas_owner_id ON arenas(owner_id);
CREATE INDEX idx_arenas_slug ON arenas(slug);
CREATE INDEX idx_arenas_status ON arenas(status);

-- Subscriptions (Arena subscriptions to plans)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  asaas_subscription_id TEXT,
  asaas_customer_id TEXT,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_arena_id ON subscriptions(arena_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX idx_friendships_user2 ON friendships(user2_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ================================================
-- ARENA-SPECIFIC TABLES
-- ================================================

-- Courts (Quadras)
CREATE TABLE IF NOT EXISTS quadras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  court_type TEXT NOT NULL,
  sports TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'manutencao')),
  description TEXT,
  rules TEXT,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  horarios JSONB NOT NULL,
  booking_duration_minutes INTEGER NOT NULL DEFAULT 60,
  capacity INTEGER,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  cover_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quadras_arena_id ON quadras(arena_id);
CREATE INDEX idx_quadras_status ON quadras(status);

-- Pricing Rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quadra_id UUID NOT NULL REFERENCES quadras(id) ON DELETE CASCADE,
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id),
  sport_type TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  price_single DECIMAL(10,2) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false
);

CREATE INDEX idx_pricing_rules_quadra_id ON pricing_rules(quadra_id);
CREATE INDEX idx_pricing_rules_arena_id ON pricing_rules(arena_id);

-- Duration Discounts
CREATE TABLE IF NOT EXISTS duration_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  duration_hours DECIMAL(4,2) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_duration_discounts_arena_id ON duration_discounts(arena_id);

-- Alunos (Students/Players)
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'nao_informado')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'experimental')),
  sport TEXT,
  level_id UUID,
  plan_id UUID,
  plan_name TEXT,
  monthly_fee DECIMAL(10,2),
  aulas_restantes INTEGER,
  aulas_agendadas JSONB DEFAULT '[]'::jsonb,
  attendance_history JSONB DEFAULT '[]'::jsonb,
  join_date DATE NOT NULL,
  avatar_url TEXT,
  credit_balance DECIMAL(10,2) DEFAULT 0,
  gamification_points INTEGER DEFAULT 0,
  gamification_level_id UUID,
  last_credit_reset_date TIMESTAMPTZ,
  asaas_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alunos_arena_id ON alunos(arena_id);
CREATE INDEX idx_alunos_profile_id ON alunos(profile_id);
CREATE INDEX idx_alunos_status ON alunos(status);

-- Aluno Levels
CREATE TABLE IF NOT EXISTS aluno_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE INDEX idx_aluno_levels_arena_id ON aluno_levels(arena_id);

-- Professores (Instructors)
CREATE TABLE IF NOT EXISTS professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  nivel_experiencia TEXT CHECK (nivel_experiencia IN ('Júnior', 'Pleno', 'Sênior')),
  metodologia TEXT,
  portfolio_url TEXT,
  comissao DECIMAL(5,2),
  pix_key TEXT,
  payment_type TEXT CHECK (payment_type IN ('por_hora', 'mensal', 'por_aula', 'por_aluno', 'percentual_aula')),
  valor_hora_aula DECIMAL(10,2),
  salario_mensal DECIMAL(10,2),
  valor_por_aula DECIMAL(10,2),
  valor_por_aluno DECIMAL(10,2),
  percentual_por_aula DECIMAL(5,2),
  ratings JSONB DEFAULT '[]'::jsonb,
  avg_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_professores_arena_id ON professores(arena_id);
CREATE INDEX idx_professores_profile_id ON professores(profile_id);

-- Atletas de Aluguel (Rental Athletes)
CREATE TABLE IF NOT EXISTS atletas_aluguel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  esportes JSONB DEFAULT '[]'::jsonb,
  nivel_tecnico TEXT CHECK (nivel_tecnico IN ('Iniciante', 'Intermediário', 'Avançado', 'Profissional')),
  experiencia_anos INTEGER,
  raio_atuacao INTEGER,
  taxa_hora DECIMAL(10,2) NOT NULL,
  comissao_arena DECIMAL(5,2) NOT NULL,
  biografia TEXT,
  certificacoes TEXT,
  palavras_chave TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'indisponivel')),
  pix_key TEXT,
  partidas_jogadas INTEGER DEFAULT 0,
  unavailability JSONB DEFAULT '[]'::jsonb,
  weekly_availability JSONB DEFAULT '[]'::jsonb,
  avg_rating DECIMAL(3,2),
  ratings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_atletas_aluguel_arena_id ON atletas_aluguel(arena_id);
CREATE INDEX idx_atletas_aluguel_status ON atletas_aluguel(status);

-- Planos de Aula
CREATE TABLE IF NOT EXISTS planos_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('avulso', 'mensal', 'trimestral', 'semestral', 'anual')),
  price DECIMAL(10,2) NOT NULL,
  num_aulas INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planos_aula_arena_id ON planos_aula(arena_id);

-- Turmas (Classes)
CREATE TABLE IF NOT EXISTS turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  professor_id UUID NOT NULL REFERENCES professores(id),
  quadra_id UUID NOT NULL REFERENCES quadras(id),
  schedule JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  alunos_por_horario INTEGER NOT NULL,
  matriculas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turmas_arena_id ON turmas(arena_id);
CREATE INDEX idx_turmas_professor_id ON turmas(professor_id);
CREATE INDEX idx_turmas_quadra_id ON turmas(quadra_id);

-- Reservations
CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  quadra_id UUID NOT NULL REFERENCES quadras(id),
  profile_id UUID REFERENCES profiles(id),
  aluno_id UUID REFERENCES alunos(id),
  turma_id UUID REFERENCES turmas(id),
  torneio_id UUID,
  evento_id UUID,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmada', 'pendente', 'cancelada', 'realizada', 'aguardando_aceite_profissional', 'aguardando_pagamento_profissional', 'aguardando_pagamento')),
  type TEXT NOT NULL CHECK (type IN ('avulsa', 'aula', 'torneio', 'evento', 'bloqueio')),
  total_price DECIMAL(10,2),
  credit_used DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pago', 'pendente', 'parcialmente_pago')),
  payment_deadline TIMESTAMPTZ,
  sport_type TEXT,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT CHECK (recurring_type IN ('none', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
  recurring_end_date DATE,
  master_id UUID,
  created_by_name TEXT,
  rented_items JSONB DEFAULT '[]'::jsonb,
  atleta_aluguel_id UUID REFERENCES atletas_aluguel(id),
  atleta_aceite_status TEXT CHECK (atleta_aceite_status IN ('pendente', 'aceito', 'recusado', 'cancelado_pelo_cliente')),
  atleta_payment_status TEXT CHECK (atleta_payment_status IN ('pendente_cliente', 'pendente_repasse', 'pago')),
  atleta_paid_at TIMESTAMPTZ,
  atleta_cost DECIMAL(10,2),
  athlete_payment_deadline TIMESTAMPTZ,
  participants JSONB DEFAULT '[]'::jsonb,
  invites_closed BOOLEAN DEFAULT false,
  attendance JSONB,
  monthly_payments JSONB,
  asaas_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservas_arena_id ON reservas(arena_id);
CREATE INDEX idx_reservas_quadra_id ON reservas(quadra_id);
CREATE INDEX idx_reservas_profile_id ON reservas(profile_id);
CREATE INDEX idx_reservas_date ON reservas(date);
CREATE INDEX idx_reservas_status ON reservas(status);
CREATE INDEX idx_reservas_type ON reservas(type);

-- Rental Items
CREATE TABLE IF NOT EXISTS rental_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rental_items_arena_id ON rental_items(arena_id);

-- ================================================
-- TOURNAMENTS & EVENTS
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_torneios_arena_id ON torneios(arena_id);
CREATE INDEX idx_torneios_status ON torneios(status);

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
  total_value DECIMAL(10,2) NOT NULL,
  deposit_value DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2),
  payment_conditions TEXT,
  notes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eventos_arena_id ON eventos(arena_id);
CREATE INDEX idx_eventos_status ON eventos(status);

-- ================================================
-- FINANCIAL TRANSACTIONS
-- ================================================

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cancellation_credit', 'manual_adjustment', 'reservation_payment', 'goodwill_credit')),
  description TEXT,
  related_reservation_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_aluno_id ON credit_transactions(aluno_id);
CREATE INDEX idx_credit_transactions_arena_id ON credit_transactions(arena_id);

-- ================================================
-- GAMIFICATION SYSTEM
-- ================================================

-- Gamification Settings
CREATE TABLE IF NOT EXISTS gamification_settings (
  arena_id UUID PRIMARY KEY REFERENCES arenas(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  points_per_reservation INTEGER DEFAULT 10,
  points_per_real INTEGER DEFAULT 1,
  voucher_expiration_days INTEGER
);

-- Gamification Levels
CREATE TABLE IF NOT EXISTS gamification_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  level_rank INTEGER NOT NULL
);

CREATE INDEX idx_gamification_levels_arena_id ON gamification_levels(arena_id);

-- Gamification Rewards
CREATE TABLE IF NOT EXISTS gamification_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discount', 'free_hour', 'free_item')),
  value DECIMAL(10,2),
  quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  product_id UUID,
  item_description TEXT
);

CREATE INDEX idx_gamification_rewards_arena_id ON gamification_rewards(arena_id);

-- Gamification Achievements
CREATE TABLE IF NOT EXISTS gamification_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('first_reservation', 'play_all_courts', 'weekly_frequency', 'loyalty_10', 'loyalty_50', 'loyalty_100')),
  points_reward INTEGER NOT NULL,
  icon TEXT NOT NULL
);

CREATE INDEX idx_gamification_achievements_arena_id ON gamification_achievements(arena_id);

-- Aluno Achievements (Junction Table)
CREATE TABLE IF NOT EXISTS aluno_achievements (
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (aluno_id, achievement_id)
);

CREATE INDEX idx_aluno_achievements_aluno_id ON aluno_achievements(aluno_id);

-- Gamification Point Transactions
CREATE TABLE IF NOT EXISTS gamification_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reservation_created', 'reservation_completed', 'manual_adjustment', 'achievement_unlocked', 'reward_redemption', 'cancellation_deduction')),
  description TEXT,
  related_reservation_id UUID,
  related_achievement_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gamification_point_transactions_aluno_id ON gamification_point_transactions(aluno_id);
CREATE INDEX idx_gamification_point_transactions_arena_id ON gamification_point_transactions(arena_id);

-- Redeemed Vouchers
CREATE TABLE IF NOT EXISTS redeemed_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  reward_id UUID NOT NULL,
  reward_title TEXT NOT NULL,
  product_id UUID,
  variant_id UUID,
  item_description TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'resgatado')),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redeemed_vouchers_arena_id ON redeemed_vouchers(arena_id);
CREATE INDEX idx_redeemed_vouchers_aluno_id ON redeemed_vouchers(aluno_id);
CREATE INDEX idx_redeemed_vouchers_code ON redeemed_vouchers(code);

-- ================================================
-- SHOP/STORE
-- ================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  stock INTEGER NOT NULL DEFAULT 0,
  variants JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_arena_id ON products(arena_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ================================================
-- NOTIFICATIONS
-- ================================================

-- Notificacoes
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'game_invite', 'friend_requests', 'cancellation', 'gamification_reward', 'gamification_points', 'direct_message', 'game_invite_response', 'payment_received', 'tournament_invite', 'tournament_announcement')),
  read BOOLEAN DEFAULT false,
  link_to TEXT,
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT,
  sender_avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_arena_id ON notificacoes(arena_id);
CREATE INDEX idx_notificacoes_profile_id ON notificacoes(profile_id);
CREATE INDEX idx_notificacoes_read ON notificacoes(read);

-- ================================================
-- ROW LEVEL SECURITY (RLS) - Basic Policies
-- ================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quadras ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (will be expanded based on roles)

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- Arenas: Arena owners and members can view
CREATE POLICY "Arena access" ON arenas
  FOR SELECT USING (
    auth.uid()::text = owner_id::text OR
    id IN (SELECT arena_id FROM profiles WHERE id::text = auth.uid()::text)
  );

-- Quadras: Anyone in the arena can view
CREATE POLICY "Quadras arena access" ON quadras
  FOR SELECT USING (
    arena_id IN (
      SELECT id FROM arenas WHERE 
        owner_id::text = auth.uid()::text OR
        id IN (SELECT arena_id FROM profiles WHERE id::text = auth.uid()::text)
    )
  );

-- Similar policies for other tables...
-- (Will be expanded with INSERT, UPDATE, DELETE policies based on permissions)

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to reservas
CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- INITIAL SEED DATA (Optional)
-- ================================================

-- Insert default plans
INSERT INTO plans (name, price, billing_cycle, features, is_active) VALUES
  ('Starter', 99.00, 'monthly', '["3 quadras", "5 membros", "Suporte básico"]', true),
  ('Professional', 299.00, 'monthly', '["10 quadras", "20 membros", "Gamificação", "Relatórios avançados"]', true),
  ('Enterprise', 599.00, 'monthly', '["Quadras ilimitadas", "Membros ilimitados", "Suporte prioritário", "API"]', true)
ON CONFLICT DO NOTHING;

-- ================================================
-- END OF SCHEMA
-- ================================================
