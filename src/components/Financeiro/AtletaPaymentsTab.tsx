import React, { useState, useMemo } from 'react';
import { Reserva, AtletaAluguel, Professor, FinanceTransaction, Notificacao } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import Button from '../Forms/Button';
import { CheckCircle, Clock, DollarSign, User, Calendar, Banknote } from 'lucide-react';
import { localApi } from '../../lib/localApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../Shared/ConfirmationModal';

interface AtletaPaymentsTabProps {
  reservas: Reserva[];
  profissionais: (AtletaAluguel | Professor)[];
  onDataChange: () => void;
}

interface PaymentItem {
  reservaId: string;
  profissionalId: string;
  profissionalName: string;
  profissionalAvatar?: string | null;
  pixKey?: string | null;
  clientName: string;
  date: string;
  grossAmount: number;
  commissionPercentage: number;
  netAmount: number;
  status: 'pendente_repasse' | 'pago';
  paidAt?: string | null;
}

const AtletaPaymentsTab: React.FC<AtletaPaymentsTabProps> = ({ reservas, profissionais, onDataChange }) => {
  const { addToast } = useToast();
  const { selectedArenaContext: arena, profile } = useAuth();
  const [paymentToConfirm, setPaymentToConfirm] = useState<PaymentItem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { pendingPayments, completedPayments } = useMemo(() => {
    const payments: PaymentItem[] = [];
    reservas.forEach(reserva => {
      if (reserva.atleta_aluguel_id && reserva.atleta_cost && reserva.atleta_cost > 0) {
        const isGameCompleted = isPast(parseDateStringAsLocal(`${reserva.date}T${reserva.end_time}`));
        if (isGameCompleted && (reserva.atleta_payment_status === 'pendente_repasse' || reserva.atleta_payment_status === 'pago')) {
          const profissional = profissionais.find(p => p.id === reserva.atleta_aluguel_id);
          if (profissional) {
            const grossAmount = reserva.atleta_cost;
            const commissionPercentage = (profissional as AtletaAluguel).comissao_arena || 0;
            const netAmount = grossAmount * (1 - commissionPercentage / 100);

            payments.push({
              reservaId: reserva.id,
              profissionalId: profissional.id,
              profissionalName: profissional.name,
              profissionalAvatar: profissional.avatar_url,
              pixKey: profissional.pix_key,
              clientName: reserva.clientName,
              date: reserva.date,
              grossAmount,
              commissionPercentage,
              netAmount,
              status: reserva.atleta_payment_status,
              paidAt: reserva.atleta_paid_at,
            });
          }
        }
      }
    });

    return {
      pendingPayments: payments.filter(p => p.status === 'pendente_repasse').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      completedPayments: payments.filter(p => p.status === 'pago').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [reservas, profissionais]);

  const handleMarkAsPaid = (payment: PaymentItem) => {
    setPaymentToConfirm(payment);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentToConfirm || !arena || !profile) return;
    
    try {
      // 1. Update reservation status
      const reservaToUpdate = reservas.find(r => r.id === paymentToConfirm.reservaId);
      if (!reservaToUpdate) throw new Error("Reserva não encontrada");

      const updatedReserva = { ...reservaToUpdate, atleta_payment_status: 'pago' as 'pago', atleta_paid_at: new Date().toISOString() };
      await localApi.upsert('reservas', [updatedReserva], arena.id);

      // 2. Create expense transaction
      const expenseTransaction: Omit<FinanceTransaction, 'id' | 'created_at'> = {
        arena_id: arena.id,
        description: `Pagamento para ${paymentToConfirm.profissionalName} (Jogo com ${paymentToConfirm.clientName})`,
        amount: paymentToConfirm.netAmount,
        type: 'despesa',
        category: 'Pagamento de Profissionais',
        date: new Date().toISOString().split('T')[0],
      };
      await localApi.upsert('finance_transactions', [expenseTransaction], arena.id);
      
      // 3. Notify professional
      const profissional = profissionais.find(p => p.id === paymentToConfirm.profissionalId);
      if (profissional && profissional.profile_id) {
        const notification: Omit<Notificacao, 'id' | 'created_at'> = {
          arena_id: arena.id,
          profile_id: profissional.profile_id,
          message: `A arena realizou o repasse de ${formatCurrency(paymentToConfirm.netAmount)} referente ao jogo com ${paymentToConfirm.clientName}.`,
          type: 'payment_received',
          read: false,
          sender_id: profile.id,
          sender_name: profile.name,
          sender_avatar_url: profile.avatar_url,
        };
        await localApi.upsert('notificacoes', [notification], arena.id);
      }

      addToast({ message: 'Pagamento registrado e profissional notificado!', type: 'success' });
      onDataChange();

    } catch (error: any) {
      addToast({ message: `Erro ao registrar pagamento: ${error.message}`, type: 'error' });
    } finally {
      setIsConfirmModalOpen(false);
      setPaymentToConfirm(null);
    }
  };

  return (
    <div className="space-y-8">
      <PaymentList title="Pagamentos Pendentes de Repasse" payments={pendingPayments} onMarkAsPaid={handleMarkAsPaid} />
      <PaymentList title="Histórico de Pagamentos Realizados" payments={completedPayments} isHistory />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmPayment}
        title="Confirmar Repasse"
        message={
          paymentToConfirm && (
            <p>
              Você confirma que realizou o pagamento de{' '}
              <strong>{formatCurrency(paymentToConfirm.netAmount)}</strong> para{' '}
              <strong>{paymentToConfirm.profissionalName}</strong>?
            </p>
          )
        }
        confirmText="Sim, Confirmo"
      />
    </div>
  );
};

