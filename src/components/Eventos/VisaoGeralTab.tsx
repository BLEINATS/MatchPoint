import React from 'react';
import { Evento, EventoStatus, EventoTipoPrivado, Quadra } from '../../types';
import { Calendar, Clock, Users, DollarSign, PartyPopper, User, Phone, Mail, Home, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface VisaoGeralTabProps {
  evento: Evento;
  quadras: Quadra[];
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
  const statuses = {
    orcamento: { label: 'Orçamento', color: 'text-gray-500' },
    pendente: { label: 'Pendente', color: 'text-yellow-500' },
    confirmado: { label: 'Confirmado', color: 'text-blue-500' },
    realizado: { label: 'Realizado', color: 'text-green-500' },
    concluido: { label: 'Concluído', color: 'text-purple-500' },
    cancelado: { label: 'Cancelado', color: 'text-red-500' },
  };
  return statuses[status] || statuses.orcamento;
};

const getTypeLabel = (type: EventoTipoPrivado): string => {
    const labels: Record<EventoTipoPrivado, string> = {
        festa: "Festa",
        corporativo: "Corporativo",
        aniversario: "Aniversário",
        show: "Show",
        outro: "Outro",
    };
    return labels[type] || "Evento";
};

const VisaoGeralTab: React.FC<VisaoGeralTabProps> = ({ evento, quadras }) => {
  const statusProps = getStatusProps(evento.status);
  const startDate = parseDateStringAsLocal(evento.startDate);
  const endDate = parseDateStringAsLocal(evento.endDate);
  const dateString = isNaN(startDate.getTime()) ? "Data a definir" : 
    format(startDate, 'dd/MM/yyyy') + (
      !isNaN(endDate.getTime()) && startDate.getTime() !== endDate.getTime() 
      ? ` a ${format(endDate, 'dd/MM/yyyy')}` 
      : ''
    );
    
  const selectedQuadraNames = evento.quadras_ids
    .map(id => quadras.find(q => q.id === id)?.name)
    .filter(Boolean);

  const allSpaces = [
    ...selectedQuadraNames,
    ...(evento.additionalSpaces || [])
  ].join(', ');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={PartyPopper} label="Status" value={statusProps.label} color={statusProps.color} />
        <StatCard icon={Users} label="Convidados" value={evento.expectedGuests} color="text-blue-500" />
        <StatCard icon={DollarSign} label="Valor Total" value={formatCurrency(evento.totalValue)} color="text-green-500" />
        {evento.discount && evento.discount > 0 && (
          <StatCard icon={Percent} label="Desconto Aplicado" value={formatCurrency(evento.discount)} color="text-yellow-500" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Detalhes do Evento</h3>
          <div className="space-y-4 text-sm">
              <InfoItem icon={Calendar} label="Data" value={dateString} />
              <InfoItem icon={Clock} label="Horário do Evento" value={`${evento.startTime} - ${evento.endTime}`} />
              {evento.quadras_ids.length > 0 && (
                <div className="p-3 rounded-md bg-brand-blue-600 dark:bg-brand-blue-700 shadow-lg">
                    <div className="flex items-start">
                        <Clock className="h-5 w-5 mr-3 mt-1 text-blue-200 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-blue-200">Horário da Quadra</p>
                            <p className="font-semibold text-white text-lg">{`${evento.courtStartTime || evento.startTime} - ${evento.courtEndTime || evento.endTime}`}</p>
                        </div>
                    </div>
                </div>
              )}
              <InfoItem icon={Users} label="Convidados" value={`${evento.expectedGuests} pessoas`} />
              <InfoItem icon={Home} label="Espaços Reservados" value={allSpaces || 'Nenhum espaço específico'} />
          </div>
        </div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Informações do Cliente</h3>
           <div className="space-y-4 text-sm">
              <InfoItem icon={User} label="Nome" value={evento.clientName} />
              <InfoItem icon={Mail} label="E-mail" value={evento.clientEmail} />
              <InfoItem icon={Phone} label="Telefone" value={evento.clientPhone} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{icon: React.ElementType, label: string, value: string}> = ({icon: Icon, label, value}) => (
    <div className="flex items-start">
        <Icon className="h-5 w-5 mr-3 mt-1 text-brand-gray-400 flex-shrink-0" />
        <div>
            <p className="font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
            <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{value || 'Não informado'}</p>
        </div>
    </div>
)

export default VisaoGeralTab;
