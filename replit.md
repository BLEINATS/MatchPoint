# MatchPlay - Sports Court Reservation System

## Overview
MatchPlay is a comprehensive SaaS platform for managing sports court reservations, built with React, TypeScript, and Vite. The application provides a complete solution for court scheduling, financial management, tournaments, and client engagement.

## Project Structure
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router v6
- **Data Storage**: Local browser storage (localStorage)
- **Language**: Portuguese (pt-BR)

## Key Features
- Court reservation management
- Student/player management (Alunos/Atletas)
- Tournament organization (Torneios)
- Event management (Eventos)
- Financial tracking (Financeiro)
- Gamification system
- Professor/instructor management
- Store/shop functionality (Loja)
- Multi-arena support
- **Asaas Payment Gateway Integration** (boleto, PIX, cartão de crédito)

## Technology Stack
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling framework
- **React Router**: Client-side routing
- **Framer Motion**: Animations
- **ECharts**: Data visualization
- **Lucide React**: Icon library

## Development Setup
The application is configured to run on Replit with:
- **Port**: 5000
- **Host**: 0.0.0.0 (allows proxy access)
- **HMR**: Configured for WebSocket over WSS on port 443

## Important Notes
- The application uses **local storage** for data persistence (no backend server)
- Supabase client is mocked (`src/lib/supabaseClient.ts`)
- All API calls are redirected to `src/lib/localApi.ts`
- Initial seed data is loaded on first run

## Running the Project
O projeto possui dois workflows configurados que rodam automaticamente:
```bash
# Frontend (Vite) - porta 5000
npm run dev

# Backend (Proxy Asaas) - porta 3001
npm run server

# Ou rodar ambos simultaneamente
npm run start
```

## Build for Production
```bash
npm run build
```

## Architecture Decisions
**Date**: November 15, 2025
- **Local-first architecture**: Using localStorage instead of backend database for data persistence
- **Vite configuration**: Customized for Replit environment with host allowance and HMR over WSS
- **No backend server**: Pure frontend application with mocked API layer

## User Preferences
- None specified yet

## Asaas Payment Integration
**Implementado em**: November 15, 2025

A integração completa com o gateway de pagamento Asaas permite que o Super Admin configure e gerencie cobranças das arenas de forma profissional.

### Arquitetura:
- **Backend Proxy** (`server.js`): Servidor Express na porta 3001 que faz proxy das chamadas para API do Asaas
- **API Key Storage**: Armazenada de forma segura no backend (`.asaas-config.json`, não versionado no Git)
- **Frontend**: Comunica-se apenas com o proxy através de `/api/asaas`, nunca diretamente com Asaas (evita problemas de CORS)
- **Vite Proxy**: Configurado para redirecionar requisições de `/api/asaas` para `http://localhost:3001` durante desenvolvimento

### Componentes Implementados:
1. **AsaasProxyService** (`src/lib/asaasProxyService.ts`): Cliente que se comunica com o proxy backend
2. **AsaasService** (`src/lib/asaasService.ts`): Biblioteca original de integração (tipos e interfaces)
3. **Server Proxy** (`server.js`): Servidor Express que intermedia chamadas para Asaas
4. **AsaasConfigModal** (`src/components/SuperAdmin/AsaasConfigModal.tsx`): Configuração de API key com teste de conexão
5. **SubscriptionsPanel** (`src/components/SuperAdmin/SubscriptionsPanel.tsx`): Painel de gerenciamento de assinaturas
6. **PaymentModal** (`src/components/SuperAdmin/PaymentModal.tsx`): Processamento de pagamentos
7. **asaasHelper** (`src/utils/asaasHelper.ts`): Funções auxiliares para gestão de assinaturas

### Funcionalidades:
- ✅ Configuração de API key (sandbox/produção) com teste de conexão
- ✅ Criação automática de clientes no Asaas
- ✅ Criação de assinaturas recorrentes
- ✅ Suporte a pagamentos via **Boleto Bancário** (com URL para visualização/impressão)
- ✅ Suporte a pagamentos via **PIX** (com QR Code e código copia-e-cola)
- ✅ Suporte a pagamentos via **Cartão de Crédito**
- ✅ Painel com estatísticas e filtros de assinaturas (SuperAdmin)
- ✅ Gerenciamento de status de assinaturas
- ✅ **Contratação de planos pelo dono da arena** (Settings > Plano e Faturamento)

