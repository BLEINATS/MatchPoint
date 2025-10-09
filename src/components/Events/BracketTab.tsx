import React from 'react';
import { motion } from 'framer-motion';
import { Evento, Match, Participant } from '../../types';
import { BarChart3, Users } from 'lucide-react';

interface BracketTabProps {
  evento: Evento;
  setEvento: React.Dispatch<React.SetStateAction<Evento | null>>;
}

const BracketTab: React.FC<BracketTabProps> = ({ evento, setEvento }) => {
  if (evento.matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-dashed border-brand-gray-200 dark:border-brand-gray-700">
        <BarChart3 className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Chaves ainda não geradas</h3>
        <p className="text-brand-gray-500 mt-2">Vá para a aba "Inscritos" para gerar as chaves do torneio.</p>
      </div>
    );
  }
  
  const handleScoreChange = (matchId: string, participantIndex: 0 | 1, score: string) => {
    setEvento(prev => {
        if (!prev) return null;
        const newMatches = prev.matches.map(m => {
            if (m.id === matchId) {
                const newScore = [...m.score];
                newScore[participantIndex] = score === '' ? null : parseInt(score, 10);
                return { ...m, score: newScore };
            }
            return m;
        });
        return { ...prev, matches: newMatches };
    });
  };

  const handleSetWinner = (matchId: string, winnerId: string | null) => {
    setEvento(prev => {
        if (!prev) return null;
        
        let matches = [...prev.matches];
        const currentMatchIndex = matches.findIndex(m => m.id === matchId);
        if (currentMatchIndex === -1) return prev;

        // Update winner of current match
        matches[currentMatchIndex] = { ...matches[currentMatchIndex], winner_id: winnerId };
        
        const nextMatchId = matches[currentMatchIndex].nextMatchId;
        if (nextMatchId) {
            const nextMatchIndex = matches.findIndex(m => m.id === nextMatchId);
            if (nextMatchIndex !== -1) {
                const nextMatch = { ...matches[nextMatchIndex] };
                // Determine if this is the first or second participant slot to fill
                const participantSlot = matches[currentMatchIndex].matchNumber % 2 === 0 ? 1 : 0;
                nextMatch.participant_ids[participantSlot] = winnerId;
                matches[nextMatchIndex] = nextMatch;
            }
        }
        
        return { ...prev, matches };
    });
  };

  const rounds = Array.from(new Set(evento.matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex overflow-x-auto space-x-8 pb-4">
        {rounds.map(round => (
          <div key={round} className="flex flex-col space-y-8 min-w-[280px]">
            <h3 className="text-lg font-bold text-center">Rodada {round}</h3>
            {evento.matches.filter(m => m.round === round).map(match => {
              const participant1 = evento.participants.find(p => p.id === match.participant_ids[0]);
              const participant2 = evento.participants.find(p => p.id === match.participant_ids[1]);
              return (
                <motion.div 
                    key={match.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-brand-gray-50 dark:bg-brand-gray-900 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg p-4"
                >
                  <div className="space-y-2">
                    {[participant1, participant2].map((p, index) => (
                      <div key={index} className={`flex items-center justify-between p-2 rounded-md ${match.winner_id === p?.id ? 'bg-green-100 dark:bg-green-900/50' : ''}`}>
                        <span className="text-sm font-medium flex-1 truncate">{p?.name || 'A definir'}</span>
                        <input
                          type="number"
                          min="0"
                          value={match.score[index] ?? ''}
                          onChange={(e) => handleScoreChange(match.id, index as 0 | 1, e.target.value)}
                          className="w-12 text-center form-input text-sm rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
                          disabled={!p}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2 mt-3 text-xs">
                    {match.participant_ids.map((id, index) => id && (
                      <button key={id} onClick={() => handleSetWinner(match.id, id)} className={`px-2 py-1 rounded ${match.winner_id === id ? 'bg-green-500 text-white' : 'bg-brand-gray-200 dark:bg-brand-gray-700'}`}>
                        Vencedor {index + 1}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BracketTab;
