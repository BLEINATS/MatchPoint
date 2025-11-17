# Guia de Commits - Alpha Dualite (350 tokens)

## Estratégia de Commits Incrementais

Para respeitar o limite de 350 tokens da Alpha Dualite, faça commits separados:

### Commit 1: Validação de CPF
```bash
git add src/utils/arenaPaymentHelper.ts
git commit -m "feat: validação completa de CPF com checksum

- Adiciona validateCPFChecksum() e validateCNPJChecksum()
- Valida dígitos verificadores usando algoritmo oficial
- Bloqueia CPFs fake (00000000000, 11111111111, etc)
- Mensagens de erro claras e específicas"
```

### Commit 2: Tipos e Interfaces
```bash
git add src/types/index.ts
git commit -m "feat: adiciona tipos para cartões salvos

- CreditCardInfo com asaas_token
- credit_cards[] em Aluno e Profile
- asaas_customer_id em Aluno e Profile"
```

### Commit 3: Interface de Pagamento
```bash
git add src/components/Shared/ArenaPaymentModal.tsx
git commit -m "feat: interface de seleção de cartões salvos

- Lista cartões salvos com brand, last4, titular
- Checkbox para salvar novos cartões
- Seleção entre cartão salvo vs novo
- Validação de CPF integrada"
```

### Commit 4: Configuração de Deployment
```bash
git add server.js vite.config.ts src/lib/asaasProxyService.ts
git commit -m "fix: corrige configuração para deployment

- server.js usa ASAAS_PORT (porta 3001)
- Proxy Vite apenas em desenvolvimento
- asaasProxyService diferencia dev/prod"
```

### Commit 5: Scripts e Documentação
```bash
git add start-production.sh DEPLOYMENT.md CHANGELOG-CPF-VALIDATION.md
git commit -m "docs: adiciona scripts e documentação de deployment

- start-production.sh: inicialização robusta
- DEPLOYMENT.md: guia completo
- CHANGELOG: resumo das alterações"
```

### Commit 6: Atualização Geral
```bash
git add replit.md
git commit -m "docs: atualiza documentação do projeto"
```

## Alternativa: Commit Único Resumido
Se preferir um commit único, use:

```bash
git add .
git commit -m "feat: validação CPF e cartões salvos + deployment

Principais mudanças:
- Validação CPF com checksum oficial
- Sistema de cartões tokenizados
- Correção deployment (portas 3001/5000)
- Scripts de produção otimizados

Arquivos: arenaPaymentHelper, ArenaPaymentModal, types, server.js"
```

## Para Alpha Dualite
A plataforma lerá o CHANGELOG-CPF-VALIDATION.md (menos de 350 tokens) que contém o resumo completo das alterações.
