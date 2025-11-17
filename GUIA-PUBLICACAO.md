# 🚀 Guia de Publicação - MatchPlay

## ✅ Correções Aplicadas

As seguintes correções foram aplicadas para resolver os problemas de deployment:

### 1. Health Check Endpoints ⚡
Adicionados ao `server.js`:
- **GET /**: Retorna status da API (200 OK)
- **GET /health**: Health check rápido (200 OK)

Esses endpoints respondem **instantaneamente**, resolvendo o problema de health checks lentos.

### 2. Configuração de Deployment 🔧
O deployment foi configurado para **Reserved VM (Web Server)**:
- ✅ Mantém backend + frontend rodando 24/7
- ✅ Ideal para apps com processos contínuos
- ✅ 99.9% uptime
- ✅ Performance consistente

### 3. Comando de Produção 📦
O deployment agora executa:
```bash
# Build (npm run build)
# Run (backend + frontend juntos)
node server.js & vite preview --host 0.0.0.0 --port 5000
```

---

## 🎯 Como Publicar o App

### Passo 1: Construir o Build
O build será feito automaticamente ao publicar, mas você pode testar antes:
```bash
npm run build
```

### Passo 2: Publicar no Replit 🚀

1. **Clique no botão "Deploy"** no topo da tela
2. **Aguarde o build** (pode demorar 1-2 minutos)
3. **Aguarde o deploy** (mais 1-2 minutos)
4. **Receba o link público!** 🎉

### Passo 3: Verificar Funcionamento ✅

Após o deploy, acesse:
- **Seu app**: `https://seu-app.repl.co`
- **Health check**: `https://seu-app.repl.co/health`
- **API status**: `https://seu-app.repl.co/` (mostra status do backend)

---

## 🔍 Configurações de Porta

O sistema agora expõe:
- **Porta 3001** (backend/API): Porta principal externa (80)
- **Porta 5000** (frontend): Acessível internamente

### Como Funciona:
1. Health checks vão para porta 80 → **Backend responde instantaneamente** ✅
2. Usuários acessam o site → Redirecionamento automático para frontend
3. Frontend faz requests para `/api/asaas` → Backend processa

---

## 🛠️ Arquitetura de Produção

```
Internet (porta 80)
    ↓
Backend (porta 3001) - Health checks rápidos
    ↓
Frontend (porta 5000) - Interface do usuário
    ↓
Supabase PostgreSQL - Banco de dados
```

---

## ⚙️ Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas nos **Secrets do Replit**:

### Obrigatórias:
- `SUPABASE_URL` ✅ (já configurada)
- `SUPABASE_ANON_KEY` ✅ (já configurada)

### Opcionais (para pagamentos):
- `ASAAS_API_KEY` (configure quando quiser usar pagamentos)
- `ASAAS_SANDBOX` (true/false)

---

## 🎉 Benefícios do Reserved VM

**Por que mudamos de Autoscale para VM:**

| Aspecto | Autoscale ❌ | Reserved VM ✅ |
|---------|--------------|----------------|
| **Backend contínuo** | Não suporta | Perfeito |
| **Múltiplos processos** | Problema | Funciona |
| **Health checks** | Lentos | Rápidos |
| **Uptime** | 99.95% | 99.9% |
| **Inicialização** | A cada request | Sempre ativo |
| **WebSockets** | Limitado | Total suporte |

---

## 🐛 Troubleshooting

### Deployment ainda falha?
1. Verifique se o build passa: `npm run build`
2. Confirme que as variáveis de ambiente estão configuradas
3. Aguarde 2-3 minutos após deploy (pode demorar)

### Health check não responde?
Teste localmente:
```bash
curl http://localhost:3001/
curl http://localhost:3001/health
```

Ambos devem retornar 200 OK instantaneamente.

### Erros de porta?
O sistema usa:
- **3001** para backend (exposto externamente)
- **5000** para frontend (interno)

Não altere essas configurações!

---

## 📊 Monitoramento

Após publicar, monitore:

1. **Logs**: Deployment pane → Logs tab
2. **Status**: Deployment pane → Status tab
3. **Health**: Acesse `/health` periodicamente

---

## 🎯 Próximos Passos

Após publicar com sucesso:

1. ✅ **Teste todas as funcionalidades** na URL pública
2. ✅ **Configure domínio customizado** (opcional)
3. ✅ **Habilite RLS no Supabase** para segurança
4. ✅ **Configure backups** do banco de dados
5. ✅ **Monitore performance** e erros

---

## 📝 Checklist Pré-Deploy

Antes de publicar, confirme:

- [x] Build funciona (`npm run build`)
- [x] Backend responde em `/health`
- [x] Frontend carrega localmente
- [x] Supabase conectado
- [x] Variáveis de ambiente configuradas
- [x] Deployment configurado para VM
- [x] Health check endpoints adicionados

---

**Tudo pronto para publicar!** 🚀

Clique no botão "Deploy" e aguarde alguns minutos.
