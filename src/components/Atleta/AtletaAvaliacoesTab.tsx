import React from 'react';
import { Star } from 'lucide-react';

const AtletaAvaliacoesTab: React.FC = () => {
  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700 text-center">
      <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold">Em Breve: Suas Avaliações</h3>
      <p className="text-brand-gray-500 mt-2">
        Após cada jogo, os clientes poderão avaliar sua performance. Volte em breve para ver seus feedbacks!
      </p>
    </div>
  );
};

export default AtletaAvaliacoesTab;
