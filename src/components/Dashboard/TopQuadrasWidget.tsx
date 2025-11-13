import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadra, Reserva } from '../../types';
import { BarChart, MapPin, Trophy } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';
import Button from '../Forms/Button';

interface TopQuadrasWidgetProps {
  reservas: Reserva[];
  quadras: Quadra[];
  className?: string;
}

const TopQuadrasWidget: React.FC<TopQuadrasWidgetProps> = ({ reservas, quadras, className }) => {
  const [view, setView] = useState<'quadras' | 'esportes'>('quadras');

  const topQuadras = useMemo(() => {
    const quadraStats = new Map<string, { count: number; revenue: number }>();

    reservas.forEach(r => {
      if (r.status !== 'cancelada') {
        const stats = quadraStats.get(r.quadra_id) || { count: 0, revenue: 0 };
        stats.count += 1;
        stats.revenue += r.total_price || 0;
        quadraStats.set(r.quadra_id, stats);
      }
    });

    return Array.from(quadraStats.entries())
      .map(([quadraId, stats]) => ({
        quadra: quadras.find(q => q.id === quadraId),
        ...stats,
      }))
      .filter(item => item.quadra)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [reservas, quadras]);

  const topEsportes = useMemo(() => {
    const sportStats = new Map<string, { count: number; revenue: number }>();

    reservas.forEach(r => {
      if (r.status !== 'cancelada' && r.sport_type) {
        const stats = sportStats.get(r.sport_type) || { count: 0, revenue: 0 };
        stats.count += 1;
        stats.revenue += r.total_price || 0;
        sportStats.set(r.sport_type, stats);
      }
    });

    return Array.from(sportStats.entries())
      .map(([sport, stats]) => ({
        sport,
        ...stats,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reservas]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-full", className)}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-brand-blue-500 inline-block" />
            Top 5
        </h3>
        <div className="flex items-center p-1 bg-brand-gray-100 dark:bg-brand-gray-900 rounded-lg">
            <Button size="sm" variant={view === 'quadras' ? 'secondary' : 'ghost'} onClick={() => setView('quadras')} className="!py-1 !px-2 text-xs">Quadras</Button>
            <Button size="sm" variant={view === 'esportes' ? 'secondary' : 'ghost'} onClick={() => setView('esportes')} className="!py-1 !px-2 text-xs">Esportes</Button>
        </div>
      </div>
      <div className="space-y-4 flex-grow overflow-y-auto pr-2 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {view === 'quadras' && (
              topQuadras.length > 0 ? (
                topQuadras.map(item => (
                  <div key={item.quadra!.id} className="p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{item.quadra!.name}</p>
                      <p className="font-bold text-sm text-green-600 dark:text-green-400">{formatCurrency(item.revenue)}</p>
                    </div>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{item.count} reservas</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center pt-8">
                  <MapPin className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
                  <p className="text-sm text-brand-gray-500">Nenhuma reserva para gerar ranking de quadras.</p>
                </div>
              )
            )}
            {view === 'esportes' && (
              topEsportes.length > 0 ? (
                topEsportes.map(item => (
                  <div key={item.sport} className="p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">{item.sport}</p>
                      <p className="font-bold text-sm text-brand-gray-800 dark:text-brand-gray-200">{item.count} reservas</p>
                    </div>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Receita: {formatCurrency(item.revenue)}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center pt-8">
                  <Trophy className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
                  <p className="text-sm text-brand-gray-500">Nenhuma reserva para gerar ranking de esportes.</p>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TopQuadrasWidget;
