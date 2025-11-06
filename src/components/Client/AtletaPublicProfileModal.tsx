import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtletaAluguel } from '../../types';
import { Star, Shield, Calendar, X, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';

interface AtletaPublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  atleta: AtletaAluguel | null;
}

const AtletaPublicProfileModal: React.FC<AtletaPublicProfileModalProps> = ({ isOpen, onClose, atleta }) => {
  const stats = useMemo(() => {
    if (!atleta) return { avgRating: 0, totalRatings: 0, gamesPlayed: 0 };
    const ratings = atleta.ratings || [];
    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;
    return {
      avgRating,
      totalRatings,
      gamesPlayed: atleta.partidas_jogadas || 0,
    };
  }, [atleta]);

  if (!atleta) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">Perfil do Atleta</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <img src={atleta.avatar_url || `https://avatar.vercel.sh/${atleta.id}.svg`} alt={atleta.name} className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-brand-gray-700 shadow-lg" />
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{atleta.name}</h1>
                    <p className="text-lg text-brand-blue-500 font-semibold mt-1">{atleta.nivel_tecnico || 'Nível não informado'}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(stats.avgRating) ? 'fill-current' : ''}`} />
                      ))}
                      <span className="ml-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">({stats.totalRatings} avaliações)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-gray-200 dark:bg-brand-gray-700">
                <StatCard icon={Shield} label="Esportes" value={atleta.esportes.map(e => e.sport).join(', ')} />
                <StatCard icon={Trophy} label="Jogos Concluídos" value={stats.gamesPlayed} />
                <StatCard icon={Calendar} label="Na plataforma desde" value={format(new Date(atleta.created_at), 'MMM yyyy', { locale: ptBR })} />
              </div>

              <div className="p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-4">Avaliações de Clientes</h3>
                <div className="space-y-6 max-h-60 overflow-y-auto pr-4">
                  {(atleta.ratings && atleta.ratings.length > 0) ? atleta.ratings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(rating => (
                    <div key={rating.reservationId} className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">{rating.clientName}</p>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < rating.rating ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mt-1 italic">"{rating.comment || 'Nenhum comentário.'}"</p>
                      {rating.tags && rating.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {rating.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs rounded-full bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-700 dark:text-brand-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-brand-gray-400 dark:text-brand-gray-500 text-right mt-2">{format(new Date(rating.date), 'dd/MM/yyyy')}</p>
                    </div>
                  )) : (
                    <p className="text-center text-sm text-brand-gray-500 py-8">Este atleta ainda não recebeu nenhuma avaliação.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
              <Button onClick={onClose}>Fechar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <div className="p-4 bg-white dark:bg-brand-gray-800 text-center">
        <Icon className="h-6 w-6 text-brand-blue-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
        <p className="text-lg font-bold text-brand-gray-900 dark:text-white">{value}</p>
    </div>
);

export default AtletaPublicProfileModal;
