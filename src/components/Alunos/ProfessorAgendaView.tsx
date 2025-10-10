import React, { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, GraduationCap, MapPin, Clock } from 'lucide-react';
import { Professor, Turma, Quadra } from '../../types';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface ProfessorAgendaViewProps {
  professores: Professor[];
  turmas: Turma[];
  quadras: Quadra[];
  isGeneralView?: boolean;
}

const ProfessorAgendaView: React.FC<ProfessorAgendaViewProps> = ({ professores, turmas, quadras, isGeneralView = false }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedProfessorId, setSelectedProfessorId] = useState<'all' | string>('all');

  useEffect(() => {
    if (!isGeneralView && professores.length === 1) {
      setSelectedProfessorId(professores[0].id);
    }
  }, [isGeneralView, professores]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(current => direction === 'next' ? addMonths(current, 1) : subMonths(current, 1));
  };

  const filteredTurmas = useMemo(() => {
    if (selectedProfessorId === 'all') {
      return turmas;
    }
    return turmas.filter(turma => turma.professor_id === selectedProfessorId);
  }, [turmas, selectedProfessorId]);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
      <div className="flex items-center">
        <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="w-40 text-center text-lg font-semibold capitalize text-brand-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button onClick={() => handleMonthChange('next')} className="p-2 rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      {isGeneralView && (
        <div>
          <label htmlFor="professor-filter" className="sr-only">Filtrar por professor</label>
          <select
            id="professor-filter"
            value={selectedProfessorId}
            onChange={(e) => setSelectedProfessorId(e.target.value)}
            className="form-select text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
          >
            <option value="all">Todos os Professores</option>
            {professores.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const renderDaysOfWeek = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-brand-gray-500 dark:text-brand-gray-400 mb-2">
        {days.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = currentMonth;
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const prefixDaysCount = getDay(monthStart);

    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: prefixDaysCount }).map((_, i) => <div key={`empty-pre-${i}`} className="border border-transparent"></div>)}
        {daysInMonth.map((day) => {
          const dayOfWeek = getDay(day);
          const aulasDoDia = filteredTurmas
            .filter(turma => turma.daysOfWeek.includes(dayOfWeek))
            .filter(turma => {
              const startDate = parseDateStringAsLocal(turma.start_date);
              if (day < startDate) return false;
              if (turma.end_date) {
                const endDate = parseDateStringAsLocal(turma.end_date);
                if (day > endDate) return false;
              }
              return true;
            })
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day.toString()} className={`p-2 border rounded-lg min-h-[120px] flex flex-col ${isSameMonth(day, monthStart) ? 'bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700' : 'bg-brand-gray-50 dark:bg-brand-gray-800/50 border-transparent'}`}>
              <span className={`font-semibold text-sm ${isSameDay(day, new Date()) ? 'text-brand-blue-500' : ''}`}>{format(day, 'd')}</span>
              <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                {aulasDoDia.map(aula => {
                  const professor = professores.find(p => p.id === aula.professor_id);
                  const quadra = quadras.find(q => q.id === aula.quadra_id);
                  return (
                    <div key={aula.id} className="text-xs p-1.5 rounded bg-purple-50 dark:bg-purple-900/30 border-l-2 border-purple-500">
                      <p className="font-bold text-purple-800 dark:text-purple-300 truncate">{aula.name}</p>
                      <div className="text-purple-700 dark:text-purple-400 mt-1 space-y-0.5">
                        <p className="flex items-center"><Clock className="h-3 w-3 mr-1" />{aula.start_time.slice(0,5)} - {aula.end_time.slice(0,5)}</p>
                        {selectedProfessorId === 'all' && professor && <p className="flex items-center"><GraduationCap className="h-3 w-3 mr-1" />{professor.name}</p>}
                        {quadra && <p className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{quadra.name}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </div>
  );
};

export default ProfessorAgendaView;
