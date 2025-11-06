import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aluno, Reserva } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isPast, isToday, addMonths, subMonths, isBefore, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, DollarSign, UserCheck, UserX, ChevronLeft, ChevronRight, Save, Hash, BookOpen, Edit, Trash2, XCircle, AlertTriangle, CheckCircle, CreditCard, Banknote } from 'lucide-react';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import MonthlyPaymentConfirmationModal from './MonthlyPaymentConfirmationModal';

interface MensalistaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva;
  aluno: Aluno | undefined;
  onSave: (reserva: Reserva) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getPaymentMethodIcon = (method?: 'pix' | 'cartao' | 'dinheiro' | 'local' | 'sistema' | null) => {
    switch (method) {
        case 'pix': return DollarSign;
        case 'cartao': return CreditCard;
        case 'dinheiro': return Banknote;
        default: return CheckCircle;
    }
};

const getPaymentMethodLabel = (method?: 'pix' | 'cartao' | 'dinheiro' | 'local' | 'sistema' | null) => {
    switch (method) {
        case 'pix': return 'Pago (PIX)';
        case 'cartao': return 'Pago (Cartão)';
        case 'dinheiro': return 'Pago (Dinheiro)';
        case 'local': return 'Pago (Local)';
        case 'sistema': return 'Pago (Sistema)';
        default: return 'Pago';
    }
};

