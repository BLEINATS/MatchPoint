import React from 'react';
import { motion } from 'framer-motion';
import { Quadra, Reserva, ReservationType } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import Input from '../Forms/Input';
import Button from '../Forms/Button';

interface FilterPanelProps {
  filters: {
    status: 'all' | Reserva['status'];
    type: 'all' | ReservationType;
    clientName: string;
    quadraId: 'all' | string;
  };
  onFilterChange: React.Dispatch<React.SetStateAction<any>>;
  onClearFilters: () => void;
  quadras: Quadra[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onClearFilters, quadras }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange((prev: any) => ({ ...prev, [name]: value }));
  };

  const reservationStatuses: Reserva['status'][] = ['confirmada', 'pendente', 'cancelada'];
  const reservationTypes: ReservationType[] = ['normal', 'aula', 'evento', 'bloqueio'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
          <select
            name="quadraId"
            value={filters.quadraId}
            onChange={handleInputChange}
            className="w-full form-select text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
          >
            <option value="all">Todas as Quadras</option>
            {quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="w-full form-select text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
          >
            <option value="all">Todos</option>
            {reservationStatuses.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleInputChange}
            className="w-full form-select text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
          >
            <option value="all">Todos</option>
            {reservationTypes.map(type => (
              <option key={type} value={type}>{getReservationTypeDetails(type).label}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <Input
            label="Buscar por Cliente"
            name="clientName"
            value={filters.clientName}
            onChange={handleInputChange}
            placeholder="Digite o nome do cliente..."
            className="text-sm"
          />
        </div>
      </div>
      <div className="mt-4 text-right">
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Limpar Filtros
        </Button>
      </div>
    </motion.div>
  );
};

export default FilterPanel;
