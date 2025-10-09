import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, GraduationCap, BookOpen, Plus, Search, BadgeCheck, BadgeX, BadgeHelp, Briefcase, Loader2, Phone, Star, Edit, Trash2, Calendar, MessageSquare, UserCheck, Handshake } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Aluno, Professor, Quadra, Turma, Reserva, ProfissionalAluguel } from '../types';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import AlunoModal from '../components/Alunos/AlunoModal';
import ProfessorModal from '../components/Alunos/ProfessorModal';
import TurmaModal from '../components/Alunos/TurmaModal';
import TurmaCard from '../components/Alunos/TurmaCard';
import ConfirmationModal from '../components/Shared/ConfirmationModal';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import ProfissionalAluguelModal from '../components/Alunos/ProfissionalAluguelModal';

type TabType = 'clientes' | 'alunos' | 'professores' | 'profissionais' | 'turmas';

const getNextDateForDay = (startDate: Date, dayOfWeek: number): Date => {
  const date = new Date(startDate.getTime());
  const currentDay = date.getDay();
  const distance = (dayOfWeek - currentDay + 7) % 7;
  date.setDate(date.getDate() + distance);
  return date;
};

const Alunos: React.FC = () => {
  const { arena } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('clientes');
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [profissionaisAluguel, setProfissionaisAluguel] = useState<ProfissionalAluguel[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isAlunoModalOpen, setIsAlunoModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const [isProfissionalAluguelModalOpen, setIsProfissionalAluguelModalOpen] = useState(false);
  const [editingProfissionalAluguel, setEditingProfissionalAluguel] = useState<ProfissionalAluguel | null>(null);

  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'aluno' | 'professor' | 'profissional' | 'turma' } | null>(null);

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const [alunosRes, professoresRes, turmasRes, quadrasRes, profissionaisRes] = await Promise.all([
        localApi.select<Aluno>('alunos', arena.id),
        localApi.select<Professor>('professores', arena.id),
        localApi.select<Turma>('turmas', arena.id),
        localApi.select<Quadra>('quadras', arena.id),
        localApi.select<ProfissionalAluguel>('profissionais_aluguel', arena.id),
      ]);
      setAlunos(alunosRes.data || []);
      setProfessores(professoresRes.data || []);
      setTurmas(turmasRes.data || []);
      setQuadras(quadrasRes.data || []);
      setProfissionaisAluguel(profissionaisRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
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

  const handleDeleteRequest = (id: string, name: string, type: 'aluno' | 'professor' | 'profissional' | 'turma') => {
    setItemToDelete({ id, name, type });
    setIsDeleteModalOpen(true);
    setIsAlunoModalOpen(false);
    setIsProfessorModalOpen(false);
    setIsTurmaModalOpen(false);
    setIsProfissionalAluguelModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !arena) return;
    const { id, type } = itemToDelete;
    const tableName = type === 'turma' ? 'turmas' : type === 'professor' ? 'professores' : type === 'profissional' ? 'profissionais_aluguel' : 'alunos';
    try {
      if (type === 'turma') {
        const { data: allReservas } = await localApi.select<Reserva>('reservas', arena.id);
        const otherReservas = allReservas.filter(r => r.turma_id !== id);
        await localApi.upsert('reservas', otherReservas, arena.id, true); // Overwrite with filtered list
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

  const handleSaveProfessor = async (professorData: Omit<Professor, 'id' | 'arena_id' | 'created_at'> | Professor) => {
    if (!arena) return;
    try {
        await localApi.upsert('professores', [{ ...professorData, arena_id: arena.id }], arena.id);
        addToast({ message: `Professor salvo com sucesso!`, type: 'success' });
        await loadData();
        setIsProfessorModalOpen(false);
        setEditingProfessor(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar professor: ${error.message}`, type: 'error' });
    }
  };
  
  const handleSaveProfissionalAluguel = async (profissionalData: Omit<ProfissionalAluguel, 'id' | 'arena_id' | 'created_at'> | ProfissionalAluguel, photoFile?: File | null) => {
    if (!arena) return;
    try {
        let finalAvatarUrl = profissionalData.avatar_url;
        if (photoFile) {
            const { publicUrl } = await localUploadPhoto(photoFile);
            finalAvatarUrl = publicUrl;
        }
        await localApi.upsert('profissionais_aluguel', [{ ...profissionalData, arena_id: arena.id, avatar_url: finalAvatarUrl }], arena.id);
        addToast({ message: `Profissional salvo com sucesso!`, type: 'success' });
        await loadData();
        setIsProfissionalAluguelModalOpen(false);
        setEditingProfissionalAluguel(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar profissional: ${error.message}`, type: 'error' });
    }
  };

  const handleSaveTurma = async (turmaData: Omit<Turma, 'id' | 'arena_id' | 'created_at'> | Turma) => {
    if (!arena) return;
    try {
        const { data: savedTurmas } = await localApi.upsert('turmas', [{ ...turmaData, arena_id: arena.id }], arena.id);
        const savedTurma = savedTurmas[0];
        if (!savedTurma) throw new Error("Falha ao salvar a turma.");
        
        const { data: allReservas } = await localApi.select<Reserva>('reservas', arena.id);
        const otherReservas = allReservas.filter(r => r.turma_id !== savedTurma.id);

        const newMasterReservations: Omit<Reserva, 'id' | 'created_at'>[] = [];
        const startDate = parseDateStringAsLocal(savedTurma.start_date);

        savedTurma.daysOfWeek.forEach(day => {
            const firstOccurrenceDate = getNextDateForDay(startDate, day);
            newMasterReservations.push({
                arena_id: arena.id,
                quadra_id: savedTurma.quadra_id,
                turma_id: savedTurma.id,
                date: format(firstOccurrenceDate, 'yyyy-MM-dd'),
                start_time: savedTurma.start_time,
                end_time: savedTurma.end_time,
                type: 'aula',
                status: 'confirmada',
                clientName: savedTurma.name,
                isRecurring: true,
                recurringType: 'weekly',
                recurringEndDate: savedTurma.end_date,
            });
        });
        
        await localApi.upsert('reservas', [...otherReservas, ...newMasterReservations], arena.id, true);

        addToast({ message: `Turma salva com sucesso!`, type: 'success' });
        await loadData();
        setIsTurmaModalOpen(false);
        setEditingTurma(null);
    } catch (error: any) {
        addToast({ message: `Erro ao salvar turma: ${error.message}`, type: 'error' });
    }
  };

  const isAluno = (aluno: Aluno): boolean => !!(aluno.plan_name && aluno.plan_name.toLowerCase() !== 'avulso' && aluno.plan_name.toLowerCase() !== 'paga por uso');
  const filteredClientes = useMemo(() => alunos.filter(a => !isAluno(a) && a.name.toLowerCase().includes(searchTerm.toLowerCase())), [alunos, searchTerm]);
  const filteredAlunos = useMemo(() => alunos.filter(a => isAluno(a) && a.name.toLowerCase().includes(searchTerm.toLowerCase())), [alunos, searchTerm]);
  const filteredProfessores = useMemo(() => professores.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [professores, searchTerm]);
  const filteredProfissionaisAluguel = useMemo(() => profissionaisAluguel.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [profissionaisAluguel, searchTerm]);
  const filteredTurmas = useMemo(() => turmas.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [turmas, searchTerm]);
  
  const availableSports = useMemo(() => [...new Set(quadras.flatMap(q => q.sports || []).filter(Boolean))], [quadras]);
  const availablePlans = useMemo(() => [...new Set(alunos.map(a => a.plan_name).filter(Boolean))], [alunos]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'clientes', label: 'Clientes', icon: Users }, { id: 'alunos', label: 'Alunos', icon: GraduationCap },
    { id: 'professores', label: 'Professores', icon: Briefcase },
    { id: 'profissionais', label: 'Profissionais', icon: Handshake },
    { id: 'turmas', label: 'Turmas', icon: BookOpen },
  ];
  const addButtonLabel = useMemo(() => {
    if (activeTab === 'profissionais') return 'Adicionar Profissional';
    return `Adicionar ${activeTab.slice(0, -1)}`;
  }, [activeTab]);
  const searchPlaceholder = useMemo(() => `Buscar por ${activeTab.slice(0, -1)}...`, [activeTab]);

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    switch (activeTab) {
      case 'clientes': return <AlunosList alunos={filteredClientes} onEdit={setEditingAluno} />;
      case 'alunos': return <AlunosList alunos={filteredAlunos} onEdit={setEditingAluno} />;
      case 'professores': return <ProfessoresList professores={filteredProfessores} onEdit={setEditingProfessor} onDelete={(id, name) => handleDeleteRequest(id, name, 'professor')} />;
      case 'profissionais': return <ProfissionaisAluguelList profissionais={filteredProfissionaisAluguel} onEdit={setEditingProfissionalAluguel} onDelete={(id, name) => handleDeleteRequest(id, name, 'profissional')} />;
      case 'turmas': return <TurmasList turmas={filteredTurmas} professores={professores} quadras={quadras} onEdit={setEditingTurma} onDelete={(id, name) => handleDeleteRequest(id, name, 'turma')} />;
      default: return null;
    }
  };
  
  useEffect(() => { if (editingAluno) setIsAlunoModalOpen(true); }, [editingAluno]);
  useEffect(() => { if (!isAlunoModalOpen) setEditingAluno(null); }, [isAlunoModalOpen]);
  useEffect(() => { if (editingProfessor) setIsProfessorModalOpen(true); }, [editingProfessor]);
  useEffect(() => { if (!isProfessorModalOpen) setEditingProfessor(null); }, [isProfessorModalOpen]);
  useEffect(() => { if (editingProfissionalAluguel) setIsProfissionalAluguelModalOpen(true); }, [editingProfissionalAluguel]);
  useEffect(() => { if (!isProfissionalAluguelModalOpen) setEditingProfissionalAluguel(null); }, [isProfissionalAluguelModalOpen]);
  useEffect(() => { if (editingTurma) setIsTurmaModalOpen(true); }, [editingTurma]);
  useEffect(() => { if (!isTurmaModalOpen) setEditingTurma(null); }, [isTurmaModalOpen]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Gerenciamento da Arena</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie sua base de clientes, alunos, profissionais e turmas.</p>
        </motion.div>
        <div className="mb-8 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map(tab => <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400'}`}><tab.icon className="mr-2 h-5 w-5" />{tab.label}</button>)}
          </nav>
        </div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto sm:flex-1"><Input placeholder={searchPlaceholder} icon={<Search className="h-4 w-4 text-brand-gray-400" />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Button onClick={() => { if (activeTab.startsWith('cliente') || activeTab.startsWith('aluno')) setIsAlunoModalOpen(true); else if (activeTab === 'professores') setIsProfessorModalOpen(true); else if (activeTab === 'profissionais') setIsProfissionalAluguelModalOpen(true); else setIsTurmaModalOpen(true); }}><Plus className="h-4 w-4 mr-2" />{addButtonLabel}</Button>
          </div>
        </div>
        <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>{renderContent()}</motion.div></AnimatePresence>
      </div>
      <AlunoModal isOpen={isAlunoModalOpen} onClose={() => setIsAlunoModalOpen(false)} onSave={handleSaveAluno} onDelete={(id) => handleDeleteRequest(id, editingAluno?.name || '', 'aluno')} initialData={editingAluno} availableSports={availableSports} availablePlans={availablePlans} modalType={activeTab === 'clientes' ? 'Cliente' : 'Aluno'} allAlunos={alunos} onDataChange={handleDataChange} />
      <ProfessorModal isOpen={isProfessorModalOpen} onClose={() => setIsProfessorModalOpen(false)} onSave={handleSaveProfessor} onDelete={(id) => handleDeleteRequest(id, editingProfessor?.name || '', 'professor')} initialData={editingProfessor} />
      <ProfissionalAluguelModal isOpen={isProfissionalAluguelModalOpen} onClose={() => setIsProfissionalAluguelModalOpen(false)} onSave={handleSaveProfissionalAluguel} onDelete={(id) => handleDeleteRequest(id, editingProfissionalAluguel?.name || '', 'profissional')} initialData={editingProfissionalAluguel} alunos={alunos} />
      <TurmaModal isOpen={isTurmaModalOpen} onClose={() => setIsTurmaModalOpen(false)} onSave={handleSaveTurma} initialData={editingTurma} professores={professores} quadras={quadras} />
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={<><p>Tem certeza que deseja excluir <strong>{itemToDelete?.name}</strong>?</p><p className="mt-2 text-xs text-red-500 dark:text-red-400">Esta ação é irreversível.</p></>} confirmText="Sim, Excluir" />
    </Layout>
  );
};

