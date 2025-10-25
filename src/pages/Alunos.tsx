import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, GraduationCap, BookOpen, Plus, Search, BadgeCheck, BadgeX, Briefcase, Loader2, MessageSquare, MoreVertical, Handshake, UserCheck, Star, Edit, Trash2, Phone, Calendar, List, Mail, Percent, FileText, DollarSign, BadgeHelp, UserPlus } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Aluno, Professor, Quadra, Turma, Reserva, AtletaAluguel, PlanoAula, GamificationPointTransaction } from '../types';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import AlunoModal from '../components/Alunos/AlunoModal';
import ProfessorModal from '../components/Alunos/ProfessorModal';
import TurmaModal from '../components/Alunos/TurmaModal';
import TurmaCard from '../components/Alunos/TurmaCard';
import ConfirmationModal from '../components/Shared/ConfirmationModal';
import { format, isBefore } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import AtletaAluguelModal from '../components/Alunos/AtletaAluguelModal';
import { localUploadPhoto } from '../lib/localApi';
import ProfessorAgendaView from '../components/Alunos/ProfessorAgendaView';
import { syncTurmaReservations } from '../utils/bookingSyncUtils';
import { awardPointsForCompletedReservation } from '../utils/gamificationUtils';

type TabType = 'clientes' | 'alunos' | 'professores' | 'atletas' | 'turmas';
type ProfessoresViewMode = 'list' | 'agenda';

