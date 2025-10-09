import React, { useMemo, useState } from 'react';
import { Torneio, Participant } from '../../types';
import { Trophy, Medal } from 'lucide-react';
import Button from '../Forms/Button';
import ThirdPlaceModal from './ThirdPlaceModal';

interface ResultsTabProps {
  torneio: Torneio;
  setTorneio: React.Dispatch<React.SetStateAction<Torneio | null>>;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ torneio, setTorneio }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ categoryId: string; semifinalLosers: Participant[] } | null>(null);

  const resultsByCategory = useMemo(() => {
    return torneio.categories.map(category => {
      const categoryMatches = torneio.matches.filter(m => m.categoryId === category.id);
      if (categoryMatches.length === 0) {
        return { category, first: null, second: null, third: null, semifinalLosers: [] };
      }

      const maxRound = Math.max(...categoryMatches.map(m => m.round));
      const finalMatch = categoryMatches.find(m => m.round === maxRound);

      let first: Participant | null = null;
      let second: Participant | null = null;
      let third: Participant | null = null;
      let semifinalLosers: Participant[] = [];

      if (finalMatch && finalMatch.winner_id) {
        first = torneio.participants.find(p => p.id === finalMatch.winner_id) || null;
        const loserId = finalMatch.participant_ids.find(id => id !== finalMatch.winner_id);
        second = torneio.participants.find(p => p.id === loserId) || null;

        const semiFinalMatches = categoryMatches.filter(m => m.round === maxRound - 1);
        if (semiFinalMatches.length === 2) {
          const losers = semiFinalMatches.map(sfMatch => {
            const loserId = sfMatch.participant_ids.find(id => id !== sfMatch.winner_id);
            return torneio.participants.find(p => p.id === loserId);
          }).filter((p): p is Participant => !!p);
          semifinalLosers = losers;
        }
      }
      
      if (category.third_place_winner_id) {
        third = torneio.participants.find(p => p.id === category.third_place_winner_id) || null;
      }

      return { category, first, second, third, semifinalLosers };
    });
  }, [torneio]);

  const handleOpenThirdPlaceModal = (categoryId: string, semifinalLosers: Participant[]) => {
    setModalData({ categoryId, semifinalLosers });
    setIsModalOpen(true);
  };

  const handleConfirmThirdPlace = (winnerId: string) => {
    if (!modalData) return;
    setTorneio(prev => {
      if (!prev) return null;
      const newCategories = prev.categories.map(cat => 
        cat.id === modalData.categoryId ? { ...cat, third_place_winner_id: winnerId } : cat
      );
      return { ...prev, categories: newCategories };
    });
    setIsModalOpen(false);
    setModalData(null);
  };

  const getParticipantDisplayName = (participant: Participant | null) => {
    if (!participant) return 'A definir';
    if (torneio.modality === 'individual') return participant.players[0]?.name || participant.name;
    if (torneio.modality === 'duplas') return participant.players.map(p => p.name).filter(Boolean).join(' / ');
    return participant.name;
  };

  return (
    <div className="space-y-8">
      {resultsByCategory.map(result => (
        <div key={result.category.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">{result.category.group} - {result.category.level}</h3>
          <div className="space-y-4">
            {/* 1st Place */}
            <PodiumPlace
              place={1}
              participant={result.first}
              prize={result.category.prize_1st}
              displayName={getParticipantDisplayName(result.first)}
            />
            {/* 2nd Place */}
            <PodiumPlace
              place={2}
              participant={result.second}
              prize={result.category.prize_2nd}
              displayName={getParticipantDisplayName(result.second)}
            />
            {/* 3rd Place */}
            {result.third ? (
              <PodiumPlace
                place={3}
                participant={result.third}
                prize={result.category.prize_3rd}
                displayName={getParticipantDisplayName(result.third)}
              />
            ) : result.semifinalLosers.length === 2 ? (
              <div className="flex items-center justify-between p-4 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <Medal className="h-8 w-8 text-orange-400 mr-4" />
                  <div>
                    <p className="font-semibold">3º Lugar</p>
                    <p className="text-sm text-brand-gray-500">Defina o vencedor da disputa.</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleOpenThirdPlaceModal(result.category.id, result.semifinalLosers)}>
                  Definir 3º Lugar
                </Button>
              </div>
            ) : (
              <PodiumPlace place={3} participant={null} prize={result.category.prize_3rd} displayName="A definir" />
            )}
          </div>
        </div>
      ))}
      {modalData && (
        <ThirdPlaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmThirdPlace}
          semifinalists={modalData.semifinalLosers}
        />
      )}
    </div>
  );
};

const PodiumPlace: React.FC<{ place: number, participant: Participant | null, prize?: string, displayName: string }> = ({ place, participant, prize, displayName }) => {
  const colors = {
    1: { icon: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/50', border: 'border-yellow-200 dark:border-yellow-800' },
    2: { icon: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700/50', border: 'border-gray-200 dark:border-gray-600' },
    3: { icon: 'text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/50', border: 'border-orange-200 dark:border-orange-800' },
  };
  const { icon, bg, border } = colors[place as keyof typeof colors];

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between ${bg} ${border}`}>
      <div className="flex items-center">
        <Trophy className={`h-8 w-8 mr-4 ${icon}`} />
        <div>
          <p className="font-bold text-lg">{displayName}</p>
          <p className="text-sm text-brand-gray-500">{place}º Lugar</p>
        </div>
      </div>
      {prize && <span className="font-semibold text-green-600 dark:text-green-400">{prize}</span>}
    </div>
  );
};

export default ResultsTab;
