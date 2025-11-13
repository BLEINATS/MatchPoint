import React from 'react';
import { RedeemedVoucher, Product } from '../../types';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Gift } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useTheme } from '../../context/ThemeContext';

interface VouchersTabProps {
  vouchers: RedeemedVoucher[];
  products: Product[];
}

const VouchersTab: React.FC<VouchersTabProps> = ({ vouchers = [], products = [] }) => {
  const { theme } = useTheme();
  const qrCodeColors = {
    light: { fg: '#0f172a', bg: '#ffffff' },
    dark: { fg: '#f8fafc', bg: '#1e293b' },
  };
  const currentColors = theme === 'dark' ? qrCodeColors.dark : qrCodeColors.light;

  const pendingVouchers = vouchers.filter(v => v.status === 'pendente').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const redeemedVouchers = vouchers.filter(v => v.status === 'resgatado').sort((a,b) => new Date(b.redeemed_at!).getTime() - new Date(a.redeemed_at!).getTime());

  const getItemName = (voucher: RedeemedVoucher) => {
    if (voucher.product_id) {
      const product = products.find(p => p.id === voucher.product_id);
      return product?.name || voucher.reward_title;
    }
    return voucher.item_description || voucher.reward_title;
  };

  return (
    <div className="space-y-8">
      <VoucherList title="Vouchers Pendentes de Retirada" vouchers={pendingVouchers} getItemName={getItemName} qrCodeColors={currentColors} />
      <VoucherList title="Histórico de Vouchers Resgatados" vouchers={redeemedVouchers} getItemName={getItemName} qrCodeColors={currentColors} isHistory />
    </div>
  );
};

const VoucherList: React.FC<{ title: string, vouchers: RedeemedVoucher[], getItemName: (v: RedeemedVoucher) => string, qrCodeColors: {fg: string, bg: string}, isHistory?: boolean }> = ({ title, vouchers, getItemName, qrCodeColors, isHistory }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4 flex items-center"><Gift className="h-5 w-5 mr-2 text-brand-blue-500"/>{title}</h3>
    {vouchers.length > 0 ? (
      <div className="space-y-4">
        {vouchers.map(voucher => {
          const isExpired = voucher.expires_at && isPast(new Date(voucher.expires_at));
          return (
            <div key={voucher.id} className={`p-4 rounded-lg border flex flex-col sm:flex-row items-center gap-4 ${isHistory ? 'bg-brand-gray-50 dark:bg-brand-gray-800/50 border-brand-gray-200 dark:border-brand-gray-700' : isExpired ? 'bg-red-50 dark:bg-red-900/50 border-red-500/50' : 'bg-blue-50 dark:bg-blue-900/50 border-blue-500'}`}>
              <div className="flex-1">
                <p className="font-bold text-lg text-brand-gray-900 dark:text-white">{getItemName(voucher)}</p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Solicitado em: {format(new Date(voucher.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                {voucher.expires_at && !isHistory && (
                  <p className={`text-sm font-semibold mt-1 ${isExpired ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {isExpired ? 'Expirou em:' : 'Expira em:'} {format(new Date(voucher.expires_at), 'dd/MM/yyyy')}
                  </p>
                )}
                {isHistory && voucher.redeemed_at && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">Retirado em: {format(new Date(voucher.redeemed_at), 'dd/MM/yyyy')}</p>
                )}
              </div>
              {!isHistory && (
                <div className={`text-center p-4 rounded-lg bg-white dark:bg-brand-gray-800 shadow-md ${isExpired ? 'opacity-50' : ''}`}>
                  <div className="p-1 bg-white inline-block rounded">
                    <QRCode
                      value={voucher.code}
                      size={80}
                      fgColor={qrCodeColors.fg}
                      bgColor={qrCodeColors.bg}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 uppercase">Código</p>
                    <p className="font-mono text-lg font-bold tracking-widest text-brand-gray-800 dark:text-white">
                      {voucher.code}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    ) : (
      <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum voucher nesta categoria.</p>
    )}
  </div>
);

export default VouchersTab;
