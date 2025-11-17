# Guia: Por que Deploy e Desenvolvimento Não Sincronizam?

## 🔴 PROBLEMA

**Dados salvos no DEPLOY não aparecem em DESENVOLVIMENTO (e vice-versa)**

## 🎯 CAUSA

Deploy e Desenvolvimento usam **Supabase Projects DIFERENTES**:

### Deploy (Produção):
- SUPABASE_URL: `https://seu-projeto-producao.supabase.co`
- SUPABASE_ANON_KEY: `eyJ...` (Key de produção)
- Dados ficam no **Banco Produção**

### Desenvolvimento (Local):
- SUPABASE_URL: Pode ser o mesmo ou diferente
- SUPABASE_ANON_KEY: Pode ser o mesmo ou diferente  
- Dados ficam no **Banco Desenvolvimento** (se for diferente)

## ✅ SOLUÇÕES

### Opção 1: USAR O MESMO SUPABASE PROJECT (Recomendado para testes)

1. No **Replit Secrets** (tanto em development quanto deploy):
   - Certifique-se que `SUPABASE_URL` é o MESMO
   - Certifique-se que `SUPABASE_ANON_KEY` é a MESMA

2. Isso fará com que:
   - ✅ Deploy salva no Supabase
   - ✅ Desenvolvimento lê do Supabase
   - ✅ Dados sincronizam automaticamente

3. **⚠️ AVISO**: Desenvolvimento e Produção compartilharão os mesmos dados!

### Opção 2: AMBIENTES SEPARADOS (Recomendado para produção real)

1. Crie 2 Supabase Projects:
   - `matchplay-dev` (Desenvolvimento)
   - `matchplay-prod` (Produção)

2. Configure Secrets diferentes:
   ```
   Development:
   SUPABASE_URL=https://matchplay-dev.supabase.co
   SUPABASE_ANON_KEY=eyJ_DEV_KEY...

   Deploy:
   SUPABASE_URL=https://matchplay-prod.supabase.co
   SUPABASE_ANON_KEY=eyJ_PROD_KEY...
   ```

3. **Dados não sincronizam** (e isso é CORRETO):
   - Desenvolvimento: Testes, dados fake
   - Produção: Dados reais de clientes

4. Para copiar dados: Use backup/restore do Supabase

## 🧪 COMO VERIFICAR QUAL SUPABASE ESTÁ USANDO

Execute no console do navegador (F12):
```javascript
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
```

Ou verifique nos Replit Secrets:
1. Clique no ícone de cadeado (Secrets)
2. Veja `SUPABASE_URL` e `SUPABASE_ANON_KEY`

## 📊 ESTADO ATUAL DO SISTEMA

### ✅ Tabelas que usam Supabase (sincronizam):
- `plans` (planos SaaS)
- `subscriptions` (assinaturas)
- `arenas` (arenas cadastradas)
- `profiles` (usuários)
- `friendships` (conexões)
- `credit_cards` (cartões salvos)
- `asaas_config` (configuração Asaas)

### ❌ Tabelas que ainda usam localStorage (NÃO sincronizam):
- `quadras` (courts)
- `reservas` (reservations)
- `alunos` (students)
- `professores` (instructors)
- `turmas` (classes)
- `torneios` (tournaments)
- `eventos` (events)
- `notificacoes` (notifications)
- `products` (store products)
- `rental_items` (equipment)
- E outras 15+ tabelas

## 🎯 PRÓXIMO PASSO

**Para sincronizar TODOS os dados entre deploy e dev:**

Migrar TODAS as tabelas restantes para Supabase. Isso está planejado na próxima tarefa.

