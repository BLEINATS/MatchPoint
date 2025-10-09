import React from 'react';
import { AtletaAluguel } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface AtletasTabProps {
  atletas: AtletaAluguel[];
  onHire: (atleta: AtletaAluguel) => void;
}

const AtletasTab: React.FC<AtletasTabProps> = ({ atletas, onHire }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Atletas de Aluguel Disponíveis</h3>
    {atletas.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atletas.filter(p => p.status === 'disponivel').map(atleta => (
          <div key={atleta.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-4 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <img src={atleta.avatar_url || `https://avatar.vercel.sh/${atleta.id}.svg`} alt={atleta.name} className="w-20 h-20 rounded-full object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-lg">{atleta.name}</h4>
                <p className="text-sm text-brand-gray-500">{atleta.nivel_tecnico}</p>
              </div>
            </div>
            <div className="text-sm space-y-1 mb-4">
              <p><strong>Especialidades:</strong> {atleta.esportes.map(e => e.sport).join(', ')}</p>
              <p><strong>Partidas Jogadas:</strong> {atleta.partidas_jogadas || 0}</p>
            </div>
            <div className="mt-auto flex justify-between items-center pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
              <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(atleta.taxa_hora)}</p>
              <Button size="sm" onClick={() => onHire(atleta)}>Contratar</Button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-brand-gray-500 py-8">Nenhum atleta de aluguel disponível nesta arena.</p>
    )}
  </div>
);

export default AtletasTab;
