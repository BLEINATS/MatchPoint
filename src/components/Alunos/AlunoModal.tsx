import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, Calendar, Award, Dribbble, DollarSign, Trash2, Gift, ClipboardList } from 'lucide-react';
import { Aluno } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';
import { maskPhone } from '../../utils/masks';
import CreatableSelect from '../Forms/CreatableSelect';
import { useToast } from '../../context/ToastContext';
import GamificationTab from './GamificationTab';
import CreditsTab from './CreditsTab';
import { localApi } from '../../lib/localApi';

interface AlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aluno: Omit<Aluno, 'id' | 'arena_id' | 'created_at'> | Aluno) => void;
  onDelete: (id: string) => void;
  initialData: Aluno | null;
  availableSports: string[];
  availablePlans: string[];
  modalType: 'Cliente' | 'Aluno';
  allAlunos: Aluno[];
  onDataChange: () => void;
}

const DEFAULT_SPORTS = ['Beach Tennis', 'Futevôlei', 'Futebol Society', 'Vôlei', 'Tênis', 'Padel', 'Funcional'];
const DEFAULT_PLANS = ['Aula Avulsa', 'Pacote 10 Aulas', 'Plano Mensal - 1x/semana', 'Plano Mensal - 2x/semana', 'Plano Mensal - 3x/semana', 'Plano Mensal - 4x/semana'];

const AlunoModal: React.FC<AlunoModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, availableSports, availablePlans, modalType, allAlunos, onDataChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'ativo' as Aluno['status'],
    sport: '',
    plan_name: '',
    monthly_fee: '',
    join_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'credits' | 'gamification'>('details');
  const [internalAluno, setInternalAluno] = useState<Aluno | null>(initialData);
  
  const isEditing = !!initialData;

  const allSports = useMemo(() => {
    return [...new Set([...DEFAULT_SPORTS, ...availableSports])];
  }, [availableSports]);

  const allPlans = useMemo(() => {
    return [...new Set([...DEFAULT_PLANS, ...availablePlans])];
  }, [availablePlans]);

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
      
      if (initialData) {
        setFormData({
          name: initialData.name,
          email: initialData.email || '',
          phone: initialData.phone || '',
          status: initialData.status,
          sport: initialData.sport || '',
          plan_name: initialData.plan_name,
          monthly_fee: initialData.monthly_fee?.toString().replace('.', ',') || '',
          join_date: initialData.join_date,
        });
      } else {
        setFormData({
          name: '', email: '', phone: '', status: 'ativo', sport: '', plan_name: '', monthly_fee: '',
          join_date: format(new Date(), 'yyyy-MM-dd'),
        });
      }
    }
  }, [initialData, isOpen]);

  const handleTabChange = (tab: 'details' | 'credits' | 'gamification') => {
    setActiveTab(tab);
    if (tab === 'credits' || tab === 'gamification') {
      refreshInternalData();
    }
  };

  const handleInternalDataChange = () => {
    refreshInternalData();
    onDataChange();
  };

  const handleSave = () => {
    const unmaskedPhone = formData.phone.replace(/\D/g, '');

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
      monthly_fee: parseFloat(formData.monthly_fee.replace(',', '.')) || 0,
    };

    if (isEditing && internalAluno) {
      onSave({ ...internalAluno, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };
  
  const handleDelete = () => {
    if (initialData) {
      onDelete(initialData.id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') {
      finalValue = maskPhone(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const modalTitle = isEditing ? `Editar ${modalType}` : `Adicionar Novo ${modalType}`;
  
  const tabs = [
    { id: 'details', label: 'Dados Cadastrais', icon: ClipboardList },
    { id: 'credits', label: 'Créditos', icon: DollarSign },
    { id: 'gamification', label: 'Gamificação', icon: Gift },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {modalTitle}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            {isEditing && (
              <div className="border-b border-brand-gray-200 dark:border-brand-gray-700">
                <nav className="-mb-px flex space-x-4 px-6" aria-label="Tabs">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as 'details' | 'credits' | 'gamification')}
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
                    <div className="space-y-4">
                      <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="E-mail" name="email" type="email" value={formData.email || ''} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} />
                        <Input label="Telefone" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
                          <select name="status" value={formData.status} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                            <option value="experimental">Experimental</option>
                          </select>
                        </div>
                        <Input label="Data de Início" name="join_date" type="date" value={formData.join_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CreatableSelect
                          label="Esporte"
                          options={allSports}
                          value={formData.sport}
                          onChange={(value) => setFormData(p => ({ ...p, sport: value }))}
                          placeholder="Selecione ou crie"
                          icon={<Dribbble className="h-4 w-4 text-brand-gray-400" />}
                        />
                        <CreatableSelect
                          label="Plano Contratado"
                          options={allPlans}
                          value={formData.plan_name}
                          onChange={(value) => setFormData(p => ({ ...p, plan_name: value }))}
                          placeholder="Selecione ou crie"
                          icon={<Award className="h-4 w-4 text-brand-gray-400" />}
                        />
                      </div>
                      <Input
                        label="Valor da Mensalidade (R$)"
                        name="monthly_fee"
                        type="text"
                        inputMode="decimal"
                        value={formData.monthly_fee}
                        onChange={handleChange}
                        icon={<DollarSign className="h-4 w-4 text-brand-gray-400" />}
                        placeholder="Ex: 99,90"
                      />
                    </div>
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
              <div>
                {isEditing && (
                  <Button variant="outline" onClick={handleDelete} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
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
  );
};

export default AlunoModal;
