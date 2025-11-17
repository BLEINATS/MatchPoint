#!/bin/bash

# Script para iniciar backend e frontend em produção
echo "🚀 Iniciando MatchPlay em produção..."

# Inicia o backend (servidor proxy Asaas)
echo "📦 Iniciando backend (porta 3001)..."
ASAAS_PORT=3001 node server.js &
BACKEND_PID=$!

# Aguarda 3 segundos para garantir que o backend iniciou
sleep 3

# Verifica se o backend está rodando
if ps -p $BACKEND_PID > /dev/null; then
   echo "✅ Backend iniciado com sucesso (PID: $BACKEND_PID)"
else
   echo "❌ Erro ao iniciar backend"
   exit 1
fi

# Inicia o frontend (Vite preview)
echo "🎨 Iniciando frontend (porta 5000)..."
npx vite preview --host 0.0.0.0 --port 5000 --strictPort &
FRONTEND_PID=$!

# Aguarda ambos os processos
wait $BACKEND_PID $FRONTEND_PID
