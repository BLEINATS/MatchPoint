import React from 'react';
import { AtletaAluguel } from '../../types';
import { Star, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AtletaAvaliacoesTabProps {
  atleta: AtletaAluguel;
}

const AtletaAvaliacoesTab: React.FC<AtletaAvaliacoesTabProps> = ({ atleta }) => {
  const ratings = atleta.ratings || [];
  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700 text-center">
        <h3 className="text-xl font-semibold">Sua Reputação</h3>
        <div className="flex items-center justify-center gap-2 mt-4 text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-8 w-8 ${i < Math.round(avgRating) ? 'fill-current' : ''}`} />
          ))}
        </div>
        <p className="text-3xl font-bold mt-2">{avgRating.toFixed(1)}</p>
        <p className="text-sm text-brand-gray-500">Baseado em {ratings.length} avaliações</p>
      </div>

      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-xl font-semibold mb-4">Comentários Recebidos</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {ratings.length > 0 ? ratings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(rating => (
            <div key={rating.reservationId} className="p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-brand-gray-400" />
                  <div>
                    <p className="font-semibold">{rating.clientName}</p>
                    <p className="text-xs text-brand-gray-500">{format(new Date(rating.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < rating.rating ? 'fill-current' : ''}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-brand-gray-700 dark:text-brand-gray-300 mt-2 italic">"{rating.comment || 'Nenhum comentário.'}"</p>
              {rating.tags && rating.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {rating.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs rounded-full bg-brand-gray-200 dark:bg-brand-gray-600 text-brand-gray-700 dark:text-brand-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )) : (
            <p className="text-center text-sm text-brand-gray-500 py-8">Você ainda não recebeu nenhuma avaliação.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtletaAvaliacoesTab;
