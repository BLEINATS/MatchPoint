import React from 'react';
import { Torneio, TorneioStatus, TorneioModality } from '../../types';
import { Calendar, Clock, Users, DollarSign, Trophy, CheckCircle, PlayCircle, Ban, Users2, User, BarChart } from 'lucide-react';
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
  const startDate = parseDateStringAsLocal(torneio.start_date);
  const endDate = parseDateStringAsLocal(torneio.end_date);
  const dateString = isNaN(startDate.getTime()) ? "Data a definir" : 
    format(startDate, 'dd/MM/yyyy') + (
      !isNaN(endDate.getTime()) && startDate.getTime() !== endDate.getTime() 
      ? ` a ${format(endDate, 'dd/MM/yyyy')}` 
      : ''
    );
  
  const totalArrecadado = (torneio.participants?.length || 0) * torneio.registration_fee;
  const totalVagas = (torneio.max_participants || 0) * (torneio.categories?.length || 0);
  const totalPotencial = totalVagas * torneio.registration_fee;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={statusProps.icon} label="Status" value={statusProps.label} color={statusProps.color} />
        <StatCard icon={Users} label="Inscritos" value={`${torneio.participants.length} / ${totalVagas}`} color="text-blue-500" />
        <StatCard icon={modalityProps.icon} label="Modalidade" value={modalityProps.label} color="text-purple-500" />
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-brand-blue-500" />
            Financeiro
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/50 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Arrecadado</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalArrecadado)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Potencial de Arrecadação</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totalPotencial)}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Detalhes do Torneio</h3>
          <div className="space-y-4 text-sm">
              <InfoItem icon={Calendar} label="Data" value={dateString} />
              <InfoItem icon={Clock} label="Horário" value={`${torneio.start_time} - ${torneio.end_time}`} />
          </div>
        </div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Premiação por Categoria</h3>
          <div className="space-y-4 text-sm max-h-60 overflow-y-auto">
            {torneio.categories.map(cat => (
              <div key={cat.id} className="pb-3 border-b border-brand-gray-200 dark:border-brand-gray-700 last:border-b-0">
                <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{cat.group} - {cat.level}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-brand-gray-600 dark:text-brand-gray-400">
                  {cat.prize_1st && <span className="font-medium"><strong className="text-yellow-500">1º:</strong> {cat.prize_1st}</span>}
                  {cat.prize_2nd && <span className="font-medium"><strong className="text-gray-400">2º:</strong> {cat.prize_2nd}</span>}
                  {cat.prize_3rd && <span className="font-medium"><strong className="text-orange-400">3º:</strong> {cat.prize_3rd}</span>}
                  {!cat.prize_1st && !cat.prize_2nd && !cat.prize_3rd && <span className="text-xs italic">Sem premiação definida</span>}
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
