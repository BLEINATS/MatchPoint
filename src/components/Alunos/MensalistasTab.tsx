import React from 'react';
import { motion } from 'framer-motion';
import { Aluno, Reserva, Quadra } from '../../types';
import MensalistaCard from './MensalistaCard';
import { Users } from 'lucide-react';

interface MensalistasTabProps {
  reservas: Reserva[];
  alunos: Aluno[];
  quadras: Quadra[];
  onSelect: (reserva: Reserva) => void;
  canEdit: boolean;
}

const MensalistasTab: React.FC<MensalistasTabProps> = ({ reservas, alunos, quadras, onSelect, canEdit }) => {
  const mensalistas = reservas.filter(r => r.isRecurring && !r.masterId);

  if (mensalistas.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
          <div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6">
            <Users className="h-8 w-8 text-brand-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">Nenhum mensalista encontrado</h3>
          <p className="text-brand-gray-600 dark:text-brand-gray-400">Crie uma reserva recorrente no Hub de Reservas para adicionar um mensalista.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mensalistas.map((reserva, index) => {
        const aluno = alunos.find(a => a.id === reserva.aluno_id);
        const quadra = quadras.find(q => q.id === reserva.quadra_id);
        return (
          <MensalistaCard
            key={reserva.id}
            index={index}
            reserva={reserva}
            aluno={aluno}
            quadra={quadra}
            onClick={() => onSelect(reserva)}
            canEdit={canEdit}
          />
        );
      })}
    </div>
  );
};

export default MensalistasTab;
