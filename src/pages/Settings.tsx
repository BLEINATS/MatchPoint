import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Building, FileText, BarChart2, CheckCircle, Save, ArrowLeft, User, Lock, CreditCard, DollarSign, Bell, Users as UsersIcon, Star, Clock, LifeBuoy } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Arena, Profile, Plan, Subscription, AlunoLevel } from '../types';
import Button from '../components/Forms/Button';
import ProfileTab from '../components/Settings/ProfileTab';
import ClientProfileSettingsTab from '../components/Settings/ClientProfileSettingsTab';
import OperationTab from '../components/Settings/OperationTab';
import DocumentsTabAdmin from '../components/Settings/DocumentsTab';
import DocumentsTabClient from '../components/Client/DocumentsTab';
import PlanTab from '../components/Settings/PlanTab';
import PaymentSettingsTab from '../components/Settings/PaymentSettingsTab';
import PlanosAulasTab from './Settings/PlanosAulasTab';
import NotificationSettingsTab from './Settings/NotificationSettingsTab';
import SecurityTab from '../components/Settings/SecurityTab';
import TeamSettingsTab from '../components/Settings/TeamSettingsTab';
import FaturamentoTab from '../components/Settings/FaturamentoTab';
import { supabaseApi } from '../lib/supabaseApi';
import SupportTab from '../components/Settings/SupportTab';
import NiveisAlunosTab from './Settings/NiveisAlunosTab';

type AdminTabType = 'profile' | 'operation' | 'documents' | 'payments' | 'planos_aulas' | 'niveis_alunos' | 'team' | 'plan' | 'faturamento';
type ClientTabType = 'my-profile' | 'notifications' | 'security' | 'documents';
type StaffTabType = 'planos_aulas';

const DEFAULT_SPORTS_LIST = [
  'Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Futebol Society', 
  'Tênis', 'Padel', 'Funcional', 'Basquete', 'Handebol', 'Pickleball', 'Futsal'
];

