import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import ClientDashboard from '../components/Client/ClientDashboard';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  
  const renderDashboard = () => {
    if (profile?.role === 'admin_arena') {
      return <AnalyticsDashboard />;
    }
    if (profile?.role === 'cliente') {
      // Redirecionado para a página de perfil do cliente
      return <ClientDashboard />;
    }
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-white">Carregando...</h2>
        <p className="text-brand-gray-600 dark:text-brand-gray-400">Verificando seu perfil.</p>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </div>
    </Layout>
  );
};

export default Dashboard;
