import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtletaAluguel } from '../../types';
import { Star, Shield, Calendar, X, Trophy, Briefcase } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';

interface AtletaPublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  atleta: AtletaAluguel | null;
  completedGames?: number;
  onHire?: (atleta: AtletaAluguel) => void;
}

const AtletaPublicProfileModal: React.FC<AtletaPublicProfileModalProps> = ({ isOpen, onClose, atleta, completedGames, onHire }) => {
  const stats = useMemo(() => {
    if (!atleta) return { avgRating: 0, totalRatings: 0, gamesPlayed: 0 };
    const ratings = atleta.ratings || [];
    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;
    return {
      avgRating,
      totalRatings,
      gamesPlayed: completedGames ?? atleta.partidas_jogadas ?? 0,
    };
  }, [atleta, completedGames]);

  if (!atleta) return null;

  const createdDate = new Date(atleta.created_at);
  const formattedCreatedDate = isValid(createdDate)
    ? format(createdDate, 'MMM yyyy', { locale: ptBR })
    : 'Data indisponível';

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
                <StatCard icon={Shield} label="Esportes" value={atleta.esportes?.map(e => e.sport).join(', ') || 'Nenhum'} />
                <StatCard icon={Trophy} label="Jogos Concluídos" value={stats.gamesPlayed} />
                <StatCard icon={Calendar} label="Na plataforma desde" value={formattedCreatedDate} />
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <InfoSection title="Sobre o Atleta">
                  <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{atleta.biografia || 'Nenhuma biografia fornecida.'}</p>
                </InfoSection>

                <InfoSection title="Detalhes Técnicos">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Experiência" value={`${atleta.experiencia_anos || 0} anos`} />
                        <DetailItem label="Taxa por Jogo" value={formatCurrency(atleta.taxa_hora)} />
                    </div>
                    <div className="mt-4">
                        <h5 className="text-sm font-semibold mb-2">Posições por Esporte</h5>
                        <div className="space-y-1">
                            {atleta.esportes?.map(e => (
                                <p key={e.sport} className="text-sm"><strong>{e.sport}:</strong> {e.position || 'Não especificada'}</p>
                            ))}
                        </div>
                    </div>
                </InfoSection>
                
                <InfoSection title="Avaliações de Clientes">
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-4">
                    {(atleta.ratings && atleta.ratings.length > 0) ? atleta.ratings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(rating => {
                        const ratingDate = new Date(rating.date);
                        const formattedRatingDate = isValid(ratingDate) ? format(ratingDate, 'dd/MM/yyyy') : 'Data inválida';

                        return (
                          <div key={rating.reservationId} className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{rating.clientName}</p>
                              <div className="flex items-center text-yellow-500">
                                {[...Array(5)].map((_, i) => ( <Star key={i} className={`h-4 w-4 ${i < rating.rating ? 'fill-current' : ''}`} /> ))}
                              </div>
                            </div>
                            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mt-1 italic">"{rating.comment || 'Nenhum comentário.'}"</p>
                            {Array.isArray(rating.tags) && rating.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {rating.tags.map(tag => ( <span key={tag} className="px-2 py-1 text-xs rounded-full bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-700 dark:text-brand-gray-300">{tag}</span> ))}
                              </div>
                            )}
                            <p className="text-xs text-brand-gray-400 dark:text-brand-gray-500 text-right mt-2">{formattedRatingDate}</p>
                          </div>
                        )
                    }) : (
                      <p className="text-center text-sm text-brand-gray-500 py-8">Este atleta ainda não recebeu nenhuma avaliação.</p>
                    )}
                  </div>
                </InfoSection>
              </div>
            </div>
            <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Fechar</Button>
              {onHire && <Button onClick={() => onHire(atleta)}>Contratar</Button>}
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
        <p className="text-lg font-bold text-brand-gray-900 dark:text-white truncate">{value}</p>
    </div>
);

const InfoSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-brand-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
    </div>
);

export default AtletaPublicProfileModal;
