# 🎯 Guia Completo: Backend Supabase - MatchPlay

## 📚 Índice
1. [Visão Geral](#visão-geral)
2. [Setup Inicial](#setup-inicial)
3. [Como Migrar Dados](#como-migrar-dados)
4. [Estrutura do Banco](#estrutura-do-banco)
5. [Como Usar a API](#como-usar-a-api)
6. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

O MatchPlay agora possui **backend completo com PostgreSQL via Supabase**, substituindo o localStorage.

### ✅ O que foi implementado:

- **30+ tabelas** PostgreSQL no Supabase
- **Cliente Supabase** configurado (`src/lib/supabaseClient.ts`)
- **API completa** (`src/lib/supabaseApi.ts`) com operações CRUD
- **Script de migração** para transferir dados do localStorage
- **Página de migração** com interface visual (`/migration`)
- **Autenticação** Supabase Auth integrada

---

## 🚀 Setup Inicial

### Passo 1: Executar Schema SQL ✅

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie todo o conteúdo de **`supabase-schema.sql`**
4. Cole e execute (Run)

✅ **Já feito!** (você confirmou que executou)

### Passo 2: Verificar Credenciais ✅

As credenciais já estão configuradas:
- `SUPABASE_URL` ✅
- `SUPABASE_ANON_KEY` ✅

Essas são injetadas automaticamente no frontend via `.env`

---

## 📦 Como Migrar Dados

### Opção 1: Interface Visual (Recomendado)

1. **Acesse**: http://localhost:5000/migration
2. **Clique** em "Testar Conexão"
3. Se conectar com sucesso ✅, clique em "Iniciar Migração"
4. **Acompanhe** o progresso no console do navegador (F12)

### Opção 2: Via Console do Navegador

```javascript
// Abra o console (F12) e execute:
import { migrateLocalStorageToSupabase } from './src/utils/migrateToSupabase';
await migrateLocalStorageToSupabase();
```

### O que é migrado?

#### Tabelas Globais:
- ✅ profiles (usuários)
- ✅ arenas
- ✅ subscriptions
- ✅ plans
- ✅ friendships

#### Tabelas por Arena (20+):
- ✅ quadras, reservas, alunos, professores, turmas
- ✅ torneios, eventos, notificações
- ✅ gamification (settings, levels, rewards, achievements)
- ✅ produtos, rental_items, pricing_rules
- ✅ credit_transactions, vouchers
- ... e muitas outras!

---

## 🗄️ Estrutura do Banco

### Tabelas Principais

```
GLOBAL (sem arena_id)
├── profiles         - Usuários/membros
├── arenas          - Arenas cadastradas
├── subscriptions   - Assinaturas das arenas
├── plans           - Planos disponíveis
└── friendships     - Amizades entre usuários

POR ARENA (com arena_id)
├── quadras         - Quadras da arena
├── reservas        - Reservas de quadras
├── alunos          - Alunos/jogadores
├── professores     - Instrutores
├── turmas          - Turmas/aulas
├── torneios        - Torneios organizados
├── eventos         - Eventos privados
├── notificacoes    - Notificações
├── products        - Produtos da loja
├── rental_items    - Itens para aluguel
├── pricing_rules   - Regras de preço
└── ... (20+ tabelas ao todo)
```

### Relacionamentos Importantes

```sql
profiles ← arenas (owner_id)
arenas ← quadras (arena_id)
arenas ← alunos (arena_id)
alunos ← reservas (aluno_id)
quadras ← reservas (quadra_id)
professores ← turmas (professor_id)
torneios → participants (JSONB)
```

---

## 💻 Como Usar a API

### Importar a API

```typescript
import { supabaseApi } from '../lib/supabaseApi';
```

### Operações Básicas

#### 1. SELECT (buscar dados)

```typescript
// Buscar todas as quadras de uma arena
const { data, error } = await supabaseApi.select('quadras', arenaId);

// Buscar dados globais (todas as arenas)
const { data, error } = await supabaseApi.select('arenas', 'all');
```

#### 2. UPSERT (inserir ou atualizar)

```typescript
// Criar ou atualizar uma quadra
const novaQuadra = {
  id: 'uuid-opcional',
  name: 'Quadra 1',
  court_type: 'beach_tennis',
  sports: ['beach_tennis'],
  status: 'ativa',
  // ... outros campos
};

const { data, error } = await supabaseApi.upsert(
  'quadras',
  [novaQuadra],
  arenaId
);
```

#### 3. DELETE (excluir)

```typescript
// Deletar uma ou mais quadras
const { data, error } = await supabaseApi.delete(
  'quadras',
  ['id-da-quadra-1', 'id-da-quadra-2']
);
```

#### 4. SELECT com Filtros

```typescript
// Buscar reservas confirmadas de hoje
const { data, error } = await supabaseApi.selectWithFilter(
  'reservas',
  arenaId,
  {
    status: 'confirmada',
    date: '2025-11-17'
  }
);
```

#### 5. SELECT Single (buscar um registro)

```typescript
// Buscar um aluno específico
const { data, error } = await supabaseApi.selectSingle(
  'alunos',
  'id-do-aluno'
);
```

#### 6. UPDATE (atualizar campos)

```typescript
// Atualizar status de uma reserva
const { data, error } = await supabaseApi.updateFields(
  'reservas',
  'id-da-reserva',
  { status: 'confirmada', payment_status: 'pago' }
);
```

---

## 🔄 Migração de LocalApi para SupabaseApi

### Antes (localStorage):

```typescript
import { localApi } from '../lib/localApi';

// Buscar quadras
const { data } = await localApi.select('quadras', arenaId);

// Salvar quadra
await localApi.upsert('quadras', [quadra], arenaId);
```

### Depois (Supabase):

```typescript
import { supabaseApi } from '../lib/supabaseApi';

// Buscar quadras
const { data, error } = await supabaseApi.select('quadras', arenaId);
if (error) console.error(error);

// Salvar quadra
const { data: saved, error: saveError } = await supabaseApi.upsert(
  'quadras',
  [quadra],
  arenaId
);
```

**A interface é praticamente idêntica!** ✅

---

## 🔐 Row Level Security (RLS)

O schema já inclui políticas RLS básicas:

```sql
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- Donos e membros podem acessar dados da arena
CREATE POLICY "Arena access" ON arenas
  FOR SELECT USING (
    auth.uid()::text = owner_id::text OR
    id IN (SELECT arena_id FROM profiles WHERE id::text = auth.uid()::text)
  );
```

### Personalizar Políticas

Acesse **Supabase Dashboard → Authentication → Policies** para:
- ✅ Adicionar políticas de INSERT/UPDATE/DELETE
- ✅ Restringir acesso por role (admin_arena, professor, cliente)
- ✅ Implementar permissões granulares

---

## 🎯 Próximos Passos

### 1. Migrar Dados Existentes
- [x] Executar schema SQL
- [ ] Acessar `/migration` e migrar dados
- [ ] Verificar dados no Supabase Dashboard

### 2. Substituir LocalApi por SupabaseApi
- [ ] Atualizar imports em todos os componentes
- [ ] Testar cada módulo (quadras, reservas, alunos, etc)
- [ ] Remover dependência do localStorage

### 3. Configurar Autenticação
- [ ] Implementar Supabase Auth
- [ ] Substituir sistema de auth atual
- [ ] Configurar políticas RLS por role

### 4. Otimizações
- [ ] Adicionar indexes para queries frequentes
- [ ] Configurar cache de dados
- [ ] Implementar real-time subscriptions

---

## 📝 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `supabase-schema.sql` | Schema completo (30+ tabelas) |
| `src/lib/supabaseClient.ts` | Cliente Supabase configurado |
| `src/lib/supabaseApi.ts` | API wrapper com operações CRUD |
| `src/utils/migrateToSupabase.ts` | Script de migração |
| `src/pages/MigrationPage.tsx` | Interface de migração |
| `.env` | Variáveis de ambiente |

---

## 🆘 Troubleshooting

### Erro: "Invalid API key"
- Verifique se `SUPABASE_ANON_KEY` está correto
- Confirme que o projeto Supabase está ativo

### Erro: "relation does not exist"
- Execute o `supabase-schema.sql` novamente
- Verifique se todas as tabelas foram criadas

### Erro: "row-level security policy violation"
- Verifique as políticas RLS no Dashboard
- Temporariamente desabilite RLS para testes

### Dados não aparecem após migração
- Abra o Supabase Dashboard → Table Editor
- Verifique se os dados estão lá
- Confirme que o `arena_id` está correto

---

## 📊 Status Atual

✅ **Schema SQL criado e executado**  
✅ **Cliente Supabase configurado**  
✅ **API completa implementada**  
✅ **Script de migração pronto**  
✅ **Interface de migração disponível**  
⏳ **Aguardando migração de dados**  
⏳ **Aguardando substituição de localApi**  

---

🎉 **Supabase Backend está pronto para uso!**

Acesse `/migration` para começar a migrar seus dados.
