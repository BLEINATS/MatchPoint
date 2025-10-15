import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Users, Mail, Phone } from 'lucide-react';
import { Participant, TorneioModality, Aluno } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { v4 as uuidv4 } from 'uuid';
import CreatableClientSelect from '../Forms/CreatableClientSelect';
import { useToast } from '../../context/ToastContext';
import { maskPhone } from '../../utils/masks';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participant: Participant) => void;
  modality: TorneioModality;
  teamSize?: number;
  initialData: Participant | null;
  alunos: Aluno[];
  categoryId: string | null;
  onWaitlist?: boolean;
}

const ParticipantModal: React.FC<ParticipantModalProps> = ({ isOpen, onClose, onSave, modality, teamSize = 2, initialData, alunos, categoryId, onWaitlist = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [players, setPlayers] = useState<{ aluno_id: string | null; name: string; phone: string }>([
    { aluno_id: null, name: '', phone: '' },
  ]);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const requiredPlayers = modality === 'individual' ? 1 : modality === 'duplas' ? 2 : teamSize;
      if (initialData) {
        setName(initialData.name);
        setEmail(initialData.email);
        const initialPlayers = initialData.players.map(player => ({
          aluno_id: player.aluno_id,
          name: player.name,
          phone: player.phone || ''
        }));
        while (initialPlayers.length < requiredPlayers) {
          initialPlayers.push({ aluno_id: null, name: '', phone: '' });
        }
        setPlayers(initialPlayers.slice(0, requiredPlayers));
      } else {
        setName('');
        setEmail('');
        setPlayers(Array(requiredPlayers).fill(null).map(() => ({ aluno_id: null, name: '', phone: '' })));
      }
    }
  }, [isOpen, initialData, modality, teamSize]);

  const handlePlayerChange = (index: number, selection: { id: string | null; name: string; phone?: string | null }) => {
    const newPlayers = [...players];
    newPlayers[index] = { 
      aluno_id: selection.id, 
      name: selection.name, 
      phone: selection.phone || ''
    };
    setPlayers(newPlayers);
  };

  const handlePlayerPhoneChange = (index: number, phone: string) => {
    const newPlayers = [...players];
    newPlayers[index].phone = maskPhone(phone);
    setPlayers(newPlayers);
  };

  const handleSave = () => {
    const filledPlayers = players.filter(p => p.name && p.name.trim());

    if (modality !== 'individual' && !name.trim()) {
      addToast({ message: 'Por favor, preencha o nome da dupla/equipe.', type: 'error' });
      return;
    }

    if (filledPlayers.length === 0) {
      if (modality !== 'individual') {
        // Permite salvar equipe/dupla apenas com o nome, mas sinaliza que está incompleta
      } else {
        addToast({ message: 'É necessário adicionar o nome do jogador.', type: 'error' });
        return;
      }
    }
    
    const newPlayerWithoutPhone = filledPlayers.some(p => !p.aluno_id && (!p.phone || p.phone.trim().length < 14));
    if (newPlayerWithoutPhone) {
        addToast({ message: 'Por favor, preencha um telefone válido para novos jogadores.', type: 'error' });
        return;
    }

    if (!categoryId && !initialData) {
      addToast({ message: 'Erro: Categoria não especificada.', type: 'error' });
      return;
    }

    const participantName = modality === 'individual' ? (players[0]?.name || 'Participante') : name;

    onSave({
      id: initialData?.id || `participant_${uuidv4()}`,
      categoryId: initialData?.categoryId || categoryId!,
      name: participantName,
      email,
      players: players,
      checked_in: initialData?.checked_in || false,
      on_waitlist: initialData?.on_waitlist || onWaitlist,
      payment_status: initialData?.payment_status || 'pendente',
    });
  };
  
  const getTitle = () => {
    if (initialData) return 'Editar Inscrito';
    if (onWaitlist) return 'Adicionar à Lista de Espera';
    switch (modality) {
      case 'individual': return 'Adicionar Atleta';
      case 'duplas': return 'Adicionar Dupla';
      case 'equipes': return 'Adicionar Equipe';
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
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">{getTitle()}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {modality !== 'individual' && (
                <Input label={`Nome da ${modality === 'duplas' ? 'Dupla' : 'Equipe'}`} value={name} onChange={e => setName(e.target.value)} icon={<Users className="h-4 w-4 text-brand-gray-400" />} required />
              )}
              <Input label="E-mail de Contato" type="email" value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="h-4 w-4 text-brand-gray-400" />} />
              <div className="space-y-4">
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Jogadores</label>
                {players.map((player, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800/50 space-y-4">
                    <CreatableClientSelect
                      alunos={alunos}
                      value={{ id: player.aluno_id, name: player.name }}
                      onChange={(selection) => handlePlayerChange(index, selection)}
                      placeholder={`Jogador ${index + 1}`}
                    />
                    {!player.aluno_id && player.name && (
                       <Input
                          label="Telefone do Novo Jogador"
                          value={player.phone || ''}
                          onChange={(e) => handlePlayerPhoneChange(index, e.target.value)}
                          placeholder="(00) 90000-0000"
                          icon={<Phone className="h-4 w-4 text-brand-gray-400" />}
                          required
                       />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/> Salvar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ParticipantModal;
