import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building, FileText, BarChart2, CheckCircle, Save, ArrowLeft, User, Lock } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Arena, Profile } from '../types';
import Button from '../components/Forms/Button';
import ProfileTab from '../components/Settings/ProfileTab';
import ClientProfileSettingsTab from '../components/Settings/ClientProfileSettingsTab';
import OperationTab from '../components/Settings/OperationTab';
import PlanTab from '../components/Settings/PlanTab';

type AdminTabType = 'profile' | 'operation' | 'plan';
type ClientTabType = 'my-profile' | 'security';

const Settings: React.FC = () => {
  const { arena, updateArena, profile, updateProfile, isLoading: isAuthLoading } = useAuth();
  
  const [arenaFormData, setArenaFormData] = useState<Partial<Arena>>({});
  const [profileFormData, setProfileFormData] = useState<Partial<Profile>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = profile?.role === 'admin_arena';

  const adminTabs: { id: AdminTabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil da Arena', icon: Building },
    { id: 'operation', label: 'Operação e Políticas', icon: FileText },
    { id: 'plan', label: 'Plano e Faturamento', icon: BarChart2 },
  ];

  const clientTabs: { id: ClientTabType; label: string; icon: React.ElementType }[] = [
    { id: 'my-profile', label: 'Meu Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
  ];

  const tabs = isAdmin ? adminTabs : clientTabs;
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  useEffect(() => {
    if (arena && isAdmin) {
      setArenaFormData(arena);
    }
    if (profile && !isAdmin) {
      setProfileFormData(profile);
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
      switch (activeTab) {
        case 'profile':
          return <ProfileTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'operation':
          return <OperationTab formData={arenaFormData} setFormData={setArenaFormData} />;
        case 'plan':
          return <PlanTab />;
        default:
          return null;
      }
    } else {
      switch (activeTab) {
        case 'my-profile':
          return <ClientProfileSettingsTab formData={profileFormData} setFormData={setProfileFormData} />;
        case 'security':
          return (
            <div>
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Alterar Senha</h3>
              <p className="mt-2 text-brand-gray-500 dark:text-brand-gray-400">Funcionalidade de alteração de senha em desenvolvimento.</p>
            </div>
          );
        default:
          return null;
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
  
  const canSave = isAdmin ? (activeTab === 'profile' || activeTab === 'operation') : (activeTab === 'my-profile');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
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