### Como Testar:

**Como Super Admin:**
1. Acesse o sistema como Super Admin (email: `superadmin@matchplay.com`)
2. No menu lateral, clique em "Super Admin"
3. Clique no botão "Configurar Asaas" no topo da página
4. Insira sua API key do Asaas (sandbox ou produção)
5. Teste a conexão
6. Na aba "Assinaturas Asaas", visualize e gerencie assinaturas
7. Use o botão "Trocar Plano" em uma arena para simular criação de assinatura

**Como Dono da Arena:**
1. Acesse o sistema como Admin/Dono de arena
2. Vá em "Configurações" no menu lateral
3. Na aba "Plano e Faturamento", visualize seu plano atual
4. Clique em "Contratar Plano" em um dos planos disponíveis
5. Selecione o método de pagamento (Boleto, PIX ou Cartão)
6. Complete o pagamento conforme o método escolhido

### Campos Adicionados:
- `Arena.asaas_customer_id`: ID do cliente no Asaas
- `Subscription.asaas_subscription_id`: ID da assinatura no Asaas
- `Subscription.asaas_customer_id`: ID do cliente vinculado
- `Subscription.next_payment_date`: Próxima data de cobrança

## Sistema de Pagamento para Arena Admin
**Implementado em**: November 16, 2025

Sistema completo de processamento de pagamentos para alunos/clientes da arena (reservas, torneios, etc.) com suporte a Asaas e modo simulação local.

### Arquitetura:
- **arenaPaymentHelper** (`src/utils/arenaPaymentHelper.ts`): Helper para criar cobranças e clientes no Asaas
- **ArenaPaymentModal** (`src/components/Shared/ArenaPaymentModal.tsx`): Componente reutilizável para processar pagamentos
- **Integração com ReservationModal**: Pagamento de reservas de quadras
- **Integração com TournamentPaymentModal**: Pagamento de inscrições em torneios
- **Fallback Local**: Simulação completa quando Asaas não está configurado

### Funcionalidades:
- ✅ Criação automática de clientes no Asaas
- ✅ Processamento de pagamentos via **Boleto, PIX e Cartão de Crédito**
- ✅ **Modo Simulação**: Funciona perfeitamente sem Asaas configurado (dados mockados)
- ✅ Boleto: linha digitável com botão copiar + download PDF
- ✅ PIX: QR Code grande + código copia-e-cola + timer de expiração
- ✅ Cartão: confirmação com status e detalhes do pagamento
- ✅ Tratamento robusto de erros com retry e fallback

### Campos Adicionados aos Tipos:
- `Aluno.asaas_customer_id`: ID do cliente no Asaas
- `Profile.asaas_customer_id`: ID do cliente no Asaas
- `Profile.cpf_cnpj`: CPF/CNPJ para compatibilidade
- `Reserva.asaas_payment_id`: ID do pagamento no Asaas

### Como Usar:
1. **Com Asaas configurado**: Pagamentos reais são processados via gateway Asaas
2. **Sem Asaas**: Sistema simula pagamentos automaticamente com dados mockados realistas

### Validação Obrigatória de Pagamento:
**Implementado em**: November 16, 2025

Sistema de validação que **bloqueia a criação de reservas e inscrições em torneios até confirmação de pagamento** quando Asaas está configurado na arena.

#### Comportamento por Tipo de Pagamento:
1. **Cartão de Crédito**:
   - Status retornado pelo Asaas: `CONFIRMED`
   - Reserva criada imediatamente com `status='confirmada'`, `payment_status='pago'`
   - Inscrição marcada como `payment_status='pago'` imediatamente
   - Transação financeira registrada

2. **Boleto / PIX**:
   - Status retornado pelo Asaas: `PENDING`
   - Reserva criada com `status='aguardando_pagamento'`, `payment_status='pendente'`
   - Inscrição marcada como `payment_status='pendente'`
   - Transação financeira **não** registrada (aguarda webhook de confirmação)
   - Quando webhook do Asaas confirmar pagamento → atualiza para 'pago' e registra transação

3. **Modo Simulação** (sem Asaas configurado):
   - Todos os pagamentos marcados como `status='confirmada'`, `payment_status='pago'`
   - Funciona perfeitamente para testes e arenas sem integração Asaas

