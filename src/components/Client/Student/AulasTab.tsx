import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aluno, Turma, Professor, Quadra, PlanoAula } from '../../../types';
import { Calendar, Clock, GraduationCap, MapPin, Users, RefreshCw, AlertTriangle, Info, CheckCircle, Star } from 'lucide-react';
import { format, isAfter, isSameDay, parse, getDay, isPast, addMinutes, startOfDay, addMonths, addYears, isBefore, sub, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePickerCalendar from '../DatePickerCalendar';
import { parseDateStringAsLocal } from '../../../utils/dateUtils';
import ClassParticipantsModal from './ClassParticipantsModal';
import RenewPlanModal from './RenewPlanModal';
import Button from '../../Forms/Button';
import ConfirmationModal from '../../Shared/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { supabaseApi } from '../../../lib/supabaseApi';
import Alert from '../../Shared/Alert';
import { useAuth } from '../../../context/AuthContext';

interface AulasTabProps {
  aluno: Aluno;
  allAlunos: Aluno[];
  turmas: Turma[];
  professores: Professor[];
  quadras: Quadra[];
  planos: PlanoAula[];
  onDataChange: () => void;
  onAvaliarProfessor: (classData: any) => void;
}

const AulasTab: React.FC<AulasTabProps> = ({ aluno, allAlunos, turmas, professores, quadras, planos, onDataChange, onAvaliarProfessor }) => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [isCancelPlanConfirmOpen, setIsCancelPlanConfirmOpen] = useState(false);
  const { addToast } = useToast();
  const { selectedArenaContext: arena } = useAuth();

  const currentPlan = useMemo(() => planos.find(p => p.id === aluno.plan_id), [planos, aluno.plan_id]);
  const isUnlimited = useMemo(() => currentPlan?.num_aulas === null, [currentPlan]);

  useEffect(() => {
    const handleCreditReset = async () => {
      if (!aluno || !aluno.plan_id || isUnlimited || !aluno.arena_id) return;

      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);
      
      const lastResetDate = aluno.last_credit_reset_date 
        ? parseDateStringAsLocal(aluno.last_credit_reset_date)
        : null;

      if (!lastResetDate || isBefore(lastResetDate, startOfCurrentMonth)) {
        const plan = planos.find(p => p.id === aluno.plan_id);
        if (plan && plan.num_aulas !== null) {
          const updatedAluno: Aluno = {
            ...aluno,
            aulas_restantes: plan.num_aulas,
            last_credit_reset_date: today.toISOString(),
          };
          
          try {
            await supabaseApi.upsert('alunos', [updatedAluno], aluno.arena_id);
            addToast({ message: 'Seus créditos de aula foram renovados para este mês!', type: 'info' });
            onDataChange();
          } catch (e) {
            addToast({ message: 'Erro ao renovar seus créditos de aula.', type: 'error' });
          }
        }
      }
    };

    handleCreditReset();
  }, [aluno, planos, isUnlimited, onDataChange, addToast]);

  const { expirationDateObject, isExpired } = useMemo(() => {
    if (!currentPlan || !aluno.join_date || currentPlan.duration_type === 'avulso') {
        return { expirationDateObject: null, isExpired: false };
    }
    const joinDate = parseDateStringAsLocal(aluno.join_date);
    let expiry: Date;
    switch (currentPlan.duration_type) {
        case 'mensal':
            expiry = addMonths(joinDate, 1);
            break;
        case 'trimestral':
            expiry = addMonths(joinDate, 3);
            break;
        case 'semestral':
            expiry = addMonths(joinDate, 6);
            break;
        case 'anual':
            expiry = addYears(joinDate, 1);
            break;
        default:
            return { expirationDateObject: null, isExpired: false };
    }
    const expired = isBefore(expiry, startOfDay(new Date()));
    return { expirationDateObject: expiry, isExpired: expired };
  }, [currentPlan, aluno.join_date]);

  const expirationDateString = expirationDateObject ? format(expirationDateObject, "dd/MM/yyyy") : null;
  
  const policyMessage = useMemo(() => {
    if (!arena) return null;

    const bookingValue = arena.class_booking_deadline_value;
    const bookingUnit = arena.class_booking_deadline_unit === 'minutes' ? 'minutos' : 'horas';
    const cancelValue = arena.class_cancellation_deadline_value;
    const cancelUnit = arena.class_cancellation_deadline_unit === 'minutes' ? 'minutos' : 'horas';

    const bookingText = bookingValue && bookingValue > 0 ? `Agendamentos devem ser feitos com no mínimo ${bookingValue} ${bookingUnit} de antecedência.` : '';
    const cancelText = cancelValue && cancelValue > 0 ? `Cancelamentos são permitidos até ${cancelValue} ${cancelUnit} antes do início da aula.` : '';

    if (!bookingText && !cancelText) return null;

    return (
      <ul className="list-disc pl-5 space-y-1">
        {bookingText && <li>{bookingText}</li>}
        {cancelText && <li>{cancelText}</li>}
      </ul>
    );
  }, [arena]);

  const { scheduledClasses, pastClasses, availableSlots } = useMemo(() => {
    const now = new Date();
    const scheduled: any[] = [];
    const past: any[] = [];
    
    (aluno.aulas_agendadas || []).forEach(aula => {
        const turma = turmas.find(t => t.id === aula.turma_id);
        if (!turma) return;

        const datePart = parseDateStringAsLocal(aula.date);
        const [startHour, startMinute] = aula.time.split(':').map(Number);
        const classStartDateTime = new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), startHour, startMinute);
        const classEndDateTime = addMinutes(classStartDateTime, 60);

        const classDetails = {
          id: `${turma.id}-${aula.date}-${aula.time}`,
          turma,
          date: datePart,
          time: aula.time,
          professor: professores.find(p => p.id === turma.professor_id),
          quadra: quadras.find(q => q.id === turma.quadra_id),
          isEnrolled: true,
          enrolledCount: allAlunos.reduce((count, currentAluno) => count + ((currentAluno.aulas_agendadas || []).some(a => a.turma_id === turma.id && a.date === aula.date && a.time === aula.time) ? 1 : 0), 0),
          capacity: turma.alunos_por_horario,
        };

        if (isAfter(classEndDateTime, now)) {
            scheduled.push(classDetails);
        } else {
            past.push(classDetails);
        }
    });

    scheduled.sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));
    past.sort((a, b) => b.date.getTime() - a.date.getTime() || b.time.localeCompare(a.time));

    const day = selectedDate;
    const dayOfWeek = getDay(day);
    const available: any[] = [];

    turmas.forEach(turma => {
        const scheduleForDay = turma.schedule?.find(s => s.day === dayOfWeek);
        if (!scheduleForDay) return;

        const startDate = parseDateStringAsLocal(turma.start_date);
        if (isBefore(day, startDate)) return;
        if (turma.end_date) {
            const endDate = parseDateStringAsLocal(turma.end_date);
            if (isAfter(day, endDate)) return;
        }

        try {
            const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
            const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
            let currentTime = startTime;

            while (currentTime < endTime) {
                const slotTime = format(currentTime, 'HH:mm');
                const slotDateTime = parse(slotTime, 'HH:mm', day);
                const isSlotPast = isPast(slotDateTime);

                let bookingDisabledByDeadline = false;
                let deadlineMessage = '';
                if (arena?.class_booking_deadline_value && arena?.class_booking_deadline_unit) {
                    const deadlineValue = arena.class_booking_deadline_value;
                    const deadlineUnit = arena.class_booking_deadline_unit;
                    const bookingDeadline = sub(slotDateTime, { [deadlineUnit]: deadlineValue });
                    if (isBefore(bookingDeadline, new Date())) {
                        bookingDisabledByDeadline = true;
                        deadlineMessage = `Agendamento encerra ${deadlineValue} ${deadlineUnit === 'hours' ? 'hora(s)' : 'minuto(s)'} antes.`;
                    }
                }

                const isEnrolled = (aluno.aulas_agendadas || []).some(a => 
                    a.turma_id === turma.id && 
                    a.date === format(day, 'yyyy-MM-dd') && 
                    a.time === slotTime
                );
                if (isEnrolled) {
                    currentTime = addMinutes(currentTime, 60);
                    continue;
                }

                const enrolledCount = allAlunos.reduce((count, currentAluno) => {
                    return count + ((currentAluno.aulas_agendadas || []).some(a => 
                        a.turma_id === turma.id && 
                        a.date === format(day, 'yyyy-MM-dd') && 
                        a.time === slotTime
                    ) ? 1 : 0);
                }, 0);

                available.push({
                    id: `${turma.id}-${format(day, 'yyyyMMdd')}-${slotTime}`,
                    turma,
                    date: day,
                    time: slotTime,
                    professor: professores.find(p => p.id === turma.professor_id),
                    quadra: quadras.find(q => q.id === turma.quadra_id),
                    isEnrolled: false,
                    enrolledCount,
                    capacity: turma.alunos_por_horario,
                    isPast: isSlotPast,
                    bookingDisabledByDeadline,
                    deadlineMessage,
                });
                
                currentTime = addMinutes(currentTime, 60);
            }
        } catch (e) {
            console.error("Error processing schedule for turma in AulasTab:", turma.name, e);
        }
    });

    available.sort((a, b) => a.time.localeCompare(b.time));
    return { scheduledClasses: scheduled, pastClasses: past, availableSlots: available };
  }, [selectedDate, turmas, aluno, professores, quadras, allAlunos, arena]);

  const handleOpenModal = (classData: any) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleCancelPlan = async () => {
    try {
        const updatedAluno = {
            ...aluno,
            plan_id: null,
            plan_name: 'Avulso',
            monthly_fee: 0,
            aulas_restantes: 0,
        };
        await supabaseApi.upsert('alunos', [updatedAluno], aluno.arena_id);
        addToast({ message: 'Seu plano foi cancelado.', type: 'success' });
        onDataChange();
    } catch (e) {
        addToast({ message: 'Erro ao cancelar o plano.', type: 'error' });
    } finally {
        setIsCancelPlanConfirmOpen(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold">{currentPlan?.name || 'Plano Avulso'}</h3>
            {currentPlan && (
                isExpired ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">Vencido</span>
                ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Ativo</span>
                )
            )}
        </div>
        <p className="text-sm text-brand-gray-500">Seu plano de aulas atual.</p>
        <div className="mt-4 text-4xl font-bold text-brand-blue-500">
          {isUnlimited ? '∞' : (aluno.aulas_restantes ?? 0)}
          <span className="text-lg font-medium text-brand-gray-600 dark:text-brand-gray-400 ml-2">aulas restantes</span>
        </div>
        {expirationDateString && (
          <p className="text-xs text-brand-gray-500 mt-1">
            {isExpired ? 'Venceu em:' : 'Renovação automática em:'} {expirationDateString}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsRenewModalOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar / Trocar Plano
          </Button>
          {currentPlan && (
            <Button variant="outline" size="sm" className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => setIsCancelPlanConfirmOpen(true)}>
                Cancelar Plano
            </Button>
          )}
        </div>
      </div>
      
      {policyMessage && (
        <Alert
          type="info"
          title="Política de Agendamento e Cancelamento de Aulas"
          message={policyMessage}
        />
      )}

      {isExpired && (
        <Alert
            type="warning"
            title="Seu plano está vencido!"
            message={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p>Para continuar agendando aulas, por favor, renove seu plano.</p>
                    <Button size="sm" onClick={() => setIsRenewModalOpen(true)} className="mt-2 sm:mt-0">
                        Renovar Agora
                    </Button>
                </div>
            }
        />
      )}

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

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Aulas Concluídas</h3>
        {pastClasses.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {pastClasses.map(aula => {
              const hasRated = aula.professor?.ratings?.some((r: any) => r.aluno_id === aluno.id);
              return (
                <div key={aula.id} className="p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <p className="font-semibold">{aula.turma.name}</p>
                    <p className="text-sm text-brand-gray-500 capitalize">{format(aula.date, "EEEE, dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {aula.professor && !hasRated && (
                      <Button size="sm" variant="outline" onClick={() => onAvaliarProfessor(aula)}>
                        <Star className="h-4 w-4 mr-1.5" /> Avaliar Professor
                      </Button>
                    )}
                    {hasRated && (
                      <span className="text-sm text-green-600 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Avaliado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-brand-gray-500 text-sm text-center py-4">Nenhuma aula concluída ainda.</p>}
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white mb-4">Agendar Novas Aulas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><DatePickerCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} /></div>
          <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h4 className="text-lg font-semibold mb-4 capitalize">Horários em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</h4>
            {availableSlots.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {availableSlots.map(slot => {
                  const isFull = slot.enrolledCount >= slot.capacity;
                  const isDisabled = slot.isPast || isFull || isExpired || slot.bookingDisabledByDeadline;
                  return (
                    <button 
                      key={slot.id} 
                      onClick={() => !isDisabled && handleOpenModal(slot)} 
                      disabled={isDisabled}
                      className={`w-full text-left p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
                          isDisabled 
                              ? 'bg-brand-gray-100 dark:bg-brand-gray-800 opacity-60 cursor-not-allowed'
                              : 'bg-brand-gray-50 dark:bg-brand-gray-700/50 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700'
                      }`}
                      title={
                        slot.bookingDisabledByDeadline ? slot.deadlineMessage :
                        isFull ? 'Turma Lotada' :
                        isExpired ? 'Seu plano está vencido' :
                        ''
                      }
                    >
                      <div className="flex-1">
                        <p className="font-bold text-brand-gray-900 dark:text-white">{slot.turma.name}</p>
                        <div className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mt-2 space-y-1.5">
                          <p className="flex items-center"><Clock className="h-4 w-4 mr-2 flex-shrink-0"/>{slot.time}</p>
                          <p className="flex items-center"><GraduationCap className="h-4 w-4 mr-2 flex-shrink-0"/>Prof. {slot.professor?.name}</p>
                          <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 flex-shrink-0"/>{slot.quadra?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mt-3 sm:mt-0">
                        {slot.isPast ? (
                          <span className="font-bold text-brand-gray-500">Encerrado</span>
                        ) : slot.bookingDisabledByDeadline ? (
                          <span className="font-bold text-yellow-500">Prazo Esgotado</span>
                        ) : isFull ? (
                          <span className="font-bold text-red-500">Lotado</span>
                        ) : isExpired ? (
                          <span className="font-bold text-yellow-500">Plano Vencido</span>
                        ) : (
                          <>
                              <Users className="h-4 w-4"/>
                              <span>{slot.enrolledCount} / {slot.capacity}</span>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
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
      <AnimatePresence>
        {isRenewModalOpen && (
            <RenewPlanModal
                isOpen={isRenewModalOpen}
                onClose={() => setIsRenewModalOpen(false)}
                aluno={aluno}
                planos={planos}
                onDataChange={onDataChange}
            />
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={isCancelPlanConfirmOpen}
        onClose={() => setIsCancelPlanConfirmOpen(false)}
        onConfirm={handleCancelPlan}
        title="Cancelar Plano?"
        message={
            <>
                <p>Você tem certeza que deseja cancelar seu plano?</p>
                <p className="mt-2 font-bold text-red-500">Todos os seus créditos de aula restantes serão perdidos.</p>
            </>
        }
        confirmText="Sim, Cancelar Plano"
        icon={<AlertTriangle className="h-10 w-10 text-red-500" />}
      />
    </div>
  );
};

export default AulasTab;
