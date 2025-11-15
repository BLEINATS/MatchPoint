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

## Recent Changes
**November 15, 2025**
- Initial Replit setup
- Configured Vite to run on port 5000 with 0.0.0.0 host
- Set up HMR over WebSocket (WSS) for Replit proxy compatibility
- Verified application loads and seeds data correctly
