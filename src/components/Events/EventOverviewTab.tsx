import React from 'react';
import { Evento, EventoStatus, EventoTipo } from '../../types';
import { Calendar, Clock, Users, DollarSign, Trophy, CheckCircle, PlayCircle, Ban, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface EventOverviewTabProps {
  evento: Evento;
}

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number, color: string }> = ({ icon: Icon, label, value, color }) => (
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

const getStatusProps = (status: EventoStatus) => {
  switch (status) {
    case 'planejado': return { icon: Calendar, color: 'text-blue-500', label: 'Planejado' };
    case 'inscricoes_abertas': return { icon: CheckCircle, color: 'text-green-500', label: 'Inscrições Abertas' };
    case 'em_andamento': return { icon: PlayCircle, color: 'text-yellow-500', label: 'Em Andamento' };
    case 'concluido': return { icon: Trophy, color: 'text-purple-500', label: 'Concluído' };
    case 'cancelado': return { icon: Ban, color: 'text-red-500', label: 'Cancelado' };
    default: return { icon: Calendar, color: 'text-gray-500', label: 'Desconhecido' };
  }
};

const getTypeLabel = (type: EventoTipo): string => {
    const labels: Record<EventoTipo, string> = {
        torneio: "Torneio",
        campeonato: "Campeonato",
        clinica: "Clínica",
        evento_especial: "Evento Especial",
    };
    return labels[type] || "Evento";
};

const EventOverviewTab: React.FC<EventOverviewTabProps> = ({ evento }) => {
  const statusProps = getStatusProps(evento.status);
  const startDate = parseDateStringAsLocal(evento.start_date);
  const endDate = parseDateStringAsLocal(evento.end_date);
  const dateString = isNaN(startDate.getTime()) ? "Data a definir" : 
    format(startDate, 'dd/MM/yyyy') + (
      !isNaN(endDate.getTime()) && startDate.getTime() !== endDate.getTime() 
      ? ` a ${format(endDate, 'dd/MM/yyyy')}` 
      : ''
    );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={statusProps.icon} label="Status" value={statusProps.label} color={statusProps.color} />
        <StatCard icon={Users} label="Inscritos" value={`${evento.participants.length} / ${evento.max_participants}`} color="text-blue-500" />
        <StatCard icon={DollarSign} label="Taxa" value={evento.registration_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="text-green-500" />
        <StatCard icon={Trophy} label="Tipo" value={getTypeLabel(evento.type)} color="text-purple-500" />
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Detalhes do Evento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 mt-1 text-brand-gray-400" />
                <div>
                    <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">Data</p>
                    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{dateString}</p>
                </div>
            </div>
            <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 mt-1 text-brand-gray-400" />
                <div>
                    <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">Horário</p>
                    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{evento.start_time} - {evento.end_time}</p>
                </div>
            </div>
             <div className="flex items-start">
                <LayoutGrid className="h-5 w-5 mr-3 mt-1 text-brand-gray-400" />
                <div>
                    <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">Quadras</p>
                    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{evento.quadras_ids.length} quadra(s) reservada(s)</p>
                </div>
            </div>
             <div className="flex items-start">
                <Trophy className="h-5 w-5 mr-3 mt-1 text-brand-gray-400" />
                <div>
                    <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">Categorias</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {evento.categories.map(cat => (
                            <span key={cat} className="px-2 py-0.5 text-xs rounded-full bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-700 dark:text-brand-gray-300">{cat}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventOverviewTab;
