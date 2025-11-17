import React, { useState, useMemo } from 'react';
import { Professor, Turma, FinanceTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parse, differenceInMinutes, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';
import { CheckCircle, DollarSign, User, Calendar, Clock, Hash } from 'lucide-react';
import { supabaseApi } from '../../lib/supabaseApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface ProfessorPaymentsTabProps {
  professores: Professor[];
  turmas: Turma[];
  transactions: FinanceTransaction[];
  onDataChange: () => void;
}

interface PaymentItem {
  professorId: string;
  professorName: string;
  professorAvatar?: string | null;
  pixKey?: string | null;
  amountDue: number;
  month: Date;
  isPaid: boolean;
  detail: string;
  paymentType: Professor['payment_type'];
}

const ProfessorPaymentsTab: React.FC<ProfessorPaymentsTabProps> = ({ professores, turmas, transactions, onDataChange }) => {
  const { addToast } = useToast();
  const { selectedArenaContext: arena } = useAuth();
  const [paymentToConfirm, setPaymentToConfirm] = useState<PaymentItem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const previousMonth = subMonths(new Date(), 1);

  const paymentsDue = useMemo(() => {
    const monthStart = startOfMonth(previousMonth);
    const monthEnd = endOfMonth(previousMonth);
    const daysInPeriod = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return professores.map(professor => {
      const professorTurmas = turmas.filter(t => t.professor_id === professor.id);
      
      let amountDue = 0;
      let detail = '';

      switch (professor.payment_type) {
        case 'mensal':
          let taughtInMonth = false;
          professorTurmas.forEach(turma => {
            if (taughtInMonth) return;
            daysInPeriod.forEach(day => {
              if (turma.schedule?.some(s => s.day === getDay(day))) {
                taughtInMonth = true;
              }
            });
          });
          if (taughtInMonth) {
            amountDue = professor.salario_mensal || 0;
          }
          detail = 'Salário Fixo';
          break;

        case 'por_aula':
          let totalClasses = 0;
          professorTurmas.forEach(turma => {
            daysInPeriod.forEach(day => {
              const scheduleForDay = turma.schedule?.find(s => s.day === getDay(day));
              if (scheduleForDay) {
                try {
                  const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
                  const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
                  if (!isNaN(startTime.valueOf()) && !isNaN(endTime.valueOf()) && endTime > startTime) {
                    const durationMinutes = differenceInMinutes(endTime, startTime);
                    const numberOfSlots = Math.floor(durationMinutes / 60);
                    totalClasses += numberOfSlots;
                  }
                } catch(e) { console.error("Error calculating classes for payment:", e); }
              }
            });
          });
          amountDue = totalClasses * (professor.valor_por_aula || 0);
          detail = `${totalClasses} aulas no mês`;
          break;
        
        case 'por_hora':
        default:
          let totalHours = 0;
          professorTurmas.forEach(turma => {
            daysInPeriod.forEach(day => {
              const scheduleForDay = turma.schedule?.find(s => s.day === getDay(day));
              if (scheduleForDay && scheduleForDay.start_time && scheduleForDay.end_time) {
                try {
                  const startTime = parse(scheduleForDay.start_time, 'HH:mm', new Date());
                  const endTime = parse(scheduleForDay.end_time, 'HH:mm', new Date());
                  if (!isNaN(startTime.valueOf()) && !isNaN(endTime.valueOf()) && endTime > startTime) {
                    totalHours += differenceInMinutes(endTime, startTime) / 60;
                  }
                } catch (e) { console.error("Error parsing time for payment calculation:", e); }
              }
            });
          });
          amountDue = totalHours * (professor.valor_hora_aula || 0);
          detail = `${totalHours.toFixed(1).replace('.', ',')} horas no mês`;
          break;
      }

      const paymentDescription = `Pagamento Professor: ${professor.name} - Mês: ${format(previousMonth, 'MM/yyyy')}`;
      const isPaid = transactions.some(t => 
        t.description === paymentDescription &&
        isSameMonth(parseDateStringAsLocal(t.date), previousMonth)
      );

      return {
        professorId: professor.id,
        professorName: professor.name,
        professorAvatar: professor.avatar_url,
        pixKey: professor.pix_key,
        amountDue,
        month: previousMonth,
        isPaid,
        detail,
        paymentType: professor.payment_type,
      };
    });
  }, [professores, turmas, transactions, previousMonth]);

  const handleMarkAsPaid = (payment: PaymentItem) => {
    setPaymentToConfirm(payment);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentToConfirm || !arena) return;
    
    try {
      const expenseTransaction: Omit<FinanceTransaction, 'id' | 'created_at'> = {
        arena_id: arena.id,
        description: `Pagamento Professor: ${paymentToConfirm.professorName} - Mês: ${format(paymentToConfirm.month, 'MM/yyyy')}`,
        amount: paymentToConfirm.amountDue,
        type: 'despesa',
        category: 'Pagamento de Professores',
        date: new Date().toISOString().split('T')[0],
      };
      await supabaseApi.upsert('finance_transactions', [expenseTransaction], arena.id);
      
      addToast({ message: 'Pagamento registrado com sucesso!', type: 'success' });
      onDataChange();

    } catch (error: any) {
      addToast({ message: `Erro ao registrar pagamento: ${error.message}`, type: 'error' });
    } finally {
      setIsConfirmModalOpen(false);
      setPaymentToConfirm(null);
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="text-xl font-semibold mb-4">
        Pagamentos a Professores - {format(previousMonth, 'MMMM yyyy', { locale: ptBR })}
      </h3>
      <div className="space-y-4">
        {paymentsDue.length > 0 ? paymentsDue.map(payment => (
          <div key={payment.professorId} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img src={payment.professorAvatar || `https://avatar.vercel.sh/${payment.professorId}.svg`} alt={payment.professorName} className="w-12 h-12 rounded-full object-cover flex-shrink-0"/>
              <div className="min-w-0">
                <p className="font-bold text-brand-gray-900 dark:text-white truncate">{payment.professorName}</p>
                <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1.5"/>
                    Valor a Pagar: <strong className="ml-1 text-green-600 dark:text-green-400">{formatCurrency(payment.amountDue)}</strong>
                  </span>
                  <span className="flex items-center">
                    {payment.paymentType === 'por_hora' ? <Clock className="h-4 w-4 mr-1.5"/> : <Hash className="h-4 w-4 mr-1.5"/>}
                    {payment.detail}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
              {payment.isPaid ? (
                <span className="inline-flex items-center justify-center w-full px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  <CheckCircle className="h-4 w-4 mr-2"/>
                  Pago
                </span>
              ) : payment.amountDue > 0 ? (
                <Button size="sm" onClick={() => handleMarkAsPaid(payment)} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2"/> Marcar como Pago
                </Button>
              ) : (
                <span className="text-sm text-brand-gray-500">Nenhum valor a pagar</span>
              )}
            </div>
          </div>
        )) : (
          <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum professor encontrado.</p>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmPayment}
        title="Confirmar Pagamento"
        message={
          paymentToConfirm && (
            <p>
              Você confirma que realizou o pagamento de{' '}
              <strong>{formatCurrency(paymentToConfirm.amountDue)}</strong> para{' '}
              <strong>{paymentToConfirm.professorName}</strong> referente ao mês de{' '}
              <strong className="capitalize">{format(paymentToConfirm.month, 'MMMM', { locale: ptBR })}</strong>?
              Esta ação registrará uma nova despesa.
            </p>
          )
        }
        confirmText="Sim, Confirmo"
      />
    </div>
  );
};

export default ProfessorPaymentsTab;
