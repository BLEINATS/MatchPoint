import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, User, CheckCircle, XCircle, Loader2, DollarSign, Users, BarChart2, Plus, Edit, Trash2, Settings } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Arena, Profile, Plan, Subscription } from '../types';
import Button from '../components/Forms/Button';
import { format, addMonths, isBefore, addDays, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatters';
import ConfirmationModal from '../components/Shared/ConfirmationModal';
import PlanModal from '../components/SuperAdmin/PlanModal';
import ChangePlanModal from '../components/SuperAdmin/ChangePlanModal';
import AsaasConfigModal from '../components/SuperAdmin/AsaasConfigModal';
import SubscriptionsPanel from '../components/SuperAdmin/SubscriptionsPanel';
import { v4 as uuidv4 } from 'uuid';

const calculateNextBillingDate = (sub: Subscription, plan: Plan): Date | null => {
    if (!sub || !plan) return null;
    const startDate = new Date(sub.start_date);
    if (plan.trial_days && plan.trial_days > 0) {
        return addDays(startDate, plan.trial_days);
    }
    if (plan.duration_days && plan.duration_days > 0) {
        return addDays(startDate, plan.duration_days);
    }
    
    const today = new Date();
    let nextBilling = startDate;
    let iterations = 0; // Safety break
    while (isBefore(nextBilling, today) && iterations < 1200) {
        let dateAdvanced = false;
        switch(plan.billing_cycle) {
            case 'monthly': nextBilling = addMonths(nextBilling, 1); dateAdvanced = true; break;
            case 'quarterly': nextBilling = addMonths(nextBilling, 3); dateAdvanced = true; break;
            case 'semiannual': nextBilling = addMonths(nextBilling, 6); dateAdvanced = true; break;
            case 'annual': nextBilling = addYears(nextBilling, 1); dateAdvanced = true; break;
        }
        if (!dateAdvanced) break;
        iterations++;
    }
    return nextBilling;
};

const SuperAdminPage: React.FC = () => {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions'>('dashboard');

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [arenaToToggle, setArenaToToggle] = useState<Arena | null>(null);
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false);
  
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [arenaToChangePlan, setArenaToChangePlan] = useState<Arena | null>(null);
  
  const [isAsaasConfigOpen, setIsAsaasConfigOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [arenasRes, profilesRes, plansRes, subsRes] = await Promise.all([
        localApi.select<Arena>('arenas', 'all'),
        localApi.select<Profile>('profiles', 'all'),
        localApi.select<Plan>('plans', 'all'),
        localApi.select<Subscription>('subscriptions', 'all'),
      ]);
      setArenas(arenasRes.data || []);
      setProfiles(profilesRes.data || []);
      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dashboardStats = useMemo(() => {
    const totalArenas = arenas.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((total, sub) => {
        const plan = plans.find(p => p.id === sub.plan_id);
        if (!plan || plan.duration_days || plan.trial_days) return total;
        
        switch(plan.billing_cycle) {
          case 'quarterly': return total + (plan.price / 3);
          case 'semiannual': return total + (plan.price / 6);
          case 'annual': return total + (plan.price / 12);
          default: return total + plan.price;
        }
      }, 0);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newSignups = arenas.filter(a => new Date(a.created_at) >= oneMonthAgo).length;

    return { totalArenas, activeSubscriptions, mrr, newSignups };
  }, [arenas, subscriptions, plans]);

  const handleToggleArenaStatus = async () => {
    if (!arenaToToggle) return;
    const newStatus = arenaToToggle.status === 'active' ? 'suspended' : 'active';
    const updatedArena = { ...arenaToToggle, status: newStatus };
    try {
      await localApi.upsert('arenas', [updatedArena], 'all');
      addToast({ message: `Status da arena "${arenaToToggle.name}" atualizado.`, type: 'success' });
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao atualizar status: ${error.message}`, type: 'error' });
    } finally {
      setIsToggleConfirmOpen(false);
      setArenaToToggle(null);
    }
  };

  const handleSavePlan = async (plan: Plan) => {
    try {
      await localApi.upsert('plans', [plan], 'all');
      addToast({ message: 'Plano salvo com sucesso!', type: 'success' });
      await loadData();
      setIsPlanModalOpen(false);
      setEditingPlan(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar plano: ${error.message}`, type: 'error' });
    }
  };
  
  const handleDeletePlanRequest = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await localApi.delete('plans', [planToDelete.id], 'all');
      addToast({ message: 'Plano excluído com sucesso.', type: 'success' });
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir plano: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteConfirmOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleOpenChangePlanModal = (arena: Arena) => {
    setArenaToChangePlan(arena);
    setIsChangePlanModalOpen(true);
  };

  const handleChangePlan = async (newPlanId: string) => {
    if (!arenaToChangePlan) return;
    
    const currentSub = subscriptions.find(s => s.arena_id === arenaToChangePlan.id);
    
    if (currentSub) {
      const updatedSub = { ...currentSub, plan_id: newPlanId, start_date: new Date().toISOString() };
      await localApi.upsert('subscriptions', [updatedSub], 'all');
    } else {
      const newSub: Subscription = {
        id: `sub_${uuidv4()}`,
        arena_id: arenaToChangePlan.id,
        plan_id: newPlanId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: null,
      };
      await localApi.upsert('subscriptions', [newSub], 'all');
    }
    
    const updatedArena = { ...arenaToChangePlan, plan_id: newPlanId };
    await localApi.upsert('arenas', [updatedArena], 'all');

    addToast({ message: 'Plano da arena alterado com sucesso!', type: 'success' });
    await loadData();
    setIsChangePlanModalOpen(false);
    setArenaToChangePlan(null);
  };
  
  const getBillingCycleLabel = (plan: Plan) => {
    if (plan.trial_days) {
      return `${plan.trial_days} dias (Trial)`;
    }
    if (plan.duration_days) {
      return `${plan.duration_days} dias`;
    }
    const labels = {
      monthly: 'mês',
      quarterly: 'trimestre',
      semiannual: 'semestre',
      annual: 'ano',
    };
    return labels[plan.billing_cycle] || 'mês';
  };

  if (profile?.role !== 'super_admin') {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-brand-gray-500">Você não tem permissão para acessar esta área.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Painel Super Admin</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerenciamento de todas as arenas da plataforma MatchPlay.</p>
            </div>
            <Button onClick={() => setIsAsaasConfigOpen(true)} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Asaas
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Assinaturas Asaas
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon={Building} label="Total de Arenas" value={dashboardStats.totalArenas} />
              <StatCard icon={CheckCircle} label="Assinaturas Ativas" value={dashboardStats.activeSubscriptions} />
              <StatCard icon={DollarSign} label="MRR (Receita Mensal)" value={formatCurrency(dashboardStats.mrr)} />
              <StatCard icon={Users} label="Novas Arenas (Mês)" value={dashboardStats.newSignups} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
                <h3 className="text-xl font-semibold p-6">Arenas Cadastradas</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                    <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Arena</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Plano</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Próx. Cobrança</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                      {arenas.map(arena => {
                        const sub = subscriptions.find(s => s.arena_id === arena.id);
                        const plan = plans.find(p => p.id === sub?.plan_id);
                        const nextBillingDate = sub && plan ? calculateNextBillingDate(sub, plan) : null;
                        const nextBillingDateStr = nextBillingDate ? format(nextBillingDate, 'dd/MM/yyyy') : '--';

                        return (
                          <tr key={arena.id} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-brand-gray-900 dark:text-white">{arena.name}</div>
                                <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Cadastro: {format(new Date(arena.created_at), 'dd/MM/yy')}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-brand-gray-900 dark:text-white">{plan?.name || 'N/A'}</div>
                                {sub && <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Início: {format(new Date(sub.start_date), 'dd/MM/yy')}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{nextBillingDateStr}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  arena.status === 'active' && sub?.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                  sub?.status === 'past_due' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {sub?.status === 'past_due' ? 'Pendente' : arena.status === 'active' ? 'Ativa' : 'Suspensa'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenChangePlanModal(arena); }}>Trocar Plano</Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setArenaToToggle(arena); setIsToggleConfirmOpen(true); }} className="ml-2">
                                {arena.status === 'active' ? 'Suspender' : 'Ativar'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="xl:col-span-1 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Planos de Assinatura</h3>
                  <Button size="sm" onClick={() => { setEditingPlan(null); setIsPlanModalOpen(true); }}><Plus className="h-4 w-4 mr-2"/>Novo Plano</Button>
                </div>
                <div className="space-y-3">
                  {plans.map(plan => (
                    <div key={plan.id} className="p-3 border rounded-lg dark:border-brand-gray-700 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{plan.name}</p>
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          {plan.price > 0 ? formatCurrency(plan.price) : 'Grátis'}
                          {plan.price > 0 ? ` / ${getBillingCycleLabel(plan)}` : ` (${getBillingCycleLabel(plan)})`}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }}><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePlanRequest(plan)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionsPanel />
            )}
          </>
        )}
      </div>
      <AsaasConfigModal
        isOpen={isAsaasConfigOpen}
        onClose={() => setIsAsaasConfigOpen(false)}
        onSave={() => {
          addToast({ message: 'Configuração Asaas atualizada!', type: 'success' });
          loadData();
        }}
      />
      <ConfirmationModal
        isOpen={isToggleConfirmOpen}
        onClose={() => setIsToggleConfirmOpen(false)}
        onConfirm={handleToggleArenaStatus}
        title={`Confirmar ${arenaToToggle?.status === 'active' ? 'Suspensão' : 'Ativação'}`}
        message={<p>Tem certeza que deseja {arenaToToggle?.status === 'active' ? 'suspender' : 'ativar'} a arena <strong>{arenaToToggle?.name}</strong>?</p>}
        confirmText="Sim, Confirmar"
      />
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeletePlan}
        title="Confirmar Exclusão"
        message={<p>Tem certeza que deseja excluir o plano <strong>{planToDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>}
        confirmText="Sim, Excluir"
      />
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSave={handleSavePlan}
        initialData={editingPlan}
      />
      <ChangePlanModal
        isOpen={isChangePlanModalOpen}
        onClose={() => setIsChangePlanModalOpen(false)}
        onConfirm={handleChangePlan}
        arena={arenaToChangePlan}
        plans={plans}
        currentSubscription={subscriptions.find(s => s.arena_id === arenaToChangePlan?.id) || null}
      />
    </Layout>
  );
};

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
  <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex items-center">
      <div className="p-3 rounded-lg bg-blue-100 dark:bg-brand-blue-500/10 mr-4">
        <Icon className="h-6 w-6 text-brand-blue-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default SuperAdminPage;
