# 🚀 GUIA DEFINITIVO DE DEPLOYMENT - MatchPlay

## ⚠️ AÇÃO NECESSÁRIA: Mudar para Reserved VM

O deployment está **falhando** porque você está usando **Cloud Run (Autoscale)**, mas seu app precisa de **Reserved VM**.

### Por que falha com Autoscale?
- ❌ Cloud Run suporta apenas **1 processo**
- ❌ Seu app precisa de **2 processos** rodando simultaneamente:
  - Backend (Node.js na porta 3001)
  - Frontend (Vite na porta 5000)

### Por que funciona com Reserved VM?
- ✅ Suporta **múltiplos processos** contínuos
- ✅ Backend + frontend rodam **24/7**
- ✅ Ideal para apps com arquitetura separada
- ✅ **99.9% uptime**

---

## 🔧 PASSO A PASSO: Como Mudar para Reserved VM

### Passo 1: Abrir Painel de Deploy
1. **Clique no botão "Deploy"** (canto superior direito no Replit)
2. Você verá o painel de Deployments

### Passo 2: Ir para Configurações
1. **Clique na aba "Manage"** ou "Configuration"
2. Procure pela seção **"Deployment Type"**

### Passo 3: Mudar para Reserved VM
1. **Clique em "Change deployment type"**
2. **Selecione "Reserved VM"** ou **"Reserved VM (Web Server)"**
3. **Confirme** a mudança

### Passo 4: Fazer Deploy
1. **Clique no botão "Deploy"** ou "Publish"
2. **Aguarde 3-5 minutos** (pode demorar na primeira vez)
3. **Verifique o status** - deve ficar verde ✅

---

## ✅ Configurações Já Aplicadas Automaticamente

Não precisa mexer nessas configurações - já estão prontas:

| Configuração | Valor | Status |
|--------------|-------|--------|
| **Deployment Target** | Reserved VM | ✅ Configurado |
| **Build Command** | `npm run build` | ✅ Configurado |
| **Run Command** | `bash start-production.sh` | ✅ Configurado |
| **Health Endpoints** | `/` e `/health` | ✅ Adicionados |
| **Backend Port** | 3001 | ✅ Configurado |
| **Frontend Port** | 5000 | ✅ Configurado |

---

## 🎯 Resultado Esperado

### Após deployment bem-sucedido:

1. **Status Verde** ✅ no painel de deployments
2. **URL Pública** gerada (exemplo: `https://matchplay-xyz.repl.co`)
3. **Health check OK**: Acesse `https://sua-url/health` → Retorna `{"status":"healthy"}`
4. **App funcional**: Frontend carrega e conecta ao backend

### Testes para fazer:
```bash
# 1. Health check
https://sua-url/health → {"status":"healthy"}

# 2. API status
https://sua-url/ → {"status":"ok","service":"MatchPlay API"}

# 3. Frontend
https://sua-url → Página principal do app
```

---

## 🏗️ Arquitetura em Produção

```
Internet (Porta 80/443)
    ↓
┌─────────────────────────────┐
│  Reserved VM (Replit)       │
│                             │
│  ┌─────────────────────┐   │
│  │ Backend (porta 3001)│   │ ← Health checks
│  │ - Express API       │   │ ← Proxy Asaas
│  │ - Health endpoints  │   │
│  └─────────────────────┘   │
│            ↕                │
│  ┌─────────────────────┐   │
│  │ Frontend (porta 5000)│  │ ← Interface web
│  │ - Vite Preview      │   │
│  │ - React/TypeScript  │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
          ↓
    Supabase PostgreSQL
  (Banco de dados externo)
```

---

## 📋 Checklist Pré-Deploy

Antes de fazer o deploy, confirme:

- [x] **Código compilando**: `npm run build` funciona
- [x] **Backend rodando**: `node server.js` inicia sem erros
- [x] **Frontend rodando**: `npm run dev` carrega a página
- [x] **Supabase conectado**: Variáveis de ambiente configuradas
- [ ] **Mudou para Reserved VM**: ⚠️ **VOCÊ PRECISA FAZER ISSO MANUALMENTE**
- [x] **Health checks**: Endpoints `/` e `/health` funcionando

---

## 🔐 Variáveis de Ambiente

Certifique-se de que estão configuradas nos **Secrets** do Replit:

### Obrigatórias (já configuradas):
- ✅ `SUPABASE_URL` 
- ✅ `SUPABASE_ANON_KEY`

### Opcionais (para pagamentos):
- `ASAAS_API_KEY` - Configure quando ativar pagamentos
- `ASAAS_SANDBOX` - `true` para testes, `false` para produção

**Nota**: As configurações Asaas também podem ser feitas via interface do app.

---

## 🐛 Troubleshooting

### Deployment ainda falha após mudar para VM?

**Erro: "Health check timeout"**
```bash
# Teste localmente:
curl http://localhost:3001/health
# Deve retornar: {"status":"healthy"}
```

**Solução**: 
1. Reinicie os workflows (backend + dev)
2. Aguarde 30 segundos
3. Teste novamente

---

**Erro: "Port already in use"**
```bash
# Mate processos nas portas:
killall node
npm run dev
```

---

**Erro: "Build failed"**
```bash
# Limpe cache e tente novamente:
rm -rf dist node_modules/.vite
npm install
npm run build
```

---

### Onde está a opção "Change deployment type"?

**Localização exata no Replit:**
```
1. Botão "Deploy" (topo direito)
2. Aba "Manage" (segunda aba)
3. Seção "Deployment Type" 
4. Botão "Change deployment type"
5. Opção "Reserved VM"
```

Se não encontrar, tente:
- Atualizar a página do Replit
- Verificar se tem permissões de admin no projeto
- Fechar e reabrir o painel de Deployments

---

## 💰 Custo do Reserved VM

- **Reserved VM**: Custo fixo mensal (~$7-20/mês dependendo do plano)
- **Autoscale**: Cobra por uso, mas **não funciona** para seu app

**Recomendação**: Use Reserved VM - é a única opção viável para sua arquitetura de backend + frontend contínuos.

---

## 🎉 Após Deploy Bem-Sucedido

### Próximos passos:
1. ✅ **Teste todas as funcionalidades** na URL pública
2. ✅ **Configure domínio customizado** (opcional)
3. ✅ **Monitore logs** regularmente
4. ✅ **Configure backups** do Supabase
5. ✅ **Habilite RLS** no Supabase (segurança)

### Monitoramento contínuo:
- **Logs**: Painel Deploy → Aba "Logs"
- **Status**: Painel Deploy → Aba "Status"
- **Métricas**: Painel Deploy → Aba "Metrics" (se disponível)

---

## 📞 Precisa de Ajuda?

Se mesmo após mudar para Reserved VM o deploy falhar:

1. **Capture os logs** (painel Deploy → Logs)
2. **Verifique o erro específico**
3. **Compartilhe os logs** para diagnóstico
4. **Teste localmente** antes: `bash start-production.sh`

---

## ✅ Resumo Rápido

**O que você precisa fazer:**
1. Abrir painel Deploy
2. Clicar em "Manage"
3. Mudar de Autoscale para **Reserved VM**
4. Clicar em Deploy
5. Aguardar 3-5 minutos
6. Testar a URL pública ✅

**Tudo o mais já está configurado automaticamente!** 🚀

---

**Última atualização**: 17/11/2025
**Status**: ✅ Pronto para deploy (só falta mudar para Reserved VM manualmente)