const Settings: React.FC = () => {
  const { selectedArenaContext: arena, updateArena, profile, updateProfile, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  
  const [arenaFormData, setArenaFormData] = useState<Partial<Arena>>({});
  const [profileFormData, setProfileFormData] = useState<Partial<Profile>>({});
  const [alunoLevels, setAlunoLevels] = useState<AlunoLevel[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = profile?.role === 'admin_arena';
  const isStaff = profile?.role === 'funcionario';

  const adminTabs: { id: AdminTabType | 'support'; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil da Arena', icon: Building },
    { id: 'operation', label: 'Operação', icon: Clock },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'planos_aulas', label: 'Planos de Aulas', icon: DollarSign },
    { id: 'niveis_alunos', label: 'Níveis de Alunos', icon: BarChart2 },
    { id: 'faturamento', label: 'Faturamento', icon: BarChart2 },
    { id: 'team', label: 'Equipe', icon: UsersIcon },
    { id: 'plan', label: 'Plano e Assinatura', icon: Star },
    { id: 'support', label: 'Idioma e Suporte', icon: LifeBuoy },
  ];

  const clientTabs: { id: ClientTabType | 'support'; label: string; icon: React.ElementType }[] = [
    { id: 'my-profile', label: 'Meu Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'support', label: 'Idioma e Suporte', icon: LifeBuoy },
  ];
  
  const staffTabs: { id: 'my-profile' | 'security' | 'planos_aulas' | 'support'; label: string; icon: React.ElementType }[] = [
    { id: 'my-profile', label: 'Meu Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
  ];
  if (profile?.permissions?.planos_aulas === 'edit') {
    staffTabs.push({ id: 'planos_aulas', label: 'Planos de Aulas', icon: DollarSign });
  }
  staffTabs.push({ id: 'support', label: 'Idioma e Suporte', icon: LifeBuoy });

  const tabs = isAdmin ? adminTabs : (isStaff ? staffTabs : clientTabs);
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '');
  
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (arena && isAdmin) {
      const initialData = { ...arena };
      if (!initialData.available_sports || initialData.available_sports.length === 0) {
        initialData.available_sports = DEFAULT_SPORTS_LIST;
      }
      setArenaFormData(initialData);

      const loadLevels = async () => {
        const { data } = await supabaseApi.select<AlunoLevel>('aluno_levels', arena.id);
        if (data && data.length > 0) {
          setAlunoLevels(data);
        } else {
          const defaultLevels: Omit<AlunoLevel, 'id' | 'arena_id'>[] = [
            { name: 'Iniciante', color: 'blue' },
            { name: 'Intermediário', color: 'green' },
            { name: 'Avançado', color: 'orange' },
            { name: 'Competição', color: 'red' },
          ];
          const { data: seededData } = await supabaseApi.upsert('aluno_levels', defaultLevels, arena.id, true);
          setAlunoLevels(seededData || []);
        }
      };
      loadLevels();
    }
    if (profile) {
      setProfileFormData(profile);
    }
    if (isAdmin) {
      const loadSaasData = async () => {
        try {
          const [plansRes, subsRes] = await Promise.all([
            supabaseApi.select<Plan>('plans', 'all'),
            supabaseApi.select<Subscription>('subscriptions', 'all'),
          ]);
          setPlans(plansRes.data || []);
          setSubscriptions(subsRes.data || []);
        } catch (error) {
          console.error("Failed to load SaaS data", error);
        }
      };
      loadSaasData();
    }
  }, [arena, profile, isAdmin]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isAdmin && arena) {
        const cleanedData = {
          ...arenaFormData,
          available_sports: (arenaFormData.available_sports || []).map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean)
        };
        await updateArena(cleanedData);
        await supabaseApi.upsert('aluno_levels', alunoLevels, arena.id, true);
      } else {
        await updateProfile(profileFormData);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Falha ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isAdmin) {
      const currentSubscription = subscriptions.find(s => s.arena_id === arena?.id);
      switch (activeTab) {
        case 'profile': return <ProfileTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'operation': return <OperationTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'documents': return <DocumentsTabAdmin formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'payments': return <PaymentSettingsTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'planos_aulas': return <PlanosAulasTab />;
        case 'niveis_alunos': return <NiveisAlunosTab levels={alunoLevels} setLevels={setAlunoLevels} />;
        case 'faturamento': return <FaturamentoTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'team': return <TeamSettingsTab />;
        case 'plan': return <PlanTab plans={plans} currentSubscription={currentSubscription || null} arena={arena} />;
        case 'support': return <SupportTab />;
        default: return null;
      }
    } else { // Client or Staff
      switch (activeTab) {
        case 'my-profile': return <ClientProfileSettingsTab formData={profileFormData} setFormData={setProfileFormData} />;
        case 'notifications': return <NotificationSettingsTab profile={profileFormData} setProfile={setProfileFormData} />;
        case 'security': return <SecurityTab />;
        case 'documents': return <DocumentsTabClient />;
        case 'planos_aulas': return isStaff ? <PlanosAulasTab /> : null;
        case 'support': return <SupportTab />;
        default: return null;
      }
    }
  };

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  const canSave = isAdmin ? (activeTab !== 'plan' && activeTab !== 'team' && activeTab !== 'planos_aulas' && activeTab !== 'support') : (activeTab === 'my-profile' || activeTab === 'notifications' || activeTab === 'security');

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Painel
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Configurações</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
            {isAdmin ? 'Gerencie as informações e políticas da sua arena.' : 'Gerencie as informações do seu perfil.'}
          </p>
        </motion.div>

        <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[70vh]">
          <aside className="w-full md:w-72 bg-brand-gray-50 dark:bg-brand-gray-800 p-6 border-b md:border-b-0 md:border-r border-brand-gray-200 dark:border-brand-gray-700">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center text-left p-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-brand-gray-700 text-brand-blue-700 dark:text-white font-semibold'
                      : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-brand-blue-500' : ''}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6 md:p-8 flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {canSave && (
              <div className="mt-8 pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
                <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showSuccess ? 'success' : 'save'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center"
                    >
                      {showSuccess ? (
                        <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
