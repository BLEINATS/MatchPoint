#!/bin/bash

# Script de commit único para GitHub (< 350 tokens)

echo "🚀 Preparando commit..."

# Adiciona todos os arquivos modificados
git add .

# Commit com mensagem compacta
git commit -m "feat: validação CPF + cartões salvos + deploy

✅ Validação CPF/CNPJ com checksum oficial
✅ Cartões tokenizados via Asaas  
✅ Fix deployment: portas 3001/5000
✅ Script produção otimizado

Arquivos:
- arenaPaymentHelper: validação CPF completa
- ArenaPaymentModal: seleção cartões salvos
- types: CreditCardInfo + asaas_customer_id
- server/vite: config deployment corrigida
- start-production.sh: script robusto

Detalhes: CHANGELOG-CPF-VALIDATION.md"

echo "✅ Commit criado!"
echo ""
echo "Para enviar ao GitHub, execute:"
echo "  git push origin main"
