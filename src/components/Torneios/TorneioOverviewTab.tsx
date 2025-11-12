import React, { useMemo } from 'react';
import { Torneio, TorneioStatus, TorneioModality } from '../../types';
import { Calendar, Clock, Users, Trophy, CheckCircle, PlayCircle, Ban, Users2, User, BarChart, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${color.replace('text-', 'bg-').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const getStatusProps = (status: TorneioStatus) => {
  switch (status) {
    case 'planejado': return { icon: Calendar, color: 'text-blue-500', label: 'Planejado' };
    case 'inscricoes_abertas': return { icon: CheckCircle, color: 'text-green-500', label: 'Inscrições Abertas' };
    case 'em_andamento': return { icon: PlayCircle, color: 'text-yellow-500', label: 'Em Andamento' };
    case 'concluido': return { icon: Trophy, color: 'text-purple-500', label: 'Concluído' };
    case 'cancelado': return { icon: Ban, color: 'text-red-500', label: 'Cancelado' };
    default: return { icon: Calendar, color: 'text-gray-500', label: 'Desconhecido' };
  }
};

const getModalityProps = (modality: TorneioModality) => {
    switch (modality) {
        case 'individual': return { icon: User, label: 'Individual' };
        case 'duplas': return { icon: Users, label: 'Duplas' };
        case 'equipes': return { icon: Users2, label: 'Equipes' };
        default: return { icon: Users, label: 'N/A' };
    }
};

const TorneioOverviewTab: React.FC<{ torneio: Torneio }> = ({ torneio }) => {
  const statusProps = getStatusProps(torneio.status);
  const modalityProps = getModalityProps(torneio.modality);
  
  const { dateString, totalMaxParticipants, potentialRevenue } = useMemo(() => {
    if (!torneio.categories || torneio.categories.length === 0) {
      return { dateString: "A definir", totalMaxParticipants: 0, potentialRevenue: 0 };
    }

    const allStartDates = torneio.categories.map(c => parseDateStringAsLocal(c.start_date)).filter(d => !isNaN(d.getTime()));
    const allEndDates = torneio.categories.map(c => parseDateStringAsLocal(c.end_date)).filter(d => !isNaN(d.getTime()));
    
    const overallStartDate = allStartDates.length > 0 ? new Date(Math.min(...allStartDates.map(d => d.getTime()))) : null;
    const overallEndDate = allEndDates.length > 0 ? new Date(Math.max(...allEndDates.map(d => d.getTime()))) : null;

    const formattedDateString = overallStartDate
      ? format(overallStartDate, 'dd/MM/yyyy') + (overallEndDate && overallStartDate.getTime() !== overallEndDate.getTime() ? ` a ${format(overallEndDate, 'dd/MM/yyyy')}` : '')
      : "Data a definir";

    const totalCapacity = torneio.categories.reduce((sum, cat) => sum + (cat.max_participants || 0), 0);
    
    const calculatedPotentialRevenue = torneio.categories.reduce((total, category) => {
        const maxParticipants = category.max_participants || 0;
        const fee = category.registration_fee || 0;
        return total + (maxParticipants * fee);
    }, 0);

    return {
      dateString: formattedDateString,
      totalMaxParticipants: totalCapacity,
      potentialRevenue: calculatedPotentialRevenue,
    };
  }, [torneio.categories]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={statusProps.icon} label="Status" value={statusProps.label} color={statusProps.color} />
        <StatCard icon={Users} label="Inscritos" value={`${torneio.participants.length} / ${totalMaxParticipants}`} color="text-blue-500" />
        <StatCard icon={modalityProps.icon} label="Modalidade" value={modalityProps.label} color="text-purple-500" />
        <StatCard icon={DollarSign} label="Receita Potencial" value={formatCurrency(potentialRevenue)} color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Detalhes do Torneio</h3>
          <div className="space-y-4 text-sm">
              <InfoItem icon={Calendar} label="Período do Torneio" value={dateString} />
              <div className="flex items-start">
                <Trophy className="h-5 w-5 mr-3 mt-1 text-brand-gray-400" />
                <div>
                    <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">Descrição</p>
                    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 whitespace-pre-wrap">{torneio.description || 'Nenhuma descrição fornecida.'}</p>
                </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Categorias</h3>
          <div className="space-y-4 text-sm max-h-60 overflow-y-auto">
            {torneio.categories.map(cat => (
              <div key={cat.id} className="pb-3 border-b border-brand-gray-200 dark:border-brand-gray-700 last:border-b-0">
                <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{cat.group} - {cat.level}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-brand-gray-600 dark:text-brand-gray-400">
                  <span><strong className="font-medium">Vagas:</strong> {cat.max_participants}</span>
                  <span><strong className="font-medium">Taxa:</strong> {formatCurrency(cat.registration_fee)}</span>
                </div>
              </div>
            ))}
            {torneio.categories.length === 0 && <p className="text-brand-gray-500">Nenhuma categoria definida.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{icon: React.ElementType, label: string, value: string}> = ({icon: Icon, label, value}) => (
    <div className="flex items-start">
        <Icon className="h-5 w-5 mr-3 mt-1 text-brand-gray-400" />
        <div>
            <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
            <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{value || 'Não informado'}</p>
        </div>
    </div>
)

export default TorneioOverviewTab;
