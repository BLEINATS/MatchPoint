import React from 'react';
import { motion } from 'framer-motion';
import { Torneio, Profile, Participant } from '../../types';
import { Trophy } from 'lucide-react';
import MyTournamentCard from './MyTournamentCard';

interface MyTournamentsWidgetProps {
  tournaments: Torneio[];
  profile: Profile;
  onInvitePartner: (torneio: Torneio, participant: Participant) => void;
}

const MyTournamentsWidget: React.FC<MyTournamentsWidgetProps> = ({ tournaments, profile, onInvitePartner }) => {
  const myRegistrations = React.useMemo(() => {
    const registrations: { torneio: Torneio; participant: Torneio['participants'][0] }[] = [];
    tournaments.forEach(torneio => {
      // Only consider active tournaments
      if (torneio.status === 'planejado' || torneio.status === 'inscricoes_abertas' || torneio.status === 'em_andamento') {
        torneio.participants.forEach(participant => {
          if (participant.players.some(player => player.profile_id === profile.id)) {
            registrations.push({ torneio, participant });
          }
        });
      }
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
    >
      <h3 className="text-2xl font-bold text-brand-gray-900 dark:text-white mb-4 flex items-center">
        <Trophy className="h-6 w-6 mr-3 text-purple-500" />
        Meus Torneios
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myRegistrations.map(({ torneio, participant }, index) => (
          <MyTournamentCard
            key={participant.id}
            torneio={torneio}
            participant={participant}
            index={index}
            onInvitePartner={onInvitePartner}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default MyTournamentsWidget;
