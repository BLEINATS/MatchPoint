import React from 'react';
import { ProfissionalAluguel } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface ProfissionaisTabProps {
  profissionais: ProfissionalAluguel[];
  onHire: (prof: ProfissionalAluguel) => void;
}

const ProfissionaisTab: React.FC<ProfissionaisTabProps> = ({ profissionais, onHire }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Profissionais Disponíveis</h3>
    {profissionais.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profissionais.filter(p => p.status === 'disponivel').map(prof => (
          <div key={prof.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-4 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <img src={prof.avatar_url || `https://avatar.vercel.sh/${prof.id}.svg`} alt={prof.name} className="w-20 h-20 rounded-full object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-lg">{prof.name}</h4>
                <p className="text-sm text-brand-gray-500">{prof.nivel_tecnico}</p>
              </div>
            </div>
            <div className="text-sm space-y-1 mb-4">
              <p><strong>Especialidades:</strong> {prof.esportes.map(e => e.sport).join(', ')}</p>
              <p><strong>Partidas Jogadas:</strong> {prof.partidas_jogadas || 0}</p>
            </div>
            <div className="mt-auto flex justify-between items-center pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
              <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(prof.taxa_hora)}</p>
              <Button size="sm" onClick={() => onHire(prof)}>Contratar</Button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-brand-gray-500 py-8">Nenhum profissional disponível nesta arena.</p>
    )}
  </div>
);

export default ProfissionaisTab;
