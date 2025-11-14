import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, Calendar, DollarSign, Trash2, Gift, ClipboardList, Hash, Users, UserPlus, ShieldCheck, AlertTriangle, Star, BarChart2 } from 'lucide-react';
import { Aluno, PlanoAula, Profile, AlunoLevel } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format, endOfMonth, differenceInDays, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { maskPhone, maskCPFOrCNPJ } from '../../utils/masks';
import { useToast } from '../../context/ToastContext';
import GamificationTab from './GamificationTab';
import CreditsTab from './CreditsTab';
import { localApi } from '../../lib/localApi';
import { formatCurrency } from '../../utils/formatters';
import ConfirmationModal from '../Shared/ConfirmationModal';
import LevelBadge from '../Shared/LevelBadge';
import { useAuth } from '../../context/AuthContext';
import ActivityTab from './ActivityTab';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface AlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aluno: Omit<Aluno, 'id' | 'arena_id' | 'created_at'> | Aluno) => void;
  onDelete: (id: string) => void;
  initialData: Aluno | null;
  availableSports: string[];
  planos: PlanoAula[];
  modalType: 'Cliente' | 'Aluno';
  allAlunos: Aluno[];
  onDataChange: () => void;
}

const DEFAULT_SPORTS = ['Beach Tennis', 'Futevôlei', 'Futebol Society', 'Vôlei', 'Tênis', 'Padel', 'Funcional'];

