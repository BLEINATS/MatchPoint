import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, GraduationCap } from 'lucide-react';
import { PlanoAula } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (planoId: string) => void;
  alunoName: string;
  planos: PlanoAula[];
}

const AssignPlanModal: React.FC<AssignPlanModalProps> = ({ isOpen, onClose, onConfirm, alunoName, planos }) => {
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>('');

  const handleConfirm = () => {
    if (selectedPlanoId) {
      onConfirm(selectedPlanoId);
    }
  };

  const activePlanos = useMemo(() => {
    return (planos || []).filter(p => p.is_active);
  }, [planos]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-brand-blue-500" />
                Atribuir Plano
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Selecione um plano de aulas para <strong>{alunoName}</strong> para poder matriculá-lo na turma.
              </p>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Planos Disponíveis</label>
                <select
                  value={selectedPlanoId}
                  onChange={(e) => setSelectedPlanoId(e.target.value)}
                  className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                >
                  <option value="">Selecione um plano...</option>
                  {activePlanos.map(plano => (
                    <option key={plano.id} value={plano.id}>{plano.name} - {formatCurrency(plano.price)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedPlanoId}>
                <Save className="h-4 w-4 mr-2"/> Atribuir e Matricular
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssignPlanModal;
