import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Star, Gift, Trophy, Loader2, Save, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { GamificationSettings, GamificationLevel, GamificationReward, GamificationAchievement } from '../types';
import Button from '../components/Forms/Button';
import GeneralSettings from '../components/Gamification/GeneralSettings';
import LevelsSettings from '../components/Gamification/LevelsSettings';
import RewardsSettings from '../components/Gamification/RewardsSettings';
import AchievementsSettings from '../components/Gamification/AchievementsSettings';

type TabType = 'general' | 'levels' | 'rewards' | 'achievements';

const Gamification: React.FC = () => {
  const { selectedArenaContext: arena } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [levels, setLevels] = useState<GamificationLevel[]>([]);
  const [rewards, setRewards] = useState<GamificationReward[]>([]);
  const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const [settingsRes, levelsRes, rewardsRes, achievementsRes] = await Promise.all([
        localApi.select<GamificationSettings>('gamification_settings', arena.id),
        localApi.select<GamificationLevel>('gamification_levels', arena.id),
        localApi.select<GamificationReward>('gamification_rewards', arena.id),
        localApi.select<GamificationAchievement>('gamification_achievements', arena.id),
      ]);

      setSettings(settingsRes.data?.[0] || null);
      setLevels(levelsRes.data?.sort((a, b) => a.level_rank - b.level_rank) || []);
      setRewards(rewardsRes.data || []);
      setAchievements(achievementsRes.data || []);

    } catch (error: any) {
      addToast({ message: `Erro ao carregar configurações: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);


  useEffect(() => {
    if (arena) {
      loadData();
    }
  }, [arena, loadData]);

  const handleSave = async () => {
    if (!arena) return;
    setIsSaving(true);
    try {
      if (settings) {
        await localApi.upsert('gamification_settings', [{ ...settings, arena_id: arena.id }], arena.id, true);
      }
      await localApi.upsert('gamification_levels', levels.map(l => ({ ...l, arena_id: arena.id })), arena.id, true);
      await localApi.upsert('gamification_rewards', rewards.map(r => ({ ...r, arena_id: arena.id })), arena.id, true);
      await localApi.upsert('gamification_achievements', achievements.map(a => ({ ...a, arena_id: arena.id })), arena.id, true);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      addToast({ message: "Configurações de gamificação salvas!", type: 'success' });
    } catch (error: any) {
      addToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'levels', label: 'Níveis', icon: Star },
    { id: 'rewards', label: 'Recompensas', icon: Gift },
    { id: 'achievements', label: 'Conquistas', icon: Trophy },
  ];

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    
    switch (activeTab) {
      case 'general':
        return <GeneralSettings settings={settings} setSettings={setSettings} />;
      case 'levels':
        return <LevelsSettings levels={levels} setLevels={setLevels} />;
      case 'rewards':
        return <RewardsSettings rewards={rewards} setRewards={setRewards} />;
      case 'achievements':
        return <AchievementsSettings achievements={achievements} setAchievements={setAchievements} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">MatchPlay Rewards</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Configure o sistema de gamificação para engajar seus clientes.</p>
            </div>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={showSuccess ? 'success' : 'save'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center">
                  {showSuccess ? <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
                </motion.span>
              </AnimatePresence>
            </Button>
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
    </Layout>
  );
};

export default Gamification;
