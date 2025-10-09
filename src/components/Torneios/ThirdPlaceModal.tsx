import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { Participant } from '../../types';
import Button from '../Forms/Button';

interface ThirdPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (winnerId: string) => void;
  semifinalists: Participant[];
}

const ThirdPlaceModal: React.FC<ThirdPlaceModalProps> = ({ isOpen, onClose, onConfirm, semifinalists }) => {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedWinnerId) {
      onConfirm(selectedWinnerId);
    }
  };
  
  const getParticipantDisplayName = (participant: Participant) => {
    if (participant.players.length <= 1) {
      return participant.players[0]?.name || participant.name;
    }
    return participant.players.map(p => p.name).filter(Boolean).join(' / ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-orange-400" />
                Definir 3º Lugar
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-brand-gray-500">Selecione o vencedor da disputa de terceiro lugar.</p>
              <div className="space-y-3">
                {semifinalists.map(participant => (
                  <button
                    key={participant.id}
                    onClick={() => setSelectedWinnerId(participant.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedWinnerId === participant.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/50 shadow-md'
                        : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-orange-400'
                    }`}
                  >
                    <span className="font-semibold text-brand-gray-900 dark:text-white">{getParticipantDisplayName(participant)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedWinnerId}>
                Confirmar Vencedor
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ThirdPlaceModal;
