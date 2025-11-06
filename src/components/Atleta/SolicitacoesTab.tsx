import React, { useMemo } from 'react';
import { Reserva, Quadra, Aluno } from '../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { Calendar, Clock, User, Check, X, Hourglass, CheckCircle, XCircle, Trophy } from 'lucide-react';
import Button from '../Forms/Button';

interface SolicitacoesTabProps {
  reservas: Reserva[];
  quadras: Quadra[];
  clientes: Aluno[];
  onUpdateRequest: (reserva: Reserva, newStatus: 'aceito' | 'recusado') => void;
}

const ReservaCard: React.FC<{ reserva: Reserva, quadra?: Quadra, cliente?: Aluno, onUpdateRequest?: (reserva: Reserva, newStatus: 'aceito' | 'recusado') => void }> = ({ reserva, quadra, cliente, onUpdateRequest }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-brand-gray-700/50 p-4 rounded-lg shadow-md"
    >
      <div className="flex items-center gap-3 mb-3">
        <img src={cliente?.avatar_url || `https://avatar.vercel.sh/${reserva.profile_id}.svg`} alt={reserva.clientName} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="font-semibold text-brand-gray-900 dark:text-white">{reserva.clientName}</p>
          <p className="text-xs text-brand-gray-500">{quadra?.name || 'Quadra'}</p>
        </div>
      </div>
      <div className="text-sm space-y-1 text-brand-gray-600 dark:text-brand-gray-300">
        <p className="flex items-center"><Calendar className="h-4 w-4 mr-2" />{format(parseDateStringAsLocal(reserva.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
        <p className="flex items-center"><Clock className="h-4 w-4 mr-2" />{reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}</p>
      </div>
      {onUpdateRequest && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-brand-gray-200 dark:border-brand-gray-600">
          <Button size="sm" className="w-full bg-green-500 hover:bg-green-600" onClick={() => onUpdateRequest(reserva, 'aceito')}><Check className="h-4 w-4 mr-1" /> Aceitar</Button>
          <Button size="sm" variant="outline" className="w-full" onClick={() => onUpdateRequest(reserva, 'recusado')}><X className="h-4 w-4 mr-1" /> Recusar</Button>
        </div>
      )}
    </motion.div>
  );
};

const Column: React.FC<{ title: string, icon: React.ElementType, reservas: Reserva[], quadras: Quadra[], clientes: Aluno[], onUpdateRequest?: (reserva: Reserva, newStatus: 'aceito' | 'recusado') => void }> = ({ title, icon: Icon, reservas, quadras, clientes, onUpdateRequest }) => {
  return (
    <div className="w-72 lg:w-80 flex-shrink-0 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-lg flex flex-col">
      <h3 className="font-bold text-lg flex items-center p-4 border-b border-brand-gray-200 dark:border-brand-gray-700 flex-shrink-0">
        <Icon className="h-5 w-5 mr-2" /> {title} ({reservas.length})
      </h3>
      <div className="space-y-3 p-4 overflow-y-auto no-scrollbar">
        {reservas.length > 0 ? reservas.map(reserva => (
          <ReservaCard key={reserva.id} reserva={reserva} quadra={quadras.find(q => q.id === reserva.quadra_id)} cliente={clientes.find(c => c.profile_id === reserva.profile_id)} onUpdateRequest={onUpdateRequest} />
        )) : (
          <p className="text-sm text-center text-brand-gray-500 py-8">Nenhuma solicitação aqui.</p>
        )}
      </div>
    </div>
  );
};

const SolicitacoesTab: React.FC<SolicitacoesTabProps> = ({ reservas, quadras, clientes, onUpdateRequest }) => {

  const categorizedReservas = useMemo(() => {
    const pending = reservas.filter(r => r.atleta_aceite_status === 'pendente');
    const confirmed = reservas.filter(r => r.atleta_aceite_status === 'aceito' && r.status !== 'realizada' && r.status !== 'cancelada');
    const completed = reservas.filter(r => r.atleta_aceite_status === 'aceito' && r.status === 'realizada');
    const refused = reservas.filter(r => r.atleta_aceite_status === 'recusado' || r.status === 'cancelada');
    return { pending, confirmed, completed, refused };
  }, [reservas]);

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
      <Column title="Pendentes" icon={Hourglass} reservas={categorizedReservas.pending} quadras={quadras} clientes={clientes} onUpdateRequest={onUpdateRequest} />
      <Column title="Confirmadas" icon={CheckCircle} reservas={categorizedReservas.confirmed} quadras={quadras} clientes={clientes} />
      <Column title="Realizadas" icon={Trophy} reservas={categorizedReservas.completed} quadras={quadras} clientes={clientes} />
      <Column title="Recusadas/Canceladas" icon={XCircle} reservas={categorizedReservas.refused} quadras={quadras} clientes={clientes} />
    </div>
  );
};

export default SolicitacoesTab;