const AlunoModal: React.FC<AlunoModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, availableSports, planos, modalType, allAlunos, onDataChange }) => {
  const { arena } = useAuth();
  const [formData, setFormData] = useState<Partial<Omit<Aluno, 'id' | 'arena_id' | 'created_at'>>>({
    name: '', email: '', phone: '', status: 'ativo', sport: '', level_id: null, plan_id: null,
    aulas_restantes: 0, join_date: format(new Date(), 'yyyy-MM-dd'), monthly_fee: 0,
    cpf: '', birth_date: '', gender: 'nao_informado'
  });
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'credits' | 'gamification' | 'atividades'>('details');
  const [internalAluno, setInternalAluno] = useState<Aluno | null>(initialData);
  const [isRenewConfirmOpen, setIsRenewConfirmOpen] = useState(false);
  const [isCreateLoginConfirmOpen, setIsCreateLoginConfirmOpen] = useState(false);
  const [proRataInfo, setProRataInfo] = useState<{ firstPayment: number; recurringPayment: number; daysRemaining: number; daysInMonth: number; } | null>(null);
  const [alunoLevels, setAlunoLevels] = useState<AlunoLevel[]>([]);
  
  const isEditing = !!initialData;

  useEffect(() => {
    const fetchLevels = async () => {
      if (arena?.id) {
        const { data } = await localApi.select<AlunoLevel>('aluno_levels', arena.id);
        setAlunoLevels(data || []);
      }
    };
    if (isOpen) {
      fetchLevels();
    }
  }, [isOpen, arena]);

  const allSports = useMemo(() => {
    return [...new Set([...DEFAULT_SPORTS, ...availableSports])];
  }, [availableSports]);

  const activePlanOptions = useMemo(() => {
    return (planos || []).filter(p => p.is_active);
  }, [planos]);
  
  const selectedPlan = useMemo(() => {
    return planos.find(p => p.id === formData.plan_id);
  }, [formData.plan_id, planos]);

  const selectedLevelForBadge = useMemo(() => {
    if (!formData.level_id) return null;
    return alunoLevels.find(l => l.id === formData.level_id);
  }, [formData.level_id, alunoLevels]);

  const isUnlimitedPlan = useMemo(() => selectedPlan?.num_aulas === null, [selectedPlan]);

  const canRenew = isEditing && formData.plan_id && selectedPlan && selectedPlan.price > 0;

  const refreshInternalData = useCallback(async () => {
    if (!initialData?.id || !initialData?.arena_id) return;
    try {
      const { data } = await localApi.select<Aluno>('alunos', initialData.arena_id);
      const updatedAluno = data.find(a => a.id === initialData.id);
      if (updatedAluno) {
        setInternalAluno(updatedAluno);
      }
    } catch (error) {
      console.error("Failed to refresh internal aluno data", error);
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen) {
      setInternalAluno(initialData);
      setActiveTab('details');
      setProRataInfo(null);
      
      const baseData = {
        name: '', email: '', phone: '', status: 'ativo', sport: '', level_id: null, plan_id: null,
        aulas_restantes: 0, join_date: format(new Date(), 'yyyy-MM-dd'), monthly_fee: 0,
        cpf: '', birth_date: '', gender: 'nao_informado' as Aluno['gender']
      };

      if (initialData) {
        setFormData({
          ...baseData,
          name: initialData.name,
          email: initialData.email || '',
          phone: initialData.phone || '',
          cpf: initialData.cpf || '',
          birth_date: initialData.birth_date || '',
          gender: initialData.gender || 'nao_informado',
          status: initialData.status,
          sport: initialData.sport || '',
          level_id: initialData.level_id || null,
          plan_id: initialData.plan_id,
          aulas_restantes: initialData.aulas_restantes,
          join_date: initialData.join_date,
          monthly_fee: initialData.monthly_fee || 0,
        });
      } else {
        setFormData(baseData);
      }
    }
  }, [initialData, isOpen]);

  const handleTabChange = (tab: 'details' | 'credits' | 'gamification' | 'atividades') => {
    setActiveTab(tab);
    if (tab === 'credits' || tab === 'gamification' || tab === 'atividades') {
      refreshInternalData();
    }
  };

  const handleInternalDataChange = () => {
    refreshInternalData();
    onDataChange();
  };

  const handleSave = () => {
    const unmaskedPhone = formData.phone?.replace(/\D/g, '');

    if (unmaskedPhone) {
      const isDuplicate = allAlunos.some(aluno => {
        if (isEditing && initialData && aluno.id === initialData.id) {
          return false;
        }
        return aluno.phone?.replace(/\D/g, '') === unmaskedPhone;
      });

      if (isDuplicate) {
        addToast({ message: 'Este telefone já está em uso por outro cliente.', type: 'error' });
        return;
      }
    }
    
    const dataToSave = {
      ...formData,
      plan_name: selectedPlan?.name || 'Avulso',
      monthly_fee: selectedPlan?.price || 0,
      aulas_restantes: isUnlimitedPlan ? null : (formData.aulas_restantes ?? 0),
    };

    if (proRataInfo && (!isEditing || (isEditing && initialData?.plan_id !== formData.plan_id))) {
        if (arena) {
            localApi.upsert('finance_transactions', [{
                arena_id: arena.id,
                description: `Pagamento Pro-rata: ${selectedPlan?.name} - ${formData.name}`,
                amount: proRataInfo.firstPayment,
                type: 'receita' as 'receita',
                category: 'Mensalidade',
                date: format(new Date(), 'yyyy-MM-dd'),
            }], arena.id);
        }
    }

    if (isEditing && internalAluno) {
      onSave({ ...internalAluno, ...dataToSave });
    } else {
      onSave(dataToSave as any);
    }
  };
  
  const handleDelete = () => {
    if (initialData) {
      onDelete(initialData.id);
    }
  };

  const handleRenewCredits = () => {
    setIsRenewConfirmOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!arena || !internalAluno || !selectedPlan) {
      addToast({ message: 'Erro: Dados do aluno ou plano incompletos.', type: 'error' });
      return;
    }
    
    try {
      await localApi.upsert('finance_transactions', [{
          arena_id: arena.id,
          description: `Renovação Plano: ${selectedPlan.name} - ${internalAluno.name}`,
          amount: selectedPlan.price,
          type: 'receita' as 'receita',
          category: 'Mensalidade',
          date: format(new Date(), 'yyyy-MM-dd'),
      }], arena.id);

      const creditsToRenew = selectedPlan.num_aulas === null ? null : selectedPlan.num_aulas;
      const updatedAluno = { ...internalAluno, aulas_restantes: creditsToRenew };
      
      await localApi.upsert('alunos', [updatedAluno], arena.id);
      
      addToast({ message: 'Créditos renovados e pagamento registrado!', type: 'success' });
      
      handleInternalDataChange();
      setIsRenewConfirmOpen(false);
    } catch (error: any) {
      addToast({ message: `Erro ao renovar créditos: ${error.message}`, type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number | null = value;

    if (name === 'phone') finalValue = maskPhone(value);
    if (name === 'cpf') finalValue = maskCPFOrCNPJ(value);

    if (name === 'plan_id') {
      const newSelectedPlan = activePlanOptions.find(p => p.id === value);
      
      let proRata = null;
      if (newSelectedPlan && newSelectedPlan.price > 0 && newSelectedPlan.duration_type !== 'avulso') {
        const today = new Date();
        const endOfThisMonth = endOfMonth(today);
        const daysRemainingInMonth = differenceInDays(endOfThisMonth, today) + 1;
        const daysInCurrentMonth = getDaysInMonth(today);

        let monthlyEquivalentPrice = 0;
        switch(newSelectedPlan.duration_type) {
            case 'mensal':
                monthlyEquivalentPrice = newSelectedPlan.price;
                break;
            case 'trimestral':
                monthlyEquivalentPrice = newSelectedPlan.price / 3;
                break;
            case 'semestral':
                monthlyEquivalentPrice = newSelectedPlan.price / 6;
                break;
            case 'anual':
                monthlyEquivalentPrice = newSelectedPlan.price / 12;
                break;
        }

        const firstPayment = (monthlyEquivalentPrice / daysInCurrentMonth) * daysRemainingInMonth;
        proRata = { firstPayment, recurringPayment: monthlyEquivalentPrice, daysRemaining: daysRemainingInMonth, daysInMonth: daysInCurrentMonth };
      }
      setProRataInfo(proRata);
      
      const isNewPlanUnlimited = newSelectedPlan?.num_aulas === null;
      setFormData(prev => ({
        ...prev,
        plan_id: value || null,
        aulas_restantes: isNewPlanUnlimited ? null : (newSelectedPlan?.num_aulas ?? 0),
        monthly_fee: newSelectedPlan?.price || 0,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue as string }));
    }
  };

  const handleCreateLogin = async () => {
    if (!arena || !internalAluno || !internalAluno.email) {
        addToast({ message: 'Erro: O cliente precisa ter um e-mail cadastrado.', type: 'error' });
        return;
    }

    try {
        const { data: allProfiles } = await localApi.select<Profile>('profiles', 'all');
        const existingProfile = allProfiles.find(p => p.email.toLowerCase() === internalAluno!.email!.toLowerCase());

        if (existingProfile) {
            const updatedAluno = { ...internalAluno, profile_id: existingProfile.id };
            await localApi.upsert('alunos', [updatedAluno], arena.id);
            addToast({ message: `Conta de usuário encontrada e vinculada a ${internalAluno.name}!`, type: 'success' });
        } else {
            const newProfile: Omit<Profile, 'id' | 'created_at'> = {
                name: internalAluno.name,
                email: internalAluno.email,
                avatar_url: internalAluno.avatar_url || null,
                role: 'cliente',
                phone: internalAluno.phone,
                cpf: internalAluno.cpf,
                birth_date: internalAluno.birth_date,
                gender: internalAluno.gender,
            };

            const { data: createdProfiles } = await localApi.upsert('profiles', [newProfile], 'all');
            const createdProfile = createdProfiles[0];

            if (!createdProfile) {
                throw new Error("Falha ao criar o perfil do usuário.");
            }

            const updatedAluno = { ...internalAluno, profile_id: createdProfile.id };
            await localApi.upsert('alunos', [updatedAluno], arena.id);

            addToast({ 
                message: `Acesso criado para ${internalAluno.name}! O cliente pode agora entrar com o e-mail e criar uma senha.`, 
                type: 'success' 
            });
        }

        handleInternalDataChange();
        setIsCreateLoginConfirmOpen(false);

    } catch (error: any) {
        addToast({ message: `Erro ao criar acesso: ${error.message}`, type: 'error' });
    }
  };

  const modalTitle = isEditing ? `Editar ${modalType}` : `Adicionar Novo ${modalType}`;
  
  const tabs = [
    { id: 'details', label: 'Dados', icon: User },
    { id: 'atividades', label: 'Atividades', icon: ClipboardList },
    { id: 'credits', label: 'Créditos', icon: DollarSign },
    { id: 'gamification', label: 'Gamificação', icon: Gift },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                    {modalTitle}
                  </h3>
                  {isEditing && selectedLevelForBadge && (
                    <LevelBadge name={selectedLevelForBadge.name} color={selectedLevelForBadge.color} />
                  )}
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <X className="h-5 w-5 text-brand-gray-500" />
                </button>
              </div>

              {isEditing && (
                <div className="border-b border-brand-gray-200 dark:border-brand-gray-700">
                  <nav className="-mb-px flex space-x-4 px-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as 'details' | 'credits' | 'gamification' | 'atividades')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                          activeTab === tab.id
                            ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                            : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
                        }`}
                      >
                        <tab.icon className="mr-2 h-5 w-5" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              <div className="p-6 space-y-4 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'details' && (
                      <>
                        {isEditing && (
                            internalAluno?.profile_id ? (
                                <div className="p-3 mb-4 rounded-md bg-green-50 dark:bg-green-900/50 flex items-center gap-3 border border-green-200 dark:border-green-800">
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Este cliente possui um acesso verificado à plataforma.</p>
                                </div>
                            ) : (
                                <div className="p-3 mb-4 rounded-md bg-yellow-50 dark:bg-yellow-900/50 flex items-center gap-3 border border-yellow-200 dark:border-yellow-800">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Este cliente ainda não tem um acesso à plataforma.</p>
                                </div>
                            )
                        )}
                        {isEditing && formData.join_date && (
                          <div className="text-sm text-center text-brand-gray-500 dark:text-brand-gray-400 mb-4">
                              Membro desde {format(parseDateStringAsLocal(formData.join_date), "MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        )}
                        <div className="space-y-4">
                            <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="E-mail" name="email" type="email" value={formData.email || ''} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} />
                            <Input label="Telefone" name="phone" value={formData.phone || ''} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="CPF" name="cpf" value={formData.cpf || ''} onChange={handleChange} icon={<Hash className="h-4 w-4 text-brand-gray-400"/>} />
                            <Input label="Data de Nascimento" name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Gênero</label>
                                <select name="gender" value={formData.gender || 'nao_informado'} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                                <option value="nao_informado">Não informar</option>
                                <option value="masculino">Masculino</option>
                                <option value="feminino">Feminino</option>
                                <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                                <option value="experimental">Experimental</option>
                                </select>
                            </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Data de Início" name="join_date" type="date" value={formData.join_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte Principal</label>
                                    <select name="sport" value={formData.sport || ''} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                                    <option value="">Selecione um esporte</option>
                                    {allSports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Nível</label>
                                    <select name="level_id" value={formData.level_id || ''} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                                        <option value="">Selecione...</option>
                                        {alunoLevels.map(level => (
                                            <option key={level.id} value={level.id}>{level.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Plano Contratado</label>
                            <select name="plan_id" value={formData.plan_id || ''} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                                <option value="">Nenhum (Avulso)</option>
                                {activePlanOptions.map(plan => <option key={plan.id} value={plan.id}>{plan.name} ({formatCurrency(plan.price)})</option>)}
                            </select>
                            </div>
                            {proRataInfo && (
                              <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Resumo da Cobrança</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <div>
                                      <span>Primeira Cobrança (proporcional)</span>
                                      <span className="text-xs text-blue-600 dark:text-blue-400 block">
                                        (referente a {proRataInfo.daysRemaining} de {proRataInfo.daysInMonth} dias do mês)
                                      </span>
                                    </div>
                                    <span className="font-bold">{formatCurrency(proRataInfo.firstPayment)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor da Recorrência:</span>
                                    <span className="font-bold">{formatCurrency(proRataInfo.recurringPayment)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <Input
                            label="Aulas Restantes (Créditos)"
                            name="aulas_restantes"
                            type="number"
                            value={isUnlimitedPlan ? '' : (formData.aulas_restantes ?? 0).toString()}
                            onChange={handleChange}
                            icon={<Hash className="h-4 w-4 text-brand-gray-400" />}
                            placeholder={isUnlimitedPlan ? 'Ilimitado' : 'Ex: 8'}
                            disabled={isUnlimitedPlan}
                            />
                        </div>
                      </>
                    )}
                    {activeTab === 'atividades' && internalAluno && (
                      <ActivityTab aluno={internalAluno} />
                    )}
                    {activeTab === 'credits' && internalAluno && (
                      <CreditsTab aluno={internalAluno} onDataChange={handleInternalDataChange} />
                    )}
                    {activeTab === 'gamification' && internalAluno && (
                      <GamificationTab aluno={internalAluno} onDataChange={handleInternalDataChange} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
                <div className="flex gap-3">
                  {isEditing && (
                    <Button variant="outline" onClick={handleDelete} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                  {canRenew && (
                    <Button variant="secondary" onClick={handleRenewCredits}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Renovar Créditos
                    </Button>
                  )}
                   {isEditing && !internalAluno?.profile_id && internalAluno?.email && (
                    <Button variant="secondary" onClick={() => setIsCreateLoginConfirmOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Acesso
                    </Button>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={isRenewConfirmOpen}
        onClose={() => setIsRenewConfirmOpen(false)}
        onConfirm={handleConfirmRenew}
        title="Confirmar Renovação?"
        message={<p>Isso registrará um pagamento de <strong>{formatCurrency(selectedPlan?.price || 0)}</strong> e redefinirá os créditos de aula de {formData.name}. Deseja continuar?</p>}
        confirmText="Sim, Renovar"
        icon={<DollarSign className="h-10 w-10 text-green-500" />}
        confirmVariant="primary"
      />
      <ConfirmationModal
        isOpen={isCreateLoginConfirmOpen}
        onClose={() => setIsCreateLoginConfirmOpen(false)}
        onConfirm={handleCreateLogin}
        title="Criar Acesso para Cliente?"
        message={
            <p>
                Isso criará uma conta de usuário para <strong>{formData.name}</strong> usando o e-mail <strong>{formData.email}</strong>. 
                O cliente poderá então fazer login e definir sua própria senha. Deseja continuar?
            </p>
        }
        confirmText="Sim, Criar Acesso"
        icon={<UserPlus className="h-10 w-10 text-brand-blue-500" />}
        confirmVariant="primary"
      />
    </>
  );
};

export default AlunoModal;
