import React from 'react';
import { motion } from 'framer-motion';
import { Reserva, Quadra, Aluno, Arena } from '../../types';
import { Repeat, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, getDay, isAfter, isBefore, startOfDay, differenceInDays, add, formatDistanceToNow, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface MensalistasHojeWidgetProps {
  reservas: Reserva[];
  quadras: Quadra[];
  alunos: Aluno[];
  arena: Arena | null;
  onCardClick: (reserva: Reserva) => void;
}

const MensalistasHojeWidget: React.FC<MensalistasHojeWidgetProps> = ({ reservas, quadras, alunos, arena, onCardClick }) => {
  const today = startOfDay(new Date());
  const todayDayOfWeek = getDay(today);

  const mensalistasHoje = reservas
    .filter(r => {
      if (!r.isRecurring || r.masterId) return false;
      const masterDate = parseDateStringAsLocal(r.date);
      if (isAfter(masterDate, today)) return false;
      if (r.recurringEndDate && isBefore(parseDateStringAsLocal(r.recurringEndDate), today)) return false;
      return getDay(masterDate) === todayDayOfWeek;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700"
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex items-center">
        <Repeat className="h-5 w-5 mr-2 text-brand-blue-500" />
        Mensalistas de Hoje
      </h3>
      <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
        {mensalistasHoje.length > 0 ? (
          mensalistasHoje.map(reserva => {
            const quadra = quadras.find(q => q.id === reserva.quadra_id);
            const monthKey = format(today, 'yyyy-MM');
            const paymentStatus = reserva.monthly_payments?.[monthKey]?.status || 'pendente';
            
            let paymentDetails: { overdue: number; cancellationTime?: string } | null = null;
            if (paymentStatus === 'pendente' && arena?.billing_day) {
              const billingDay = arena.billing_day;
              const todayDateNumber = today.getDate();
              
              let lastDueDate: Date;
              if (todayDateNumber >= billingDay) {
                lastDueDate = new Date(today.getFullYear(), today.getMonth(), billingDay);
              } else {
                const lastMonth = subMonths(today, 1);
                lastDueDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), billingDay);
              }

              const reservationStartDate = parseDateStringAsLocal(reserva.date);

              if (isBefore(reservationStartDate, lastDueDate) && isAfter(today, lastDueDate)) {
                const daysOverdue = differenceInDays(today, lastDueDate);
                
                if (daysOverdue > 0) {
                  let cancellationTime;
                  const gracePeriodValue = arena.billing_grace_period_value || 0;
                  const gracePeriodUnit = arena.billing_grace_period_unit || 'days';
                  
                  if (gracePeriodValue > 0) {
                    const cancellationDeadline = add(lastDueDate, { [gracePeriodUnit]: gracePeriodValue });
                    if (isAfter(cancellationDeadline, today)) {
                      cancellationTime = formatDistanceToNow(cancellationDeadline, { locale: ptBR, addSuffix: true });
                    }
                  }
                  paymentDetails = { overdue: daysOverdue, cancellationTime };
                }
              }
            }

            return (
              <div key={reserva.id} onClick={() => onCardClick(reserva)} className="p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{reserva.clientName}</p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                      {quadra?.name || 'Quadra'} • {reserva.sport_type || 'Esporte'}
                    </p>
                  </div>
                  <div className={`flex items-center text-xs font-bold ${paymentStatus === 'pago' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {paymentStatus === 'pago' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {paymentStatus === 'pago' ? 'Em dia' : 'Pendente'}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-600 flex flex-col gap-1 text-xs text-brand-gray-600 dark:text-brand-gray-400">
                  <div className="flex justify-between">
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}</span>
                    {reserva.recurringEndDate ? (
                      <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />Vence em: {format(parseDateStringAsLocal(reserva.recurringEndDate), 'dd/MM/yy')}</span>
                    ) : (
                      <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />Contínuo</span>
                    )}
                  </div>
                  {paymentDetails && (
                    <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      Atrasado há {paymentDetails.overdue} dia(s).
                      {paymentDetails.cancellationTime && ` Cancelamento ${paymentDetails.cancellationTime}.`}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-center text-brand-gray-500 py-8">Nenhum mensalista joga hoje.</p>
        )}
      </div>
    </motion.div>
  );
};

export default MensalistasHojeWidget;
