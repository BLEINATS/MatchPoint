import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aluno, Turma, Professor, Quadra } from '../../../types';
import { Calendar, Clock, GraduationCap, MapPin, ChevronLeft, ChevronRight, User, AlertCircle } from 'lucide-react';
import { format, addDays, startOfWeek, isPast, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../../Forms/Button';
import ConfirmationModal from '../../Shared/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { localApi } from '../../../lib/localApi';

interface AulasTabProps {
  aluno: Aluno;
  turmas: Turma[];
  professores: Professor[];
  quadras: Quadra[];
  onDataChange: () => void;
}

const AulasTab: React.FC<AulasTabProps> = ({ aluno, turmas, professores, quadras, onDataChange }) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCancelConfirm, setShowCancelConfirm] = useState<any>(null);
  const [showBookConfirm, setShowBookConfirm] = useState<any>(null);
  const { addToast } = useToast();

  const handleWeekChange = (direction: 'next' | 'prev') => {
    setCurrentWeek(current => addDays(current, direction === 'next' ? 7 : -7));
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));
  }, [currentWeek]);

  const { scheduledClasses, availableSlots } = useMemo(() => {
    const scheduled: any[] = [];
    const available: any[] = [];

    weekDays.forEach(day => {
      const dayOfWeek = day.getDay();
      const dayTurmas = turmas.filter(t => t.daysOfWeek.includes(dayOfWeek));

      dayTurmas.forEach(turma => {
        const slots = getSlotsForTurma(turma);
        slots.forEach(slotTime => {
          const slotDateTime = new Date(`${format(day, 'yyyy-MM-dd')}T${slotTime}`);
          if (isPast(slotDateTime)) return;

          const matricula = turma.matriculas.find(m => m.dayOfWeek === dayOfWeek && m.time === slotTime);
          const isEnrolled = matricula?.student_ids.includes(aluno.id);
          const isFull = (matricula?.student_ids.length || 0) >= turma.alunos_por_horario;
          const professor = professores.find(p => p.id === turma.professor_id);
          const quadra = quadras.find(q => q.id === turma.quadra_id);
          
          const classInfo = {
            id: `${turma.id}-${format(day, 'yyyyMMdd')}-${slotTime}`,
            turma,
            date: day,
            time: slotTime,
            professor,
            quadra,
            isEnrolled,
            isFull,
            enrolledCount: matricula?.student_ids.length || 0,
            capacity: turma.alunos_por_horario,
          };

          if (isEnrolled) {
            scheduled.push(classInfo);
          } else {
            available.push(classInfo);
          }
        });
      });
    });
    
    scheduled.sort((a,b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));

    return { scheduledClasses: scheduled, availableSlots: available };
  }, [weekDays, turmas, aluno.id, professores, quadras]);

  const getSlotsForTurma = (turma: Turma) => {
    const slots = [];
    const startTime = new Date(`1970-01-01T${turma.start_time}`);
    const endTime = new Date(`1970-01-01T${turma.end_time}`);
    let currentTime = startTime;
    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addDays(currentTime, 1); // This is a bug, should be addMinutes
    }
    // Correcting the bug
    const slotsCorrect = [];
    let currentCorrectTime = new Date(`1970-01-01T${turma.start_time}`);
    const endCorrectTime = new Date(`1970-01-01T${turma.end_time}`);
    while(currentCorrectTime < endCorrectTime) {
        slotsCorrect.push(format(currentCorrectTime, 'HH:mm'));
        currentCorrectTime = new Date(currentCorrectTime.getTime() + 60 * 60 * 1000); // Assuming 1-hour slots
    }
    return slotsCorrect;
  };

  const handleBookClass = async () => {
    if (!showBookConfirm || !aluno.plan_id) return;
    
    const { turma, date, time } = showBookConfirm;
    
    try {
        const updatedTurma = { ...turma };
        let matricula = updatedTurma.matriculas.find(m => m.dayOfWeek === date.getDay() && m.time === time);
        if (matricula) {
            matricula.student_ids.push(aluno.id);
        } else {
            updatedTurma.matriculas.push({ dayOfWeek: date.getDay(), time, student_ids: [aluno.id] });
        }
        
        const updatedAluno = { ...aluno, aulas_restantes: (aluno.aulas_restantes || 0) - 1 };

        await localApi.upsert('turmas', [updatedTurma], turma.arena_id);
        await localApi.upsert('alunos', [updatedAluno], aluno.arena_id);
        
        addToast({ message: 'Aula agendada com sucesso!', type: 'success' });
        onDataChange();
    } catch(e) {
        addToast({ message: 'Erro ao agendar aula.', type: 'error' });
    } finally {
        setShowBookConfirm(null);
    }
  };

  const handleCancelClass = async () => {
    if (!showCancelConfirm) return;
    const { turma, date, time } = showCancelConfirm;
    
    try {
        const updatedTurma = { ...turma };
        let matricula = updatedTurma.matriculas.find(m => m.dayOfWeek === date.getDay() && m.time === time);
        if (matricula) {
            matricula.student_ids = matricula.student_ids.filter(id => id !== aluno.id);
        }
        
        const updatedAluno = { ...aluno, aulas_restantes: (aluno.aulas_restantes || 0) + 1 };

        await localApi.upsert('turmas', [updatedTurma], turma.arena_id);
        await localApi.upsert('alunos', [updatedAluno], aluno.arena_id);

        addToast({ message: 'Agendamento cancelado!', type: 'success' });
        onDataChange();
    } catch(e) {
        addToast({ message: 'Erro ao cancelar aula.', type: 'error' });
    } finally {
        setShowCancelConfirm(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-bold">{aluno.plan_name}</h3>
        <p className="text-sm text-brand-gray-500">Seu plano de aulas atual.</p>
        <div className="mt-4 text-4xl font-bold text-brand-blue-500">
          {aluno.aulas_restantes}
          <span className="text-lg font-medium text-brand-gray-600 dark:text-brand-gray-400 ml-2">aulas restantes</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Minhas Próximas Aulas</h3>
        {scheduledClasses.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {scheduledClasses.map(aula => (
              <div key={aula.id} className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{aula.turma.name}</p>
                  <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{format(aula.date, "EEEE, dd/MM", { locale: ptBR })} às {aula.time}</p>
                  <p className="text-xs text-brand-gray-500">Prof. {aula.professor?.name} • {aula.quadra?.name}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowCancelConfirm(aula)}>Cancelar</Button>
              </div>
            ))}
          </div>
        ) : <p className="text-brand-gray-500 text-sm">Você não tem nenhuma aula agendada para esta semana.</p>}
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Agendar Novas Aulas</h3>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => handleWeekChange('prev')}><ChevronLeft className="h-5 w-5" /></Button>
            <span className="text-sm font-medium w-28 text-center">{format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM')}</span>
            <Button variant="ghost" size="sm" onClick={() => handleWeekChange('next')}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day.toString()} className={`p-2 rounded-lg ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
              <p className="text-center font-bold text-sm mb-2">{format(day, 'EEE', { locale: ptBR })}</p>
              <p className="text-center text-xs text-brand-gray-500 mb-3">{format(day, 'dd/MM')}</p>
              <div className="space-y-2">
                {availableSlots.filter(slot => isSameDay(slot.date, day)).map(slot => (
                  <button 
                    key={slot.id} 
                    onClick={() => setShowBookConfirm(slot)}
                    disabled={aluno.aulas_restantes <= 0 || slot.isFull}
                    className="w-full p-2 rounded-md text-left text-xs bg-brand-gray-100 dark:bg-brand-gray-700 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={aluno.aulas_restantes <= 0 ? 'Você não tem créditos de aula' : slot.isFull ? 'Turma lotada' : ''}
                  >
                    <p className="font-semibold flex items-center"><Clock className="h-3 w-3 mr-1"/>{slot.time}</p>
                    <p className="truncate"><GraduationCap className="h-3 w-3 mr-1 inline"/>{slot.professor?.name}</p>
                    <p className="truncate"><MapPin className="h-3 w-3 mr-1 inline"/>{slot.quadra?.name}</p>
                    <p className="text-right font-medium">{slot.enrolledCount}/{slot.capacity}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!showBookConfirm}
        onClose={() => setShowBookConfirm(null)}
        onConfirm={handleBookClass}
        title="Confirmar Agendamento"
        message={<p>Deseja usar 1 crédito de aula para agendar esta aula? Você ficará com <strong>{(aluno.aulas_restantes || 0) - 1}</strong> aula(s) restante(s).</p>}
        confirmText="Sim, Agendar"
        icon={<Calendar className="h-10 w-10 text-brand-blue-500" />}
      />

      <ConfirmationModal
        isOpen={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        onConfirm={handleCancelClass}
        title="Cancelar Agendamento"
        message={<p>Tem certeza que deseja cancelar sua presença nesta aula? Seu crédito será devolvido.</p>}
        confirmText="Sim, Cancelar"
        icon={<AlertCircle className="h-10 w-10 text-red-500" />}
      />
    </div>
  );
};

export default AulasTab;
