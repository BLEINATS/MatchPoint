import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aluno, Reserva } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isPast, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, DollarSign, Check, XCircle, UserCheck, UserX, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface MensalistaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva;
  aluno: Aluno | undefined;
  onSave: (reserva: Reserva) => void;
}

const MensalistaDetailModal: React.FC<MensalistaDetailModalProps> = ({ isOpen, onClose, reserva, aluno, onSave }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localAttendance, setLocalAttendance] = useState(reserva.attendance || {});

  useEffect(() => {
    setLocalAttendance(reserva.attendance || {});
  }, [reserva.attendance]);

  const monthlyOccurrences = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const masterDate = new Date(reserva.date);
    const recurringDay = getDay(masterDate);

    return daysInMonth
      .filter(day => getDay(day) === recurringDay)
      .map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        return {
          date: day,
          status: localAttendance[dateString] || (isPast(day) ? 'pendente' : 'futura'),
        };
      });
  }, [currentMonth, reserva.date, localAttendance]);

  const stats = useMemo(() => {
    const presencas = Object.values(localAttendance).filter(s => s === 'presente').length;
    const faltas = Object.values(localAttendance).filter(s => s === 'falta').length;
    const aulasDadas = presencas + faltas;
    const totalAulasMes = monthlyOccurrences.length;
    return { presencas, faltas, aulasDadas, totalAulasMes };
  }, [localAttendance, monthlyOccurrences]);

  const handleAttendanceChange = (date: Date, status: 'presente' | 'falta') => {
    const dateString = format(date, 'yyyy-MM-dd');
    setLocalAttendance(prev => ({ ...prev, [dateString]: status }));
  };

  const handleSaveChanges = () => {
    const updatedReserva = { ...reserva, attendance: localAttendance };
    onSave(updatedReserva);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const prefixDaysCount = getDay(monthStart);

    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft/></Button>
          <h4 className="font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h4>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight/></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-brand-gray-500">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: prefixDaysCount }).map((_, i) => <div key={`empty-${i}`} />)}
          {daysInMonth.map(day => {
            const occurrence = monthlyOccurrences.find(o => isSameDay(o.date, day));
            const isSelected = !!occurrence;
            const isPastDay = isPast(day) && !isToday(day);
            let bgColor = 'bg-transparent';
            if (isSelected) {
              if (occurrence.status === 'presente') bgColor = 'bg-green-500 text-white';
              else if (occurrence.status === 'falta') bgColor = 'bg-red-500 text-white';
              else if (isPastDay) bgColor = 'bg-yellow-400 text-yellow-900';
              else bgColor = 'bg-blue-500 text-white';
            }
            return (
              <div key={day.toString()} className={`aspect-square flex items-center justify-center text-sm rounded-full ${bgColor}`}>
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <div>
                <h3 className="text-xl font-bold">Detalhes do Mensalista</h3>
                <p className="text-sm text-brand-gray-500">{aluno?.name || reserva.clientName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <StatCard label="Valor Mensal" value={formatCurrency(aluno?.monthly_fee)} icon={DollarSign} />
                <StatCard label="Aulas no Mês" value={`${stats.aulasDadas}/${stats.totalAulasMes}`} icon={Calendar} />
                <StatCard label="Aulas Restantes" value={aluno?.aulas_restantes ?? '∞'} icon={Calendar} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderCalendar()}
                <div>
                  <h4 className="font-semibold mb-2">Frequência do Mês</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {monthlyOccurrences.map(occ => (
                      <div key={occ.date.toString()} className="flex items-center justify-between p-2 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-md">
                        <div>
                          <p className="font-medium capitalize text-sm">{format(occ.date, "EEEE, dd/MM", { locale: ptBR })}</p>
                          <p className={`text-xs font-bold ${occ.status === 'presente' ? 'text-green-500' : occ.status === 'falta' ? 'text-red-500' : 'text-brand-gray-500'}`}>
                            {occ.status === 'presente' ? 'Presença' : occ.status === 'falta' ? 'Falta' : isPast(occ.date) ? 'Pendente' : 'Próxima'}
                          </p>
                        </div>
                        {isPast(occ.date) && (
                          <div className="flex gap-1">
                            <Button size="sm" variant={occ.status === 'presente' ? 'primary' : 'ghost'} onClick={() => handleAttendanceChange(occ.date, 'presente')}><UserCheck className="h-4 w-4" /></Button>
                            <Button size="sm" variant={occ.status === 'falta' ? 'danger' : 'ghost'} onClick={() => handleAttendanceChange(occ.date, 'falta')}><UserX className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Fechar</Button>
              <Button onClick={handleSaveChanges}><Save className="h-4 w-4 mr-2"/> Salvar Frequência</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="p-4 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-lg">
    <Icon className="h-6 w-6 text-brand-blue-500 mx-auto mb-2" />
    <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
  </div>
);

export default MensalistaDetailModal;
