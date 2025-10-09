import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { AtletaAluguel, Reserva, Quadra } from '../../types';
import Button from '../Forms/Button';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface AssignToReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reservaId: string) => void;
  profissional: AtletaAluguel;
  minhasReservas: Reserva[];
  quadras: Quadra[];
}

const AssignToReservationModal: React.FC<AssignToReservationModalProps> = ({ isOpen, onClose, onConfirm, profissional, minhasReservas, quadras }) => {
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedReservaId) {
      onConfirm(selectedReservaId);
    }
  };

  const getQuadraName = (id: string) => quadras.find(q => q.id === id)?.name || 'N/A';
  
  const filteredReservas = minhasReservas.filter(r => 
    r.status === 'confirmada' && 
    r.type === 'avulsa' &&
    !r.atleta_aluguel_id &&
    profissional.esportes.some(e => e.sport === r.sport_type)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Contratar {profissional.name}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-brand-gray-500">Selecione para qual de suas próximas reservas você deseja contratar este atleta.</p>
              {filteredReservas.length > 0 ? (
                <div className="space-y-3">
                  {filteredReservas.map(reserva => (
                    <button 
                      key={reserva.id} 
                      onClick={() => setSelectedReservaId(reserva.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${selectedReservaId === reserva.id ? 'border-brand-blue-500 bg-blue-50 dark:bg-brand-blue-900/50' : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'}`}
                    >
                      <p className="font-semibold">{getQuadraName(reserva.quadra_id)}</p>
                      <div className="text-sm text-brand-gray-600 dark:text-brand-gray-400 flex items-center gap-4 mt-1">
                        <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5"/>{format(parseDateStringAsLocal(reserva.date), 'dd/MM/yyyy')}</span>
                        <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5"/>{reserva.start_time.slice(0,5)} - {reserva.end_time.slice(0,5)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-brand-gray-500 py-8">Você não tem nenhuma reserva futura compatível para contratar este atleta.</p>
              )}
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedReservaId}>Contratar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssignToReservationModal;
