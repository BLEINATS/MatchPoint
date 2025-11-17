import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Aluno, Turma } from '../../../types';
import { X, Calendar, Clock, GraduationCap, MapPin, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { format, isSameDay, differenceInHours, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../../Forms/Button';
import ConfirmationModal from '../../Shared/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { supabaseApi } from '../../../lib/localApi';
import { useAuth } from '../../../context/AuthContext';
import { parseDateStringAsLocal } from '../../../utils/dateUtils';

interface ClassParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: any;
  aluno: Aluno;
  allAlunos: Aluno[];
  onDataChange: () => void;
  scheduledClasses: any[];
  isUnlimited: boolean;
}

const ClassParticipantsModal: React.FC<ClassParticipantsModalProps> = ({ isOpen, onClose, classData, aluno, allAlunos, onDataChange, scheduledClasses, isUnlimited }) => {
  const { addToast } = useToast();
  const { selectedArenaContext: arena } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showBookConfirm, setShowBookConfirm] = useState(false);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);

  const { turma, date, time, professor, quadra, isEnrolled, enrolledCount, capacity } = classData;

  const participants = useMemo(() => {
    return allAlunos.filter(a =>
      (a.aulas_agendadas || []).some(ag =>
        ag.turma_id === turma.id && ag.date === format(date, 'yyyy-MM-dd') && ag.time === time
      )
    );
  }, [allAlunos, turma, date, time]);

  const cancellationPolicyHours = useMemo(() => {
    return arena?.class_cancellation_deadline_value ?? 2;
  }, [arena]);

  const canCancel = useMemo(() => {
    try {
        const classDateTime = parseDateStringAsLocal(`${format(date, 'yyyy-MM-dd')}T${time}`);
        if (isNaN(classDateTime.getTime())) return false;
        
        const hoursUntilClass = differenceInHours(classDateTime, new Date());
        return hoursUntilClass > cancellationPolicyHours;
    } catch {
        return false;
    }
  }, [date, time, cancellationPolicyHours]);

  const bookedClassOnDay = useMemo(() => {
    return scheduledClasses.find(c => isSameDay(c.date, date));
  }, [scheduledClasses, date]);

  const canBook = (isUnlimited || (aluno.aulas_restantes !== null && aluno.aulas_restantes > 0)) && enrolledCount < capacity && !bookedClassOnDay;
  const canSwap = !!bookedClassOnDay && enrolledCount < capacity && !isEnrolled;
  const oldClassForSwap = bookedClassOnDay;

  const handleBookClass = async () => {
    if (!arena) return;
    try {
      const { data: allTurmas } = await supabaseApi.select<Turma>('turmas', arena.id);
      const turmaToUpdate = allTurmas.find(t => t.id === turma.id);
      if (!turmaToUpdate) throw new Error("Turma não encontrada para matrícula.");

      const dayOfWeek = getDay(date);
      const matriculas = turmaToUpdate.matriculas || [];
      const matriculaIndex = matriculas.findIndex(m => m.dayOfWeek === dayOfWeek && m.time === time);
      
      if (matriculaIndex > -1) {
        const studentIds = new Set(matriculas[matriculaIndex].student_ids);
        studentIds.add(aluno.id);
        matriculas[matriculaIndex].student_ids = Array.from(studentIds);
      } else {
        matriculas.push({ dayOfWeek, time, student_ids: [aluno.id] });
      }

      const updatedTurma = { ...turmaToUpdate, matriculas };
      await supabaseApi.upsert('turmas', [updatedTurma], arena.id);

      const newBooking = { turma_id: turma.id, date: format(date, 'yyyy-MM-dd'), time };
      const updatedAulasAgendadas = [...(aluno.aulas_agendadas || []), newBooking];
      let updatedAluno = { ...aluno, aulas_agendadas: updatedAulasAgendadas };
      if (!isUnlimited) {
        updatedAluno.aulas_restantes = Math.max(0, (aluno.aulas_restantes || 0) - 1);
      }
      await supabaseApi.upsert('alunos', [updatedAluno], aluno.arena_id);
      
      addToast({ message: 'Aula agendada com sucesso!', type: 'success' });
      onDataChange();
    } catch (e: any) {
      addToast({ message: `Erro ao agendar aula: ${e.message}`, type: 'error' });
    } finally {
      setShowBookConfirm(false);
      onClose();
    }
  };

  const handleCancelClass = async () => {
    if (!arena) return;
    const dateString = format(date, 'yyyy-MM-dd');
    try {
      const { data: allTurmas } = await supabaseApi.select<Turma>('turmas', arena.id);
      const turmaToUpdate = allTurmas.find(t => t.id === turma.id);
      if (turmaToUpdate) {
        const dayOfWeek = getDay(date);
        const updatedMatriculas = (turmaToUpdate.matriculas || []).map(m => {
          if (m.dayOfWeek === dayOfWeek && m.time === time) {
            return { ...m, student_ids: m.student_ids.filter(id => id !== aluno.id) };
          }
          return m;
        });
        const updatedTurma = { ...turmaToUpdate, matriculas: updatedMatriculas };
        await supabaseApi.upsert('turmas', [updatedTurma], arena.id);
      }

      const updatedAulasAgendadas = (aluno.aulas_agendadas || []).filter(a => !(a.turma_id === turma.id && a.date === dateString && a.time === time));
      let updatedAluno = { ...aluno, aulas_agendadas: updatedAulasAgendadas };
      if (!isUnlimited && aluno.aulas_restantes !== null) {
        updatedAluno.aulas_restantes = (aluno.aulas_restantes || 0) + 1;
      }
      await supabaseApi.upsert('alunos', [updatedAluno], aluno.arena_id);
      
      addToast({ message: 'Agendamento cancelado!', type: 'success' });
      onDataChange();
    } catch (e: any) {
      addToast({ message: `Erro ao cancelar aula: ${e.message}`, type: 'error' });
    } finally {
      setShowCancelConfirm(false);
      onClose();
    }
  };

  const handleSwapClass = async () => {
    if (!oldClassForSwap || !arena) return;
    try {
      const { data: allTurmas } = await supabaseApi.select<Turma>('turmas', arena.id);
      const turmasToUpdate: Turma[] = [];

      const oldTurmaToUpdate = allTurmas.find(t => t.id === oldClassForSwap.turma.id);
      if (oldTurmaToUpdate) {
        const oldDayOfWeek = getDay(oldClassForSwap.date);
        const oldTime = oldClassForSwap.time;
        oldTurmaToUpdate.matriculas = (oldTurmaToUpdate.matriculas || []).map(m => {
          if (m.dayOfWeek === oldDayOfWeek && m.time === oldTime) {
            return { ...m, student_ids: m.student_ids.filter(id => id !== aluno.id) };
          }
          return m;
        });
        turmasToUpdate.push(oldTurmaToUpdate);
      }

      const newTurmaToUpdate = turmasToUpdate.find(t => t.id === turma.id) || allTurmas.find(t => t.id === turma.id);
      if (newTurmaToUpdate) {
        const newDayOfWeek = getDay(date);
        const newTime = time;
        const matriculas = newTurmaToUpdate.matriculas || [];
        const matriculaIndex = matriculas.findIndex(m => m.dayOfWeek === newDayOfWeek && m.time === newTime);

        if (matriculaIndex > -1) {
          const studentIds = new Set(matriculas[matriculaIndex].student_ids);
          studentIds.add(aluno.id);
          matriculas[matriculaIndex].student_ids = Array.from(studentIds);
        } else {
          matriculas.push({ dayOfWeek: newDayOfWeek, time: newTime, student_ids: [aluno.id] });
        }
        newTurmaToUpdate.matriculas = matriculas;
        
        if (!turmasToUpdate.some(t => t.id === newTurmaToUpdate.id)) {
          turmasToUpdate.push(newTurmaToUpdate);
        }
      }

      if (turmasToUpdate.length > 0) {
        await supabaseApi.upsert('turmas', turmasToUpdate, arena.id);
      }
      
      const oldDateString = format(oldClassForSwap.date, 'yyyy-MM-dd');
      const newDateString = format(date, 'yyyy-MM-dd');
      const newBooking = { turma_id: turma.id, date: newDateString, time };
      
      const updatedAulasAgendadas = (aluno.aulas_agendadas || [])
        .filter(a => !(a.turma_id === oldClassForSwap.turma.id && a.date === oldDateString && a.time === oldClassForSwap.time))
        .concat(newBooking);

      const updatedAluno = { ...aluno, aulas_agendadas: updatedAulasAgendadas };
      
      await supabaseApi.upsert('alunos', [updatedAluno], aluno.arena_id);
      addToast({ message: 'Troca de horário realizada com sucesso!', type: 'success' });
      onDataChange();
    } catch(e: any) {
      addToast({ message: `Erro ao trocar de horário: ${e.message}`, type: 'error' });
    } finally {
      setShowSwapConfirm(false);
      onClose();
    }
  };

  const getActionButton = () => {
    if (isEnrolled) {
      return (
        <div className="w-full">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowCancelConfirm(true)}
            disabled={!canCancel}
            title={!canCancel ? `O cancelamento só é permitido até ${cancellationPolicyHours} horas antes da aula.` : ''}
          >
            Cancelar Agendamento
          </Button>
          {!canCancel && (
            <div className="mt-2 text-xs text-center text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/50 rounded-md">
              O prazo para cancelamento expirou. A aula será considerada como realizada.
            </div>
          )}
        </div>
      );
    }
    if (canSwap) {
      return <Button className="w-full" onClick={() => setShowSwapConfirm(true)}><RefreshCw className="h-4 w-4 mr-2" />Trocar Horário</Button>;
    }
    if (canBook) {
      return <Button className="w-full" onClick={() => setShowBookConfirm(true)}>Agendar Aula</Button>;
    }
    
    if (enrolledCount >= capacity) {
      return <Button className="w-full" disabled>Turma Lotada</Button>;
    }
    if (bookedClassOnDay) {
      return <Button className="w-full" disabled>Já possui aula neste dia</Button>;
    }
    if (!isUnlimited && (aluno.aulas_restantes === null || aluno.aulas_restantes <= 0)) {
      return <Button className="w-full" disabled>Créditos Insuficientes</Button>;
    }
    
    return <Button className="w-full" disabled>Indisponível</Button>;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-md shadow-xl flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{turma.name}</h3>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{turma.sport}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-brand-gray-700 dark:text-brand-gray-300">
              <p className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-brand-gray-400"/> {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
              <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-brand-gray-400"/> {time}</p>
              <p className="flex items-center"><GraduationCap className="h-4 w-4 mr-2 text-brand-gray-400"/> Prof. {professor?.name}</p>
              <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-brand-gray-400"/> {quadra?.name}</p>
            </div>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <h4 className="font-semibold mb-4 flex items-center"><Users className="h-5 w-5 mr-2"/> Quem Vai? ({participants.length}/{capacity})</h4>
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.avatar_url || `https://avatar.vercel.sh/${p.id}.svg`} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-medium">{p.name}</span>
                </div>
              ))}
              {participants.length === 0 && <p className="text-sm text-brand-gray-500 text-center py-4">Ninguém agendou este horário ainda. Seja o primeiro!</p>}
            </div>
          </div>
          <div className="p-6 border-t border-brand-gray-200 dark:border-brand-gray-700">
            {getActionButton()}
          </div>
        </motion.div>
      </motion.div>
      
      <ConfirmationModal isOpen={showBookConfirm} onClose={() => setShowBookConfirm(false)} onConfirm={handleBookClass} title="Confirmar Agendamento" message={isUnlimited ? <p>Deseja agendar esta aula?</p> : <p>Deseja usar 1 crédito de aula para agendar? Você ficará com <strong>{(aluno.aulas_restantes || 0) - 1}</strong> aula(s) restante(s).</p>} confirmText="Sim, Agendar" icon={<Calendar className="h-10 w-10 text-brand-blue-500" />} />
      <ConfirmationModal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} onConfirm={handleCancelClass} title="Cancelar Agendamento" message={<p>Tem certeza que deseja cancelar sua presença nesta aula? {isUnlimited ? '' : 'Seu crédito será devolvido.'}</p>} confirmText="Sim, Cancelar" icon={<AlertCircle className="h-10 w-10 text-red-500" />} />
      <ConfirmationModal isOpen={showSwapConfirm} onClose={() => setShowSwapConfirm(false)} onConfirm={handleSwapClass} title="Confirmar Troca de Horário" message={<p>Deseja trocar sua aula das <strong>{oldClassForSwap?.time}</strong> pela aula das <strong>{time}</strong> no mesmo dia?</p>} confirmText="Sim, Trocar" icon={<RefreshCw className="h-10 w-10 text-brand-blue-500" />} />
    </>
  );
};

export default ClassParticipantsModal;
