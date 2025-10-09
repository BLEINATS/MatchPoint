import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Torneio, Quadra, Match, Participant } from '../../types';
import { BarChart3 } from 'lucide-react';
import Input from '../Forms/Input';

interface BracketTabProps {
  torneio: Torneio;
  setTorneio: React.Dispatch<React.SetStateAction<Torneio | null>>;
  quadras: Quadra[];
}

const BracketTab: React.FC<BracketTabProps> = ({ torneio, setTorneio, quadras }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(torneio.categories[0]?.id || null);
  const [editingSlot, setEditingSlot] = useState<{ matchId: string; participantIndex: 0 | 1 } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingSlot(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoryMatches = useMemo(() => {
    if (!selectedCategoryId) return [];
    return torneio.matches.filter(m => m.categoryId === selectedCategoryId);
  }, [torneio.matches, selectedCategoryId]);

  const availableForSub = useMemo(() => {
    if (!editingSlot || !selectedCategoryId) return [];
    const currentMatch = categoryMatches.find(m => m.id === editingSlot.matchId);
    if (!currentMatch) return [];
    
    const participantsInCategory = torneio.participants.filter(p => p.categoryId === selectedCategoryId);
    const participantsInMatch = currentMatch.participant_ids;

    return participantsInCategory.filter(p => !participantsInMatch.includes(p.id));
  }, [editingSlot, categoryMatches, torneio.participants, selectedCategoryId]);

  if (torneio.matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-dashed border-brand-gray-200 dark:border-brand-gray-700">
        <BarChart3 className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Chaves ainda não geradas</h3>
        <p className="text-brand-gray-500 mt-2">Vá para a aba "Inscritos" para gerar as chaves do torneio.</p>
      </div>
    );
  }
  
  const handleScoreChange = (matchId: string, participantIndex: 0 | 1, score: string) => {
    setTorneio(prev => {
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
    setTorneio(prev => {
        if (!prev) return null;
        
        let matches = [...prev.matches];
        const currentMatchIndex = matches.findIndex(m => m.id === matchId);
        if (currentMatchIndex === -1) return prev;

        matches[currentMatchIndex] = { ...matches[currentMatchIndex], winner_id: winnerId };
        
        const nextMatchId = matches[currentMatchIndex].nextMatchId;
        if (nextMatchId) {
            const nextMatchIndex = matches.findIndex(m => m.id === nextMatchId);
            if (nextMatchIndex !== -1) {
                const nextMatch = { ...matches[nextMatchIndex] };
                const participantSlot = matches[currentMatchIndex].matchNumber % 2 === 0 ? 1 : 0;
                nextMatch.participant_ids[participantSlot] = winnerId;
                matches[nextMatchIndex] = nextMatch;
            }
        }
        
        return { ...prev, matches };
    });
  };

  const handleWO = (matchId: string, absentParticipantIndex: 0 | 1) => {
    const match = categoryMatches.find(m => m.id === matchId);
    if (!match) return;
    const winnerIndex = absentParticipantIndex === 0 ? 1 : 0;
    const winnerId = match.participant_ids[winnerIndex];
    if (winnerId) {
        handleSetWinner(matchId, winnerId);
    }
  };

  const handleSubstitute = (newParticipantId: string) => {
    if (!editingSlot) return;

    setTorneio(prev => {
        if (!prev) return null;
        const newMatches = prev.matches.map(m => {
            if (m.id === editingSlot.matchId) {
                const newParticipantIds = [...m.participant_ids];
                newParticipantIds[editingSlot.participantIndex] = newParticipantId;
                return { ...m, participant_ids: newParticipantIds };
            }
            return m;
        });
        return { ...prev, matches: newMatches };
    });
    setEditingSlot(null);
  };

  const handleMatchDetailsChange = (matchId: string, field: keyof Match, value: string | null) => {
    setTorneio(prev => {
        if (!prev) return null;
        const newMatches = prev.matches.map(m => {
            if (m.id === matchId) {
                return { ...m, [field]: value };
            }
            return m;
        });
        return { ...prev, matches: newMatches };
    });
  };

  const tournamentQuadras = useMemo(() => {
    return quadras.filter(q => torneio.quadras_ids.includes(q.id));
  }, [quadras, torneio.quadras_ids]);

  const rounds = Array.from(new Set(categoryMatches.map(m => m.round))).sort((a, b) => a - b);

  const getPlayerNamesTooltip = (p: Participant | undefined) => {
    if (!p || torneio.modality === 'individual') return undefined;
    return p.players.map(player => player.name).filter(Boolean).join(', ');
  };

  const getParticipantDisplayName = (p: Participant | undefined) => {
    if (!p) return 'A definir';
    const seedText = p.ranking_points ? `(${p.ranking_points}) ` : '';
    return `${seedText}${p.name}`;
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="mb-6">
        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Ver chaves da categoria:</label>
        <select
          value={selectedCategoryId || ''}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full max-w-xs form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800"
        >
          {torneio.categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.group} - {cat.level}</option>
          ))}
        </select>
      </div>
      <div className="flex overflow-x-auto space-x-8 pb-4">
        {rounds.map(round => (
          <div key={round} className="flex flex-col space-y-8 min-w-[300px]">
            <h3 className="text-lg font-bold text-center">Rodada {round}</h3>
            {categoryMatches.filter(m => m.round === round).map(match => {
              const participant1 = torneio.participants.find(p => p.id === match.participant_ids[0]);
              const participant2 = torneio.participants.find(p => p.id === match.participant_ids[1]);
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
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => !match.winner_id && setEditingSlot({ matchId: match.id, participantIndex: index as 0 | 1 })}
                            className={`text-sm font-medium text-left w-full truncate ${!match.winner_id ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'}`}
                            title={getPlayerNamesTooltip(p)}
                            disabled={!!match.winner_id}
                          >
                            {getParticipantDisplayName(p)}
                          </button>
                          <AnimatePresence>
                            {editingSlot?.matchId === match.id && editingSlot?.participantIndex === index && (
                                <motion.div
                                    ref={dropdownRef}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 5 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute z-10 mt-1 w-full bg-white dark:bg-brand-gray-800 shadow-lg rounded-md border border-brand-gray-200 dark:border-brand-gray-700"
                                >
                                    <ul className="max-h-40 overflow-y-auto p-1">
                                        {availableForSub.map(sub => (
                                            <li key={sub.id}>
                                                <button onClick={() => handleSubstitute(sub.id)} className="w-full text-left p-2 text-sm rounded-md hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                                                    {getParticipantDisplayName(sub)}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {p && !match.winner_id && (
                            <button onClick={() => handleWO(match.id, index as 0 | 1)} className="text-xs font-bold text-red-500 hover:text-red-700 ml-2 px-1" title={`Declarar W.O. para ${p.name}`}>W.O.</button>
                        )}
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

                  <div className="mt-4 pt-4 border-t border-brand-gray-200 dark:border-brand-gray-700 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-medium text-brand-gray-500">Quadra</label>
                            <select value={match.quadra_id || ''} onChange={(e) => handleMatchDetailsChange(match.id, 'quadra_id', e.target.value)} className="w-full text-xs form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800">
                                <option value="">Selecione</option>
                                {tournamentQuadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-brand-gray-500">Data</label>
                            <Input type="date" value={match.date || ''} onChange={(e) => handleMatchDetailsChange(match.id, 'date', e.target.value)} className="w-full !text-xs !py-1.5" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-brand-gray-500">Horário</label>
                        <Input type="time" value={match.start_time || ''} onChange={(e) => handleMatchDetailsChange(match.id, 'start_time', e.target.value)} className="w-full !text-xs !py-1.5" />
                    </div>
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
