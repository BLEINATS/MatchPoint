# Validação de CPF e Cartões Salvos - Changelog

## Resumo
Implementação completa de validação de CPF com checksum e sistema de cartões salvos tokenizados.

## Arquivos Modificados

### 1. src/utils/arenaPaymentHelper.ts (305 linhas)
**Novas funções:**
- `validateCPFChecksum(cpf: string)`: Valida dígitos verificadores do CPF
- `validateCNPJChecksum(cnpj: string)`: Valida dígitos verificadores do CNPJ
- `validateCustomerCPF(customer)`: Validação completa antes de processar pagamento

**Validações implementadas:**
- CPF vazio ou não cadastrado
- Formato (11 ou 14 dígitos)
- CPFs fake com dígitos repetidos (00000000000, 11111111111, etc.)
- Checksum usando algoritmo oficial da Receita Federal

**Tokenização de cartões:**
- Captura `creditCardToken` da resposta Asaas
- Salva cartão se `saveCard === true`
- Evita duplicação verificando token existente

### 2. src/types/index.ts (682 linhas)
**Novos tipos:**
```typescript
export interface CreditCardInfo {
  id: string;
  last4: string;
  brand: string;
  cardholder_name: string;
  asaas_token?: string;
  created_at?: string;
}
```

**Campos adicionados em Aluno:**
- `asaas_customer_id?: string | null`
- `credit_cards?: CreditCardInfo[]`

**Campos adicionados em Profile:**
- `asaas_customer_id?: string | null`
- `credit_cards?: CreditCardInfo[]`

### 3. src/components/Shared/ArenaPaymentModal.tsx (698 linhas)
**Funcionalidades:**
- Interface para selecionar cartão salvo vs novo cartão
- Lista visual de cartões com brand, last4, titular
- Checkbox "Salvar este cartão para pagamentos futuros"
- Validação de CPF antes de processar pagamento
- Suporte para usar token em pagamentos futuros

### 4. src/lib/asaasProxyService.ts (109 linhas)
**Mudança:**
```typescript
const getProxyBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '/api/asaas';
  }
  return 'http://localhost:3001/api/asaas';
};
```
Proxy ativo apenas em desenvolvimento.

### 5. server.js (285 linhas)
**Mudança:**
```javascript
const PORT = process.env.ASAAS_PORT || 3001;
```
Usa variável ASAAS_PORT em vez de PORT.

### 6. vite.config.ts (34 linhas)
**Mudança:**
```typescript
proxy: command === 'serve' ? { ... } : undefined
```
Proxy condicional apenas em desenvolvimento.

### 7. start-production.sh (28 linhas) [NOVO]
Script de inicialização para produção que:
- Inicia backend na porta 3001
- Verifica saúde do processo
- Inicia frontend na porta 5000

## Mensagens de Erro
- "CPF não cadastrado. Por favor, cadastre seu CPF antes de realizar o pagamento."
- "CPF inválido (dígitos verificadores incorretos). Por favor, verifique o CPF cadastrado."
- "CNPJ inválido (dígitos verificadores incorretos). Por favor, verifique o CNPJ cadastrado."

## Deploy
- Target: VM
- Build: `npm run build`
- Run: `bash start-production.sh`
