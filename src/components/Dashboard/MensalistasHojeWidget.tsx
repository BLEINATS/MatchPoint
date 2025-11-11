import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Reserva, Quadra, Aluno, Arena, Professor, Turma } from '../../types';
import { Repeat, CheckCircle, AlertTriangle, GraduationCap } from 'lucide-react';
import { getDay, format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { cn } from '../../lib/utils';

interface MensalistasHojeWidgetProps {
  reservas: Reserva[];
  quadras: Quadra[];
  alunos: Aluno[];
  professores: Professor[];
  turmas: Turma[];
  arena: Arena | null;
  onCardClick: (reserva: Reserva) => void;
  className?: string;
}

const MensalistasHojeWidget: React.FC<MensalistasHojeWidgetProps> = ({ reservas, quadras, alunos, professores, turmas, arena, onCardClick, className }) => {
  const today = new Date();
  const todayDayOfWeek = getDay(today);

  const mensalistasHoje = useMemo(() => {
    return reservas
      .filter(r => {
        if (!r.isRecurring || r.masterId || r.type === 'aula') return false;
        const masterDate = parseDateStringAsLocal(r.date);
        return getDay(masterDate) === todayDayOfWeek;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, todayDayOfWeek]);
  
  const aulasHoje = useMemo(() => {
    return turmas
      .filter(turma => turma.schedule?.some(s => s.day === todayDayOfWeek))
      .flatMap(turma => {
        const schedule = turma.schedule!.find(s => s.day === todayDayOfWeek)!;
        return { turma, schedule };
      })
      .sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time));
  }, [turmas, todayDayOfWeek]);

  const getPaymentLabel = (status: 'pago' | 'pendente') => {
    return status === 'pago' ? 'Pago' : 'Pendente';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-[28rem]", className)}
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex-shrink-0">
        <Repeat className="h-5 w-5 mr-2 text-brand-blue-500 inline-block" />
        Mensalistas e Aulas de Hoje
      </h3>
      <div className="space-y-4 flex-grow overflow-y-auto px-2 pb-2 -mx-2 min-h-0">
        {mensalistasHoje.length === 0 && aulasHoje.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Repeat className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
            <p className="text-sm text-brand-gray-500">Nenhum mensalista ou aula para hoje.</p>
          </div>
        ) : (
          <>
            {mensalistasHoje.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-brand-gray-600 dark:text-brand-gray-400 text-sm">Mensalistas</h4>
                {mensalistasHoje.map(reserva => {
                  const paymentInfo = reserva.monthly_payments?.[format(today, 'yyyy-MM')];
                  const paymentStatus = paymentInfo?.status || 'pendente';
                  
                  return (
                    <div key={reserva.id} onClick={() => onCardClick(reserva)} className="p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{reserva.clientName}</p>
                          <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                            {quadras.find(q => q.id === reserva.quadra_id)?.name || 'Quadra'} • {reserva.start_time.slice(0, 5)}
                          </p>
                        </div>
                        <div className={`flex items-center text-xs font-bold ${paymentStatus === 'pago' ? 'text-green-500' : 'text-red-500'}`}>
                          {paymentStatus === 'pago' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                          {getPaymentLabel(paymentStatus)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {aulasHoje.length > 0 && (
              <div className={`space-y-3 ${mensalistasHoje.length > 0 ? 'mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700' : ''}`}>
                <h4 className="font-semibold text-brand-gray-600 dark:text-brand-gray-400 text-sm">Aulas</h4>
                {aulasHoje.map(({ turma, schedule }) => {
                  const professor = professores.find(p => p.id === turma.professor_id);
                  const quadra = quadras.find(q => q.id === turma.quadra_id);
                  return (
                    <div key={turma.id} className="p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50">
                       <div className="flex justify-between items-start">
                         <div>
                            <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{turma.name}</p>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                              {quadra?.name || 'Quadra'} • Prof. {professor?.name || 'A definir'}
                            </p>
                         </div>
                       </div>
                       <div className="mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-600 flex items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
                         {schedule.start_time} - {schedule.end_time}
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MensalistasHojeWidget;
