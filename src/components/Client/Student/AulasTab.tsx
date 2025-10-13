import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aluno, Turma, Professor, Quadra, PlanoAula } from '../../../types';
import { Calendar, Clock, GraduationCap, MapPin, Users } from 'lucide-react';
import { format, isAfter, isSameDay, parse, getDay, isPast, addMinutes, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePickerCalendar from '../DatePickerCalendar';
import { parseDateStringAsLocal } from '../../../utils/dateUtils';
import ClassParticipantsModal from './ClassParticipantsModal';

interface AulasTabProps {
  aluno: Aluno;
  allAlunos: Aluno[];
  turmas: Turma[];
  professores: Professor[];
  quadras: Quadra[];
  planos: PlanoAula[];
  onDataChange: () => void;
}

const AulasTab: React.FC<AulasTabProps> = ({ aluno, allAlunos, turmas, professores, quadras, planos, onDataChange }) => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  const currentPlan = useMemo(() => planos.find(p => p.id === aluno.plan_id), [planos, aluno.plan_id]);
  const isUnlimited = useMemo(() => currentPlan?.num_aulas === null, [currentPlan]);

  const getSlotsForTurma = useCallback((turma: Turma) => {
    const slots = [];
    try {
      const startTime = parse(turma.start_time, 'HH:mm', new Date());
      const endTime = parse(turma.end_time, 'HH:mm', new Date());
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || endTime <= startTime) return [];
      let currentTime = startTime;
      while (currentTime < endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, 60);
      }
    } catch (e) { console.error("Error parsing time for turma:", turma.name, e); }
    return slots;
  }, []);

  const { scheduledClasses, availableSlots } = useMemo(() => {
    const now = new Date();
    const scheduled = (aluno.aulas_agendadas || [])
      .map(aula => {
        const turma = turmas.find(t => t.id === aula.turma_id);
        if (!turma) return null;

        const datePart = parseDateStringAsLocal(aula.date);
        const [startHour, startMinute] = aula.time.split(':').map(Number);
        const classStartDateTime = new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), startHour, startMinute);
        const classEndDateTime = addMinutes(classStartDateTime, 60);

        if (!isAfter(classEndDateTime, now)) return null;
        
        const enrolledCount = allAlunos.reduce((count, currentAluno) => {
          return count + ((currentAluno.aulas_agendadas || []).some(a => a.turma_id === turma.id && a.date === aula.date && a.time === aula.time) ? 1 : 0);
        }, 0);

        return {
          id: `${turma.id}-${aula.date}-${aula.time}`,
          turma,
          date: datePart,
          time: aula.time,
          professor: professores.find(p => p.id === turma.professor_id),
          quadra: quadras.find(q => q.id === turma.quadra_id),
          isEnrolled: true,
          enrolledCount,
          capacity: turma.alunos_por_horario,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));

    const day = selectedDate;
    const dayOfWeek = getDay(day);
    const dayTurmas = turmas.filter(t => t.daysOfWeek.includes(dayOfWeek));
    const available: any[] = [];

    dayTurmas.forEach(turma => {
      const slots = getSlotsForTurma(turma);
      slots.forEach(slotTime => {
        const slotDateTime = parse(slotTime, 'HH:mm', day);
        if (isPast(slotDateTime) && !isSameDay(slotDateTime, new Date())) return;

        const isEnrolled = (aluno.aulas_agendadas || []).some(a => a.turma_id === turma.id && a.date === format(day, 'yyyy-MM-dd') && a.time === slotTime);
        if (isEnrolled) return;

        const enrolledCount = allAlunos.reduce((count, currentAluno) => {
          return count + ((currentAluno.aulas_agendadas || []).some(a => a.turma_id === turma.id && a.date === format(day, 'yyyy-MM-dd') && a.time === slotTime) ? 1 : 0);
        }, 0);

        available.push({
          id: `${turma.id}-${format(day, 'yyyyMMdd')}-${slotTime}`,
          turma, date: day, time: slotTime,
          professor: professores.find(p => p.id === turma.professor_id),
          quadra: quadras.find(q => q.id === turma.quadra_id),
          isEnrolled: false,
          enrolledCount,
          capacity: turma.alunos_por_horario,
        });
      });
    });

    available.sort((a, b) => a.time.localeCompare(b.time));
    return { scheduledClasses: scheduled, availableSlots: available };
  }, [selectedDate, turmas, aluno, professores, quadras, allAlunos, getSlotsForTurma]);

  const handleOpenModal = (classData: any) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-bold">{currentPlan?.name || 'Plano Avulso'}</h3>
          <p className="text-sm text-brand-gray-500">Seu plano de aulas atual.</p>
          <div className="mt-4 text-4xl font-bold text-brand-blue-500">
            {isUnlimited ? '∞' : (aluno.aulas_restantes ?? 0)}
            <span className="text-lg font-medium text-brand-gray-600 dark:text-brand-gray-400 ml-2">aulas restantes</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Minhas Próximas Aulas</h3>
        {scheduledClasses.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {scheduledClasses.map(aula => (
              <button key={aula.id} onClick={() => handleOpenModal(aula)} className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-colors">
                <div>
                  <p className="font-semibold">{aula.turma.name}</p>
                  <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 capitalize">{format(aula.date, "EEEE, dd/MM", { locale: ptBR })} às {aula.time}</p>
                  <p className="text-xs text-brand-gray-500">Prof. {aula.professor?.name} • {aula.quadra?.name}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-brand-blue-700 dark:text-brand-blue-300"><Users className="h-4 w-4"/><span>{aula.enrolledCount} / {aula.capacity}</span></div>
              </button>
            ))}
          </div>
        ) : <p className="text-brand-gray-500 text-sm text-center py-4">Você não tem nenhuma aula agendada.</p>}
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white mb-4">Agendar Novas Aulas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><DatePickerCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} /></div>
          <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h4 className="text-lg font-semibold mb-4 capitalize">Horários em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</h4>
            {availableSlots.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {availableSlots.map(slot => (
                  <button key={slot.id} onClick={() => handleOpenModal(slot)} className="w-full text-left p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">
                    <div className="flex-1">
                      <p className="font-bold text-brand-gray-900 dark:text-white">{slot.turma.name}</p>
                      <div className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mt-2 space-y-1.5">
                        <p className="flex items-center"><Clock className="h-4 w-4 mr-2 flex-shrink-0"/>{slot.time}</p>
                        <p className="flex items-center"><GraduationCap className="h-4 w-4 mr-2 flex-shrink-0"/>Prof. {slot.professor?.name}</p>
                        <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 flex-shrink-0"/>{slot.quadra?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mt-3 sm:mt-0"><Users className="h-4 w-4"/><span>{slot.enrolledCount} / {slot.capacity}</span></div>
                  </button>
                ))}
              </div>
            ) : (<div className="text-center py-10"><Calendar className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" /><p className="text-brand-gray-500">Nenhum horário disponível para esta data.</p></div>)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedClass && (
          <ClassParticipantsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            classData={selectedClass}
            aluno={aluno}
            allAlunos={allAlunos}
            onDataChange={onDataChange}
            scheduledClasses={scheduledClasses}
            isUnlimited={isUnlimited}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AulasTab;
