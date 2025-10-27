import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Aluno } from '../../../types';
import { X, Calendar, Clock, GraduationCap, MapPin, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../../Forms/Button';
import ConfirmationModal from '../../Shared/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { localApi } from '../../../lib/localApi';

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

  const bookedClassOnDay = useMemo(() => {
    return scheduledClasses.find(c => isSameDay(c.date, date));
  }, [scheduledClasses, date]);

  const canBook = (isUnlimited || (aluno.aulas_restantes !== null && aluno.aulas_restantes > 0)) && enrolledCount < capacity && !bookedClassOnDay;
  const canSwap = !!bookedClassOnDay && enrolledCount < capacity && !isEnrolled;
  const oldClassForSwap = bookedClassOnDay;

  const handleBookClass = async () => {
    try {
      const newBooking = { turma_id: turma.id, date: format(date, 'yyyy-MM-dd'), time };
      const updatedAulasAgendadas = [...(aluno.aulas_agendadas || []), newBooking];
      let updatedAluno = { ...aluno, aulas_agendadas: updatedAulasAgendadas };
      if (!isUnlimited) {
        updatedAluno.aulas_restantes = Math.max(0, (aluno.aulas_restantes || 0) - 1);
      }
      await localApi.upsert('alunos', [updatedAluno], aluno.arena_id);
      addToast({ message: 'Aula agendada com sucesso!', type: 'success' });
      onDataChange();
    } catch (e) {
      addToast({ message: 'Erro ao agendar aula.', type: 'error' });
    } finally {
      setShowBookConfirm(false);
      onClose();
    }
  };

  const handleSwapClass = async () => {
    if (!oldClassForSwap) return;
    try {
      const oldDateString = format(oldClassForSwap.date, 'yyyy-MM-dd');
      const newDateString = format(date, 'yyyy-MM-dd');
      const newBooking = { turma_id: turma.id, date: newDateString, time };
      
      const updatedAulasAgendadas = (aluno.aulas_agendadas || [])
        .filter(a => !(a.turma_id === oldClassForSwap.turma.id && a.date === oldDateString && a.time === oldClassForSwap.time))
        .concat(newBooking);

      const updatedAluno = { ...aluno, aulas_agendadas: updatedAulasAgendadas };
      
      await localApi.upsert('alunos', [updatedAluno], aluno.arena_id);
      addToast({ message: 'Troca de horário realizada com sucesso!', type: 'success' });
      onDataChange();
    } catch(e) {
      addToast({ message: 'Erro ao trocar de horário.', type: 'error' });
    } finally {
      setShowSwapConfirm(false);
      onClose();
    }
  };

  const handleCancelClass = async () => {
    const dateString = format(date, 'yyyy-MM-dd');
    try {
      const updatedAulasAgendadas = (aluno.aulas_agendadas || []).filter(a => !(a.turma_id === turma.id && a.date === dateString && a.time === time));
      let updatedAluno = { ...aluno, aulas_agendadas: updatedAulasAgendadas };
      if (!isUnlimited && aluno.aulas_restantes !== null) {
        updatedAluno.aulas_restantes = (aluno.aulas_restantes || 0) + 1;
      }
      await localApi.upsert('alunos', [updatedAluno], aluno.arena_id);
      addToast({ message: 'Agendamento cancelado!', type: 'success' });
      onDataChange();
    } catch (e) {
      addToast({ message: 'Erro ao cancelar aula.', type: 'error' });
    } finally {
      setShowCancelConfirm(false);
      onClose();
    }
  };

  const getActionButton = () => {
    if (isEnrolled) {
      return <Button variant="outline" className="w-full" onClick={() => setShowCancelConfirm(true)}>Cancelar Agendamento</Button>;
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
