import React from 'react';
import { AtletaAluguel } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Star } from 'lucide-react';

interface AtletasTabProps {
  atletas: AtletaAluguel[];
  onViewProfile: (atleta: AtletaAluguel) => void;
}

const AtletasTab: React.FC<AtletasTabProps> = ({ atletas, onViewProfile }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Atletas de Aluguel Disponíveis</h3>
    {atletas.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atletas.filter(p => p.status === 'disponivel').map(atleta => (
          <button 
            key={atleta.id} 
            onClick={() => onViewProfile(atleta)}
            className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-4 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col text-left hover:shadow-lg hover:border-brand-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <img src={atleta.avatar_url || `https://avatar.vercel.sh/${atleta.id}.svg`} alt={atleta.name} className="w-20 h-20 rounded-full object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-lg">{atleta.name}</h4>
                <p className="text-sm text-brand-gray-500">{atleta.nivel_tecnico}</p>
                 <div className="flex items-center text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(atleta.avg_rating || 0) ? 'fill-current' : ''}`} />
                    ))}
                    <span className="text-xs text-brand-gray-500 ml-1">({atleta.ratings?.length || 0})</span>
                  </div>
              </div>
            </div>
            <div className="text-sm space-y-1 mb-4 flex-1">
              <p><strong>Esportes:</strong> {atleta.esportes.map(e => e.sport).join(', ')}</p>
            </div>
            <div className="mt-auto flex justify-between items-center pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
              <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(atleta.taxa_hora)}</p>
              <span className="text-sm font-semibold text-brand-blue-500">Ver Perfil</span>
            </div>
          </button>
        ))}
      </div>
    ) : (
      <p className="text-center text-brand-gray-500 py-8">Nenhum atleta de aluguel disponível nesta arena.</p>
    )}
  </div>
);

export default AtletasTab;
