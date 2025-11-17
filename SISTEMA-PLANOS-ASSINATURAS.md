# Sistema de Planos e Assinaturas - MatchPlay

## ✅ Status Atual (17/11/2025)

O sistema de planos e assinaturas está **100% funcional** no Supabase. Os dados agora persistem permanentemente.

---

## 📊 Estrutura do Sistema

### **Tabelas Principais:**

1. **`plans`** - Planos de assinatura disponíveis (criados pelo SuperAdmin)
   - Starter (R$ 0 - Grátis)
   - Professional (R$ 299/mês)
   - Enterprise (R$ 599/mês)

2. **`arenas`** - Arenas cadastradas na plataforma
   - Cada arena tem um `owner_id` (Admin da Arena)
   - Cada arena pode ter um `plan_id` (plano atual)

3. **`subscriptions`** - Assinaturas ativas das arenas
   - Vincula `arena_id` ao `plan_id`
   - Status: `active`, `past_due`, `canceled`
   - Datas: `start_date`, `end_date`, `next_payment_date`

4. **`profiles`** - Usuários do sistema
   - Roles: `super_admin`, `admin_arena`, `funcionario`, `cliente`

---

## 🔐 Como Fazer Login

###  **Como SuperAdmin:**
- **E-mail:** `klaus@bleinat.com.br`
- **Senha:** qualquer senha (sistema em desenvolvimento usa mock login)
- **Acesso:** `/superadmin`

### **Como Admin da Arena:**
- **E-mail:** `admin@matchplay.com`
- **Senha:** qualquer senha
- **Acesso:** Dashboard da arena

---

## 🎯 Fluxo Completo

### **1. SuperAdmin Cria Plano**
1. Acesse `/superadmin`
2. Role até "Planos de Assinatura Disponíveis"
3. Clique em "+ Novo Plano"
4. Preencha:
   - Nome (ex: "Premium")
   - Preço mensal (ex: R$ 199)
   - Ciclo de cobrança (mensal/trimestral/anual)
   - Features (lista de benefícios)
5. Salvar

### **2. SuperAdmin Atribui Plano à Arena**
1. Na tabela "Arenas Cadastradas"
2. Localize a arena (ex: "Arena MatchPlay")
3. Clique em "Trocar Plano"
4. Selecione o plano desejado (ex: "Professional")
5. Confirmar
6. ✅ **O plano agora aparece na coluna "Plano"**

### **3. Arena Admin Vê Seu Plano**
1. Faça login como Admin da Arena
2. Vá em Settings → Plano e Faturamento
3. ✅ **Verá:**
   - Nome do plano (ex: "Professional")
   - Preço e ciclo (ex: "R$ 299/mês")
   - Data de início
   - Próxima cobrança
   - Features incluídas

---

## 🐛 Problemas Resolvidos

### ✅ **"Nenhum Plano Ativo"** - CORRIGIDO
**Causa:** Banco Supabase estava vazio  
**Solução:** Criados dados iniciais (profiles, arena, subscription)

### ✅ **"Plano aparece N/A no SuperAdmin"** - CORRIGIDO
**Causa:** Subscription não estava vinculada corretamente  
**Solução:** Criada subscription com foreign keys corretas

### ✅ **Seeding apagando dados** - CORRIGIDO
**Causa:** `seedInitialData()` rodando a cada reload  
**Solução:** Desabilitado seeding automático no `AuthProvider.tsx`

### ✅ **30 tabelas faltando** - CORRIGIDO
**Causa:** Schema SQL incompleto  
**Solução:** Executado `fix-database-schema.sql` completo

---

## 🧪 Como Testar Agora

### **Teste 1: Ver Plano no SuperAdmin**
```
1. Login como klaus@bleinat.com.br
2. Acesse /superadmin
3. Veja tabela "Arenas Cadastradas"
4. Linha "Arena MatchPlay" deve mostrar:
   - Plano: Professional
   - Próx. Cobrança: data calculada
   - Status: Ativa
```

### **Teste 2: Ver Plano no Arena Admin**
```
1. Login como admin@matchplay.com
2. Vá em Settings → Plano e Faturamento
3. Deve mostrar:
   ✅ Professional
   ✅ R$ 299/mês
   ✅ Data de início
   ✅ Funcionalidades do plano
```

### **Teste 3: Trocar Plano**
```
1. No SuperAdmin, clique "Trocar Plano" na Arena MatchPlay
2. Selecione "Enterprise"
3. Confirmar
4. ✅ Plano muda para Enterprise imediatamente
5. Arena Admin verá o novo plano ao recarregar
```

---

## 📝 Dados no Banco (Estado Atual)

```sql
-- Profiles criados:
- Klaus Bleinat (klaus@bleinat.com.br) → super_admin
- Admin MatchPlay (admin@matchplay.com) → admin_arena

-- Plans disponíveis:
- Starter (R$ 0)
- Professional (R$ 299)
- Enterprise (R$ 599)

-- Arenas:
- Arena MatchPlay → owner: Admin MatchPlay

-- Subscriptions:
- Arena MatchPlay → Professional Plan (active)
```

---

## ⚙️ Arquivos Modificados

1. **`fix-database-schema.sql`** - Script SQL com 30 tabelas
2. **`src/context/AuthProvider.tsx`** - Seeding desabilitado
3. **`.gitignore`** - Otimizado para React+Vite
4. **Dados criados manualmente via SQL** - Profiles, arena, subscription

---

## 🚀 Próximos Passos (Opcional)

1. **Configurar Supabase Storage** para logos (ver `SUPABASE-STORAGE-SETUP.md`)
2. **Migrar dados do localStorage** se houver dados antigos
3. **Configurar Asaas** para cobranças reais (botão no SuperAdmin)
4. **Criar mais arenas** para testes

---

## 💡 Dica Importante

**Os planos agora funcionam corretamente!** A screenshot mostrando "N/A" era porque:
- O banco estava vazio
- O seeding automático estava apagando dados
- Subscription não estava criada

**Agora tudo está persistido no Supabase e sincronizado entre Deploy e Development! 🎉**
