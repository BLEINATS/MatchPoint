import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, GraduationCap, User } from 'lucide-react';
import { Aluno, Professor, AtletaAluguel } from '../../types';
import Button from '../Forms/Button';
import PersonSelect from './PersonSelect';
import { useToast } from '../../context/ToastContext';

type Target = 'all' | 'students' | 'clients' | 'individual';

interface NotificationComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (target: Target, message: string, profileId?: string) => void;
  alunos: Aluno[];
  professores: Professor[];
  atletas: AtletaAluguel[];
}

const NotificationComposerModal: React.FC<NotificationComposerModalProps> = ({ isOpen, onClose, onSubmit, alunos, professores, atletas }) => {
  const [target, setTarget] = useState<Target>('all');
  const [message, setMessage] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { addToast } = useToast();

  const allPeople = useMemo(() => {
    const combined = new Map<string, { profile_id: string; name: string; typeLabel: string }>();

    (alunos || []).forEach(a => {
        if (a.profile_id && a.name) {
            combined.set(a.profile_id, {
                profile_id: a.profile_id,
                name: a.name,
                typeLabel: a.plan_id ? 'Aluno' : 'Cliente'
            });
        }
    });
    (professores || []).forEach(p => {
        if (p.profile_id && p.name) {
            combined.set(p.profile_id, {
                profile_id: p.profile_id,
                name: p.name,
                typeLabel: 'Professor'
            });
        }
    });
    (atletas || []).forEach(a => {
        if (a.profile_id && a.name) {
            combined.set(a.profile_id, {
                profile_id: a.profile_id,
                name: a.name,
                typeLabel: 'Atleta'
            });
        }
    });

    return Array.from(combined.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [alunos, professores, atletas]);

  const handleSubmit = () => {
    if (!message.trim()) {
        addToast({ message: 'A mensagem não pode estar vazia.', type: 'error' });
        return;
    }
    if (target === 'individual' && !selectedProfileId) {
      addToast({ message: 'Por favor, selecione um destinatário.', type: 'error' });
      return;
    }
    onSubmit(target, message.trim(), target === 'individual' ? selectedProfileId! : undefined);
  };

  const getTargetCount = (targetType: Target) => {
    switch (targetType) {
      case 'all':
        return new Set(alunos.map(a => a.profile_id).filter(Boolean)).size;
      case 'students':
        return new Set(alunos.filter(a => a.plan_id).map(a => a.profile_id).filter(Boolean)).size;
      case 'clients':
        return new Set(alunos.filter(a => !a.plan_id).map(a => a.profile_id).filter(Boolean)).size;
      default:
        return 0;
    }
  };

  const targets = [
    { id: 'all', label: 'Todos os Usuários', icon: Users, count: getTargetCount('all') },
    { id: 'students', label: 'Apenas Alunos com Plano', icon: GraduationCap, count: getTargetCount('students') },
    { id: 'clients', label: 'Apenas Clientes Avulsos', icon: User, count: getTargetCount('clients') },
    { id: 'individual', label: 'Individual', icon: User, count: selectedProfileId ? 1 : 0 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <Send className="h-5 w-5 text-brand-blue-500" />
                Enviar Notificação
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Enviar para:</label>
                <div className="space-y-2">
                  {targets.map(({ id, label, icon: Icon, count }) => {
                    const isSelected = target === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setTarget(id as Target)}
                        className={`w-full p-3 border-2 rounded-lg text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-brand-blue-500 bg-blue-100 dark:bg-brand-blue-500/20'
                            : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-blue-500' : 'text-brand-gray-400'}`} />
                          <span className={`font-medium ${isSelected ? 'text-brand-blue-800 dark:text-brand-blue-200' : 'text-brand-gray-700 dark:text-brand-gray-300'}`}>{label}</span>
                        </div>
                        {id !== 'individual' && <span className="text-sm font-bold text-brand-gray-500 dark:text-brand-gray-400">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              {target === 'individual' && (
                <div className="mt-4">
                    <PersonSelect
                        people={allPeople}
                        value={selectedProfileId}
                        onChange={(id) => setSelectedProfileId(id)}
                    />
                </div>
              )}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Mensagem:</label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                  placeholder="Digite sua mensagem aqui..."
                />
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-2" /> Enviar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationComposerModal;
