import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Button from '../Forms/Button';
import { useNavigate } from 'react-router-dom';

const SubscriptionLockOverlay: React.FC = () => {
  const navigate = useNavigate();

  const handleManageSubscription = () => {
    navigate('/settings', { state: { activeTab: 'plan' } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-brand-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white dark:bg-brand-gray-800 rounded-2xl w-full max-w-md shadow-2xl text-center p-8">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/50 mb-6">
          <Lock className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white">
          Assinatura Expirada
        </h3>
        <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-4">
          Seu plano expirou. Para reativar o acesso completo à plataforma e continuar gerenciando sua arena, por favor, renove sua assinatura.
        </p>
        <div className="mt-8">
          <Button onClick={handleManageSubscription} className="w-full" size="lg">
            Gerenciar Assinatura
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionLockOverlay;
