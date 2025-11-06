import React from 'react';
import { motion } from 'framer-motion';
import { Reserva, Quadra, Aluno, Arena } from '../../types';
import { Repeat, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, getDay, isAfter, isBefore, startOfDay, differenceInDays, add } from 'date-fns';
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

  const getPaymentLabel = (status: 'pago' | 'pendente', method?: string) => {
    if (status !== 'pago') return 'Aguardando Pagamento';
    switch (method) {
      case 'pix': return 'Pago (PIX)';
      case 'cartao': return 'Pago (Cartão)';
      case 'dinheiro': return 'Pago (Dinheiro)';
      default: return 'Pago';
    }
  };

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
            const paymentInfo = reserva.monthly_payments?.[monthKey];
            const paymentStatus = paymentInfo?.status || 'pendente';
            const paymentMethod = paymentInfo?.method;
            
            return (
              <div key={reserva.id} onClick={() => onCardClick(reserva)} className="p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 cursor-pointer hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{reserva.clientName}</p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                      {quadra?.name || 'Quadra'} • {reserva.sport_type || 'Esporte'}
                    </p>
                  </div>
                  <div className={`flex items-center text-xs font-bold ${paymentStatus === 'pago' ? 'text-green-500' : 'text-red-500'}`}>
                    {paymentStatus === 'pago' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {getPaymentLabel(paymentStatus, paymentMethod)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-600 flex flex-col gap-1 text-xs text-brand-gray-600 dark:text-brand-gray-400">
                  <div className="flex justify-between">
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}</span>
                  </div>
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
