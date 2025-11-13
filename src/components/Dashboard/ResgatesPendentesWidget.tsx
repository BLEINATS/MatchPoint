import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gift, User, Search } from 'lucide-react';
import { RedeemedVoucher, Aluno, Product } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { cn } from '../../lib/utils';
import ConfirmVoucherModal from './ConfirmVoucherModal';
import { isPast } from 'date-fns';

interface ResgatesPendentesWidgetProps {
  vouchers: RedeemedVoucher[];
  alunos: Aluno[];
  products: Product[];
  onConfirmRedemption: (voucher: RedeemedVoucher) => void;
  className?: string;
}

const ResgatesPendentesWidget: React.FC<ResgatesPendentesWidgetProps> = ({ vouchers, alunos, products, onConfirmRedemption, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<RedeemedVoucher | null>(null);

  const getItemName = (voucher: RedeemedVoucher) => {
    if (voucher.product_id) {
      const product = products.find(p => p.id === voucher.product_id);
      return product?.name || voucher.reward_title;
    }
    return voucher.item_description || voucher.reward_title;
  };

  const obscureCode = (code: string) => {
    if (!code || code.length <= 4) {
        return '****';
    }
    return `${code.substring(0, 2)}****${code.substring(code.length - 2)}`;
  }

  const pendingVouchers = useMemo(() => {
    const pending = vouchers.filter(v => v.status === 'pendente');
    if (!searchTerm.trim()) {
      return pending;
    }
    return pending.filter(v => v.code && v.code.toUpperCase().startsWith(searchTerm.trim().toUpperCase()));
  }, [vouchers, searchTerm]);

  const handleOpenConfirmModal = (voucher: RedeemedVoucher) => {
    setSelectedVoucher(voucher);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedVoucher(null);
  };

  const handleConfirm = (voucher: RedeemedVoucher) => {
    onConfirmRedemption(voucher);
    handleCloseConfirmModal();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-full", className)}
      >
        <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex-shrink-0 flex items-center">
          <Gift className="h-5 w-5 mr-2 text-brand-blue-500" />
          Resgates Pendentes
        </h3>
        <div className="mb-4">
          <Input
            placeholder="Buscar por código do voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4 text-brand-gray-400" />}
          />
        </div>
        <div className="space-y-4 flex-grow overflow-y-auto pr-2 min-h-0">
          {pendingVouchers.length > 0 ? (
            pendingVouchers.map(voucher => {
              const aluno = alunos.find(a => a.id === voucher.aluno_id);
              const isExpired = voucher.expires_at && isPast(new Date(voucher.expires_at));
              return (
                <div key={voucher.id} className="p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{getItemName(voucher)}</p>
                      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 flex items-center mt-1">
                        <User className="h-3 w-3 mr-1" />
                        {aluno?.name || 'Cliente desconhecido'}
                      </p>
                       <p className="text-xs font-mono tracking-wider text-brand-gray-500 dark:text-brand-gray-400 mt-1">
                        CÓD: {obscureCode(voucher.code)}
                      </p>
                    </div>
                    {isExpired ? (
                      <span className="text-xs font-bold text-red-500">Expirado</span>
                    ) : (
                      <Button size="sm" onClick={() => handleOpenConfirmModal(voucher)}>Confirmar</Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Gift className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
              <p className="text-sm text-brand-gray-500">Nenhum resgate pendente.</p>
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmVoucherModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirm}
        voucher={selectedVoucher}
        getItemName={getItemName}
      />
    </>
  );
};

export default ResgatesPendentesWidget;
