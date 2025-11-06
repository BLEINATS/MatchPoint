import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Star } from 'lucide-react';
import { AtletaAluguel, Reserva } from '../../types';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface HirePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (profissionalId: string) => void;
  reserva: Reserva;
  profissionais: AtletaAluguel[];
}

const HirePlayerModal: React.FC<HirePlayerModalProps> = ({ isOpen, onClose, onConfirm, reserva, profissionais }) => {
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string | null>(null);

  const availableProfissionais = useMemo(() => {
    if (!profissionais) return [];
    return profissionais.filter(p => 
      p.status === 'disponivel' && 
      p.esportes.some(e => e.sport === reserva.sport_type)
    );
  }, [profissionais, reserva.sport_type]);

  const handleConfirm = () => {
    if (selectedProfissionalId) {
      onConfirm(selectedProfissionalId);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Contratar Jogador Profissional</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {availableProfissionais.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProfissionais.map(prof => (
                    <button 
                      key={prof.id} 
                      onClick={() => setSelectedProfissionalId(prof.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all flex items-center gap-4 ${selectedProfissionalId === prof.id ? 'border-brand-blue-500 bg-blue-50 dark:bg-brand-blue-900/50' : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'}`}
                    >
                      <img src={prof.avatar_url || `https://avatar.vercel.sh/${prof.id}.svg`} alt={prof.name} className="w-16 h-16 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="font-bold">{prof.name}</p>
                        <p className="text-sm text-brand-gray-500">{prof.nivel_tecnico || 'Nível não informado'}</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">{formatCurrency(prof.taxa_hora)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-brand-gray-500 py-8">Nenhum profissional disponível para este esporte no momento.</p>
              )}
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedProfissionalId}>Contratar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HirePlayerModal;