const AlunosList: React.FC<{ alunos: Aluno[], onEdit: (aluno: Aluno) => void }> = ({ alunos, onEdit }) => {
  if (alunos.length === 0) return <PlaceholderTab title="Nenhum cliente/aluno encontrado" description="Cadastre novos clientes ou alunos para vê-los aqui." />;
  
  const getStatusProps = (status: Aluno['status']) => ({
    'ativo': { icon: BadgeCheck, color: 'text-green-500' },
    'inativo': { icon: BadgeX, color: 'text-red-500' },
    'experimental': { icon: BadgeHelp, color: 'text-yellow-500' }
  }[status]);

  const handleInvite = (phone: string, name: string) => {
    const message = encodeURIComponent(`Olá ${name}, para acompanhar suas reservas, pontos e receber notificações da nossa arena, crie sua conta em nossa plataforma: ${window.location.origin}/auth`);
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Cliente/Aluno</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Crédito</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Nível / Pontos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Plano</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Membro Desde</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {alunos.map((aluno, index) => {
              const statusProps = getStatusProps(aluno.status);
              const levelName = (aluno.gamification_levels as { name: string } | null)?.name || 'Iniciante';
              return (
                <motion.tr key={aluno.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} onClick={() => onEdit(aluno)} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10">{aluno.avatar_url ? (<img className="h-10 w-10 rounded-full object-cover" src={aluno.avatar_url} alt={aluno.name} />) : (<div className="h-10 w-10 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center text-brand-gray-500 font-bold">{aluno.name ? aluno.name.charAt(0).toUpperCase() : '?'}</div>)}</div><div className="ml-4"><div className="text-sm font-medium text-brand-gray-900 dark:text-white">{aluno.name}</div><div className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{aluno.email}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusProps.color.replace('text-','bg-').replace('-500','-100')} dark:${statusProps.color.replace('text-','bg-').replace('-500','-900/50')} ${statusProps.color}`}><statusProps.icon className="h-3 w-3 mr-1.5" />{statusProps.label}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(aluno.credit_balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-brand-gray-900 dark:text-white flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-400" />{levelName}</div><div className="text-sm text-brand-gray-500">{aluno.gamification_points || 0} pontos</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-brand-gray-900 dark:text-white">{aluno.plan_name}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{format(parseDateStringAsLocal(aluno.join_date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {aluno.profile_id ? (
                      <div className="flex justify-end items-center h-9 w-9" title="Este cliente já possui uma conta na plataforma.">
                        <UserCheck className="h-5 w-5 text-green-500" />
                      </div>
                    ) : aluno.phone ? (
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

const ProfessoresList: React.FC<{ professores: Professor[], onEdit: (prof: Professor) => void, onDelete: (id: string, name: string) => void }> = ({ professores, onEdit, onDelete }) => {
  if (professores.length === 0) return <PlaceholderTab title="Nenhum professor encontrado" description="Cadastre os professores que dão aulas na sua arena." />;
  return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{professores.map((prof, index) => (<motion.div key={prof.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between"><div><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-4"><div className="flex-shrink-0 h-16 w-16">{prof.avatar_url ? (<img src={prof.avatar_url} alt={prof.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-gray-200 dark:border-brand-gray-600" />) : (<div className="w-16 h-16 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center border-2 border-brand-gray-200 dark:border-brand-gray-600"><span className="text-2xl text-brand-gray-500 font-bold">{prof.name ? prof.name.charAt(0).toUpperCase() : '?'}</span></div>)}</div><div><h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{prof.name}</h3><p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{prof.email}</p></div></div><div className="flex space-x-1"><Button variant="ghost" size="sm" onClick={() => onEdit(prof)} className="p-2" title="Editar"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => onDelete(prof.id, prof.name)} className="p-2 hover:text-red-500" title="Excluir"><Trash2 className="h-4 w-4" /></Button></div></div><div className="space-y-2 text-sm mb-4 border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">{prof.phone && (<div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400"><Phone className="h-4 w-4 mr-2 text-brand-gray-400" /><span>{prof.phone}</span></div>)}<div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400"><Calendar className="h-4 w-4 mr-2 text-brand-gray-400" /><span>Incluso em: {format(new Date(prof.created_at), 'dd/MM/yyyy')}</span></div></div></div><div className="mt-auto"><h4 className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200 mb-2">Especialidades:</h4><div className="flex flex-wrap gap-2">{prof.specialties.map(spec => (<span key={spec} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{spec}</span>))}</div></div></motion.div>))}</div>);
};

const ProfissionaisAluguelList: React.FC<{ profissionais: ProfissionalAluguel[], onEdit: (prof: ProfissionalAluguel) => void, onDelete: (id: string, name: string) => void }> = ({ profissionais, onEdit, onDelete }) => {
  if (profissionais.length === 0) return <PlaceholderTab title="Nenhum profissional encontrado" description="Cadastre jogadores que podem ser contratados por seus clientes." />;
  
  const getStatusProps = (status: ProfissionalAluguel['status']) => ({
    'disponivel': { icon: BadgeCheck, color: 'text-green-500', label: 'Disponível' },
    'indisponivel': { icon: BadgeX, color: 'text-red-500', label: 'Indisponível' },
  }[status]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {profissionais.map((prof, index) => {
        const statusProps = getStatusProps(prof.status);
        const specialtiesString = prof.esportes.map(e => e.position ? `${e.sport} (${e.position})` : e.sport).join(', ');
        return (
          <motion.div key={prof.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {prof.avatar_url ? (
                    <img src={prof.avatar_url} alt={prof.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-gray-200 dark:border-brand-gray-600" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center border-2 border-brand-gray-200 dark:border-brand-gray-600">
                      <span className="text-2xl text-brand-gray-500 font-bold">{prof.name ? prof.name.charAt(0).toUpperCase() : '?'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{prof.name}</h3>
                  <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{prof.phone}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(prof)} className="p-2" title="Editar"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(prof.id, prof.name)} className="p-2 hover:text-red-500" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-1">Especialidades</h4>
              <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">{specialtiesString}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Valor/Partida</p>
                <p className="font-semibold text-brand-gray-800 dark:text-white">{formatCurrency(prof.taxa_hora)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Comissão Arena</p>
                <p className="font-semibold text-brand-gray-800 dark:text-white">{prof.comissao_arena}%</p>
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

const TurmasList: React.FC<{ turmas: Turma[], professores: Professor[], quadras: Quadra[], onEdit: (turma: Turma) => void, onDelete: (id: string, name: string) => void }> = ({ turmas, professores, quadras, onEdit, onDelete }) => {
  if (turmas.length === 0) return <PlaceholderTab title="Nenhuma turma encontrada" description="Clique em 'Adicionar Turma' para criar sua primeira turma e começar a agendar aulas." />;
  return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{turmas.map((turma, index) => (<TurmaCard key={turma.id} turma={turma} professor={professores.find(p => p.id === turma.professor_id)} quadra={quadras.find(q => q.id === turma.quadra_id)} onEdit={() => onEdit(turma)} onDelete={() => onDelete(turma.id, turma.name)} index={index} />))}</div>);
};

const PlaceholderTab: React.FC<{ title: string, description: string }> = ({ title, description }) => (<div className="text-center py-16"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto"><div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6"><Users className="h-8 w-8 text-brand-gray-400" /></div><h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">{title}</h3><p className="text-brand-gray-600 dark:text-brand-gray-400">{description}</p></motion.div></div>);

export default Alunos;
