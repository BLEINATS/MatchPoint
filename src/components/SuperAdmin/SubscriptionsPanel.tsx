import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabaseApi } from '../../lib/supabaseApi';
import { Subscription, Arena, Plan } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionWithDetails extends Subscription {
  arena: Arena;
  plan: Plan;
}

export default function SubscriptionsPanel() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'past_due' | 'canceled'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const [subsRes, arenasRes, plansRes] = await Promise.all([
        supabaseApi.select<Subscription>('subscriptions', 'all'),
        supabaseApi.select<Arena>('arenas', 'all'),
        supabaseApi.select<Plan>('plans', 'all'),
      ]);

      const subs = subsRes.data || [];
      const arenas = arenasRes.data || [];
      const plans = plansRes.data || [];

      const subsWithDetails: SubscriptionWithDetails[] = subs
        .map(sub => {
          const arena = arenas.find(a => a.id === sub.arena_id);
          const plan = plans.find(p => p.id === sub.plan_id);
          if (!arena || !plan) return null;
          return { ...sub, arena, plan };
        })
        .filter((s): s is SubscriptionWithDetails => s !== null);

      setSubscriptions(subsWithDetails);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'past_due':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'past_due':
        return 'Vencida';
      case 'canceled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    filter === 'all' || sub.status === filter
  );

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    pastDue: subscriptions.filter(s => s.status === 'past_due').length,
    canceled: subscriptions.filter(s => s.status === 'canceled').length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.plan.price, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ativas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pastDue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Canceladas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.canceled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Receita Mensal</p>
              <p className="text-2xl font-bold text-white">
                R$ {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Todas ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Ativas ({stats.active})
        </button>
        <button
          onClick={() => setFilter('past_due')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'past_due'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Vencidas ({stats.pastDue})
        </button>
        <button
          onClick={() => setFilter('canceled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'canceled'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Canceladas ({stats.canceled})
        </button>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Arena
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Início
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Próximo Pagamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {sub.arena.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {sub.arena.city}, {sub.arena.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {sub.plan.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sub.plan.billing_cycle === 'monthly' && 'Mensal'}
                        {sub.plan.billing_cycle === 'quarterly' && 'Trimestral'}
                        {sub.plan.billing_cycle === 'semiannual' && 'Semestral'}
                        {sub.plan.billing_cycle === 'annual' && 'Anual'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {sub.plan.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                        {getStatusIcon(sub.status)}
                        {getStatusText(sub.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(sub.start_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {sub.next_payment_date
                        ? format(new Date(sub.next_payment_date), "dd 'de' MMM, yyyy", { locale: ptBR })
                        : sub.asaas_subscription_id
                        ? 'Configurado no Asaas'
                        : 'Não configurado'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredSubscriptions.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma assinatura encontrada
            </div>
          ) : (
            filteredSubscriptions.map((sub) => (
              <div key={sub.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{sub.arena.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sub.arena.city}, {sub.arena.state}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                    {getStatusIcon(sub.status)}
                    {getStatusText(sub.status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Plano</p>
                    <p className="font-medium text-gray-900 dark:text-white">{sub.plan.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sub.plan.billing_cycle === 'monthly' && 'Mensal'}
                      {sub.plan.billing_cycle === 'quarterly' && 'Trimestral'}
                      {sub.plan.billing_cycle === 'semiannual' && 'Semestral'}
                      {sub.plan.billing_cycle === 'annual' && 'Anual'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                    <p className="font-medium text-gray-900 dark:text-white">R$ {sub.plan.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Início</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(sub.start_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Próximo Pagamento</p>
                    <p className="font-medium text-gray-900 dark:text-white text-xs">
                      {sub.next_payment_date
                        ? format(new Date(sub.next_payment_date), "dd/MM/yyyy")
                        : sub.asaas_subscription_id
                        ? 'Asaas'
                        : 'N/C'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