const Alunos: React.FC = () => {
  const { selectedArenaContext: arena, profile, isLoading: isAuthLoading } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('clientes');
  const [professoresViewMode, setProfessoresViewMode] = useState<ProfessoresViewMode>('list');
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [atletasAluguel, setAtletasAluguel] = useState<AtletaAluguel[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [planos, setPlanos] = useState<PlanoAula[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isAlunoModalOpen, setIsAlunoModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const [isAtletaAluguelModalOpen, setIsAtletaAluguelModalOpen] = useState(false);
  const [editingAtletaAluguel, setEditingAtletaAluguel] = useState<AtletaAluguel | null>(null);

  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'aluno' | 'professor' | 'atleta' | 'turma' } | null>(null);
  
  const canEdit = useMemo(() => profile?.role === 'admin_arena' || profile?.permissions?.gerenciamento_arena === 'edit', [profile]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    if (!arena) {
        setIsLoading(false);
        return;
    }
    try {
      const [alunosRes, professoresRes, turmasRes, quadrasRes, atletasRes, planosRes, reservasRes, transactionsRes] = await Promise.all([
        localApi.select<Aluno>('alunos', arena.id),
        localApi.select<Professor>('professores', arena.id),
        localApi.select<Turma>('turmas', arena.id),
        localApi.select<Quadra>('quadras', arena.id),
        localApi.select<AtletaAluguel>('atletas_aluguel', arena.id),
        localApi.select<PlanoAula>('planos_aulas', arena.id),
        localApi.select<Reserva>('reservas', arena.id),
        localApi.select<GamificationPointTransaction>('gamification_point_transactions', arena.id),
      ]);

      // Processar pontos de gamificação para reservas concluídas
      const now = new Date();
      const completedReservations = (reservasRes.data || []).filter(r => {
        if (r.status !== 'confirmada' && r.status !== 'realizada') return false;
        try {
          const endDateTime = parseDateStringAsLocal(`${r.date}T${r.end_time}`);
          return isBefore(endDateTime, now);
        } catch { return false; }
      });

      if (completedReservations.length > 0) {
        const processedIds = new Set((transactionsRes.data || []).filter(t => t.type === 'reservation_completed').map(t => t.related_reservation_id));
        const reservationsToProcess = completedReservations.filter(r => !r.id || !processedIds.has(r.id));
        
        if (reservationsToProcess.length > 0) {
          for (const reserva of reservationsToProcess) {
            await awardPointsForCompletedReservation(reserva, arena.id);
          }
          // Refetch alunos data after awarding points
          const { data: updatedAlunos } = await localApi.select<Aluno>('alunos', arena.id);
          setAlunos(updatedAlunos || []);
        } else {
          setAlunos(alunosRes.data || []);
        }
      } else {
        setAlunos(alunosRes.data || []);
      }

      setProfessores(professoresRes.data || []);
      setTurmas(turmasRes.data || []);
      setQuadras(quadrasRes.data || []);
      setAtletasAluguel(atletasRes.data || []);
      setPlanos(planosRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [isAuthLoading, loadData]);
  
  const handleDataChange = useCallback(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    if (location.state?.openModal) {
      setIsAlunoModalOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  const handleSaveAluno = async (alunoData: Omit<Aluno, 'id' | 'arena_id' | 'created_at'> | Aluno) => {
    if (!arena) return;
    try {
        const dataWithDefaults = {
            ...alunoData,
            credit_balance: 'credit_balance' in alunoData ? alunoData.credit_balance : 0,
            gamification_points: 'gamification_points' in alunoData ? alunoData.gamification_points : 0,
        };
        await localApi.upsert('alunos', [{ ...dataWithDefaults, arena_id: arena.id }], arena.id);
        addToast({ message: `Cliente/Aluno salvo com sucesso!`, type: 'success' });
        await loadData();
        setIsAlunoModalOpen(false);
        setEditingAluno(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar cliente/aluno: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteRequest = (id: string, name: string, type: 'aluno' | 'professor' | 'atleta' | 'turma') => {
    setItemToDelete({ id, name, type });
    setIsDeleteModalOpen(true);
    setIsAlunoModalOpen(false);
    setIsProfessorModalOpen(false);
    setIsTurmaModalOpen(false);
    setIsAtletaAluguelModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !arena) return;
    const { id, type } = itemToDelete;
    const tableName = type === 'turma' ? 'turmas' : type === 'professor' ? 'professores' : type === 'atleta' ? 'atletas_aluguel' : 'alunos';
    try {
      if (type === 'turma') {
        const { data: allReservas } = await localApi.select<Reserva>('reservas', arena.id);
        const otherReservas = allReservas.filter(r => r.turma_id !== id);
        await localApi.upsert('reservas', otherReservas, arena.id, true);
      }
      await localApi.delete(tableName, [id], arena.id);
      addToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} excluído(a) com sucesso.`, type: 'success' });
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSaveProfessor = async (professorData: Omit<Professor, 'id' | 'arena_id' | 'created_at'> | Professor, photoFile?: File | null) => {
    if (!arena) return;
    try {
        let finalAvatarUrl = professorData.avatar_url;
        if (photoFile) {
            const { publicUrl } = await localUploadPhoto(photoFile);
            finalAvatarUrl = publicUrl;
        }
        await localApi.upsert('professores', [{ ...professorData, arena_id: arena.id, avatar_url: finalAvatarUrl }], arena.id);
        if (professorData.profile_id) {
          const alunoToRemove = alunos.find(a => a.profile_id === professorData.profile_id);
          if (alunoToRemove) {
            await localApi.delete('alunos', [alunoToRemove.id], arena.id);
          }
        }
        addToast({ message: `Professor salvo com sucesso!`, type: 'success' });
        await loadData();
        setIsProfessorModalOpen(false);
        setEditingProfessor(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar professor: ${error.message}`, type: 'error' });
    }
  };
  
  const handleSaveAtletaAluguel = async (atletaData: Omit<AtletaAluguel, 'id' | 'arena_id' | 'created_at'> | AtletaAluguel, photoFile?: File | null) => {
    if (!arena) return;
    try {
        let finalAvatarUrl = atletaData.avatar_url;
        if (photoFile) {
            const { publicUrl } = await localUploadPhoto(photoFile);
            finalAvatarUrl = publicUrl;
        }
        await localApi.upsert('atletas_aluguel', [{ ...atletaData, arena_id: arena.id, avatar_url: finalAvatarUrl }], arena.id);
        if (atletaData.profile_id) {
          const alunoToRemove = alunos.find(a => a.profile_id === atletaData.profile_id);
          if (alunoToRemove) {
            await localApi.delete('alunos', [alunoToRemove.id], arena.id);
          }
        }
        addToast({ message: `Atleta salvo com sucesso!`, type: 'success' });
        await loadData();
        setIsAtletaAluguelModalOpen(false);
        setEditingAtletaAluguel(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar atleta: ${error.message}`, type: 'error' });
    }
  };

  const handleSaveTurma = async (turmaData: Omit<Turma, 'id' | 'arena_id' | 'created_at'> | Turma) => {
    if (!arena) return;
    try {
        const { data: savedTurmas } = await localApi.upsert('turmas', [{ ...turmaData, arena_id: arena.id }], arena.id);
        const savedTurma = savedTurmas[0];
        if (!savedTurma) throw new Error("Falha ao salvar a turma.");
        
        const { data: allReservas } = await localApi.select<Reserva>('reservas', arena.id);
        const updatedReservas = syncTurmaReservations(savedTurma, allReservas);
        
        await localApi.upsert('reservas', updatedReservas, arena.id, true);

        addToast({ message: `Turma salva com sucesso!`, type: 'success' });
        await loadData();
        setIsTurmaModalOpen(false);
        setEditingTurma(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar turma: ${error.message}`, type: 'error' });
    }
  };

  const isAluno = (aluno: Aluno): boolean => !!(aluno.plan_name && aluno.plan_name.trim() !== '' && aluno.plan_name.toLowerCase() !== 'avulso');

  const linkedProfileIds = useMemo(() => {
    const profProfileIds = professores.map(p => p.profile_id).filter(Boolean);
    const atletaAluguelProfileIds = atletasAluguel.map(p => p.profile_id).filter(Boolean);
    return new Set([...profProfileIds, ...atletaAluguelProfileIds]);
  }, [professores, atletasAluguel]);

  const unlinkedAlunos = useMemo(() => {
    return alunos.filter(a => !linkedProfileIds.has(a.profile_id));
  }, [alunos, linkedProfileIds]);

  const filteredClientes = useMemo(() => 
    unlinkedAlunos.filter(a => !isAluno(a) && a.name.toLowerCase().includes(searchTerm.toLowerCase())), 
    [unlinkedAlunos, searchTerm, isAluno]
  );
  
  const filteredAlunos = useMemo(() => 
    unlinkedAlunos.filter(a => isAluno(a) && a.name.toLowerCase().includes(searchTerm.toLowerCase())), 
    [unlinkedAlunos, searchTerm, isAluno]
  );

  const filteredProfessores = useMemo(() => professores.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [professores, searchTerm]);
  const filteredAtletasAluguel = useMemo(() => atletasAluguel.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [atletasAluguel, searchTerm]);
  const filteredTurmas = useMemo(() => turmas.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [turmas, searchTerm]);
  
  const availableSports = useMemo(() => [...new Set(quadras.flatMap(q => q.sports || []).filter(Boolean))], [quadras]);
  
  const linkableAlunosForModal = useMemo(() => {
    const currentEditingProfessorId = editingProfessor?.profile_id;
    const currentEditingAtletaId = editingAtletaAluguel?.profile_id;
    
    return alunos.filter(a => {
      if (!a.profile_id) return false;
      if (a.profile_id === currentEditingProfessorId || a.profile_id === currentEditingAtletaId) return true;
      return !linkedProfileIds.has(a.profile_id);
    });
  }, [alunos, linkedProfileIds, editingProfessor, editingAtletaAluguel]);

  const handlePromoteToProfessor = (aluno: Aluno) => {
    const newProfessorData: Partial<Professor> = {
      profile_id: aluno.profile_id,
      name: aluno.name,
      email: aluno.email || '',
      phone: aluno.phone || '',
      avatar_url: aluno.avatar_url,
      specialties: [],
      status: 'ativo',
      valor_hora_aula: 0,
    };
    setEditingProfessor(newProfessorData as Professor);
    setIsProfessorModalOpen(true);
  };

  const handlePromoteToAtleta = (aluno: Aluno) => {
    const newAtletaData: Partial<AtletaAluguel> = {
      profile_id: aluno.profile_id,
      name: aluno.name,
      email: aluno.email || '',
      phone: aluno.phone || '',
      avatar_url: aluno.avatar_url,
      status: 'disponivel',
      esportes: [],
      taxa_hora: 0,
      comissao_arena: 10,
    };
    setEditingAtletaAluguel(newAtletaData as AtletaAluguel);
    setIsAtletaAluguelModalOpen(true);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'clientes', label: 'Clientes', icon: Users }, { id: 'alunos', label: 'Alunos', icon: GraduationCap },
    { id: 'professores', label: 'Professores', icon: Briefcase },
    { id: 'atletas', label: 'Atletas', icon: Handshake },
    { id: 'turmas', label: 'Turmas', icon: BookOpen },
  ];
  
  const addButtonLabel = useMemo(() => {
    if (activeTab === 'atletas') return 'Adicionar Atleta';
    if (activeTab === 'professores') return 'Adicionar Professor';
    if (activeTab === 'turmas') return 'Adicionar Turma';
    return `Adicionar Cliente`;
  }, [activeTab]);

  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'atletas') return 'Buscar por atleta...';
    if (activeTab === 'professores') return 'Buscar por professor...';
    if (activeTab === 'turmas') return 'Buscar por turma...';
    return `Buscar por cliente/aluno...`;
  }, [activeTab]);

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    switch (activeTab) {
      case 'clientes': return <AlunosList alunos={filteredClientes} onEdit={setEditingAluno} onPromoteToProfessor={handlePromoteToProfessor} onPromoteToAtleta={handlePromoteToAtleta} canEdit={canEdit} />;
      case 'alunos': return <AlunosList alunos={filteredAlunos} onEdit={setEditingAluno} onPromoteToProfessor={handlePromoteToProfessor} onPromoteToAtleta={handlePromoteToAtleta} canEdit={canEdit} />;
      case 'professores':
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Button variant={professoresViewMode === 'list' ? 'primary' : 'outline'} size="sm" onClick={() => setProfessoresViewMode('list')}><List className="h-4 w-4 mr-2"/>Lista</Button>
              <Button variant={professoresViewMode === 'agenda' ? 'primary' : 'outline'} size="sm" onClick={() => setProfessoresViewMode('agenda')}><Calendar className="h-4 w-4 mr-2"/>Agenda</Button>
            </div>
            {professoresViewMode === 'list' ? (
              <ProfessoresList professores={filteredProfessores} onEdit={setEditingProfessor} onDelete={(id, name) => handleDeleteRequest(id, name, 'professor')} canEdit={canEdit} />
            ) : (
              <ProfessorAgendaView professores={professores} turmas={turmas} quadras={quadras} isGeneralView={true} />
            )}
          </div>
        );
      case 'atletas': return <AtletasAluguelList atletas={filteredAtletasAluguel} onEdit={setEditingAtletaAluguel} onDelete={(id, name) => handleDeleteRequest(id, name, 'atleta')} canEdit={canEdit} />;
      case 'turmas': return <TurmasList turmas={filteredTurmas} professores={professores} quadras={quadras} onEdit={setEditingTurma} onDelete={(id, name) => handleDeleteRequest(id, name, 'turma')} canEdit={canEdit} />;
      default: return null;
    }
  };
  
  useEffect(() => { if (editingAluno) setIsAlunoModalOpen(true); }, [editingAluno]);
  useEffect(() => { if (!isAlunoModalOpen) setEditingAluno(null); }, [isAlunoModalOpen]);
  useEffect(() => { if (editingProfessor) setIsProfessorModalOpen(true); }, [editingProfessor]);
  useEffect(() => { if (!isProfessorModalOpen) setEditingProfessor(null); }, [isProfessorModalOpen]);
  useEffect(() => { if (editingAtletaAluguel) setIsAtletaAluguelModalOpen(true); }, [editingAtletaAluguel]);
  useEffect(() => { if (!isAtletaAluguelModalOpen) setEditingAtletaAluguel(null); }, [isAtletaAluguelModalOpen]);
  useEffect(() => { if (editingTurma) setIsTurmaModalOpen(true); }, [editingTurma]);
  useEffect(() => { if (!isTurmaModalOpen) setEditingTurma(null); }, [isTurmaModalOpen]);

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (profile?.role === 'funcionario' && profile.permissions?.gerenciamento_arena === 'none') {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-brand-gray-500">Você não tem permissão para acessar esta área.</p>
          <Link to="/dashboard"><Button className="mt-4">Voltar para o Painel</Button></Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Gerenciamento da Arena</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie sua base de clientes, alunos, profissionais e turmas.</p>
        </motion.div>
        <div className="mb-8 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400'}`}><tab.icon className="mr-2 h-5 w-5" />{tab.label}</button>)}
          </nav>
        </div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto sm:flex-1"><Input placeholder={searchPlaceholder} icon={<Search className="h-4 w-4 text-brand-gray-400" />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Button onClick={() => { if (activeTab.startsWith('cliente') || activeTab.startsWith('aluno')) setIsAlunoModalOpen(true); else if (activeTab === 'professores') setIsProfessorModalOpen(true); else if (activeTab === 'atletas') setIsAtletaAluguelModalOpen(true); else setIsTurmaModalOpen(true); }} disabled={!canEdit}><Plus className="h-4 w-4 mr-2" />{addButtonLabel}</Button>
          </div>
        </div>
        <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>{renderContent()}</motion.div></AnimatePresence>
      </div>
      <AlunoModal isOpen={isAlunoModalOpen} onClose={() => setIsAlunoModalOpen(false)} onSave={handleSaveAluno} onDelete={(id) => handleDeleteRequest(id, editingAluno?.name || '', 'aluno')} initialData={editingAluno} availableSports={availableSports} planos={planos} modalType={activeTab === 'clientes' ? 'Cliente' : 'Aluno'} allAlunos={alunos} onDataChange={handleDataChange} />
      <ProfessorModal isOpen={isProfessorModalOpen} onClose={() => setIsProfessorModalOpen(false)} onSave={handleSaveProfessor} onDelete={(id) => handleDeleteRequest(id, editingProfessor?.name || '', 'professor')} initialData={editingProfessor} alunos={linkableAlunosForModal} />
      <AtletaAluguelModal isOpen={isAtletaAluguelModalOpen} onClose={() => setIsAtletaAluguelModalOpen(false)} onSave={handleSaveAtletaAluguel} onDelete={(id) => handleDeleteRequest(id, editingAtletaAluguel?.name || '', 'atleta')} initialData={editingAtletaAluguel} alunos={linkableAlunosForModal} />
      <TurmaModal isOpen={isTurmaModalOpen} onClose={() => setIsTurmaModalOpen(false)} onSave={handleSaveTurma} initialData={editingTurma} professores={professores} quadras={quadras} alunos={unlinkedAlunos} planos={planos} onDataChange={handleDataChange} />
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={<><p>Tem certeza que deseja excluir <strong>{itemToDelete?.name}</strong>?</p><p className="mt-2 text-xs text-red-500 dark:text-red-400">Esta ação é irreversível.</p></>} confirmText="Sim, Excluir" />
    </Layout>
  );
};

