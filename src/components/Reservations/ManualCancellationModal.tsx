import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import Button from '../Forms/Button';

interface ManualCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservaName: string;
}

const ManualCancellationModal: React.FC<ManualCancellationModalProps> = ({ isOpen, onClose, onConfirm, reservaName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3 text-yellow-500" />
                Cancelar Reserva Interna
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-brand-gray-600 dark:text-brand-gray-400">
                A reserva <strong className="text-brand-gray-800 dark:text-white">"{reservaName}"</strong> é uma reserva interna (como Aula, Bloqueio ou Evento) e não está associada a um cliente pagante.
              </p>
              <p className="text-brand-gray-600 dark:text-brand-gray-400">
                Deseja marcar esta reserva como "Cancelada" para liberar o horário na agenda?
              </p>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Voltar</Button>
              <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500">
                Sim, Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManualCancellationModal;
