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
The dev workflow is already configured and runs automatically:
```bash
npm run dev
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

### Componentes Implementados:
1. **AsaasService** (`src/lib/asaasService.ts`): Biblioteca completa de integração com API do Asaas
2. **AsaasConfigModal** (`src/components/SuperAdmin/AsaasConfigModal.tsx`): Configuração de API key com teste de conexão
3. **SubscriptionsPanel** (`src/components/SuperAdmin/SubscriptionsPanel.tsx`): Painel de gerenciamento de assinaturas
4. **PaymentModal** (`src/components/SuperAdmin/PaymentModal.tsx`): Processamento de pagamentos
5. **asaasHelper** (`src/utils/asaasHelper.ts`): Funções auxiliares para gestão de assinaturas

### Funcionalidades:
- ✅ Configuração de API key (sandbox/produção) com teste de conexão
- ✅ Criação automática de clientes no Asaas
- ✅ Criação de assinaturas recorrentes
- ✅ Suporte a pagamentos via **Boleto Bancário** (com URL para visualização/impressão)
- ✅ Suporte a pagamentos via **PIX** (com QR Code e código copia-e-cola)
- ✅ Suporte a pagamentos via **Cartão de Crédito**
- ✅ Painel com estatísticas e filtros de assinaturas
- ✅ Gerenciamento de status de assinaturas

### Como Testar:
1. Acesse o sistema como Super Admin (email: `superadmin@matchplay.com`)
2. No menu lateral, clique em "Super Admin"
3. Clique no botão "Configurar Asaas" no topo da página
4. Insira sua API key do Asaas (sandbox ou produção)
5. Teste a conexão
6. Na aba "Assinaturas Asaas", visualize e gerencie assinaturas
7. Use o botão "Trocar Plano" em uma arena para simular criação de assinatura

### Campos Adicionados:
- `Arena.asaas_customer_id`: ID do cliente no Asaas
- `Subscription.asaas_subscription_id`: ID da assinatura no Asaas
- `Subscription.asaas_customer_id`: ID do cliente vinculado
- `Subscription.next_payment_date`: Próxima data de cobrança

## Recent Changes
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
