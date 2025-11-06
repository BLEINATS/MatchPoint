import React, { useMemo } from 'react';
import { Reserva, Quadra } from '../../types';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface AtletaAgendaTabProps {
  reservas: Reserva[];
  quadras: Quadra[];
}

const AtletaAgendaTab: React.FC<AtletaAgendaTabProps> = ({ reservas, quadras }) => {
  const { upcomingGames, pastGames } = useMemo(() => {
    const now = new Date();
    const confirmed = reservas.filter(r => r.atleta_aceite_status === 'aceito' && r.status !== 'cancelada');
    
    const upcoming = confirmed
      .filter(r => isAfter(parseDateStringAsLocal(`${r.date}T${r.end_time}`), now))
      .sort((a, b) => new Date(`${a.date}T${a.start_time}`).getTime() - new Date(`${b.date}T${b.start_time}`).getTime());

    const past = confirmed
      .filter(r => !isAfter(parseDateStringAsLocal(`${r.date}T${r.end_time}`), now))
      .sort((a, b) => new Date(`${b.date}T${b.start_time}`).getTime() - new Date(`${a.date}T${a.start_time}`).getTime());
      
    return { upcomingGames: upcoming, pastGames: past };
  }, [reservas]);

  return (
    <div className="space-y-8">
      <GameList title="Próximos Jogos" games={upcomingGames} quadras={quadras} />
      <GameList title="Histórico de Jogos" games={pastGames} quadras={quadras} isPast />
    </div>
  );
};

const GameList: React.FC<{ title: string, games: Reserva[], quadras: Quadra[], isPast?: boolean }> = ({ title, games, quadras, isPast }) => (
  <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    {games.length > 0 ? (
      <div className="space-y-4">
        {games.map(game => {
          const quadra = quadras.find(q => q.id === game.quadra_id);
          return (
            <div key={game.id} className={`p-4 rounded-lg border-l-4 ${isPast ? 'bg-brand-gray-50 dark:bg-brand-gray-800/50 border-brand-gray-400 opacity-70' : 'bg-blue-50 dark:bg-blue-900/50 border-blue-500'}`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <p className="font-bold text-brand-gray-900 dark:text-white">{quadra?.name || 'Quadra'}</p>
                <p className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200">{format(parseDateStringAsLocal(game.date), "EEEE, dd/MM/yy", { locale: ptBR })}</p>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm text-brand-gray-600 dark:text-brand-gray-300">
                <p className="flex items-center"><Clock className="h-4 w-4 mr-2" />{game.start_time.slice(0,5)} - {game.end_time.slice(0,5)}</p>
                <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" />{game.sport_type}</p>
                <p className="flex items-center"><User className="h-4 w-4 mr-2" />{game.clientName}</p>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum jogo encontrado.</p>
    )}
  </div>
);

export default AtletaAgendaTab;
