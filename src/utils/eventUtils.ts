// Função para embaralhar um array (Fisher-Yates shuffle)
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

/**
 * Gera uma chave de eliminação simples para um dado número de participantes.
 * Leva em consideração o ranking para posicionar os "cabeças de chave".
 * @param participants A lista de participantes (ou duplas/equipes).
 * @param categoryId O ID da categoria para associar as partidas.
 * @returns Um array de partidas (Match[]).
 */
export const generateBracket = (participants: import('../types').Participant[], categoryId: string): import('../types').Match[] => {
  if (participants.length < 2) return [];

  const needsSeeding = participants.some(p => p.ranking_points && p.ranking_points > 0);
  let orderedParticipants: import('../types').Participant[];

  if (needsSeeding) {
    // Ordena por ranking (maior para menor), e depois aleatoriamente para quem tem o mesmo ranking
    orderedParticipants = [...participants].sort((a, b) => {
      const rankDiff = (b.ranking_points || 0) - (a.ranking_points || 0);
      if (rankDiff !== 0) return rankDiff;
      return Math.random() - 0.5;
    });
  } else {
    orderedParticipants = shuffle([...participants]);
  }

  const numParticipants = orderedParticipants.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
  const numByes = bracketSize - numParticipants;

  const matches: import('../types').Match[] = [];
  let matchCounter = 0;
  
  const firstRoundParticipants: (import('../types').Participant)[] = [];
  const secondRoundParticipants: (import('../types').Participant | import('../types').Match)[] = [];

  // Os 'numByes' melhores ranqueados recebem a folga (BYE)
  for (let i = 0; i < numByes; i++) {
    secondRoundParticipants.push(orderedParticipants[i]);
  }
  
  // O restante dos participantes joga a primeira rodada
  for (let i = numByes; i < numParticipants; i++) {
    firstRoundParticipants.push(orderedParticipants[i]);
  }
  
  // Cria as partidas da primeira rodada
  for (let i = 0; i < firstRoundParticipants.length / 2; i++) {
    const participant1 = firstRoundParticipants[i * 2];
    const participant2 = firstRoundParticipants[i * 2 + 1];
    const match: import('../types').Match = {
      id: `match_${categoryId}_${matchCounter++}`,
      round: 1,
      matchNumber: i,
      participant_ids: [participant1.id, participant2.id],
      score: [null, null],
      winner_id: null,
      nextMatchId: null,
      categoryId: categoryId,
    };
    matches.push(match);
    secondRoundParticipants.push(match);
  }

  // Gera as rodadas subsequentes
  let previousRoundSources = shuffle(secondRoundParticipants); // Embaralha os vencedores da R1 + BYEs
  let round = 2;
  while (previousRoundSources.length > 1) {
    const currentRoundMatches: import('../types').Match[] = [];
    for (let i = 0; i < previousRoundSources.length / 2; i++) {
      const match: import('../types').Match = {
        id: `match_${categoryId}_${matchCounter++}`,
        round: round,
        matchNumber: i,
        participant_ids: [null, null],
        score: [null, null],
        winner_id: null,
        nextMatchId: null,
        categoryId: categoryId,
      };

      const source1 = previousRoundSources[i * 2];
      const source2 = previousRoundSources[i * 2 + 1];

      if (source1 && 'name' in source1) { // É um Participant (veio de um BYE)
        match.participant_ids[0] = source1.id;
      } else if (source1) { // É uma Match
        (source1 as import('../types').Match).nextMatchId = match.id;
      }

      if (source2 && 'name' in source2) { // É um Participant
        match.participant_ids[1] = source2.id;
      } else if (source2) { // É uma Match
        (source2 as import('../types').Match).nextMatchId = match.id;
      }
      
      currentRoundMatches.push(match);
    }
    matches.push(...currentRoundMatches);
    previousRoundSources = currentRoundMatches as any;
    round++;
  }

  return matches;
};
