import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode.react';
import { Reserva, Quadra } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, X, ShoppingBag, CreditCard, DollarSign, CheckCircle, AlertCircle, User, Info } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useTheme } from '../../context/ThemeContext';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  quadra: Quadra | null;
  arenaName?: string;
  onCancel: (reserva: Reserva) => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({ isOpen, onClose, reserva, quadra, arenaName, onCancel }) => {
  const { theme } = useTheme();

  if (!reserva || !quadra) return null;

  const qrCodeColors = {
    light: { fg: '#0f172a', bg: '#f1f5f9' },
    dark: { fg: '#f8fafc', bg: '#1e293b' },
  };
  const currentColors = theme === 'dark' ? qrCodeColors.dark : qrCodeColors.light;
  
  const handleCancelClick = () => {
    onClose();
    setTimeout(() => onCancel(reserva), 150);
  };

  const paymentStatus = useMemo(() => {
    switch (reserva.payment_status) {
      case 'pago': return { icon: CheckCircle, color: 'text-green-500', label: 'Pago' };
      case 'pendente': return { icon: AlertCircle, color: 'text-yellow-500', label: 'Pendente' };
      default: return { icon: AlertCircle, color: 'text-brand-gray-400', label: 'N/D' };
    }
  }, [reserva.payment_status]);

  const rentalItemsTotal = useMemo(() => {
    return reserva.rented_items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  }, [reserva.rented_items]);

  const reservationValue = (reserva.total_price || 0) - rentalItemsTotal;
  const amountToPay = (reserva.total_price || 0) - (reserva.credit_used || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-brand-gray-900 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white">Detalhes da Reserva</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="text-center">
                <div className="inline-block p-3 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-lg border border-brand-gray-200 dark:border-brand-gray-700">
                  <QRCode
                    value={reserva.id}
                    size={128}
                    fgColor={currentColors.fg}
                    bgColor={currentColors.bg}
                    level="L"
                  />
                </div>
                <p className="text-xs text-brand-gray-500 mt-2">Apresente este QR Code na recepção.</p>
              </div>

              <div className="space-y-3">
                <InfoItem icon={MapPin} label="Local" value={`${quadra.name} • ${arenaName}`} />
                <InfoItem icon={Calendar} label="Data" value={format(parseDateStringAsLocal(reserva.date), "EEEE, dd 'de' MMMM", { locale: ptBR })} />
                <InfoItem icon={Clock} label="Horário" value={`${reserva.start_time.slice(0, 5)} - ${reserva.end_time.slice(0, 5)}`} />
                {reserva.created_by_name && (
                    <InfoItem icon={User} label="Reservado por" value={reserva.created_by_name} />
                )}
                <InfoItem icon={Info} label="Data da Reserva" value={reserva.created_at ? format(new Date(reserva.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não disponível'} />
              </div>

              <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4 space-y-2">
                <h4 className="font-semibold text-brand-gray-800 dark:text-white mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2 text-brand-blue-500" /> Pagamento</h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-brand-gray-600 dark:text-brand-gray-400">Valor da Reserva</span>
                  <span className="font-medium">{formatCurrency(reservationValue)}</span>
                </div>
                
                {rentalItemsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray-600 dark:text-brand-gray-400">Itens Alugados</span>
                    <span className="font-medium">+ {formatCurrency(rentalItemsTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-semibold border-t border-brand-gray-200 dark:border-brand-gray-700 pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(reserva.total_price)}</span>
                </div>

                {reserva.credit_used && reserva.credit_used > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray-600 dark:text-brand-gray-400 flex items-center"><CreditCard className="h-4 w-4 mr-1.5 text-blue-500"/> Crédito utilizado</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">- {formatCurrency(reserva.credit_used)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t-2 border-brand-gray-300 dark:border-brand-gray-600 pt-2 mt-2">
                  <span>Valor a Pagar</span>
                  <span className="text-brand-blue-600 dark:text-brand-blue-300">{formatCurrency(amountToPay)}</span>
                </div>

                 <div className="flex justify-end items-center text-xs mt-1">
                    <paymentStatus.icon className={`h-3 w-3 mr-1 ${paymentStatus.color}`} />
                    <span className={`font-medium ${paymentStatus.color}`}>{paymentStatus.label}</span>
                </div>
              </div>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Fechar</Button>
              <Button onClick={handleCancelClick} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500">
                Cancelar Reserva
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start">
    <Icon className="h-5 w-5 mr-3 mt-0.5 text-brand-gray-400 flex-shrink-0" />
    <div>
      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
      <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{value || 'Não informado'}</p>
    </div>
  </div>
);

export default ReservationDetailModal;
