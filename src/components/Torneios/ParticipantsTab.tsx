import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Torneio, Participant, Aluno } from '../../types';
import Button from '../Forms/Button';
import { Check, UserPlus, Send, BarChart3, Users, X, Edit, Trash2, AlertTriangle, ArrowUpCircle, Clock, MessageSquare, CheckCircle, DollarSign, ChevronDown, Info, User } from 'lucide-react';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import Alert from '../Shared/Alert';
import { formatCurrency } from '../../utils/formatters';

interface ParticipantsTabProps {
  torneio: Torneio;
  setTorneio: React.Dispatch<React.SetStateAction<Torneio | null>>;
  alunos: Aluno[];
  onAddParticipant: (participant: null, categoryId: string, onWaitlist: boolean) => void;
  onEditParticipant: (participant: Participant, categoryId: string) => void;
  onGenerateBracket: (categoryId: string) => void;
  onDeleteBracket: (categoryId: string) => void;
}

const ParticipantsTab: React.FC<ParticipantsTabProps> = ({ torneio, setTorneio, onAddParticipant, onEditParticipant, onGenerateBracket, onDeleteBracket }) => {
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { addToast } = useToast();
  const [paymentConfirm, setPaymentConfirm] = useState<{ participant: Participant, playerIndex: number } | null>(null);

  const handlePlayerDetailChange = (participantId: string, playerIndex: number, field: 'payment_status' | 'checked_in', value: any) => {
    if (field === 'payment_status') {
      const participant = torneio.participants.find(p => p.id === participantId);
      if (participant) {
        setPaymentConfirm({ participant, playerIndex });
      }
      return;
    }

    setTorneio(prev => {
      if (!prev) return null;
      const newParticipants = prev.participants.map(p => {
        if (p.id === participantId) {
          const newPlayers = [...p.players];
          const currentStatus = newPlayers[playerIndex][field];
          newPlayers[playerIndex] = { ...newPlayers[playerIndex], [field]: !currentStatus };
          return { ...p, players: newPlayers };
        }
        return p;
      });
      return { ...prev, participants: newParticipants };
    });
  };
  
  const handleConfirmPayment = (method: 'pix' | 'cartao' | 'dinheiro') => {
    if (!paymentConfirm) return;
    const { participant, playerIndex } = paymentConfirm;
    
    setTorneio(prev => {
      if (!prev) return null;
      const newParticipants = prev.participants.map(p => {
        if (p.id === participant.id) {
          const newPlayers = [...p.players];
          const playerToUpdate = newPlayers[playerIndex];

          if (playerToUpdate.payment_status === 'pago') {
             newPlayers[playerIndex] = { ...playerToUpdate, payment_status: 'pendente', payment_method: null };
          } else {
             newPlayers[playerIndex] = { ...playerToUpdate, payment_status: 'pago', payment_method: method };
          }

          const acceptedPlayers = newPlayers.filter(pl => pl.status === 'accepted');
          const allPaid = acceptedPlayers.length > 0 && acceptedPlayers.every(pl => pl.payment_status === 'pago');
          const somePaid = acceptedPlayers.some(pl => pl.payment_status === 'pago');

          let newParticipantStatus: Participant['payment_status'] = 'pendente';
          if (allPaid) newParticipantStatus = 'pago';
          else if (somePaid) newParticipantStatus = 'parcialmente_pago';

          return { ...p, players: newPlayers, payment_status: newParticipantStatus };
        }
        return p;
      });
      return { ...prev, participants: newParticipants };
    });

    setPaymentConfirm(null);
    addToast({ message: 'Status de pagamento atualizado!', type: 'success' });
  };

  const handleDeleteRequest = (participant: Participant) => {
    setParticipantToDelete(participant);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (!participantToDelete) return;
    setTorneio(prev => {
      if (!prev) return null;
      return { ...prev, participants: prev.participants.filter(p => p.id !== participantToDelete.id) };
    });
    setParticipantToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handlePromoteFromWaitlist = (participant: Participant) => {
    const categoryParticipants = torneio.participants.filter(p => p.categoryId === participant.categoryId && !p.on_waitlist);
    const category = torneio.categories.find(c => c.id === participant.categoryId);
    const maxParticipants = category?.max_participants || 0;

    if (categoryParticipants.length >= maxParticipants) {
      addToast({ message: 'A lista de inscritos para esta categoria está cheia.', type: 'error' });
      return;
    }

    setTorneio(prev => {
        if (!prev) return null;
        return {
            ...prev,
            participants: prev.participants.map(p => p.id === participant.id ? { ...p, on_waitlist: false } : p)
        };
    });
    addToast({ message: `${participant.name} foi promovido para a lista de inscritos.`, type: 'success' });
  };

  return (
    <div className="space-y-8">
      <Alert
        type="info"
        title="Como funciona o Check-in?"
        message="O check-in confirma a presença dos jogadores no dia do torneio. É um passo obrigatório antes que o sistema possa gerar as chaves das partidas, garantindo que o torneio comece apenas com quem realmente compareceu."
      />
      {torneio.categories.map(category => {
        const categoryParticipants = torneio.participants.filter(p => p.categoryId === category.id && !p.on_waitlist);
        const waitlistParticipants = torneio.participants.filter(p => p.categoryId === category.id && p.on_waitlist);
        const hasMatches = torneio.matches.some(m => m.categoryId === category.id);
        
        const allCheckedIn = categoryParticipants.every(p => p.players.every(player => player.checked_in));
        const allTeamsComplete = categoryParticipants.every(p => {
          const requiredSize = torneio.modality === 'individual' ? 1 : torneio.modality === 'duplas' ? 2 : torneio.team_size || 1;
          return p.players.filter(pl => pl && pl.name).length === requiredSize;
        });
        const canGenerate = categoryParticipants.length >= 2 && allCheckedIn && allTeamsComplete;

        let generateBracketTooltip = '';
        if (categoryParticipants.length < 2) generateBracketTooltip = 'Mínimo de 2 inscritos para gerar chaves.';
        else if (!allTeamsComplete) generateBracketTooltip = 'Existem equipes/duplas incompletas.';
        else if (!allCheckedIn) generateBracketTooltip = 'Todos os jogadores devem ter o check-in realizado.';
        
        const maxParticipants = category?.max_participants || 0;
        const currentParticipantsCount = categoryParticipants.length;
        const isFull = currentParticipantsCount >= maxParticipants;

        return (
          <div key={category.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <span>{category.group} - {category.level}</span>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${ isFull ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                  {currentParticipantsCount} / {maxParticipants}
                </span>
              </h3>
              <div className="flex gap-2 items-center">
                {hasMatches ? (
                  <Button variant="outline" onClick={() => onDeleteBracket(category.id)} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4 mr-2" />Excluir Chaves
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => onGenerateBracket(category.id)} disabled={!canGenerate} title={generateBracketTooltip}>
                    <BarChart3 className="h-4 w-4 mr-2" />Gerar Chaves
                  </Button>
                )}
                <Button onClick={() => onAddParticipant(null, category.id, isFull)}>
                  <UserPlus className="h-4 w-4 mr-2" /> {isFull ? 'Adicionar na Espera' : 'Adicionar Inscrito'}
                </Button>
              </div>
            </div>
            
            <ParticipantTable
              participants={categoryParticipants}
              torneio={torneio}
              onEdit={onEditParticipant}
              onDelete={handleDeleteRequest}
              onPlayerDetailChange={handlePlayerDetailChange}
            />

            {waitlistParticipants.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4 border-t pt-4">Lista de Espera ({waitlistParticipants.length})</h4>
                <ParticipantTable
                  participants={waitlistParticipants}
                  torneio={torneio}
                  onEdit={onEditParticipant}
                  onDelete={handleDeleteRequest}
                  onPromote={handlePromoteFromWaitlist}
                  isMainListFull={isFull}
                  onPlayerDetailChange={handlePlayerDetailChange}
                />
              </div>
            )}
          </div>
        );
      })}
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Remoção"
        message={<p>Tem certeza que deseja remover <strong>{participantToDelete?.name}</strong> da lista de inscritos?</p>}
        confirmText="Sim, Remover"
      />
      <PaymentConfirmationModal
        isOpen={!!paymentConfirm}
        onClose={() => setPaymentConfirm(null)}
        onConfirm={handleConfirmPayment}
        participantName={paymentConfirm?.participant.players[paymentConfirm.playerIndex]?.name || ''}
      />
    </div>
  );
};

const getParticipantStatus = (participant: Participant, torneio: Torneio) => {
    const requiredPlayers = torneio.modality === 'individual' ? 1 : torneio.modality === 'duplas' ? 2 : torneio.team_size || 2;
    const actualPlayers = participant.players.filter(p => p.name && p.name.trim()).length;

    if (actualPlayers < requiredPlayers) {
        return { 
            label: 'Inscrição Incompleta', 
            color: 'bg-red-600 text-white', 
            icon: AlertTriangle 
        };
    }

    const acceptedPlayers = participant.players.filter(p => p.status === 'accepted' && p.name);
    if (acceptedPlayers.length === 0) {
        return { 
            label: 'Pendente', 
            color: 'bg-yellow-500 text-yellow-900', 
            icon: Clock 
        };
    }

    const allPaid = acceptedPlayers.every(p => p.payment_status === 'pago');
    if (allPaid) {
        return { 
            label: 'Pago', 
            color: 'bg-green-600 text-white', 
            icon: CheckCircle 
        };
    }

    const somePaid = acceptedPlayers.some(p => p.payment_status === 'pago');
    if (somePaid) {
        return { 
            label: 'Pago Parcial', 
            color: 'bg-orange-500 text-white', 
            icon: DollarSign 
        };
    }

    return { 
        label: 'Pendente', 
        color: 'bg-yellow-500 text-yellow-900', 
        icon: Clock 
    };
};

const ParticipantRow: React.FC<{
  participant: Participant;
  torneio: Torneio;
  onEdit: (p: Participant, categoryId: string) => void;
  onDelete: (p: Participant) => void;
  onPromote?: (p: Participant) => void;
  isMainListFull?: boolean;
  onPlayerDetailChange: (participantId: string, playerIndex: number, field: 'payment_status' | 'checked_in', value: any) => void;
}> = ({ participant, torneio, onEdit, onDelete, onPromote, isMainListFull, onPlayerDetailChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const status = getParticipantStatus(participant, torneio);

  const allCheckedIn = useMemo(() => {
    const acceptedPlayers = participant.players.filter(p => p.status === 'accepted' && p.name);
    return acceptedPlayers.length > 0 && acceptedPlayers.every(p => p.checked_in);
  }, [participant.players]);
  
  const category = torneio.categories.find(c => c.id === participant.categoryId);
  const registrationFee = category?.registration_fee || 0;

  return (
    <div className="border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg">
      <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1 font-semibold text-brand-gray-900 dark:text-white">{participant.name}</div>
        <div className="flex-1 text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.label}
          </span>
        </div>
        <div className="flex-1 text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${allCheckedIn ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
            {allCheckedIn ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
            {allCheckedIn ? 'Check-in OK' : 'Check-in Pendente'}
          </span>
        </div>
        <div className="flex-1 text-right flex justify-end items-center gap-1">
          {onPromote && <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onPromote(participant); }} disabled={isMainListFull} title={isMainListFull ? "Lista principal está cheia" : "Promover para lista de inscritos"}><ArrowUpCircle className="h-4 w-4"/></Button>}
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(participant, participant.categoryId); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(participant); }} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
          <ChevronDown className={`h-5 w-5 text-brand-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 bg-brand-gray-50 dark:bg-brand-gray-900/50 border-t border-brand-gray-200 dark:border-brand-gray-700 space-y-2">
              {participant.players.map((player, index) => (
                <div key={player.profile_id || index} className="flex items-center justify-between p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-brand-gray-500" />
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium">{player.name || `Jogador ${index + 1}`}</p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">({formatCurrency(registrationFee)})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onPlayerDetailChange(participant.id, index, 'payment_status', null)} title="Marcar Pagamento">
                      <DollarSign className={`h-4 w-4 ${player.payment_status === 'pago' ? 'text-green-500' : 'text-brand-gray-500'}`} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onPlayerDetailChange(participant.id, index, 'checked_in', null)} title="Marcar Check-in">
                      <Check className={`h-4 w-4 ${player.checked_in ? 'text-green-500' : 'text-brand-gray-500'}`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ParticipantTable: React.FC<Omit<ParticipantRowProps, 'participant' | 'onPlayerDetailChange'> & { participants: Participant[], onPlayerDetailChange: (participantId: string, playerIndex: number, field: 'payment_status' | 'checked_in', value: any) => void; }> = ({ participants, ...props }) => {
  if (participants.length === 0) {
    return <p className="text-center py-4 text-sm text-brand-gray-500">Nenhum inscrito.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="hidden md:grid grid-cols-4 gap-4 px-3 py-2 border-b border-brand-gray-200 dark:border-brand-gray-700 text-xs font-semibold text-brand-gray-500 uppercase">
        <div className="">Nome</div>
        <div className="text-center">Pagamento</div>
        <div className="text-center">Check-in</div>
        <div className="text-right">Ações</div>
      </div>
      {participants.map((participant) => (
        <ParticipantRow key={participant.id} participant={participant} {...props} />
      ))}
    </div>
  );
};

export default ParticipantsTab;
