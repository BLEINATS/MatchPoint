# MatchPlay - Sports Court Reservation System

## Overview
MatchPlay is a comprehensive SaaS platform designed for managing sports court reservations. Built with React, TypeScript, and Vite, it offers a complete solution for court scheduling, financial management, tournament organization, event management, and client engagement. The platform aims to streamline operations for sports facilities, providing tools for student/player management, instructor management, and even an integrated store/shop functionality. It supports multi-arena operations and includes a robust payment system via Asaas for various transaction types.

## User Preferences
- None specified yet

## System Architecture
The application uses a local-first architecture where data is persisted in the browser's `localStorage` instead of a traditional backend database. The frontend is built with React 18, TypeScript, and Vite, utilizing Tailwind CSS for styling, React Router v6 for routing, Framer Motion for animations, ECharts for data visualization, and Lucide React for icons.

A Node.js/Express backend proxy server runs on port 3001, primarily to handle Asaas payment gateway integrations and bypass CORS issues. This proxy is active in both development and production. In development, a Vite proxy redirects `/api/asaas` requests to `http://localhost:3001`. In production, the frontend directly calls `http://localhost:3001/api/asaas`.

The application is configured for deployment on Replit using a VM target, ensuring both the frontend (Vite preview on port 5000, mapped to external port 80) and the backend (Express server on port 3001) run continuously. Initial seed data is loaded on the first run.

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
- **Asaas Payment Gateway**: Integrated for processing payments (boleto, PIX, credit card), managing subscriptions, and handling customer data.
- **React**: Frontend UI library.
- **TypeScript**: Superset of JavaScript for type safety.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **React Router**: Declarative routing for React.
- **Framer Motion**: Animation library.
- **ECharts**: Data visualization library.
- **Lucide React**: Icon library.
- **Express.js**: Node.js framework used for the backend proxy server.