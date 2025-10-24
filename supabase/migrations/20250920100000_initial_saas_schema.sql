-- Habilita a extensão pgcrypto para usar gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

-- =================================================================
-- Tabela de Perfis de Usuários
-- Armazena todos os usuários do sistema, incluindo clientes, admins e super admins.
-- =================================================================
/*
    # [Tabela de Perfis de Usuários]
    Armazena informações de perfil para todos os usuários, vinculados à autenticação do Supabase.

    ## Query Description: "Cria a tabela 'profiles' para armazenar dados de usuários. Esta é uma operação estrutural segura e não afeta dados existentes, pois a tabela é nova. Ela será a base para o gerenciamento de todos os tipos de usuários no sistema."

    ## Metadata:
    - Schema-Category: "Structural"
    - Impact-Level: "Low"
    - Requires-Backup: false
    - Reversible: true

    ## Structure Details:
    - Tabela: public.profiles
    - Colunas: id, name, email, avatar_url, role, phone, cpf, birth_date, gender, created_at, updated_at
    - Constraints: Chave primária em 'id', referência à 'auth.users'.

    ## Security Implications:
    - RLS Status: Enabled
    - Policy Changes: Yes (Políticas de acesso serão criadas)
    - Auth Requirements: Vinculado ao sistema de autenticação do Supabase.

    ## Performance Impact:
    - Indexes: Chave primária em 'id'.
    - Triggers: Nenhum.
    - Estimated Impact: Nenhum impacto inicial.
*/
CREATE TYPE public.user_role AS ENUM ('cliente', 'admin_arena', 'funcionario', 'super_admin');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'cliente',
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis para todos" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
FOR UPDATE USING (auth.uid() = id);


-- =================================================================
-- Tabela de Planos de Assinatura do SaaS
-- Define os planos que os donos de arena podem assinar.
-- =================================================================
/*
    # [Tabela de Planos de Assinatura]
    Cria a tabela 'plans' para definir os diferentes níveis de assinatura do SaaS.

    ## Query Description: "Esta operação cria a tabela 'plans' para gerenciar os planos de assinatura (ex: Básico, Pro). É uma adição estrutural e não representa risco para dados existentes. Essencial para a monetização do serviço."

    ## Metadata:
    - Schema-Category: "Structural"
    - Impact-Level: "Low"
    - Requires-Backup: false
    - Reversible: true

    ## Structure Details:
    - Tabela: public.plans
    - Colunas: id, name, description, price, features, is_active

    ## Security Implications:
    - RLS Status: Enabled
    - Policy Changes: Yes (Apenas Super Admin pode gerenciar)
    - Auth Requirements: Acesso restrito.

    ## Performance Impact:
    - Indexes: Chave primária em 'id'.
    - Triggers: Nenhum.
    - Estimated Impact: Nenhum.
*/
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    features JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planos são visíveis para todos" ON public.plans
FOR SELECT USING (true);

CREATE POLICY "Super Admins podem gerenciar planos" ON public.plans
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);


-- =================================================================
-- Tabela de Assinaturas
-- Vincula uma arena a um plano de assinatura.
-- =================================================================
/*
    # [Tabela de Assinaturas]
    Cria a tabela 'subscriptions' para rastrear qual arena assina qual plano.

    ## Query Description: "Cria a tabela 'subscriptions' para vincular arenas a planos de assinatura. Esta é uma operação estrutural segura e fundamental para o controle de acesso e faturamento das arenas."

    ## Metadata:
    - Schema-Category: "Structural"
    - Impact-Level: "Medium"
    - Requires-Backup: false
    - Reversible: true

    ## Structure Details:
    - Tabela: public.subscriptions
    - Colunas: id, arena_id, plan_id, status, current_period_start, current_period_end
    - Constraints: Chaves estrangeiras para 'arenas' e 'plans'.

    ## Security Implications:
    - RLS Status: Enabled
    - Policy Changes: Yes (Acesso restrito por role)
    - Auth Requirements: Acesso restrito.

    ## Performance Impact:
    - Indexes: Chaves primária e estrangeiras.
    - Triggers: Nenhum.
    - Estimated Impact: Nenhum.
*/
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arena_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status public.subscription_status NOT NULL DEFAULT 'trialing',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins podem gerenciar assinaturas" ON public.subscriptions
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Donos de arena podem ver sua própria assinatura" ON public.subscriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.arenas 
    WHERE arenas.id = subscriptions.arena_id AND arenas.owner_id = auth.uid()
  )
);


-- =================================================================
-- Tabela de Arenas
-- Modificada para incluir a referência à assinatura.
-- =================================================================
/*
    # [Tabela de Arenas]
    Armazena os dados de cada arena cadastrada no sistema.

    ## Query Description: "Cria a tabela 'arenas' para os centros esportivos. É uma operação estrutural segura, essencial para a organização dos dados de cada cliente do SaaS."

    ## Metadata:
    - Schema-Category: "Structural"
    - Impact-Level: "Low"
    - Requires-Backup: false
    - Reversible: true

    ## Structure Details:
    - Tabela: public.arenas
    - Colunas: id, owner_id, subscription_id, name, slug, etc.
    - Constraints: Chaves estrangeiras para 'profiles' e 'subscriptions'.

    ## Security Implications:
    - RLS Status: Enabled
    - Policy Changes: Yes (Acesso restrito por dono)
    - Auth Requirements: Acesso restrito.

    ## Performance Impact:
    - Indexes: Chaves primária e estrangeiras.
    - Triggers: Nenhum.
    - Estimated Impact: Nenhum.
*/
CREATE TABLE public.arenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    subscription_id UUID REFERENCES public.subscriptions(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
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
    city TEXT,
    state TEXT,
    google_maps_link TEXT,
    cancellation_policy TEXT,
    terms_of_use TEXT,
    asaas_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona a chave estrangeira de 'subscriptions' para 'arenas'
ALTER TABLE public.subscriptions ADD CONSTRAINT fk_arena_id FOREIGN KEY (arena_id) REFERENCES public.arenas(id) ON DELETE CASCADE;

ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Arenas são visíveis para todos" ON public.arenas
FOR SELECT USING (true);

CREATE POLICY "Donos podem gerenciar suas próprias arenas" ON public.arenas
FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Super Admins podem gerenciar todas as arenas" ON public.arenas
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Adicionar um perfil de Super Admin (substitua com seu e-mail)
-- ATENÇÃO: Você precisará criar este usuário no painel de Autenticação do Supabase primeiro.
INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Super Admin', 'seu-email-de-superadmin@exemplo.com', 'super_admin'
FROM auth.users
WHERE email = 'seu-email-de-superadmin@exemplo.com'
ON CONFLICT (id) DO NOTHING;

-- Adicionar planos padrão
INSERT INTO public.plans (name, description, price, features)
VALUES
  ('Básico', 'Para arenas que estão começando.', 0.00, '{"quadras": 5, "reservas_online": true, "gestao_clientes": false}'),
  ('Pro', 'Funcionalidades avançadas para arenas em crescimento.', 99.90, '{"quadras": "ilimitado", "reservas_online": true, "gestao_clientes": true, "relatorios": true, "gamificacao": true}')
ON CONFLICT (name) DO NOTHING;
