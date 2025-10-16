import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import ClientDashboard from '../components/Client/ClientDashboard';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const canManageReservations = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.reservas === 'edit', [profile]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Nova Reserva':
        if (!canManageReservations) {
          addToast({ message: 'Você não tem permissão para criar novas reservas.', type: 'error' });
          return;
        }
        navigate('/reservas', { state: { openModal: true, type: 'avulsa' } });
        break;
      // Handle other actions...
      default:
        break;
    }
  };
  
  const renderDashboard = () => {
    if (profile?.role === 'admin_arena' || profile?.role === 'funcionario') {
      return <AnalyticsDashboard />;
    }
    if (profile?.role === 'cliente') {
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
