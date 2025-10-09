import React from 'react';
import { Evento, EventoStatus } from '../../types';
import EventoKanbanCard from './EventoKanbanCard';
import { Link } from 'react-router-dom';

interface KanbanBoardProps {
  eventos: Evento[];
  setEventos: React.Dispatch<React.SetStateAction<Evento[]>>;
}

const columns: { status: EventoStatus; title: string; color: string }[] = [
  { status: 'orcamento', title: 'Orçamento', color: 'bg-gray-400' },
  { status: 'pendente', title: 'Pendente', color: 'bg-yellow-500' },
  { status: 'confirmado', title: 'Confirmado', color: 'bg-blue-500' },
  { status: 'realizado', title: 'Realizado', color: 'bg-green-500' },
  { status: 'concluido', title: 'Concluído', color: 'bg-purple-500' },
  { status: 'cancelado', title: 'Cancelado', color: 'bg-red-500' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ eventos, setEventos }) => {
  // Drag and drop logic would go here in a real implementation
  // For now, we just display the columns

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <div key={column.status} className="w-72 flex-shrink-0 bg-brand-gray-100 dark:bg-brand-gray-900 rounded-lg">
          <div className="p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="font-semibold text-brand-gray-800 dark:text-white flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${column.color}`}></span>
              {column.title}
              <span className="ml-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">
                ({eventos.filter(e => e.status === column.status).length})
              </span>
            </h3>
          </div>
          <div className="p-2 space-y-2 min-h-[50vh]">
            {eventos.filter(e => e.status === column.status).map(evento => (
              <Link key={evento.id} to={`/eventos/${evento.id}`}>
                <EventoKanbanCard evento={evento} />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
