# 🚀 Guia de Configuração do Supabase - MatchPlay

## 📋 Passo 1: Executar Schema SQL no Supabase

### 1.1 Acesse o Editor SQL do Supabase
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto **MatchPlay**
3. No menu lateral esquerdo, clique em **"SQL Editor"**

### 1.2 Execute o Schema
1. Clique em **"New query"** (+ New query)
2. Copie TODO o conteúdo do arquivo **`supabase-schema.sql`** (na raiz do projeto)
3. Cole no editor SQL do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

⏱️ **Tempo estimado**: 30 segundos a 1 minuto

### 1.3 Verifique a Criação das Tabelas
1. No menu lateral, clique em **"Table Editor"**
2. Você deverá ver **30+ tabelas** criadas:
   - ✅ profiles
   - ✅ arenas
   - ✅ quadras
   - ✅ reservas
   - ✅ alunos
   - ✅ professores
   - ✅ torneios
   - ✅ eventos
   - ... e muitas outras

---

## 📊 Passo 2: Configurar Row Level Security (RLS)

Por padrão, as tabelas já têm RLS ativado com políticas básicas. Você pode personalizá-las depois.

### Ver Políticas RLS
1. Vá em **"Authentication" → "Policies"**
2. Selecione uma tabela (ex: `arenas`)
3. Você verá as políticas de acesso configuradas

---

## 🔐 Passo 3: (Opcional) Criar Usuários de Teste

### Via SQL Editor
```sql
-- Criar um perfil de super admin para teste
INSERT INTO profiles (name, email, role, created_at) 
VALUES ('Admin Teste', 'admin@matchplay.com', 'super_admin', NOW());

-- Criar uma arena de teste
INSERT INTO arenas (
  owner_id, 
  name, 
  slug, 
  city, 
  state, 
  created_at
) VALUES (
  (SELECT id FROM profiles WHERE email = 'admin@matchplay.com'),
  'Arena Teste',
  'arena-teste',
  'São Paulo',
  'SP',
  NOW()
);
```

---

## 🎯 Próximos Passos

Após executar o schema SQL:

1. ✅ As credenciais **SUPABASE_URL** e **SUPABASE_ANON_KEY** já estão configuradas no Replit
2. ✅ O frontend já tem o cliente Supabase configurado (`src/lib/supabaseClient.ts`)
3. ✅ A API está pronta (`src/lib/supabaseApi.ts`)

### Próximo: Migrar Dados do localStorage para Supabase

Será criado um script que permite migrar todos os dados existentes do localStorage para o banco PostgreSQL do Supabase.

---

## ⚠️ Troubleshooting

### Erro: "relation already exists"
- **Solução**: Algumas tabelas já existem. Você pode:
  - Ignorar o erro e continuar
  - OU deletar as tabelas existentes antes (cuidado!)

### Erro: "permission denied"
- **Solução**: Verifique se você está usando o usuário correto do Supabase
- Vá em **Settings → API** e confirme que está usando a **API key correta**

### Erro de Foreign Key
- **Solução**: Execute o script completo de uma vez (não em partes)
- As foreign keys dependem de tabelas criadas anteriormente

---

## 📝 Arquivos Importantes

- `supabase-schema.sql` - Schema completo do banco de dados
- `src/lib/supabaseClient.ts` - Cliente Supabase
- `src/lib/supabaseApi.ts` - API de acesso aos dados
- `.env` - Variáveis de ambiente (já configuradas)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas, me avise informando:
1. Qual passo você está
2. A mensagem de erro completa
3. Screenshot do erro (se possível)
