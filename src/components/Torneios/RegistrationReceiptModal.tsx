import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, MapPin, User } from 'lucide-react';
import { Torneio, Participant, Arena } from '../../types';
import Button from '../Forms/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode.react';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';

interface RegistrationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  torneio: Torneio | null;
  arena: Arena | null;
  participant: Participant | null;
}

const RegistrationReceiptModal: React.FC<RegistrationReceiptModalProps> = ({ isOpen, onClose, torneio, arena, participant }) => {
  const { theme } = useTheme();

  if (!isOpen || !torneio || !participant || !arena) {
    return null;
  }

  const qrCodeColors = {
    light: { fg: '#0f172a', bg: '#ffffff' },
    dark: { fg: '#f8fafc', bg: '#1e293b' },
  };
  const currentColors = theme === 'dark' ? qrCodeColors.dark : qrCodeColors.light;

  const category = torneio.categories.find(c => c.id === participant.categoryId);
  const registrationFee = category?.registration_fee || torneio.registration_fee || 0;
  const paidPlayersCount = participant.players.filter(p => p.payment_status === 'pago').length;
  const totalPaid = paidPlayersCount * registrationFee;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[90]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-brand-gray-800 rounded-lg w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div id="receipt-content" className="p-6 space-y-6 overflow-y-auto">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white">Inscrição Confirmada</h3>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                Comprovante de inscrição para o torneio.
              </p>
            </div>
            
            <div className="text-center border-y border-brand-gray-200 dark:border-brand-gray-700 py-4">
              <h4 className="text-xl font-semibold">{torneio.name}</h4>
              <p className="text-brand-gray-500 flex items-center justify-center gap-2 mt-1">
                <MapPin className="h-4 w-4" /> {arena.name}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Nome da Dupla/Equipe" value={participant.name} />
              <InfoItem label="Categoria" value={`${category?.group} - ${category?.level}`} />
              <InfoItem label="Data da Inscrição" value={format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })} />
              <InfoItem label="ID da Inscrição" value={participant.id.split('_')[1].substring(0, 8)} />
            </div>

            <div>
              <h5 className="font-semibold mb-2 text-brand-gray-800 dark:text-brand-gray-300">Jogadores</h5>
              <div className="space-y-2">
                {participant.players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-md">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-brand-gray-500" />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${player.payment_status === 'pago' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                      {player.payment_status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-brand-gray-100 dark:bg-brand-gray-700 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-gray-600 dark:text-brand-gray-300">Valor por Jogador:</span>
                <span className="font-medium">{formatCurrency(registrationFee)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-gray-600 dark:text-brand-gray-300">Jogadores Pagos:</span>
                <span className="font-medium">{paidPlayersCount} / {participant.players.length}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t border-brand-gray-200 dark:border-brand-gray-600 pt-2 mt-2">
                <span className="text-brand-gray-800 dark:text-white">Valor Total Pago (Equipe):</span>
                <span className="text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm font-semibold mb-2">Seu QR Code para Check-in</p>
              <div className="p-2 bg-white inline-block rounded-lg shadow-md">
                <QRCode
                  value={participant.id}
                  size={128}
                  fgColor={currentColors.fg}
                  bgColor={currentColors.bg}
                  level="M"
                />
              </div>
              <p className="text-xs text-brand-gray-500 mt-2">Apresente este código no dia do evento.</p>
            </div>
          </div>
          <div className="p-4 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between gap-3 print-hidden">
            <Button variant="outline" onClick={handlePrint}>Imprimir</Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const InfoItem: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
    <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{value}</p>
  </div>
);

export default RegistrationReceiptModal;
