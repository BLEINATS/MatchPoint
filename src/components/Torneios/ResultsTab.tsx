import React, { useMemo, useState } from 'react';
import { Torneio, Participant } from '../../types';
import { Trophy, XCircle } from 'lucide-react';
import Button from '../Forms/Button';
import WinnerSelectionModal from './WinnerSelectionModal';

interface ResultsTabProps {
  torneio: Torneio;
  setTorneio: React.Dispatch<React.SetStateAction<Torneio | null>>;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ torneio, setTorneio }) => {
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ categoryId: string; position: 1 | 2 | 3; participants: Participant[] } | null>(null);

  const resultsByCategory = useMemo(() => {
    return torneio.categories.map(category => {
      const categoryParticipants = torneio.participants.filter(p => p.categoryId === category.id);
      const categoryMatches = torneio.matches.filter(m => m.categoryId === category.id);
      
      let first: Participant | null = null;
      let second: Participant | null = null;
      let third: Participant | null = null;

      // Check for manual overrides first
      if (category.first_place_winner_id) {
        first = torneio.participants.find(p => p.id === category.first_place_winner_id) || null;
      }
      if (category.second_place_winner_id) {
        second = torneio.participants.find(p => p.id === category.second_place_winner_id) || null;
      }
      if (category.third_place_winner_id) {
        third = torneio.participants.find(p => p.id === category.third_place_winner_id) || null;
      }

      // If no manual override, determine from bracket
      if (categoryMatches.length > 0) {
        const maxRound = Math.max(...categoryMatches.map(m => m.round));
        const finalMatch = categoryMatches.find(m => m.round === maxRound);

        if (finalMatch && finalMatch.winner_id) {
          if (!first) {
            first = torneio.participants.find(p => p.id === finalMatch.winner_id) || null;
          }
          if (!second) {
            const loserId = finalMatch.participant_ids.find(id => id !== finalMatch.winner_id);
            second = torneio.participants.find(p => p.id === loserId) || null;
          }
        }
      }

      return { category, first, second, third, participants: categoryParticipants };
    });
  }, [torneio]);

  const handleOpenWinnerModal = (categoryId: string, position: 1 | 2 | 3, participants: Participant[]) => {
    setModalData({ categoryId, position, participants });
    setIsWinnerModalOpen(true);
  };

  const handleConfirmWinner = (winnerId: string) => {
    if (!modalData) return;
    
    setTorneio(prev => {
      if (!prev) return null;
      const newCategories = prev.categories.map(cat => {
        if (cat.id === modalData.categoryId) {
          const field = {
            1: 'first_place_winner_id',
            2: 'second_place_winner_id',
            3: 'third_place_winner_id',
          }[modalData.position] as 'first_place_winner_id' | 'second_place_winner_id' | 'third_place_winner_id';
          return { ...cat, [field]: winnerId };
        }
        return cat;
      });
      return { ...prev, categories: newCategories };
    });

    setIsWinnerModalOpen(false);
    setModalData(null);
  };

  const handleClearWinner = (categoryId: string, position: 1 | 2 | 3) => {
    setTorneio(prev => {
      if (!prev) return null;
      const newCategories = prev.categories.map(cat => {
        if (cat.id === categoryId) {
          const field = {
            1: 'first_place_winner_id',
            2: 'second_place_winner_id',
            3: 'third_place_winner_id',
          }[position] as 'first_place_winner_id' | 'second_place_winner_id' | 'third_place_winner_id';
          return { ...cat, [field]: null };
        }
        return cat;
      });
      return { ...prev, categories: newCategories };
    });
  };

  const getParticipantDisplayName = (participant: Participant | null) => {
    if (!participant) return 'A definir';
    if (torneio.modality === 'individual') return participant.players[0]?.name || participant.name;
    if (torneio.modality === 'duplas') return participant.players.map(p => p.name).filter(Boolean).join(' / ');
    return participant.name;
  };

  return (
    <>
      <div className="space-y-8">
        {resultsByCategory.map(result => (
          <div key={result.category.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="text-xl font-semibold mb-4">{result.category.group} - {result.category.level}</h3>
            <div className="space-y-4">
              <PodiumPlace
                place={1}
                participant={result.first}
                prize={result.category.prize_1st}
                displayName={getParticipantDisplayName(result.first)}
                onDefine={() => handleOpenWinnerModal(result.category.id, 1, result.participants)}
                onClear={() => handleClearWinner(result.category.id, 1)}
              />
              <PodiumPlace
                place={2}
                participant={result.second}
                prize={result.category.prize_2nd}
                displayName={getParticipantDisplayName(result.second)}
                onDefine={() => handleOpenWinnerModal(result.category.id, 2, result.participants)}
                onClear={() => handleClearWinner(result.category.id, 2)}
              />
              <PodiumPlace
                place={3}
                participant={result.third}
                prize={result.category.prize_3rd}
                displayName={getParticipantDisplayName(result.third)}
                onDefine={() => handleOpenWinnerModal(result.category.id, 3, result.participants)}
                onClear={() => handleClearWinner(result.category.id, 3)}
              />
            </div>
          </div>
        ))}
      </div>
      {modalData && (
        <WinnerSelectionModal
          isOpen={isWinnerModalOpen}
          onClose={() => setIsWinnerModalOpen(false)}
          onConfirm={handleConfirmWinner}
          participants={modalData.participants}
          position={modalData.position}
        />
      )}
    </>
  );
};

const PodiumPlace: React.FC<{ place: number, participant: Participant | null, prize?: string, displayName: string, onDefine: () => void, onClear: () => void }> = ({ place, participant, prize, displayName, onDefine, onClear }) => {
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
      <div className="flex items-center gap-2">
        {prize && <span className="font-semibold text-green-600 dark:text-green-400">{prize}</span>}
        {participant && (
          <Button variant="ghost" size="icon" onClick={onClear} title="Limpar Vencedor" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" onClick={onDefine}>
          {participant ? 'Editar' : 'Definir'}
        </Button>
      </div>
    </div>
  );
};

export default ResultsTab;
