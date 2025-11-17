# MatchPlay - Sports Court Reservation System

## Overview
MatchPlay is a comprehensive SaaS platform designed for managing sports court reservations. Built with React, TypeScript, and Vite, it offers a complete solution for court scheduling, financial management, tournament organization, event management, and client engagement. The platform aims to streamline operations for sports facilities, providing tools for student/player management, instructor management, and even an integrated store/shop functionality. It supports multi-arena operations and includes a robust payment system via Asaas for various transaction types.

## User Preferences
- None specified yet

## System Architecture

**Backend: Supabase PostgreSQL Database**
The application now uses Supabase (PostgreSQL) as the primary database, replacing the previous localStorage implementation. The backend consists of:
- **30+ PostgreSQL tables** hosted on Supabase
- **Supabase Client** (`src/lib/supabaseClient.ts`) for direct database access from frontend
- **Supabase API** (`src/lib/supabaseApi.ts`) wrapper providing CRUD operations compatible with the old localApi interface
- **Row Level Security (RLS)** policies for data access control
- **Supabase Auth** for user authentication

**Frontend**
Built with React 18, TypeScript, and Vite, utilizing Tailwind CSS for styling, React Router v6 for routing, Framer Motion for animations, ECharts for data visualization, and Lucide React for icons.

**Backend Proxy Server**
A Node.js/Express backend proxy server runs on port 3001, primarily to handle Asaas payment gateway integrations and bypass CORS issues. This proxy is active in both development and production. In development, a Vite proxy redirects `/api/asaas` requests to `http://localhost:3001`. In production, the frontend directly calls `http://localhost:3001/api/asaas`.

**Deployment Configuration**
The application is configured for deployment on Replit using a **Reserved VM (Web Server)** target, ensuring both the frontend (Vite preview on port 5000) and the backend (Express server on port 3001, exposed on external port 80) run continuously. Health check endpoints (/ and /health) on the backend ensure fast deployment health checks.

**Migration Tool**
A migration utility (`/migration` route) allows transferring existing localStorage data to Supabase. The system maintains backward compatibility during the transition period.

Key features include:
- Court reservation management
- Student/player and Professor/instructor management
- Tournament and event organization
- Financial tracking
- Gamification system
- Store/shop functionality
- Multi-arena support
- Comprehensive Asaas payment integration for various payment methods (boleto, PIX, credit card).
- A robust payment validation system blocks reservations and tournament registrations until payment confirmation when Asaas is configured.
- CPF validation for payment processing, including checksum validation and blocking of invalid CPFs.
- Credit card tokenization and management of saved cards for recurring payments.

## External Dependencies

**Database & Backend:**
- **Supabase**: PostgreSQL database hosting with real-time capabilities, Row Level Security, and authentication
- **Asaas Payment Gateway**: Integrated for processing payments (boleto, PIX, credit card), managing subscriptions, and handling customer data
- **Express.js**: Node.js framework used for the backend proxy server (Asaas API)

**Frontend Stack:**
- **React 18**: Frontend UI library
- **TypeScript**: Superset of JavaScript for type safety
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router v6**: Declarative routing for React
- **Framer Motion**: Animation library
- **ECharts**: Data visualization library
- **Lucide React**: Icon library

## Database Schema

The Supabase PostgreSQL database contains 30+ tables organized in two categories:

**Global Tables (no arena_id):**
- `profiles` - Users and team members
- `arenas` - Arena/facility information
- `subscriptions` - Arena subscription data
- `plans` - Available subscription plans
- `friendships` - User connections
- `credit_cards` - Saved payment methods

**Arena-Specific Tables (with arena_id):**
- `quadras` - Courts/fields
- `reservas` - Reservations
- `alunos` - Students/players
- `professores` - Instructors/coaches
- `turmas` - Classes/sessions
- `torneios` - Tournaments
- `eventos` - Private events
- `notificacoes` - Notifications
- `products` - Store products
- `rental_items` - Rentable equipment
- `pricing_rules` - Dynamic pricing
- `duration_discounts` - Bulk booking discounts
- `atletas_aluguel` - Professional players for hire
- `planos_aula` - Lesson plans
- `credit_transactions` - Credit balance history
- `gamification_settings` - Gamification configuration
- `gamification_levels` - Player levels
- `gamification_rewards` - Redeemable rewards
- `gamification_achievements` - Achievement types
- `aluno_achievements` - Unlocked achievements
- `gamification_point_transactions` - Points history
- `redeemed_vouchers` - Used vouchers

See `supabase-schema.sql` and `BACKEND-SUPABASE-GUIDE.md` for complete details.