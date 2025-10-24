import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App, { ProtectedRoute } from './App.tsx';
import './index.css';

import Home from './pages/Home';
import ArenaSignup from './pages/ArenaSignup';
import Dashboard from './pages/Dashboard';
import ArenaPublic from './pages/ArenaPublic';
import Settings from './pages/Settings';
import Reservations from './pages/Reservations';
import Quadras from './pages/Quadras';
import ClientProfile from './pages/ClientProfile';
import AuthPortal from './pages/AuthPortal';
import Arenas from './pages/Arenas';
import Alunos from './pages/Alunos';
import Torneios from './pages/Torneios';
import TorneioDetail from './pages/TorneioDetail';
import Eventos from './pages/Eventos';
import EventoDetail from './pages/EventoDetail';
import Gamification from './pages/Gamification';
import TorneioPublico from './pages/TorneioPublico.tsx';
import Financeiro from './pages/Financeiro.tsx';
import ProfessorProfilePage from './pages/ProfessorProfilePage.tsx';
import SuperAdminPage from './pages/SuperAdmin.tsx';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import React from 'react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'auth', element: <AuthPortal /> },
      { path: 'cadastro-arena', element: <ArenaSignup /> },
      { path: 'arenas', element: <Arenas /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: 'superadmin',
        element: <ProtectedRoute><SuperAdminPage /></ProtectedRoute>,
      },
      {
        path: 'settings',
        element: <ProtectedRoute><Settings /></ProtectedRoute>,
      },
      {
        path: 'reservas',
        element: <ProtectedRoute><Reservations /></ProtectedRoute>,
      },
      {
        path: 'quadras',
        element: <ProtectedRoute><Quadras /></ProtectedRoute>,
      },
      {
        path: 'alunos',
        element: <ProtectedRoute><Alunos /></ProtectedRoute>,
      },
      {
        path: 'professores/:id',
        element: <ProtectedRoute><ProfessorProfilePage /></ProtectedRoute>,
      },
      {
        path: 'torneios',
        element: <ProtectedRoute><Torneios /></ProtectedRoute>,
      },
      {
        path: 'torneios/:id',
        element: <ProtectedRoute><TorneioDetail /></ProtectedRoute>,
      },
      {
        path: 'torneios/publico/:id',
        element: <TorneioPublico />,
      },
      {
        path: 'eventos',
        element: <ProtectedRoute><Eventos /></ProtectedRoute>,
      },
      {
        path: 'eventos/:id',
        element: <ProtectedRoute><EventoDetail /></ProtectedRoute>,
      },
      {
        path: 'gamification',
        element: <ProtectedRoute><Gamification /></ProtectedRoute>,
      },
       {
        path: 'financeiro',
        element: <ProtectedRoute><Financeiro /></ProtectedRoute>,
      },
      {
        path: 'perfil',
        element: <ProtectedRoute><ClientProfile /></ProtectedRoute>,
      },
      { path: ':slug', element: <ArenaPublic /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
