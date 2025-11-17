# MatchPlay - Guia de Deployment

## ⚙️ Configuração de Deployment

O projeto está configurado para deployment no Replit usando **VM (Virtual Machine)**:

### Arquitetura:
- **Target**: VM (mantém backend e frontend rodando continuamente)
- **Build**: `npm run build` (compila React/TypeScript para produção)
- **Run**: `bash start-production.sh` (script otimizado que gerencia ambos processos)

### Portas em Produção:
- **Backend (server.js)**: porta 3001 (variável `ASAAS_PORT`)
- **Frontend (Vite preview)**: porta 5000 → mapeada para porta 80 externa
- **Proxy Vite**: Desativado em produção (frontend usa conexão direta `localhost:3001`)

### Script de Inicialização:
O arquivo `start-production.sh` gerencia a inicialização sequencial e verifica a saúde dos processos:
1. Inicia backend na porta 3001
2. Aguarda 3 segundos
3. Verifica se backend iniciou com sucesso
4. Inicia frontend na porta 5000
5. Aguarda ambos os processos

---

## 🚀 Como Fazer Deployment

### Passo 1: Preparar o Código
Certifique-se de que todas as alterações foram salvas e testadas em desenvolvimento.

### Passo 2: Iniciar Deployment
1. No topo do Replit, clique em **"Deploy"** ou **"Deployments"**
2. Na aba **"Overview"**, clique em **"Publish"** ou **"Republish"**

### Passo 3: Aguardar Build
- ⏳ **Build** (~20-30 segundos): Compilando TypeScript/React
- ⏳ **Deploy** (~30-60 segundos): Subindo para produção
- ✅ **Success**: Deployment concluído

### Passo 4: Testar
1. Abra uma **aba anônima** (Ctrl+Shift+N)
2. Acesse o link do deployment
3. Teste as funcionalidades principais

---

## ⚠️ Troubleshooting

### Erro: "HTTP 503 Service Unavailable"
**Causa**: Erro temporário de infraestrutura do Replit (container registry indisponível)

**Solução**:
1. Aguarde 2-3 minutos
2. Clique em **"Deploy"** novamente
3. Se persistir, aguarde 10-15 minutos e tente novamente

Este é um erro **temporário** do lado do Replit, não um problema com o código.

### Erro: "Port 5000 is in use"
**Causa**: Conflito de portas entre backend e frontend

**Solução**: Já corrigido no script `start-production.sh`
- Backend usa `ASAAS_PORT=3001`
- Frontend usa porta 5000 com `--strictPort`

### Erro: "Health check failed"
**Causa**: Aplicação não está respondendo na porta 80

**Solução**: 
- Verifique se o script `start-production.sh` está marcado como executável
- Verifique logs de deployment para identificar qual processo falhou

---

## 📊 Diferenças: Desenvolvimento vs Produção

### Desenvolvimento (localhost):
```
Frontend (Vite Dev): http://localhost:5000
Backend (Express): http://localhost:3001
Proxy Vite: /api/asaas → localhost:3001 ✅
```

### Produção (deployment):
```
Frontend (Vite Preview): http://your-app.replit.app (porta 5000→80)
Backend (Express): localhost:3001 (interno)
Frontend → Backend: http://localhost:3001/api/asaas ✅
```

---

## 🔄 Atualizando Deployment

Sempre que fizer alterações no código:

1. **Teste em desenvolvimento** primeiro
2. **Faça commit das mudanças** (Replit faz automaticamente)
3. **Republique** clicando em "Republish" no painel de Deployments
4. **Limpe o cache** do navegador antes de testar (Ctrl+Shift+Delete)

---

## ✅ Checklist Antes de Republicar

- [ ] Código testado em desenvolvimento
- [ ] Build funcionando: `npm run build`
- [ ] Workflows rodando sem erros
- [ ] Validação de CPF funcionando
- [ ] Integração Asaas configurada
- [ ] Cartões salvos funcionando
- [ ] Sem arquivos temporários ou de teste

---

## 📝 Logs e Debug em Produção

Para visualizar logs do deployment:

1. Vá em **"Deployments"**
2. Clique na aba **"Logs"**
3. Selecione o deployment ativo
4. Veja logs em tempo real do backend e frontend

---

**Última atualização**: 17 de novembro de 2025