const MensalistaDetailModal: React.FC<MensalistaDetailModalProps> = ({ isOpen, onClose, reserva, aluno, onSave, onEdit, onDelete }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localAttendance, setLocalAttendance] = useState(reserva.attendance || {});
  const [localMonthlyPayments, setLocalMonthlyPayments] = useState(reserva.monthly_payments || {});
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date());
      setLocalAttendance(reserva.attendance || {});
      setLocalMonthlyPayments(reserva.monthly_payments || {});
    }
  }, [isOpen, reserva.attendance, reserva.monthly_payments]);

  const recurringDayOfWeek = useMemo(() => {
    if (!reserva.date) return '';
    const masterDate = parseDateStringAsLocal(reserva.date);
    return format(masterDate, 'EEEE', { locale: ptBR });
  }, [reserva.date]);
  
  const monthlyOccurrences = useMemo(() => {
    if (!reserva.date) return [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const masterDate = startOfDay(parseDateStringAsLocal(reserva.date));
    const recurringDay = getDay(masterDate);

    const recurrenceEndDate = reserva.recurringEndDate ? startOfDay(parseDateStringAsLocal(reserva.recurringEndDate)) : null;

    return daysInMonth
      .filter(day => {
        const currentDay = startOfDay(day);
        const isCorrectDayOfWeek = getDay(currentDay) === recurringDay;
        const isAfterStartDate = !isBefore(currentDay, masterDate);
        const isBeforeEndDate = recurrenceEndDate ? !isAfter(currentDay, recurrenceEndDate) : true;
        
        return isCorrectDayOfWeek && isAfterStartDate && isBeforeEndDate;
      })
      .map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const status = localAttendance[dateString] || (isPast(day) && !isToday(day) ? 'pendente' : 'futura');
        return {
          date: day,
          status: status,
          isPayable: status !== 'cancelada',
        };
      });
  }, [currentMonth, reserva.date, reserva.recurringEndDate, localAttendance]);

  const stats = useMemo(() => {
    const presencas = monthlyOccurrences.filter(occ => occ.status === 'presente').length;
    const faltas = monthlyOccurrences.filter(occ => occ.status === 'falta').length;
    const aulasDadas = presencas + faltas;
    const totalAulasMes = monthlyOccurrences.filter(occ => occ.isPayable).length;
    const aulasRestantesMes = totalAulasMes - aulasDadas;

    return { presencas, faltas, aulasDadas, totalAulasMes, aulasRestantesMes };
  }, [monthlyOccurrences]);

  const valorMensal = useMemo(() => {
    const pricePerSession = reserva.total_price || 0;
    return pricePerSession * stats.totalAulasMes;
  }, [reserva.total_price, stats.totalAulasMes]);

  const monthKey = format(currentMonth, 'yyyy-MM');
  const paymentInfo = localMonthlyPayments[monthKey];
  const paymentStatusForMonth = paymentInfo?.status || 'pendente';
  const PaymentIcon = paymentInfo?.method ? getPaymentMethodIcon(paymentInfo.method) : CheckCircle;

  const handleAttendanceChange = (date: Date, status: 'presente' | 'falta') => {
    const dateString = format(date, 'yyyy-MM-dd');
    setLocalAttendance(prev => {
      const currentStatus = prev[dateString];
      if (currentStatus === status) {
        const newAttendance = { ...prev };
        delete newAttendance[dateString];
        return newAttendance;
      }
      return { ...prev, [dateString]: status };
    });
  };

  const handleCancelOccurrence = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setLocalAttendance(prev => ({ ...prev, [dateString]: 'cancelada' }));
  };
  
  const handleConfirmPayment = (method: 'pix' | 'cartao' | 'dinheiro') => {
    setLocalMonthlyPayments(prev => ({
        ...prev,
        [monthKey]: {
            status: 'pago',
            method: method,
            paid_at: new Date().toISOString(),
        }
    }));
    setIsPaymentConfirmOpen(false);
  };

  const handleSaveChanges = () => {
    const updatedReserva = { 
        ...reserva, 
        attendance: localAttendance,
        monthly_payments: localMonthlyPayments,
    };
    onSave(updatedReserva);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const prefixDaysCount = getDay(monthStart);
    const masterDate = parseDateStringAsLocal(reserva.date);
    const recurringDay = getDay(masterDate);
    const recurrenceEndDate = reserva.recurringEndDate ? parseDateStringAsLocal(reserva.recurringEndDate) : null;

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft/></Button>
          <h4 className="font-semibold capitalize text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h4>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight/></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-brand-gray-500 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="w-8 h-8 flex items-center justify-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: prefixDaysCount }).map((_, i) => <div key={`empty-${i}`} className="w-8 h-8" />)}
          {daysInMonth.map(day => {
            const isRecurringDay = getDay(day) === recurringDay && !isBefore(day, masterDate) && (recurrenceEndDate ? !isAfter(day, recurrenceEndDate) : true);
            let bgColor = 'bg-transparent';
            if (isRecurringDay) {
              const occurrence = monthlyOccurrences.find(o => isSameDay(o.date, day));
              if (occurrence) {
                if (occurrence.status === 'presente') bgColor = 'bg-green-500 text-white';
                else if (occurrence.status === 'falta') bgColor = 'bg-red-500 text-white';
                else if (occurrence.status === 'cancelada') bgColor = 'bg-gray-500 text-white line-through';
                else if (isPast(day) && !isToday(day)) bgColor = 'bg-yellow-400 text-yellow-900';
                else bgColor = 'bg-blue-500 text-white';
              }
            }
            return (
              <div key={day.toString()} className={`w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors ${bgColor}`}>
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-gray-800 text-white rounded-lg w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-700">
                <div>
                  <h3 className="text-xl font-bold">Detalhes do Mensalista</h3>
                  <p className="text-sm text-brand-gray-400 capitalize">
                    {aluno?.name || reserva.clientName} - Toda {recurringDayOfWeek} às {reserva.start_time.slice(0,5)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Valor Mensal" value={formatCurrency(valorMensal)} icon={DollarSign} />
                  <StatCard label="Aulas no Mês" value={`${stats.aulasDadas}/${stats.totalAulasMes}`} icon={BookOpen} />
                  <StatCard label="Aulas Restantes no Mês" value={stats.aulasRestantesMes} icon={Hash} />
                </div>

                <div className="mt-4 p-4 bg-brand-gray-900 rounded-lg flex justify-between items-center">
                  <div>
                      <p className="text-sm text-brand-gray-400">Pagamento ({format(currentMonth, 'MMMM', { locale: ptBR })})</p>
                      {paymentStatusForMonth === 'pago' && paymentInfo ? (
                          <div className="flex flex-col items-start">
                              <p className="text-lg font-bold text-green-400 flex items-center">
                                  <PaymentIcon className="h-5 w-5 mr-2" />
                                  {getPaymentMethodLabel(paymentInfo.method)}
                              </p>
                              {paymentInfo.paid_at && (
                                  <p className="text-xs text-brand-gray-500">em {format(new Date(paymentInfo.paid_at), 'dd/MM/yy')}</p>
                              )}
                          </div>
                      ) : (
                          <p className="text-lg font-bold text-red-400">Aguardando Pagamento</p>
                      )}
                  </div>
                  {paymentStatusForMonth === 'pendente' && (
                      <Button onClick={() => setIsPaymentConfirmOpen(true)} size="sm">
                          Marcar como Pago
                      </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderCalendar()}
                  <div>
                    <h4 className="font-semibold mb-4 text-center">Frequência do Mês</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {monthlyOccurrences.map(occ => {
                        const isPastDay = isPast(occ.date) && !isToday(occ.date);
                        const isFutureDay = isAfter(occ.date, new Date());
                        return (
                          <div key={occ.date.toString()} className="flex items-center justify-between p-3 bg-brand-gray-700/50 rounded-md">
                            <div>
                              <p className="font-medium capitalize text-sm">{format(occ.date, "EEEE, dd/MM", { locale: ptBR })}</p>
                              <div className="flex items-baseline gap-2">
                                  <p className={`text-xs font-bold ${occ.status === 'presente' ? 'text-green-400' : occ.status === 'falta' ? 'text-red-400' : occ.status === 'cancelada' ? 'text-gray-400' : 'text-brand-gray-400'}`}>
                                    {occ.status === 'presente' ? 'Presença' : occ.status === 'falta' ? 'Falta' : occ.status === 'cancelada' ? 'Cancelada' : isPastDay ? 'Pendente' : 'Próxima'}
                                  </p>
                                  {occ.isPayable && (
                                      <span className="text-xs font-semibold text-green-400/80">
                                          ({formatCurrency(reserva.total_price || 0)})
                                      </span>
                                  )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(isPastDay || isToday(occ.date)) && occ.status !== 'cancelada' && (
                                <>
                                  <Button size="sm" variant={occ.status === 'presente' ? 'primary' : 'ghost'} onClick={() => handleAttendanceChange(occ.date, 'presente')} className={occ.status === 'presente' ? 'bg-green-500 hover:bg-green-600' : ''}><UserCheck className="h-4 w-4" /></Button>
                                  <Button size="sm" variant={occ.status === 'falta' ? 'danger' : 'ghost'} onClick={() => handleAttendanceChange(occ.date, 'falta')} className={occ.status === 'falta' ? 'bg-red-500 hover:bg-red-600' : ''}><UserX className="h-4 w-4" /></Button>
                                </>
                              )}
                              {isFutureDay && occ.status !== 'cancelada' && (
                                 <Button size="sm" variant="ghost" onClick={() => handleCancelOccurrence(occ.date)} className="text-red-400 hover:bg-red-500/20" title="Cancelar esta aula"><XCircle className="h-4 w-4" /></Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 mt-auto border-t border-brand-gray-700 flex justify-between items-center">
                <div>
                  <Button variant="danger" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2"/> Excluir Plano</Button>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>Fechar</Button>
                  <Button onClick={onEdit}><Edit className="h-4 w-4 mr-2"/> Editar Plano</Button>
                  <Button onClick={handleSaveChanges}><Save className="h-4 w-4 mr-2"/> Salvar Frequência</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <MonthlyPaymentConfirmationModal
        isOpen={isPaymentConfirmOpen}
        onClose={() => setIsPaymentConfirmOpen(false)}
        onConfirm={handleConfirmPayment}
        clientName={aluno?.name || reserva.clientName}
        month={format(currentMonth, 'MMMM', { locale: ptBR })}
        amount={valorMensal}
      />
    </>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType, color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' }> = ({ label, value, icon: Icon, color = 'blue' }) => {
    const colors = {
        blue: { text: 'text-brand-blue-400', bg: 'bg-brand-blue-500/20' },
        green: { text: 'text-green-400', bg: 'bg-green-500/20' },
        yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        red: { text: 'text-red-400', bg: 'bg-red-500/20' },
        purple: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
    };
    const selectedColor = colors[color];
    return (
        <div className="p-4 bg-brand-gray-900 rounded-lg flex items-center gap-4">
            <div className={`p-3 ${selectedColor.bg} rounded-lg`}>
                <Icon className={`h-6 w-6 ${selectedColor.text}`} />
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-brand-gray-400">{label}</p>
            </div>
        </div>
    );
};

export default MensalistaDetailModal;
