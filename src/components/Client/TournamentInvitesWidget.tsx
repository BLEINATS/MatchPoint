import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Torneio, Profile } from '../../types';
import Button from '../Forms/Button';
import { Trophy, Check, X } from 'lucide-react';

interface TournamentInvitesWidgetProps {
  torneios: Torneio[];
  profile: Profile;
  onUpdateInvite: (torneioId: string, participantId: string, status: 'accepted' | 'declined') => void;
}

const TournamentInvitesWidget: React.FC<TournamentInvitesWidgetProps> = ({ torneios, profile, onUpdateInvite }) => {
  const pendingInvites = useMemo(() => {
    const invites: {
      torneio: Torneio;
      participant: Torneio['participants'][0];
      inviterName: string;
    }[] = [];

    if (!torneios || !profile) return invites;

    for (const torneio of torneios) {
      for (const participant of torneio.participants) {
        const myPlayerEntry = participant.players.find(p => p.profile_id === profile.id && p.status === 'pending');
        if (myPlayerEntry) {
          const inviter = participant.players.find(p => p.status === 'accepted');
          invites.push({
            torneio,
            participant,
            inviterName: inviter?.name || 'Alguém',
          });
        }
      }
    }
    return invites;
  }, [torneios, profile]);

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {pendingInvites.map(({ torneio, participant, inviterName }, index) => (
        <motion.div
          key={participant.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg border-l-4 border-indigo-500"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <Trophy className="h-6 w-6 text-indigo-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-indigo-800 dark:text-indigo-200">Convite para Torneio</h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                  <strong>{inviterName}</strong> convidou você para jogar o torneio <strong>"{torneio.name}"</strong> na equipe/dupla <strong>"{participant.name}"</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
              <Button size="sm" onClick={() => onUpdateInvite(torneio.id, participant.id, 'accepted')} className="bg-green-500 hover:bg-green-600">
                <Check className="h-4 w-4 mr-1" /> Aceitar
              </Button>
              <Button size="sm" variant="outline" onClick={() => onUpdateInvite(torneio.id, participant.id, 'declined')}>
                <X className="h-4 w-4 mr-1" /> Recusar
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TournamentInvitesWidget;
