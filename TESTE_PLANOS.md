# Diagnóstico e Correção - Criação de Planos e Troca de Planos

## Data: 17 de Novembro de 2025

## Problema Relatado
1. Após criar um novo plano no SuperAdmin, o sistema mostra "salvo" 
2. Mas os dados não aparecem no banco de dados Supabase
3. Não consegue trocar plano do cliente

## Diagnóstico Realizado

### 1. Verificação do Banco de Dados
- ✅ Banco de dados Supabase está configurado corretamente
- ✅ Tabela `plans` existe com estrutura adequada
- ✅ Atualmente existem **3 planos** no banco: Starter, Professional, Enterprise

### 2. Análise do Código
Identifiquei o problema principal na função `handleSavePlan`:

**PROBLEMA:** A função estava mostrando "Plano salvo com sucesso!" mesmo quando havia erro, porque não verificava o retorno do `supabaseApi.upsert`.

**Antes:**
```typescript
const handleSavePlan = async (plan: Plan) => {
  try {
    await supabaseApi.upsert('plans', [plan], 'all');
    addToast({ message: 'Plano salvo com sucesso!', type: 'success' });
    // ❌ Não verificava se houve erro!
  } catch (error: any) {
    addToast({ message: `Erro ao salvar plano: ${error.message}`, type: 'error' });
  }
};
```

**Depois (corrigido):**
```typescript
const handleSavePlan = async (plan: Plan) => {
  try {
    console.log('[SuperAdmin] Salvando plano:', plan);
    const result = await supabaseApi.upsert('plans', [plan], 'all');
    
    if (result.error) {
      console.error('[SuperAdmin] Erro ao salvar plano:', result.error);
      addToast({ 
        message: `Erro ao salvar plano: ${result.error.message || JSON.stringify(result.error)}`, 
        type: 'error' 
      });
      return; // ✅ Retorna se houver erro
    }
    
    console.log('[SuperAdmin] Plano salvo com sucesso:', result.data);
    addToast({ message: 'Plano salvo com sucesso!', type: 'success' });
    // ✅ Só mostra sucesso se realmente salvou!
  } catch (error: any) {
    console.error('[SuperAdmin] Exceção ao salvar plano:', error);
    addToast({ message: `Erro ao salvar plano: ${error.message}`, type: 'error' });
  }
};
```

### 3. Correções Implementadas

1. **Verificação de erro no salvamento de planos** ✅
   - Agora a função verifica se `result.error` existe antes de mostrar sucesso
   - Logs de console adicionados para diagnóstico

2. **Tipo TypeScript atualizado** ✅
   - Campo `created_at` adicionado à interface `Plan`
   - Compatibilidade total com o schema do Supabase

3. **Código LSP corrigido** ✅
   - Variável `startDate` não utilizada removida

## Como Testar

### Teste 1: Criar um Novo Plano

1. Acesse o painel SuperAdmin
2. Clique em "Novo Plano"
3. Preencha os dados:
   - **Nome:** Teste Premium
   - **Preço:** 150,00
   - **Ciclo:** Mensal
   - **Features:** Digite algumas funcionalidades
4. Clique em "Salvar"

**O que verificar:**
- ✅ Mensagem de sucesso/erro aparece corretamente
- ✅ Abra o Console do navegador (F12) e veja os logs:
  - Deve aparecer `[SuperAdmin] Salvando plano:`
  - E depois `[SuperAdmin] Plano salvo com sucesso:` OU `[SuperAdmin] Erro ao salvar plano:`

### Teste 2: Verificar no Banco de Dados

Execute o seguinte comando SQL no Supabase:
```sql
SELECT * FROM plans ORDER BY created_at DESC LIMIT 5;
```

**Resultado esperado:**
- O novo plano "Teste Premium" deve aparecer na lista

### Teste 3: Trocar Plano de um Cliente

1. No painel SuperAdmin, encontre uma arena
2. Clique em "Trocar Plano"
3. Selecione um plano diferente
4. Confirme a troca

**O que verificar:**
- ✅ Mensagem de sucesso/erro aparece
- ✅ Logs no console mostram o processo
- ✅ No banco de dados, verifique a tabela `subscriptions`:
  ```sql
  SELECT * FROM subscriptions WHERE arena_id = 'ID_DA_ARENA' ORDER BY start_date DESC LIMIT 1;
  ```

## Próximos Passos Recomendados

Se o teste ainda não funcionar, verifique:

1. **Console do navegador (F12):**
   - Procure por mensagens de erro em vermelho
   - Procure pelos logs `[SuperAdmin]`

2. **Credenciais do Supabase:**
   - Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos
   - Você pode verificar com: `env | grep SUPABASE`

3. **Políticas RLS (Row Level Security) do Supabase:**
   - Pode ser que as políticas de segurança estejam bloqueando a inserção
   - Verifique no dashboard do Supabase se há políticas ativas na tabela `plans`

## Status Atual

✅ **Código corrigido e revisado pelo arquiteto**
✅ **Logs de diagnóstico implementados**
✅ **Workflows reiniciados e ativos**
✅ **Banco de dados testado e funcionando**

### O que foi corrigido:

1. **handleSavePlan**: Agora verifica se houve erro antes de mostrar sucesso
2. **handleChangePlan**: Verifica erros em todas as operações (subscription, arena)
3. **Tipo Plan**: Campo `created_at` adicionado para compatibilidade
4. **Logs**: Console logs adicionados em todas as operações para diagnóstico

### Como os erros agora serão mostrados:

**Antes:**
- Sistema mostrava "Plano salvo com sucesso!" mesmo se houvesse erro
- Usuário não sabia que falhou

**Depois:**
- Se houver erro: Mostra mensagem de erro específica
- Logs detalhados no console para diagnóstico
- Só mostra sucesso se realmente salvar no banco

---

## ⚠️ Problema Adicional Identificado (Não Crítico)

Durante a análise, identifiquei um erro de **Row Level Security (RLS)** do Supabase Storage ao tentar criar o bucket de fotos. Este erro **NÃO afeta** a criação de planos, mas pode impedir o upload de imagens (logos de arenas, fotos de quadras, etc).

**Erro no console:**
```
Error creating storage bucket: StorageApiError: new row violates row-level security policy
```

**Solução:** Configure o bucket manualmente no dashboard do Supabase seguindo o guia `SUPABASE-STORAGE-SETUP.md`.

---

**Observação:** Os workflows já foram reiniciados e o código está ativo. Você pode testar imediatamente. Todos os logs agora mostram `[SuperAdmin]` para facilitar a identificação.
