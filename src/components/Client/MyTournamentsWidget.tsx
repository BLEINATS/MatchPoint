import React from 'react';
import { motion } from 'framer-motion';
import { Torneio, Profile } from '../../types';
import { Trophy, ArrowRight } from 'lucide-react';
import Button from '../Forms/Button';
import { useNavigate } from 'react-router-dom';

interface MyTournamentsWidgetProps {
  tournaments: Torneio[];
  profile: Profile;
}

const MyTournamentsWidget: React.FC<MyTournamentsWidgetProps> = ({ tournaments, profile }) => {
  const navigate = useNavigate();

  const myRegistrations = React.useMemo(() => {
    const registrations: { torneio: Torneio; participant: Torneio['participants'][0] }[] = [];
    tournaments.forEach(torneio => {
      torneio.participants.forEach(participant => {
        if (participant.players.some(player => player.profile_id === profile.id)) {
          registrations.push({ torneio, participant });
        }
      });
    });
    return registrations;
  }, [tournaments, profile]);

  if (myRegistrations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700"
    >
      <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-purple-500" />
        Meus Torneios Inscritos
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {myRegistrations.map(({ torneio, participant }) => {
          const category = torneio.categories.find(c => c.id === participant.categoryId);
          return (
            <div key={participant.id} className="p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{torneio.name}</p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                  {category ? `${category.group} - ${category.level}` : 'Categoria'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate(`/torneios/publico/${torneio.id}`)}>
                Ver Detalhes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MyTournamentsWidget;