const PaymentList: React.FC<{ title: string, payments: PaymentItem[], onMarkAsPaid?: (payment: PaymentItem) => void, isHistory?: boolean }> = ({ title, payments, onMarkAsPaid, isHistory }) => (
  <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    {payments.length > 0 ? (
      <div className="space-y-4">
        {payments.map(payment => (
          <div key={payment.reservaId} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <img src={payment.profissionalAvatar || `https://avatar.vercel.sh/${payment.profissionalId}.svg`} alt={payment.profissionalName} className="w-12 h-12 rounded-full object-cover flex-shrink-0"/>
                <div className="min-w-0">
                  <p className="font-bold text-brand-gray-900 dark:text-white truncate">{payment.profissionalName}</p>
                  <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400 flex items-center gap-4">
                    <span className="flex items-center"><User className="h-3 w-3 mr-1.5"/>{payment.clientName}</span>
                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1.5"/>{format(parseDateStringAsLocal(payment.date), 'dd/MM/yy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {isHistory ? (
                   <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(payment.netAmount)}</p>
                      {payment.paidAt && <p className="text-xs text-brand-gray-500">Pago em {format(new Date(payment.paidAt), 'dd/MM/yy')}</p>}
                   </div>
                ) : (
                  onMarkAsPaid && (
                    <Button size="sm" onClick={() => onMarkAsPaid(payment)} className="w-full sm:w-auto">
                      <CheckCircle className="h-4 w-4 mr-2"/> Marcar como Pago
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-brand-gray-200 dark:border-brand-gray-600 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-brand-gray-500">Valor Bruto:</span>
                  <span className="font-medium">{formatCurrency(payment.grossAmount)}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-brand-gray-500">Comissão da Arena ({payment.commissionPercentage}%):</span>
                  <span className="font-medium text-red-500">- {formatCurrency(payment.grossAmount - payment.netAmount)}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4 font-bold">
                  <span className="text-brand-gray-600 dark:text-brand-gray-300">Líquido a Pagar:</span>
                  <span className="text-green-600 dark:text-green-400">{formatCurrency(payment.netAmount)}</span>
                </div>
              </div>
              {payment.pixKey && !isHistory && (
                <div className="text-sm text-brand-blue-500 dark:text-brand-blue-400 flex items-center mt-1 bg-blue-50 dark:bg-blue-900/50 px-3 py-1.5 rounded-md flex-shrink-0">
                  <Banknote className="h-4 w-4 mr-2"/>
                  <span className="font-mono">{payment.pixKey}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum pagamento nesta categoria.</p>
    )}
  </div>
);

export default AtletaPaymentsTab;
