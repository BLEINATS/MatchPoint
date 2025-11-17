import React, { useState, useEffect, useCallback } from 'react';
import { Aluno, Reserva, CreditTransaction, GamificationPointTransaction } from '../../types';
import { supabaseApi } from '../../lib/supabaseApi';
import { useToast } from '../../context/ToastContext';
import { Loader2, Calendar, DollarSign, Star, CheckCircle, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';

interface ActivityTabProps {
  aluno: Aluno;
}

interface ActivityItem {
  id: string;
  date: Date;
  type: 'reserva' | 'credito' | 'pontos';
  title: string;
  description: string;
  amount?: number;
  status?: string;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ aluno }) => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    if (!aluno?.arena_id || !aluno?.id) {
        setIsLoading(false);
        return;
    }
    
    try {
      const [reservasRes, creditsRes, pointsRes] = await Promise.all([
        supabaseApi.select<Reserva>('reservas', aluno.arena_id),
        supabaseApi.select<CreditTransaction>('credit_transactions', aluno.arena_id),
        supabaseApi.select<GamificationPointTransaction>('gamification_point_transactions', aluno.arena_id),
      ]);

      const allActivities: ActivityItem[] = [];

      // Process Reservations
      (reservasRes.data || [])
        .filter(r => r.aluno_id === aluno.id || (r.profile_id && r.profile_id === aluno.profile_id))
        .forEach(r => {
          allActivities.push({
            id: `res-${r.id}`,
            date: new Date(r.created_at),
            type: 'reserva',
            title: r.status === 'cancelada' ? 'Reserva Cancelada' : 'Nova Reserva',
            description: `${r.start_time.slice(0,5)} em ${format(new Date(r.date), 'dd/MM/yy')}`,
            amount: r.total_price,
            status: r.status,
          });
        });

      // Process Credit Transactions
      (creditsRes.data || [])
        .filter(t => t.aluno_id === aluno.id)
        .forEach(t => {
          allActivities.push({
            id: `cred-${t.id}`,
            date: new Date(t.created_at!),
            type: 'credito',
            title: t.amount > 0 ? 'Crédito Adicionado' : 'Crédito Utilizado',
            description: t.description || 'Ajuste de crédito',
            amount: t.amount,
          });
        });
        
      // Process Gamification Points
      (pointsRes.data || [])
        .filter(t => t.aluno_id === aluno.id)
        .forEach(t => {
          allActivities.push({
            id: `pts-${t.id}`,
            date: new Date(t.created_at),
            type: 'pontos',
            title: t.points > 0 ? 'Pontos Ganhos' : 'Pontos Resgatados',
            description: t.description,
            amount: t.points,
          });
        });
      
      allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setActivities(allActivities);

    } catch (error: any) {
      addToast({ message: `Erro ao carregar atividades: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [aluno, addToast]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getIcon = (type: ActivityItem['type'], status?: string) => {
    if (type === 'reserva' && status === 'cancelada') return <XCircle className="h-5 w-5 text-red-500" />;
    if (type === 'reserva') return <Calendar className="h-5 w-5 text-blue-500" />;
    if (type === 'credito') return <DollarSign className="h-5 w-5 text-green-500" />;
    if (type === 'pontos') return <Star className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-gray-500" />;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-brand-gray-800 dark:text-white">Histórico Completo de Atividades</h4>
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
        {activities.length > 0 ? activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-4 p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
            <div className="mt-1">{getIcon(activity.type, activity.status)}</div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold text-sm text-brand-gray-900 dark:text-white">{activity.title}</p>
                {activity.amount !== undefined && (
                  <p className={`font-bold text-sm ${
                    activity.type === 'pontos' ? 'text-yellow-500' : 
                    activity.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.type === 'credito' ? formatCurrency(activity.amount) : `${activity.amount > 0 ? '+' : ''}${activity.amount}`}
                  </p>
                )}
              </div>
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{activity.description}</p>
              <p className="text-xs text-brand-gray-500 mt-1">
                {formatDistanceToNow(activity.date, { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        )) : (
          <p className="text-center text-sm text-brand-gray-500 py-8">Nenhuma atividade registrada para este cliente.</p>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;
