import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Building, FileText, BarChart2, CheckCircle, Save, ArrowLeft, User, Lock, CreditCard, DollarSign, Bell, Users as UsersIcon, Star } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Arena, Profile, Plan, Subscription } from '../types';
import Button from '../components/Forms/Button';
import ProfileTab from '../components/Settings/ProfileTab';
import ClientProfileSettingsTab from '../components/Settings/ClientProfileSettingsTab';
import OperationTab from '../components/Settings/OperationTab';
import PlanTab from '../components/Settings/PlanTab';
import PaymentSettingsTab from '../components/Settings/PaymentSettingsTab';
import PlanosAulasTab from './Settings/PlanosAulasTab';
import NotificationSettingsTab from './Settings/NotificationSettingsTab';
import SecurityTab from '../components/Settings/SecurityTab';
import TeamSettingsTab from '../components/Settings/TeamSettingsTab';
import FaturamentoTab from '../components/Settings/FaturamentoTab';
import { localApi } from '../lib/localApi';

type AdminTabType = 'profile' | 'operation' | 'payments' | 'planos_aulas' | 'team' | 'plan' | 'faturamento';
type ClientTabType = 'my-profile' | 'notifications' | 'security';
type StaffTabType = 'planos_aulas'; // Staff can only see what they have permissions for

const Settings: React.FC = () => {
  const { arena, updateArena, profile, updateProfile, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  
  const [arenaFormData, setArenaFormData] = useState<Partial<Arena>>({});
  const [profileFormData, setProfileFormData] = useState<Partial<Profile>>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = profile?.role === 'admin_arena';
  const isStaff = profile?.role === 'funcionario';

  const adminTabs: { id: AdminTabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil da Arena', icon: Building },
    { id: 'operation', label: 'Operação e Políticas', icon: FileText },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'planos_aulas', label: 'Planos de Aulas', icon: DollarSign },
    { id: 'faturamento', label: 'Faturamento', icon: BarChart2 },
    { id: 'team', label: 'Equipe', icon: UsersIcon },
    { id: 'plan', label: 'Plano e Assinatura', icon: Star },
  ];

  const clientTabs: { id: ClientTabType; label: string; icon: React.ElementType }[] = [
    { id: 'my-profile', label: 'Meu Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Lock },
  ];
  
  const staffTabs: { id: AdminTabType | ClientTabType; label: string; icon: React.ElementType }[] = [
    { id: 'my-profile', label: 'Meu Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
  ];
  if (profile?.permissions?.planos_aulas === 'edit') {
    staffTabs.push({ id: 'planos_aulas', label: 'Planos de Aulas', icon: DollarSign });
  }

  const tabs = isAdmin ? adminTabs : (isStaff ? staffTabs : clientTabs);
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '');
  
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (arena && isAdmin) {
      setArenaFormData(arena);
    }
    if (profile && !isAdmin) {
      setProfileFormData(profile);
    }
    if (isAdmin) {
      const loadSaasData = async () => {
        try {
          const [plansRes, subsRes] = await Promise.all([
            localApi.select<Plan>('plans', 'all'),
            localApi.select<Subscription>('subscriptions', 'all'),
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
      if (isAdmin) {
        await updateArena(arenaFormData);
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
        case 'payments': return <PaymentSettingsTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'planos_aulas': return <PlanosAulasTab />;
        case 'faturamento': return <FaturamentoTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'team': return <TeamSettingsTab />;
        case 'plan': return <PlanTab plans={plans} currentSubscription={currentSubscription || null} arena={arena} />;
        default: return null;
      }
    } else { // Client or Staff
      switch (activeTab) {
        case 'my-profile': return <ClientProfileSettingsTab formData={profileFormData} setFormData={setProfileFormData} />;
        case 'notifications': return <NotificationSettingsTab profile={profileFormData} setProfile={setProfileFormData} />;
        case 'security': return <SecurityTab />;
        case 'planos_aulas': return isStaff ? <PlanosAulasTab /> : null;
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
  
  const canSave = isAdmin ? (activeTab === 'profile' || activeTab === 'operation' || activeTab === 'payments' || activeTab === 'faturamento') : (activeTab === 'my-profile' || activeTab === 'notifications' || activeTab === 'security');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onClick={() => setActiveTab(tab.id)}
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
