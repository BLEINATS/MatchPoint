import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Torneio, TorneioStatus, TorneioTipo } from '../../types';
import { Calendar, Clock, Users, CheckCircle, PlayCircle, Trophy, Ban, ArrowRight } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import Button from '../Forms/Button';

interface TorneioCardProps {
  torneio: Torneio;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

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

const getTypeLabel = (type: TorneioTipo): string => {
    const labels: Record<TorneioTipo, string> = {
        torneio: "Torneio",
        campeonato: "Campeonato",
        clinica: "Clínica",
        evento_especial: "Evento Especial",
    };
    return labels[type] || "Evento";
};

const TorneioCard: React.FC<TorneioCardProps> = ({ torneio, onEdit, onDelete, index }) => {
  const statusProps = getStatusProps(torneio.status);

  const { dateString, startTime, endTime, totalMaxParticipants } = useMemo(() => {
    if (!torneio.categories || torneio.categories.length === 0) {
      return { dateString: "A definir", startTime: "N/A", endTime: "N/A", totalMaxParticipants: 0 };
    }

    const allStartDates = torneio.categories.map(c => parseDateStringAsLocal(c.start_date)).filter(d => !isNaN(d.getTime()));
    const allEndDates = torneio.categories.map(c => parseDateStringAsLocal(c.end_date)).filter(d => !isNaN(d.getTime()));
    
    const overallStartDate = allStartDates.length > 0 ? new Date(Math.min(...allStartDates.map(d => d.getTime()))) : null;
    const overallEndDate = allEndDates.length > 0 ? new Date(Math.max(...allEndDates.map(d => d.getTime()))) : null;

    const formattedDateString = overallStartDate
      ? format(overallStartDate, 'dd/MM') + (overallEndDate && overallStartDate.getTime() !== overallEndDate.getTime() ? ` - ${format(overallEndDate, 'dd/MM')}` : '')
      : "Data a definir";

    const allStartTimes = torneio.categories.map(c => c.start_time).filter(Boolean);
    const allEndTimes = torneio.categories.map(c => c.end_time).filter(Boolean);

    const earliestStartTime = allStartTimes.length > 0 ? allStartTimes.reduce((min, t) => t < min ? t : min) : "N/A";
    const latestEndTime = allEndTimes.length > 0 ? allEndTimes.reduce((max, t) => t > max ? t : max) : "N/A";
    
    const totalCapacity = torneio.categories.reduce((sum, cat) => sum + (cat.max_participants || 0), 0);

    return {
      dateString: formattedDateString,
      startTime: earliestStartTime,
      endTime: latestEndTime,
      totalMaxParticipants: totalCapacity,
    };
  }, [torneio.categories]);

  return (
    <motion.div
      key={torneio.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between hover:shadow-xl dark:hover:shadow-brand-blue-500/10 transition-shadow"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{torneio.name}</h3>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{getTypeLabel(torneio.type)}</p>
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
            <span>{startTime} - {endTime}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
                <Users className="h-4 w-4 mr-2" />
                <span>{torneio.participants?.length || 0} / {totalMaxParticipants} inscritos</span>
            </div>
            <Link to={`/torneios/${torneio.id}`}>
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

export default TorneioCard;
