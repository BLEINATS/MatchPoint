-- ============================================================
-- INSTRUÇÕES: Criar tabela asaas_config no Supabase Cloud
-- ============================================================
-- 
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione seu projeto MatchPlay
-- 3. Vá em: SQL Editor (menu lateral esquerdo)
-- 4. Clique em: "New Query"
-- 5. Cole o SQL abaixo e clique em "Run"
-- ============================================================

-- Criar tabela para armazenar configuração do Asaas
CREATE TABLE IF NOT EXISTS public.asaas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL DEFAULT '',
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentário descritivo
COMMENT ON TABLE public.asaas_config IS 'Configuração global da API do Asaas (sandbox ou produção)';

-- Inserir registro inicial vazio
INSERT INTO public.asaas_config (api_key, is_sandbox)
VALUES ('', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- IMPORTANTE: Esta tabela deve ter apenas 1 registro
-- O backend vai usar UPDATE para modificar este registro único
-- ============================================================

-- Verificar se foi criada corretamente
SELECT * FROM public.asaas_config;