#### Arquivos Modificados:
- `arenaPaymentHelper.ts`: `checkAsaasConfigForArena()` valida `Arena.asaas_api_key`
- `ArenaPaymentModal.tsx`: Callback retorna `{ paymentId, isRealPayment, status }`
- `ReservationModal.tsx`: Intercepta fluxo e exige pagamento antes de criar reserva
- `TournamentPaymentModal.tsx`: Interface atualizada para processar callback com status
- `TorneioPublico.tsx` (3 versões): Handlers atualizam status baseado em tipo de pagamento

#### Próximos Passos (Recomendado):
- Implementar webhook handlers para atualizar reservas/torneios pendentes quando Asaas confirmar PIX/boleto
- Adicionar endpoint `/api/asaas/webhook` no `server.js` para receber notificações do Asaas
- Criar serviço para atualizar status de `pendente` → `pago` automaticamente

## Recent Changes
**November 16, 2025**
- **✅ Validação de CPF obrigatória e Cartões Salvos implementados**
  - Validação de CPF: sistema agora valida se cliente tem CPF cadastrado antes de processar pagamento
  - Erro claro se CPF não cadastrado: "CPF não cadastrado. Por favor, cadastre seu CPF antes de realizar o pagamento"
  - **Validação robusta**: bloqueia CPFs fake com dígitos repetidos (00000000000, 11111111111, etc.)
  - **Validação de checksum completa**: valida dígitos verificadores do CPF/CNPJ usando algoritmo oficial da Receita Federal
  - CPF normalizado: remove formatação (pontos e traços) antes de enviar ao Asaas
  - Mensagens de erro específicas para diferentes tipos de problemas no CPF
  - Tokenização de cartões: cartões salvos automaticamente após primeiro pagamento bem-sucedido
  - Interface para selecionar cartão salvo ou adicionar novo cartão
  - Cartões salvos incluem: bandeira, últimos 4 dígitos, nome do titular, token Asaas
  - Checkbox "Salvar este cartão para pagamentos futuros" em novos cartões
  - Pagamentos futuros usando token: não precisa reinserir dados do cartão
  - Tipos atualizados: CreditCardInfo com asaas_token, Aluno e Profile com credit_cards[]
- **✅ Validação obrigatória de pagamento implementada e aprovada pelo architect**
  - Reservas e torneios agora bloqueiam até confirmação real via Asaas quando configurado
  - Cartão aprovado: status confirmado imediatamente
  - Boleto/PIX: status aguardando_pagamento até webhook confirmar
  - asaas_payment_id persistido em reservas e participantes de torneios
  - Transação financeira só registrada após pagamento confirmado
  - Fallback local funciona perfeitamente sem Asaas configurado
- **Implementado sistema completo de pagamento para Arena Admin**
  - arenaPaymentHelper.ts: Helper para criar cobranças e clientes no Asaas
  - ArenaPaymentModal.tsx: Componente reutilizável para processar pagamentos
  - Integração com ReservationModal para pagamento de reservas
  - Integração com TournamentPaymentModal para pagamento de torneios
  - Fallback local completo: simula pagamentos quando Asaas não está configurado
  - Boleto, PIX e Cartão funcionam 100% localmente sem depender de links externos
  - Tipos atualizados com campos asaas_customer_id e asaas_payment_id
- **Implementado processamento de pagamento 100% local para Super Admin**
  - PaymentModal refatorado para processar pagamentos sem depender de links externos
  - Endpoint /api/asaas/payments/:id/bankSlip corrigido para retornar PDF real

**November 15, 2025**
- Initial Replit setup
- Configured Vite to run on port 5000 with 0.0.0.0 host
- Set up HMR over WebSocket (WSS) for Replit proxy compatibility
- Verified application loads and seeds data correctly
- **Implementada integração completa com Asaas Payment Gateway**
  - Serviço de integração com API do Asaas
  - Componentes de configuração e gerenciamento no SuperAdmin
  - Suporte completo a boleto, PIX e cartão de crédito
  - Painel de gerenciamento de assinaturas com filtros e estatísticas
- **Implementado servidor proxy Node.js/Express para resolver problema de CORS**
  - Backend serverless rodando na porta 3001
  - API key armazenada de forma segura no backend (arquivo .asaas-config.json)
  - Frontend comunica-se com proxy que faz chamadas para API do Asaas
  - Solução corrige erro "Erro ao conectar com Asaas" causado por política CORS
