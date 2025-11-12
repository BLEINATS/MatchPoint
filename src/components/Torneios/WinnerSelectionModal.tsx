import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { Participant } from '../../types';
import Button from '../Forms/Button';

interface WinnerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (winnerId: string) => void;
  participants: Participant[];
  position: 1 | 2 | 3;
}

const WinnerSelectionModal: React.FC<WinnerSelectionModalProps> = ({ isOpen, onClose, onConfirm, participants, position }) => {
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
                <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                Definir {position}º Lugar
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-brand-gray-500">Selecione o vencedor entre os participantes da categoria.</p>
              <div className="space-y-3">
                {participants.map(participant => (
                  <button
                    key={participant.id}
                    onClick={() => setSelectedWinnerId(participant.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedWinnerId === participant.id
                        ? 'border-brand-blue-500 bg-blue-100 dark:bg-brand-blue-500/20 shadow-md'
                        : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'
                    }`}
                  >
                    <span className={`font-semibold transition-colors ${selectedWinnerId === participant.id ? 'text-brand-blue-800 dark:text-brand-blue-200' : 'text-brand-gray-900 dark:text-white'}`}>{getParticipantDisplayName(participant)}</span>
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

export default WinnerSelectionModal;
