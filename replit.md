# MatchPlay - Sports Court Reservation System

## Overview
MatchPlay is a comprehensive SaaS platform designed for managing sports court reservations. Built with React, TypeScript, and Vite, it offers a complete solution for court scheduling, financial management, tournament organization, event management, and client engagement. The platform aims to streamline operations for sports facilities, providing tools for student/player management, instructor management, and even an integrated store/shop functionality. It supports multi-arena operations and includes a robust payment system via Asaas for various transaction types.

## Recent Changes (November 17, 2025)

### ✅ Completed Migrations
1. **Planos e Assinaturas**: Migrated from localStorage to Supabase
   - SuperAdmin creates arenas/subscriptions → Saved to Supabase
   - Arena Admin views subscription → Reads from Supabase
   - Data now syncs properly between SuperAdmin and Arena Admin contexts
   
2. **Asaas API Key**: Migrated from file storage to Supabase  
   - Created `asaas_config` table in Supabase
   - API key persists permanently
   - Modal shows visual indicators when API Key is configured

3. **Free Trial Support**: Fixed payment logic for different plan types
   - **Free plans** (price=0): Create local subscription without Asaas payment
   - **Paid plans WITHOUT trial**: Create Asaas subscription, first charge in 7 days
   - **Paid plans WITH trial** (price>0, trial_days>0): Create Asaas subscription, first charge AFTER trial period
   - No more "O campo value deve ser informado" error

4. **Complete Supabase Migration**: All 51 files migrated from localStorage to Supabase
   - **100% of tables** now use Supabase PostgreSQL database
   - Migrated all arena-specific tables: quadras, reservas, alunos, professores, turmas, torneios, eventos, etc
   - Replaced `localApi` with `supabaseApi` across entire codebase
   - Data now persists permanently and syncs across deploy/dev (if using same Supabase project)

5. **Supabase Storage Integration**: Real photo upload/delete implemented
   - Created `supabaseStorage.ts` with uploadPhoto/deletePhoto functions
   - Photos save to Supabase Storage bucket 'photos' (requires manual setup)
   - Automatic fallback to blob URLs if Storage not configured
   - Supports: arena logos, court photos, student avatars, product images
   - See `SUPABASE-STORAGE-SETUP.md` for configuration instructions

6. **User Registration System**: Fully implemented and integrated with Supabase (Nov 17, 2025 - 20:53)
   - Fixed empty signUp() function that prevented user registration
   - Supabase auto-generates UUIDs for profiles and arenas (gen_random_uuid())
   - Email uniqueness enforced by database UNIQUE constraint
   - Duplicate email detection with proper error messages
   - Rollback mechanism: if arena creation fails, profile is deleted
   - Supports registration for: Admin Arena (creates profile + arena), Cliente/Aluno (creates profile only)
   - See `SISTEMA-CADASTRO-USUARIOS.md` for complete documentation

7. **Plan Status Banner & Renewals System**: Fully functional plan management (Nov 17, 2025 - 21:16)
   - **PlanStatusBanner** displays at top of dashboard for all arena admins/staff
   - **5 States Supported**:
     - Loading: hidden (prevents visual flash during data fetch)
     - Error: gray banner with reload message (Supabase connection errors)
     - No Plan: orange banner with CTA to contract plan
     - Active: blue banner showing plan name and next billing date
     - Past Due: yellow banner warning about pending payment
     - Expired: red banner with renewal CTA
   - **Error Handling**: Added `error` flag to `useSubscriptionStatus` hook
   - **Plan Changes**: `handleChangePlan` in SuperAdmin correctly calculates next_payment_date
   - **Plan Creation**: `createAsaasSubscription` saves correctly to Supabase for free and paid plans
   - All data persists correctly in `subscriptions` table with proper dates

### ⚠️ Configuration Required
- **Supabase Storage Bucket**: Bucket 'photos' must be created manually in Supabase dashboard with RLS policies. See `SUPABASE-STORAGE-SETUP.md` for step-by-step instructions.
- **Deploy ↔ Development Sync**: If using different Supabase projects for deploy and development, data will NOT sync between them. See `SUPABASE-SYNC-GUIDE.md` for solutions.

## User Preferences
- None specified yet

## System Architecture

**Backend: Supabase PostgreSQL Database (100% Migrated)**
The application now uses Supabase (PostgreSQL) as the **ONLY** database backend.

**✅ ALL TABLES MIGRATED TO SUPABASE:**

**Global Tables** (no arena_id):
- `profiles`, `arenas`, `subscriptions`, `plans`, `friendships`, `credit_cards`, `asaas_config`

**Arena-Specific Tables** (with arena_id):
- `quadras`, `reservas`, `alunos`, `professores`, `turmas`
- `torneios`, `eventos`, `notificacoes`
- `products`, `rental_items`, `pricing_rules`, `duration_discounts`
- `atletas_aluguel`, `planos_aula`, `credit_transactions`
- `gamification_settings`, `gamification_levels`, `gamification_rewards`
- `gamification_achievements`, `aluno_achievements`, `gamification_point_transactions`
- `redeemed_vouchers`, `finance_transactions`

**Infrastructure:**
- **Supabase Client** (`src/lib/supabaseClient.ts`) for direct database access
- **Supabase API** (`src/lib/supabaseApi.ts`) CRUD wrapper used throughout the app
- **Supabase Storage** (`src/lib/supabaseStorage.ts`) for photo uploads/storage
- **localStorage REMOVED** - All data now persists in PostgreSQL database
- **Row Level Security (RLS)** policies for data access control

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
- **Supabase**: PostgreSQL database hosting with real-time capabilities, Row Level Security, authentication, and Storage for photos
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