# Correção da Integração com Asaas

## Problema Identificado

O fluxo de pagamento estava criando:
1. Uma **subscription** no Asaas
2. Um **payment manual** separado

### Comportamento Incorreto
Isso causava duplicação e confusão porque o Asaas **já cria automaticamente** o primeiro payment quando você cria uma subscription.

## Solução Implementada

### Fluxo Corrigido (Conforme Documentação Oficial do Asaas)

**Para Planos Gratuitos (price = 0):**
- Criar apenas subscription local no Supabase
- Não chamar API do Asaas
- Status: `active` imediatamente

**Para Planos Pagos:**
1. Verificar se Asaas está configurado
2. Buscar ou criar cliente no Asaas (`POST /customers`)
3. Criar subscription no Asaas (`POST /subscriptions`)
   - Para **cartão de crédito**: incluir dados do cartão na criação da subscription
   - Para **boleto/PIX**: subscription gera payment automaticamente
4. Salvar subscription no Supabase com `asaas_subscription_id`

### Melhorias Adicionadas

**Logs Detalhados:**
```javascript
console.log('[createAsaasSubscription] Iniciando com:', { arena, plan, billingType });
console.log('[createAsaasSubscription] Cliente criado:', asaasCustomerId);
console.log('[createAsaasSubscription] Assinatura criada no Asaas:', asaasSubscription.id);
console.log('[createAsaasSubscription] Subscription salva com sucesso');
```

Agora é possível acompanhar cada etapa do processo no console do browser.

**Tratamento de Erros Aprimorado:**
- Mensagens claras em cada ponto de falha
- Logs específicos para debug
- Retorno estruturado com `{ success, payment, error }`

## Como Testar

### Passo 1: Configurar API Key do Asaas
1. Login como Super Admin
2. Ir em Configurações → Asaas
3. Inserir API Key (sandbox ou produção)
4. Marcar "Modo Sandbox" se estiver testando

### Passo 2: Criar Nova Arena
1. Logout do Super Admin
2. Ir em "Começar gratuitamente"
3. Criar nova arena com dados completos:
   - Nome da arena
   - CNPJ/CPF válido (11 dígitos para CPF, 14 para CNPJ)
   - Email válido
   - Telefone
   - Endereço completo (CEP, número)

### Passo 3: Contratar Plano
1. Login na arena criada
2. Ir em Configurações → Plano e Assinatura
3. Clicar em "Contratar Plano"
4. Escolher plano (Básico, Pro, Professional)
5. Selecionar método de pagamento:
   - **Boleto**: Gera linha digitável + PDF
   - **PIX**: Gera QR Code + código copia-e-cola
   - **Cartão**: Processa pagamento imediatamente

### Passo 4: Verificar Resultado
1. Verificar no console do browser os logs começando com `[createAsaasSubscription]`
2. Verificar se subscription aparece na aba "Plano e Assinatura"
3. Para boleto/PIX: verificar se os dados de pagamento são exibidos

## Endpoints Asaas Utilizados

```
POST /v3/customers          - Criar cliente
POST /v3/subscriptions      - Criar assinatura recorrente
```

## Estrutura de Dados

### Subscription (Supabase)
```typescript
{
  id: string,
  arena_id: string,
  plan_id: string,
  status: 'active' | 'past_due' | 'canceled' | 'expired',
  start_date: string,
  end_date: string | null,
  asaas_subscription_id: string | null,
  asaas_customer_id: string | null,
  next_payment_date: string | null
}
```

### Asaas Subscription Request
```json
{
  "customer": "cus_xxxxx",
  "billingType": "BOLETO" | "PIX" | "CREDIT_CARD",
  "value": 99.90,
  "nextDueDate": "2025-11-24",
  "cycle": "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY",
  "description": "Plano Pro - Arena MatchPlay",
  "creditCard": { ... },        // Apenas para CREDIT_CARD
  "creditCardHolderInfo": { ... }  // Apenas para CREDIT_CARD
}
```

## Próximos Passos (Opcional)

1. **Webhooks**: Implementar listener para receber eventos do Asaas
   - `PAYMENT_CONFIRMED`: Atualizar status da subscription
   - `PAYMENT_OVERDUE`: Marcar como `past_due`
   - `SUBSCRIPTION_EXPIRED`: Cancelar acesso

2. **Listagem de Payments**: Buscar payments da subscription
   - `GET /subscriptions/{id}/payments`

3. **Renovação Automática**: Sistema de lembretes antes do vencimento
