# MatchPlay - Sports Court Reservation System

## Overview
MatchPlay is a comprehensive SaaS platform designed for managing sports court reservations. It offers a complete solution for court scheduling, financial management, tournament organization, event management, and client engagement. The platform aims to streamline operations for sports facilities, providing tools for student/player management, instructor management, and an integrated store/shop functionality. It supports multi-arena operations and includes a robust payment system via Asaas.

## User Preferences
- None specified yet

## System Architecture

MatchPlay utilizes a modern web stack with a clear separation of concerns.

**Frontend:**
Built with React 18, TypeScript, and Vite.
-   **Styling:** Tailwind CSS
-   **Routing:** React Router v6
-   **Animations:** Framer Motion
-   **Data Visualization:** ECharts
-   **Icons:** Lucide React

**Backend & Database:**
The system is 100% migrated to Supabase, serving as the sole database backend.
-   **Database:** Supabase PostgreSQL for all persistent data.
    -   **Global Tables:** `profiles`, `arenas`, `subscriptions`, `plans`, `friendships`, `credit_cards`, `asaas_config`.
    -   **Arena-Specific Tables:** `quadras`, `reservas`, `alunos`, `professores`, `turmas`, `torneios`, `eventos`, `notificacoes`, `products`, `rental_items`, `pricing_rules`, `duration_discounts`, `atletas_aluguel`, `planos_aula`, `credit_transactions`, `gamification_settings`, `gamification_levels`, `gamification_rewards`, `gamification_achievements`, `aluno_achievements`, `gamification_point_transactions`, `redeemed_vouchers`, `finance_transactions`.
-   **Data Access:** `src/lib/supabaseClient.ts` for direct access, `src/lib/supabaseApi.ts` as a CRUD wrapper.
-   **File Storage:** Supabase Storage (`src/lib/supabaseStorage.ts`) for photo uploads (arena logos, court photos, student avatars, product images). Requires manual 'photos' bucket creation and RLS policies.
-   **Security:** Row Level Security (RLS) policies are implemented for data access control.

**Backend Proxy Server:**
A Node.js/Express backend proxy server (running on port 3001) handles Asaas payment gateway integrations and resolves CORS issues. This server is active in both development and production environments.

**Deployment:**
Configured for deployment on Replit using a Reserved VM (Web Server) target. Both the frontend (Vite preview on port 5000) and the backend (Express server on port 3001) run continuously. Health check endpoints (`/` and `/health`) are provided for quick deployment status.

**Key Features:**
-   Comprehensive court reservation and scheduling.
-   Management of students/players and instructors.
-   Tournament and event organization.
-   Financial tracking and gamification system.
-   Integrated store/shop functionality.
-   Support for multi-arena operations.
-   Robust Asaas payment integration for various methods (boleto, PIX, credit card), including payment validation and credit card tokenization.
-   User registration and plan management system with automated plan status tracking and renewal logic.

## External Dependencies

**Database & Backend:**
-   **Supabase**: PostgreSQL database, real-time capabilities, authentication, and Storage.
-   **Asaas Payment Gateway**: For payment processing, subscription management, and customer data.
-   **Express.js**: Node.js framework for the backend proxy server.

**Frontend Stack:**
-   **React 18**: Frontend UI library.
-   **TypeScript**: Type safety for JavaScript.
-   **Vite**: Build tool and development server.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **React Router v6**: Client-side routing.
-   **Framer Motion**: Animation library.
-   **ECharts**: Data visualization.
-   **Lucide React**: Icon library.