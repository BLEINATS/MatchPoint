import React, { useState, useMemo, useEffect } from 'react';
import { format, addMinutes, parse, getDay, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GraduationCap, MapPin, Users } from 'lucide-react';
import { Professor, Turma, Quadra } from '../../types';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import DatePickerCalendar from '../Client/DatePickerCalendar';

interface ProfessorAgendaViewProps {
  professores: Professor[];
  turmas: Turma[];
  quadras: Quadra[];
  isGeneralView?: boolean;
}

const ProfessorAgendaView: React.FC<ProfessorAgendaViewProps> = ({ professores, turmas, quadras, isGeneralView = false }) => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedProfessorId, setSelectedProfessorId] = useState<'all' | string>('all');

  useEffect(() => {
    if (!isGeneralView && professores.length === 1) {
      setSelectedProfessorId(professores[0].id);
    }
  }, [isGeneralView, professores]);

  const filteredTurmas = useMemo(() => {
    if (selectedProfessorId === 'all') {
      return turmas;
    }
    return turmas.filter(turma => turma.professor_id === selectedProfessorId);
  }, [turmas, selectedProfessorId]);

  const aulasDoDia = useMemo(() => {
    const dayOfWeek = getDay(selectedDate);
    
    return filteredTurmas
      .flatMap(turma => {
        const scheduleForDay = turma.schedule?.find(s => s.day === dayOfWeek);
        if (!scheduleForDay) return [];

        const startDate = parseDateStringAsLocal(turma.start_date);
        if (isAfter(startDate, selectedDate)) return [];
        if (turma.end_date) {
          const endDate = parseDateStringAsLocal(turma.end_date);
          if (isAfter(selectedDate, endDate)) return [];
        }
        
        const slots = [];
        try {
          const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
          const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
          let currentTime = startTime;
          while (currentTime < endTime) {
            const slotStartTime = format(currentTime, 'HH:mm');
            const slotEndTime = format(addMinutes(currentTime, 60), 'HH:mm');
            
            const matricula = turma.matriculas?.find(m => m.dayOfWeek === dayOfWeek && m.time === slotStartTime);
            const enrolledCount = matricula?.student_ids.length || 0;

            slots.push({
              turma,
              start_time: slotStartTime,
              end_time: slotEndTime,
              unique_key: `${turma.id}-${format(selectedDate, 'yyyyMMdd')}-${slotStartTime}`,
              professor: professores.find(p => p.id === turma.professor_id),
              quadra: quadras.find(q => q.id === turma.quadra_id),
              enrolledCount,
              capacity: turma.alunos_por_horario,
            });
            currentTime = addMinutes(currentTime, 60);
          }
        } catch(e) { console.error("Error parsing time in ProfessorAgendaView", e)}
        return slots;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [selectedDate, filteredTurmas, professores, quadras]);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
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

  return (
    <div className="space-y-6">
      {isGeneralView && renderHeader()}
      <DatePickerCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white mb-4 capitalize">
          Aulas de {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h3>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {aulasDoDia.length > 0 ? (
            aulasDoDia.map(aula => (
              <div key={aula.unique_key} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-brand-gray-900 dark:text-white">{aula.turma.name}</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{aula.start_time} - {aula.end_time}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
                    <Users className="h-4 w-4"/>
                    <span>{aula.enrolledCount} / {aula.capacity}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-600 text-xs text-brand-gray-500 dark:text-brand-gray-400 space-y-1">
                  {isGeneralView && aula.professor && <p className="flex items-center"><GraduationCap className="h-3 w-3 mr-2"/>{aula.professor.name}</p>}
                  {aula.quadra && <p className="flex items-center"><MapPin className="h-3 w-3 mr-2"/>{aula.quadra.name}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-brand-gray-500 py-8">Nenhuma aula agendada para este dia.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorAgendaView;
