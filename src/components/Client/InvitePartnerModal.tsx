import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus } from 'lucide-react';
import { Profile } from '../../types';
import Button from '../Forms/Button';

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partnerId: string) => void;
  friends: Profile[];
  isLoading: boolean;
}

const InvitePartnerModal: React.FC<InvitePartnerModalProps> = ({ isOpen, onClose, onConfirm, friends, isLoading }) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedFriendId) {
      onConfirm(selectedFriendId);
    }
  };

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
                <UserPlus className="h-5 w-5 text-brand-blue-500" />
                Convidar Parceiro(a)
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">
                Selecione um amigo para formar sua dupla. Ele receberá uma notificação para aceitar o convite.
              </p>
              <div className="space-y-2">
                {friends.length > 0 ? friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriendId(friend.id)}
                    className={`w-full p-3 border-2 rounded-lg text-left flex items-center gap-3 transition-all ${
                      selectedFriendId === friend.id
                        ? 'border-brand-blue-500 bg-blue-100 dark:bg-brand-blue-500/20'
                        : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'
                    }`}
                  >
                    <img src={friend.avatar_url || `https://avatar.vercel.sh/${friend.id}.svg`} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-medium">{friend.name}</span>
                  </button>
                )) : (
                  <p className="text-center text-sm text-brand-gray-500 py-8">Você não tem amigos adicionados. Adicione amigos na aba "Amigos" para poder convidá-los.</p>
                )}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!selectedFriendId || isLoading} isLoading={isLoading}>
                <Send className="h-4 w-4 mr-2" /> Confirmar Convite
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvitePartnerModal;