const AlunosList: React.FC<{ alunos: Aluno[], onEdit: (aluno: Aluno) => void, onPromoteToProfessor: (aluno: Aluno) => void, onPromoteToAtleta: (aluno: Aluno) => void, canEdit: boolean }> = ({ alunos, onEdit, onPromoteToProfessor, onPromoteToAtleta, canEdit }) => {
  if (alunos.length === 0) return <PlaceholderTab title="Nenhum cliente/aluno encontrado" description="Cadastre novos clientes ou alunos para vê-los aqui." />;
  
  const getStatusProps = (status: Aluno['status']) => ({
    'ativo': { icon: BadgeCheck, color: 'text-green-500' },
    'inativo': { icon: BadgeX, color: 'text-red-500' },
    'experimental': { icon: BadgeHelp, color: 'text-yellow-500' }
  }[status]);

  const handleInvite = (phone: string, name: string) => {
    const message = encodeURIComponent(`Olá ${name}, para acompanhar suas reservas, pontos e receber notificações da nossa arena, crie sua conta em nossa plataforma: ${window.location.origin}/auth`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Cliente/Aluno</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Conta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Crédito</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Nível / Pontos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Plano</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {alunos.map((aluno, index) => {
              const statusProps = getStatusProps(aluno.status);
              const levelName = (aluno.gamification_levels as { name: string } | null)?.name || 'Iniciante';
              return (
                <motion.tr key={aluno.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} onClick={() => canEdit && onEdit(aluno)} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10">{aluno.avatar_url ? (<img className="h-10 w-10 rounded-full object-cover" src={aluno.avatar_url} alt={aluno.name} />) : (<div className="h-10 w-10 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center text-brand-gray-500 font-bold">{aluno.name ? aluno.name.charAt(0).toUpperCase() : '?'}</div>)}</div><div className="ml-4"><div className="text-sm font-medium text-brand-gray-900 dark:text-white">{aluno.name}</div><div className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{aluno.email}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusProps.color.replace('text-','bg-').replace('-500','-100')} dark:${statusProps.color.replace('text-','bg-').replace('-500','-900/50')} ${statusProps.color}`}><statusProps.icon className="h-3 w-3 mr-1.5" />{aluno.status.charAt(0).toUpperCase() + aluno.status.slice(1)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {aluno.profile_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        <UserCheck className="h-3 w-3 mr-1.5" /> Verificada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-gray-100 text-brand-gray-700 dark:bg-brand-gray-700 dark:text-brand-gray-300">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(aluno.credit_balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-brand-gray-900 dark:text-white flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-400" />{levelName}</div><div className="text-sm text-brand-gray-500">{aluno.gamification_points || 0} pontos</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-brand-gray-900 dark:text-white">{aluno.plan_name}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {aluno.profile_id && canEdit ? (
                      <ActionMenu aluno={aluno} onPromoteToProfessor={() => onPromoteToProfessor(aluno)} onPromoteToAtleta={() => onPromoteToAtleta(aluno)} />
                    ) : !aluno.profile_id && aluno.phone && canEdit ? (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleInvite(aluno.phone!, aluno.name); }} title="Convidar cliente via WhatsApp" className="text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 p-2">
                        <MessageSquare className="h-5 w-5" />
                      </Button>
                    ) : (
                      <div className="w-9 h-9"></div>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProfessoresList: React.FC<{ professores: Professor[], onEdit: (prof: Professor) => void, onDelete: (id: string, name: string) => void, canEdit: boolean }> = ({ professores, onEdit, onDelete, canEdit }) => {
  if (professores.length === 0) return <PlaceholderTab title="Nenhum professor encontrado" description="Cadastre os professores que dão aulas na sua arena." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {professores.map((prof, index) => (
        <motion.div key={prof.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {prof.avatar_url ? (<img src={prof.avatar_url} alt={prof.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-gray-200 dark:border-brand-gray-600" />) : (<div className="w-16 h-16 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center border-2 border-brand-gray-200 dark:border-brand-gray-600"><span className="text-2xl text-brand-gray-500 font-bold">{prof.name ? prof.name.charAt(0).toUpperCase() : '?'}</span></div>)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{prof.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${prof.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {prof.status === 'ativo' ? <BadgeCheck className="h-3 w-3 mr-1" /> : <BadgeX className="h-3 w-3 mr-1" />}
                    {prof.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(prof)} className="p-2" title="Editar"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(prof.id, prof.name)} className="p-2 hover:text-red-500" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
            <div className="space-y-3 text-sm mb-4 border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
              {prof.email && <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400"><Mail className="h-4 w-4 mr-2 text-brand-gray-400" /><span>{prof.email}</span></div>}
              {prof.phone && <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400"><Phone className="h-4 w-4 mr-2 text-brand-gray-400" /><span>{prof.phone}</span></div>}
              <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400"><Briefcase className="h-4 w-4 mr-2 text-brand-gray-400" /><span>{prof.nivel_experiencia || 'Nível não informado'}</span></div>
              <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400"><DollarSign className="h-4 w-4 mr-2 text-brand-gray-400" /><span>{formatCurrency(prof.valor_hora_aula)} / hora</span></div>
              {prof.metodologia && <div className="flex items-start text-brand-gray-600 dark:text-brand-gray-400"><FileText className="h-4 w-4 mr-2 mt-0.5 text-brand-gray-400 flex-shrink-0" /><p className="italic line-clamp-2">"{prof.metodologia}"</p></div>}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400">Especialidades:</h4>
            <div className="flex flex-wrap gap-2">
              {prof.specialties.map(spec => (
                <span key={spec} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{spec}</span>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700">
            <Link to={`/professores/${prof.id}`} className="w-full block">
              <Button variant="secondary" className="w-full">
                Ver Perfil
              </Button>
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const AtletasAluguelList: React.FC<{ atletas: AtletaAluguel[], onEdit: (prof: AtletaAluguel) => void, onDelete: (id: string, name: string) => void, canEdit: boolean }> = ({ atletas, onEdit, onDelete, canEdit }) => {
  if (atletas.length === 0) return <PlaceholderTab title="Nenhum atleta encontrado" description="Cadastre jogadores que podem ser contratados por seus clientes." />;
  
  const getStatusProps = (status: AtletaAluguel['status']) => ({
    'disponivel': { icon: BadgeCheck, color: 'text-green-500', label: 'Disponível' },
    'indisponivel': { icon: BadgeX, color: 'text-red-500', label: 'Indisponível' },
  }[status]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {atletas.map((atleta, index) => {
        const statusProps = getStatusProps(atleta.status);
        const specialtiesString = atleta.esportes.map(e => e.position ? `${e.sport} (${e.position})` : e.sport).join(', ');
        return (
          <motion.div key={atleta.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {atleta.avatar_url ? (
                    <img src={atleta.avatar_url} alt={atleta.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-gray-200 dark:border-brand-gray-600" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center border-2 border-brand-gray-200 dark:border-brand-gray-600"><span className="text-2xl text-brand-gray-500 font-bold">{atleta.name ? atleta.name.charAt(0).toUpperCase() : '?'}</span></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{atleta.name}</h3>
                  <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{atleta.phone}</p>
                </div>
              </div>
              {canEdit && (
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(atleta)} className="p-2" title="Editar"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(atleta.id, atleta.name)} className="p-2 hover:text-red-500" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
            <div className="mb-4">
              <h4 className="text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-1">Especialidades</h4>
              <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">{specialtiesString}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Valor/Partida</p>
                <p className="font-semibold text-brand-gray-800 dark:text-white">{formatCurrency(atleta.taxa_hora)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Comissão Arena</p>
                <p className="font-semibold text-brand-gray-800 dark:text-white">{atleta.comissao_arena}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Status</p>
                <p className={`font-semibold text-sm flex items-center ${statusProps.color}`}><statusProps.icon className="h-4 w-4 mr-1.5" />{statusProps.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const TurmasList: React.FC<{ turmas: Turma[], professores: Professor[], quadras: Quadra[], onEdit: (turma: Turma) => void, onDelete: (id: string, name: string) => void, canEdit: boolean }> = ({ turmas, professores, quadras, onEdit, onDelete, canEdit }) => {
  if (turmas.length === 0) return <PlaceholderTab title="Nenhuma turma encontrada" description="Clique em 'Adicionar Turma' para criar sua primeira turma e começar a agendar aulas." />;
  return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{turmas.map((turma, index) => (<TurmaCard key={turma.id} turma={turma} professor={professores.find(p => p.id === turma.professor_id)} quadra={quadras.find(q => q.id === turma.quadra_id)} onEdit={() => canEdit && onEdit(turma)} onDelete={() => canEdit && onDelete(turma.id, turma.name)} index={index} />))}</div>);
};

const PlaceholderTab: React.FC<{ title: string, description: string }> = ({ title, description }) => (<div className="text-center py-16"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto"><div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6"><Users className="h-8 w-8 text-brand-gray-400" /></div><h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">{title}</h3><p className="text-brand-gray-600 dark:text-brand-gray-400">{description}</p></motion.div></div>);

const ActionMenu: React.FC<{ aluno: Aluno, onPromoteToProfessor: () => void, onPromoteToAtleta: () => void }> = ({ aluno, onPromoteToProfessor, onPromoteToAtleta }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsOpen(p => !p); }} className="p-2">
        <MoreVertical className="h-5 w-5" />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-1 w-48 bg-white dark:bg-brand-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <button onClick={(e) => { e.stopPropagation(); onPromoteToProfessor(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800">
                <Briefcase className="h-4 w-4 mr-3" /> Tornar Professor
              </button>
              <button onClick={(e) => { e.stopPropagation(); onPromoteToAtleta(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800">
                <Handshake className="h-4 w-4 mr-3" /> Tornar Atleta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Alunos;
