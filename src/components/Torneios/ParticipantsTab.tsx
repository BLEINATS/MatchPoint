import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Torneio, Participant, Aluno } from '../../types';
import Button from '../Forms/Button';
import { Check, UserPlus, BarChart3, X, Edit, Trash2, AlertTriangle, ArrowUpCircle, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import Input from '../Forms/Input';

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

  const handleParticipantDetailChange = (participantId: string, field: keyof Participant, value: any) => {
    setTorneio(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map(p =>
          p.id === participantId ? { ...p, [field]: value } : p
        ),
      };
    });
  };

  const toggleCheckIn = (participantId: string) => {
    handleParticipantDetailChange(participantId, 'checked_in', !torneio.participants.find(p => p.id === participantId)?.checked_in);
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
    const maxParticipants = torneio.max_participants || 0;

    if (categoryParticipants.length >= maxParticipants) {
      addToast({ message: 'A lista de inscritos para esta categoria está cheia.', type: 'error' });
      return;
    }

    handleParticipantDetailChange(participant.id, 'on_waitlist', false);
    addToast({ message: `${participant.name} foi promovido para a lista de inscritos.`, type: 'success' });
  };

  return (
    <div className="space-y-8">
      {torneio.categories.map(category => {
        const categoryParticipants = torneio.participants.filter(p => p.categoryId === category.id && !p.on_waitlist);
        const waitlistParticipants = torneio.participants.filter(p => p.categoryId === category.id && p.on_waitlist);
        const hasMatches = torneio.matches.some(m => m.categoryId === category.id);
        
        const allCheckedIn = categoryParticipants.every(p => p.checked_in);
        const allTeamsComplete = categoryParticipants.every(p => {
          const requiredSize = torneio.modality === 'individual' ? 1 : torneio.modality === 'duplas' ? 2 : torneio.team_size || 1;
          return p.players.filter(pl => pl && pl.name).length === requiredSize;
        });
        const canGenerate = categoryParticipants.length >= 2 && allCheckedIn && allTeamsComplete;

        let generateBracketTooltip = '';
        if (categoryParticipants.length < 2) generateBracketTooltip = 'Mínimo de 2 inscritos para gerar chaves.';
        else if (!allTeamsComplete) generateBracketTooltip = 'Existem equipes/duplas incompletas.';
        else if (!allCheckedIn) generateBracketTooltip = 'Todos os inscritos devem ter o check-in realizado.';
        
        const maxParticipants = torneio.max_participants || 0;
        const currentParticipantsCount = categoryParticipants.length;
        const isFull = currentParticipantsCount >= maxParticipants;

        return (
          <div key={category.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <span>{category.group} - {category.level}</span>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                  isFull 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>
                  {currentParticipantsCount} / {maxParticipants}
                </span>
              </h3>
              <div className="flex gap-2 items-center">
                {hasMatches && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">Chaves Geradas</span>
                    </div>
                )}
                {hasMatches ? (
                  <Button variant="outline" onClick={() => onDeleteBracket(category.id)} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Chaves
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => onGenerateBracket(category.id)} disabled={!canGenerate} title={generateBracketTooltip}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gerar Chaves
                  </Button>
                )}
                <Button onClick={() => onAddParticipant(null, category.id, isFull)}>
                  <UserPlus className="h-4 w-4 mr-2" /> 
                  {isFull ? 'Adicionar na Espera' : 'Adicionar Inscrito'}
                </Button>
              </div>
            </div>
            
            <ParticipantTable
              participants={categoryParticipants}
              torneio={torneio}
              onToggleCheckIn={toggleCheckIn}
              onEdit={onEditParticipant}
              onDelete={handleDeleteRequest}
              onParticipantDetailChange={handleParticipantDetailChange}
            />

            {waitlistParticipants.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4 border-t pt-4">Lista de Espera ({waitlistParticipants.length})</h4>
                <ParticipantTable
                  participants={waitlistParticipants}
                  torneio={torneio}
                  onToggleCheckIn={toggleCheckIn}
                  onEdit={onEditParticipant}
                  onDelete={handleDeleteRequest}
                  onPromote={handlePromoteFromWaitlist}
                  isMainListFull={isFull}
                  onParticipantDetailChange={handleParticipantDetailChange}
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
    </div>
  );
};

interface ParticipantTableProps {
    participants: Participant[];
    torneio: Torneio;
    onToggleCheckIn: (id: string) => void;
    onEdit: (p: Participant, categoryId: string) => void;
    onDelete: (p: Participant) => void;
    onPromote?: (p: Participant) => void;
    isMainListFull?: boolean;
    onParticipantDetailChange: (participantId: string, field: keyof Participant, value: any) => void;
}

const ParticipantTable: React.FC<ParticipantTableProps> = ({ participants, torneio, onToggleCheckIn, onEdit, onDelete, onPromote, isMainListFull, onParticipantDetailChange }) => {
    
    const handleInvite = (phone: string, name: string) => {
        const message = encodeURIComponent(`Olá ${name}, você foi inscrito no torneio "${torneio.name}". Crie sua conta em nossa plataforma para acompanhar os jogos e receber notificações: ${window.location.origin}/auth`);
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {participants.length > 0 && (
                    <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Ranking</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Check-in</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                )}
                <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                    {participants.map((participant, index) => {
                        const isTeam = torneio.modality === 'equipes';
                        const isDuo = torneio.modality === 'duplas';
                        const requiredSize = isTeam ? torneio.team_size || 0 : isDuo ? 2 : 1;
                        const currentSize = participant.players.filter(p => p && p.name).length;
                        const isIncomplete = currentSize < requiredSize && requiredSize > 1;
                        const isOnWaitlist = participant.on_waitlist === true;
                        const newPlayer = participant.players.find(p => !p.aluno_id && p.phone);

                        return (
                            <motion.tr key={participant.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div>
                                        <div className="font-semibold text-brand-gray-900 dark:text-white">{participant.name}</div>
                                        {torneio.modality !== 'individual' && participant.players.some(p => p.name) && (
                                            <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                                                {participant.players.map(p => p.name).filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {isIncomplete && (
                                            <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="h-3 w-3" /> Vaga Aberta {isTeam && `(${currentSize}/${requiredSize})`}
                                            </span>
                                        )}
                                        {isOnWaitlist && (
                                            <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                                                <Clock className="h-3 w-3" /> Lista de Espera
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Input
                                        type="number"
                                        className="w-20 text-sm"
                                        value={participant.ranking_points || ''}
                                        placeholder="0"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            onParticipantDetailChange(participant.id, 'ranking_points', e.target.value === '' ? undefined : parseInt(e.target.value, 10));
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {!isOnWaitlist && (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participant.checked_in ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {participant.checked_in ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                                            {participant.checked_in ? 'Feito' : 'Pendente'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                                    {isOnWaitlist && onPromote && (
                                        <Button size="sm" variant="outline" onClick={() => onPromote(participant)} disabled={isMainListFull} title={isMainListFull ? "A lista de inscritos está cheia." : "Promover para a lista de inscritos"}>
                                            <ArrowUpCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {!isOnWaitlist && (
                                        <Button size="sm" variant={participant.checked_in ? 'outline' : 'primary'} onClick={() => onToggleCheckIn(participant.id)} disabled={isIncomplete} title={isIncomplete ? "Complete a equipe/dupla para fazer o check-in" : ""}>
                                            {participant.checked_in ? 'Desfazer' : 'Check-in'}
                                        </Button>
                                    )}
                                    {newPlayer && (
                                        <Button variant="ghost" size="sm" onClick={() => handleInvite(newPlayer.phone!, newPlayer.name)} className="text-green-500 hover:text-green-600" title="Convidar jogador via WhatsApp">
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => onEdit(participant, participant.categoryId)} className="text-brand-gray-500 hover:text-brand-blue-500"><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => onDelete(participant)} className="text-brand-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
            {participants.length === 0 && <p className="text-center py-4 text-sm text-brand-gray-500">Nenhum inscrito {onPromote ? 'na lista de espera' : 'nesta categoria'}.</p>}
        </div>
    );
}

export default ParticipantsTab;
