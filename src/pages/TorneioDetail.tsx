import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate, useBlocker } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, CheckCircle, Trophy, Users, BarChart3, Image as ImageIcon, Edit, AlertTriangle, Share2, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Torneio, Quadra, Reserva, Aluno, Participant, Match } from '../types';
import ParticipantsTab from '../components/Torneios/ParticipantsTab';
import BracketTab from '../components/Torneios/BracketTab';
import TorneioOverviewTab from '../components/Torneios/TorneioOverviewTab';
import ResultsTab from '../components/Torneios/ResultsTab';
import TorneioModal from '../components/Torneios/TorneioModal';
import ConfirmationModal from '../components/Shared/ConfirmationModal';
import { localApi } from '../lib/localApi';
import { generateBracket } from '../utils/eventUtils';
import ParticipantModal from '../components/Torneios/ParticipantModal';
import { v4 as uuidv4 } from 'uuid';
import Input from '../components/Forms/Input';
import CommunicationModal from '../components/Torneios/CommunicationModal';
import { isWithinInterval, parseDateStringAsLocal, endOfDay } from '../utils/dateUtils';
import { syncTournamentReservations } from '../utils/bookingSyncUtils';
import { format } from 'date-fns';

type TabType = 'overview' | 'participants' | 'bracket' | 'results';

const TorneioDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { arena } = useAuth();
  const { addToast } = useToast();
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDeleteBracket, setCategoryToDeleteBracket] = useState<string | null>(null);
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const blocker = useBlocker(hasUnsavedChanges);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  
  const [isComModalOpen, setIsComModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (arena && id) {
      try {
        const [torneiosRes, quadrasRes, alunosRes, reservasRes] = await Promise.all([
          localApi.select<Torneio>('torneios', arena.id),
          localApi.select<Quadra>('quadras', arena.id),
          localApi.select<Aluno>('alunos', arena.id),
          localApi.select<Reserva>('reservas', arena.id),
        ]);
        const currentTorneio = torneiosRes.data?.find(e => e.id === id);
        setTorneio(currentTorneio || null);
        setQuadras(quadrasRes.data || []);
        setAlunos(alunosRes.data || []);
        setReservas(reservasRes.data || []);
        setHasUnsavedChanges(false);
      } catch (error: any) {
        addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
      }
    }
  }, [arena, id, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleTorneioUpdate = (updater: React.SetStateAction<Torneio | null>) => {
    setTorneio(updater);
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };

  const handleShare = async () => {
    if (!torneio) return;
    const publicUrl = `${window.location.origin}/torneios/publico/${torneio.id}`;
    setShareableLink(publicUrl);

    try {
      await navigator.clipboard.writeText(publicUrl);
      addToast({ message: 'Link da página pública copiado!', type: 'success' });
    } catch (err) {
      setShowShareModal(true);
    }
  };

  const handleSendCommunication = async (target: 'all' | string, message: string) => {
    if (!torneio || !arena) return;

    let targetParticipants = torneio.participants;
    if (target !== 'all') {
        targetParticipants = targetParticipants.filter(p => p.categoryId === target);
    }

    const notifications = targetParticipants
        .map(p => p.players.map(player => player.aluno_id))
        .flat()
        .filter((alunoId, index, self) => alunoId && self.indexOf(alunoId) === index) // Unique aluno_ids
        .map(alunoId => {
            const aluno = alunos.find(a => a.id === alunoId);
            if (aluno && aluno.profile_id) {
                return {
                    profile_id: aluno.profile_id,
                    arena_id: arena.id,
                    message: `Anúncio do Torneio "${torneio.name}": ${message}`,
                    type: 'tournament_announcement',
                };
            }
            return null;
        })
        .filter((n): n is NonNullable<typeof n> => n !== null);

    if (notifications.length > 0) {
        try {
            await localApi.upsert('notificacoes', notifications, arena.id);
            addToast({ message: `Comunicado enviado para ${notifications.length} participante(s) com conta.`, type: 'success' });
        } catch (error: any) {
            addToast({ message: `Erro ao enviar comunicado: ${error.message}`, type: 'error' });
        }
    } else {
        addToast({ message: 'Nenhum participante com conta encontrada para receber o comunicado.', type: 'info' });
    }
    setIsComModalOpen(false);
  };

  const handleSave = async () => {
    if (!arena || !torneio || !id) return;
    setIsSaving(true);
    try {
        const torneioToSave = { ...torneio };

        const newPlayersToCreate: { name: string; phone?: string | null }[] = [];
        const allExistingAlunos = (await localApi.select<Aluno>('alunos', arena.id)).data || [];
        
        torneioToSave.participants.forEach(participant => {
            participant.players.forEach(player => {
                if (player.aluno_id === null && player.name) {
                    const existingPlayerIndex = newPlayersToCreate.findIndex(p => p.name === player.name);
                    const alreadyInDb = allExistingAlunos.some(a => a.name.toLowerCase() === player.name.toLowerCase());
                    if (existingPlayerIndex === -1 && !alreadyInDb) {
                        newPlayersToCreate.push({ name: player.name, phone: player.phone });
                    }
                }
            });
        });

        if (newPlayersToCreate.length > 0) {
            const newAlunosPayload = newPlayersToCreate.map(player => ({
                arena_id: arena.id, name: player.name, phone: player.phone || null,
                status: 'ativo' as 'ativo', plan_name: 'Avulso', join_date: format(new Date(), 'yyyy-MM-dd'),
            }));
            const { data: createdAlunos } = await localApi.upsert('alunos', newAlunosPayload, arena.id);
            if (createdAlunos) {
                const createdAlunosMap = new Map(createdAlunos.map(a => [a.name, a.id]));
                torneioToSave.participants.forEach(participant => {
                    participant.players.forEach(player => {
                        if (player.aluno_id === null && player.name) {
                            const newId = createdAlunosMap.get(player.name);
                            if (newId) player.aluno_id = newId;
                        }
                    });
                });
            }
        }
        
        const tournamentStartDate = parseDateStringAsLocal(torneioToSave.start_date);
        const tournamentEndDate = endOfDay(parseDateStringAsLocal(torneioToSave.end_date));

        const cleanedMatches = torneioToSave.matches.map(match => {
            if (match.date) {
                const matchDate = parseDateStringAsLocal(match.date);
                if (!isWithinInterval(matchDate, { start: tournamentStartDate, end: tournamentEndDate })) {
                    return { ...match, date: null, start_time: null, quadra_id: null };
                }
            }
            return match;
        });
        torneioToSave.matches = cleanedMatches;
        
        await localApi.upsert('torneios', [torneioToSave], arena.id);

        const { data: currentReservas } = await localApi.select<Reserva>('reservas', arena.id);
        const updatedReservas = syncTournamentReservations(torneioToSave, currentReservas, quadras);
        await localApi.upsert('reservas', updatedReservas, arena.id, true);

        setHasUnsavedChanges(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        addToast({ message: 'Alterações salvas e agenda sincronizada!', type: 'success' });
        loadData();
    } catch (error: any) {
        addToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!arena || !id) return;
    try {
      await localApi.delete('torneios', [id], arena.id);
      
      const { data: currentReservas } = await localApi.select<Reserva>('reservas', arena.id);
      const finalReservas = currentReservas.filter(r => r.torneio_id !== id);
      await localApi.upsert('reservas', finalReservas, arena.id, true);

      setHasUnsavedChanges(false);
      addToast({ message: 'Torneio excluído com sucesso.', type: 'success' });
      navigate('/torneios');
    } catch (error: any) {
      addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleSaveFromModal = async (torneioData: Torneio | Omit<Torneio, 'id' | 'arena_id' | 'created_at'>) => {
    if (!arena) return;
    const fullTorneioData = { ...torneio, ...torneioData } as Torneio;
    try {
        setTorneio(fullTorneioData);
        setIsEditModalOpen(false);
        setHasUnsavedChanges(true); 
        addToast({ message: 'Dados do torneio atualizados. Clique em "Salvar Alterações" para confirmar.', type: 'info' });
    } catch (error: any) {
        addToast({ message: `Erro ao atualizar torneio: ${error.message}`, type: 'error' });
    }
  };
  
  const handleOpenParticipantModal = (participant: Participant | null, categoryId: string, onWaitlist: boolean = false) => {
    setEditingParticipant(participant);
    setSelectedCategoryForModal(categoryId);
    setIsAddingToWaitlist(onWaitlist);
    setIsParticipantModalOpen(true);
  };

  const handleCloseParticipantModal = () => {
    setIsParticipantModalOpen(false);
    setEditingParticipant(null);
    setSelectedCategoryForModal(null);
  };

  const handleSaveParticipant = (participant: Participant) => {
    handleTorneioUpdate(prev => {
      if (!prev) return null;
      const isEditing = prev.participants.some(p => p.id === participant.id);
      if (isEditing) {
        return { ...prev, participants: prev.participants.map(p => p.id === participant.id ? participant : p) };
      } else {
        return { ...prev, participants: [...prev.participants, participant] };
      }
    });
    handleCloseParticipantModal();
  };

  const handleGenerateBracket = (categoryId: string) => {
    if (!torneio) return;
    const categoryParticipants = torneio.participants.filter(p => p.categoryId === categoryId && !p.on_waitlist);
    if (categoryParticipants.length < 2) {
      addToast({ message: "É necessário ter pelo menos 2 inscritos confirmados nesta categoria para gerar as chaves.", type: 'error' });
      return;
    }
    const otherCategoryMatches = torneio.matches.filter(m => m.categoryId !== categoryId);
    const newMatches = generateBracket(categoryParticipants, categoryId);
    
    handleTorneioUpdate(prev => prev ? { ...prev, matches: [...otherCategoryMatches, ...newMatches] } : null);
    addToast({ message: "Chaves geradas com sucesso! Salve as alterações para confirmar.", type: 'info' });
  };
  
  const handleRequestDeleteBracket = (categoryId: string) => {
    setCategoryToDeleteBracket(categoryId);
  };

  const handleConfirmDeleteBracket = () => {
    if (!categoryToDeleteBracket) return;

    handleTorneioUpdate(prev => {
      if (!prev) return null;
      const updatedMatches = prev.matches.filter(m => m.categoryId !== categoryToDeleteBracket);
      return { ...prev, matches: updatedMatches };
    });

    addToast({ message: 'Chaves removidas. Salve as alterações para confirmar.', type: 'info' });
    setCategoryToDeleteBracket(null);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Trophy },
    { id: 'participants', label: 'Inscritos', icon: Users },
    { id: 'bracket', label: 'Chaves', icon: BarChart3 },
    { id: 'results', label: 'Resultados', icon: ImageIcon },
  ];

  const renderContent = () => {
    if (!torneio) return null;
    switch (activeTab) {
      case 'overview': return <TorneioOverviewTab torneio={torneio} />;
      case 'participants': return <ParticipantsTab torneio={torneio} setTorneio={handleTorneioUpdate} alunos={alunos} onAddParticipant={handleOpenParticipantModal} onEditParticipant={handleOpenParticipantModal} onGenerateBracket={handleGenerateBracket} onDeleteBracket={handleRequestDeleteBracket} />;
      case 'bracket': return <BracketTab torneio={torneio} setTorneio={handleTorneioUpdate} quadras={quadras} />;
      case 'results': return <ResultsTab torneio={torneio} setTorneio={handleTorneioUpdate} />;
      default: return null;
    }
  };

  if (!torneio) {
    return <Layout><div className="text-center p-8">Carregando torneio...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/torneios" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para todos os torneios
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{torneio.name}</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie todos os aspectos do seu torneio.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <AnimatePresence>
                    {hasUnsavedChanges && !isSaving && !showSuccess && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Alterações não salvas</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Button variant="outline" onClick={() => setIsComModalOpen(true)}><Send className="h-4 w-4 mr-2" />Comunicar</Button>
                <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Compartilhar</Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(true)}><Edit className="h-4 w-4 mr-2" />Editar</Button>
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)} className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                </Button>
                <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving || !hasUnsavedChanges} className={hasUnsavedChanges && !isSaving ? 'animate-pulse' : ''}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={showSuccess ? 'success' : 'save'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center">
                      {showSuccess ? <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
                    </motion.span>
                  </AnimatePresence>
                </Button>
            </div>
          </div>
        </motion.div>

        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'}`}>
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      <TorneioModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveFromModal}
        initialData={torneio}
        quadras={quadras}
        reservas={reservas}
      />
      <ParticipantModal 
        isOpen={isParticipantModalOpen}
        onClose={handleCloseParticipantModal}
        onSave={handleSaveParticipant}
        modality={torneio.modality}
        teamSize={torneio.team_size}
        initialData={editingParticipant}
        alunos={alunos}
        categoryId={selectedCategoryForModal}
        onWaitlist={isAddingToWaitlist}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão do Torneio"
        message={<p>Tem certeza que deseja excluir o torneio <strong>"{torneio.name}"</strong>? Todos os jogos e bloqueios de horário associados serão removidos. Esta ação é irreversível.</p>}
        confirmText="Sim, Excluir"
      />
       <ConfirmationModal
        isOpen={!!categoryToDeleteBracket}
        onClose={() => setCategoryToDeleteBracket(null)}
        onConfirm={handleConfirmDeleteBracket}
        title="Confirmar Exclusão das Chaves"
        message={<><p>Tem certeza que deseja excluir o chaveamento desta categoria?</p><p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">Todos os resultados e agendamentos de partidas para esta categoria serão perdidos. Os horários bloqueados na agenda serão liberados após salvar as alterações.</p></>}
        confirmText="Sim, Excluir Chaves"
      />
       <ConfirmationModal
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Sair sem Salvar?"
        message="Você tem alterações não salvas. Se sair agora, perderá todo o seu progresso. Deseja continuar?"
        confirmText="Sair"
        cancelText="Permanecer"
      />
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-xl font-semibold">Compartilhar Torneio</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowShareModal(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-brand-gray-500">
                  A cópia automática falhou. Por favor, copie o link manualmente abaixo (Ctrl+C / Cmd+C).
                </p>
                <Input
                  readOnly
                  value={shareableLink}
                  onFocus={(e) => e.target.select()}
                  autoFocus
                />
              </div>
              <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
                <Button onClick={() => setShowShareModal(false)}>Fechar</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CommunicationModal
        isOpen={isComModalOpen}
        onClose={() => setIsComModalOpen(false)}
        onSubmit={handleSendCommunication}
        categories={torneio.categories}
        participantCount={torneio.participants.length}
      />
    </Layout>
  );
};

export default TorneioDetail;
