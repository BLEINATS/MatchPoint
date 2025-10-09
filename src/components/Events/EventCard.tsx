import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Evento, EventoStatus, EventoTipo } from '../../types';
import { Calendar, Clock, Users, CheckCircle, PlayCircle, Trophy, Ban, ArrowRight } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import Button from '../Forms/Button';

interface EventCardProps {
  evento: Evento;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

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

const EventCard: React.FC<EventCardProps> = ({ evento, onEdit, onDelete, index }) => {
  const statusProps = getStatusProps(evento.status);
  const startDate = parseDateStringAsLocal(evento.start_date);
  const endDate = parseDateStringAsLocal(evento.end_date);

  const dateString = isNaN(startDate.getTime()) ? "Data a definir" : 
    format(startDate, 'dd/MM') + (
      !isNaN(endDate.getTime()) && startDate.getTime() !== endDate.getTime() 
      ? ` - ${format(endDate, 'dd/MM')}` 
      : ''
    );

  return (
    <motion.div
      key={evento.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between hover:shadow-xl dark:hover:shadow-brand-blue-500/10 transition-shadow"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{evento.name}</h3>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{getTypeLabel(evento.type)}</p>
          </div>
          <div className={`flex items-center text-sm font-medium ${statusProps.color}`}>
            <statusProps.icon className="h-4 w-4 mr-1" />
            <span>{statusProps.label}</span>
          </div>
        </div>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{dateString}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{evento.start_time} - {evento.end_time}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
                <Users className="h-4 w-4 mr-2" />
                <span>{evento.participants?.length || 0} / {evento.max_participants} inscritos</span>
            </div>
            <Link to={`/eventos/${evento.id}`}>
                <Button size="sm">
                    Gerenciar
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
