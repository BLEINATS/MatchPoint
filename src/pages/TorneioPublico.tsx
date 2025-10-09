import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { localApi } from '../lib/localApi';
import { Torneio, Quadra } from '../types';
import { Loader2, Trophy, Users, BarChart3, Info, Calendar, MapPin, DollarSign, Users2, User } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';

type TabType = 'overview' | 'participants' | 'bracket' | 'results';

const getModalityProps = (modality: Torneio['modality']) => {
    switch (modality) {
        case 'individual': return { icon: User, label: 'Individual' };
        case 'duplas': return { icon: Users, label: 'Duplas' };
        case 'equipes': return { icon: Users2, label: 'Equipes' };
        default: return { icon: Users, label: 'N/A' };
    }
};

const TorneioPublico: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const loadData = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    try {
      // Since this is a public page, it needs to search across all arenas
      const { data: allArenas } = await localApi.select<any>('arenas', 'all');
      let foundTorneio: Torneio | null = null;
      let arenaIdForTorneio: string | null = null;

      for (const arena of allArenas) {
        const { data: torneiosInArena } = await localApi.select<Torneio>('torneios', arena.id);
        const match = torneiosInArena.find(t => t.id === id);
        if (match) {
          foundTorneio = match;
          arenaIdForTorneio = arena.id;
          break;
        }
      }

      if (foundTorneio && arenaIdForTorneio) {
        setTorneio(foundTorneio);
        const { data: quadrasData } = await localApi.select<Quadra>('quadras', arenaIdForTorneio);
        setQuadras(quadrasData || []);
      } else {
        setTorneio(null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do torneio público:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPrizeMoney = useMemo(() => {
    if (!torneio) return 0;
    return torneio.categories.reduce((total, cat) => {
        const p1 = parseFloat(cat.prize_1st?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
        const p2 = parseFloat(cat.prize_2nd?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
        const p3 = parseFloat(cat.prize_3rd?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
        return total + p1 + p2 + p3;
    }, 0);
  }, [torneio]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Info },
    { id: 'participants', label: 'Inscritos', icon: Users },
    { id: 'bracket', label: 'Chaves', icon: BarChart3 },
    { id: 'results', label: 'Resultados', icon: Trophy },
  ];

  const renderContent = () => {
    if (!torneio) return null;
    switch (activeTab) {
      case 'overview': return <PublicOverviewTab torneio={torneio} />;
      case 'participants': return <PublicParticipantsTab torneio={torneio} />;
      case 'bracket': return <PublicBracketTab torneio={torneio} quadras={quadras} />;
      case 'results': return <PublicResultsTab torneio={torneio} />;
      default: return null;
    }
  };

  if (isLoading) {
    return <Layout><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500"/></div></Layout>;
  }

  if (!torneio) {
    return <Layout><div className="text-center p-8">Torneio não encontrado.</div></Layout>;
  }

  const modalityProps = getModalityProps(torneio.modality);
  const dateString = format(parseDateStringAsLocal(torneio.start_date), 'dd/MM/yyyy') + (torneio.start_date !== torneio.end_date ? ` - ${format(parseDateStringAsLocal(torneio.end_date), 'dd/MM/yyyy')}` : '');

  return (
    <Layout>
      <div className="bg-brand-gray-100 dark:bg-brand-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-extrabold text-brand-gray-900 dark:text-white text-center">{torneio.name}</h1>
            <p className="text-center text-lg text-brand-gray-600 dark:text-brand-gray-400 mt-2">{dateString}</p>
          </motion.div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <StatCard icon={modalityProps.icon} label="Modalidade" value={modalityProps.label} />
            <StatCard icon={DollarSign} label="Inscrição" value={formatCurrency(torneio.registration_fee)} />
            <StatCard icon={Trophy} label="Premiação Total" value={formatCurrency(totalPrizeMoney)} />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400'}`}>
                <tab.icon className="mr-2 h-5 w-5" />{tab.label}
              </button>
            ))}
          </nav>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md">
        <Icon className="h-8 w-8 text-brand-blue-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">{value}</h3>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
    </motion.div>
);

const PublicOverviewTab: React.FC<{ torneio: Torneio }> = ({ torneio }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Sobre o Torneio</h3>
            <p className="text-brand-gray-600 dark:text-brand-gray-300 whitespace-pre-wrap">{torneio.description || 'Nenhuma descrição fornecida.'}</p>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Premiação</h3>
            <div className="space-y-4">
                {torneio.categories.map(cat => (
                    <div key={cat.id}>
                        <p className="font-semibold">{cat.group} - {cat.level}</p>
                        <ul className="list-disc list-inside text-sm text-brand-gray-600 dark:text-brand-gray-300 space-y-1 mt-1">
                            {cat.prize_1st && <li><strong>1º Lugar:</strong> {cat.prize_1st}</li>}
                            {cat.prize_2nd && <li><strong>2º Lugar:</strong> {cat.prize_2nd}</li>}
                            {cat.prize_3rd && <li><strong>3º Lugar:</strong> {cat.prize_3rd}</li>}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const PublicParticipantsTab: React.FC<{ torneio: Torneio }> = ({ torneio }) => {
    const getParticipantDisplayName = (participant: Torneio['participants'][0]) => {
        if (torneio.modality === 'individual') return participant.players[0]?.name || participant.name;
        if (torneio.modality === 'duplas') return participant.players.map(p => p.name).filter(Boolean).join(' / ');
        return participant.name;
    };

    return (
        <div className="space-y-6">
            {torneio.categories.map(category => {
                const categoryParticipants = torneio.participants.filter(p => p.categoryId === category.id);
                return (
                    <div key={category.id} className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-bold mb-4">{category.group} - {category.level} ({categoryParticipants.length} inscritos)</h3>
                        <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                            {categoryParticipants.map(p => (
                                <li key={p.id} className="py-3 font-medium">{getParticipantDisplayName(p)}</li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};

const PublicBracketTab: React.FC<{ torneio: Torneio, quadras: Quadra[] }> = ({ torneio, quadras }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(torneio.categories[0]?.id || null);

  const categoryMatches = useMemo(() => {
    if (!selectedCategoryId) return [];
    return torneio.matches.filter(m => m.categoryId === selectedCategoryId);
  }, [torneio.matches, selectedCategoryId]);

  const rounds = Array.from(new Set(categoryMatches.map(m => m.round))).sort((a, b) => a - b);
  
  if (torneio.matches.length === 0) {
    return <div className="text-center p-8">Chaves ainda não disponíveis.</div>;
  }

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow">
      <div className="mb-6">
        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Ver chaves da categoria:</label>
        <select value={selectedCategoryId || ''} onChange={(e) => setSelectedCategoryId(e.target.value)} className="form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800">
          {torneio.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.group} - {cat.level}</option>)}
        </select>
      </div>
      <div className="flex overflow-x-auto space-x-8 pb-4">
        {rounds.map(round => (
          <div key={round} className="flex flex-col space-y-8 min-w-[280px]">
            <h3 className="text-lg font-bold text-center">Rodada {round}</h3>
            {categoryMatches.filter(m => m.round === round).map(match => {
              const p1 = torneio.participants.find(p => p.id === match.participant_ids[0]);
              const p2 = torneio.participants.find(p => p.id === match.participant_ids[1]);
              const quadra = quadras.find(q => q.id === match.quadra_id);
              return (
                <div key={match.id} className="bg-brand-gray-50 dark:bg-brand-gray-900/50 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg p-4">
                  <div className="space-y-2">
                    {[p1, p2].map((p, index) => (
                      <div key={index} className={`flex items-center justify-between p-2 rounded-md ${match.winner_id === p?.id ? 'bg-green-100 dark:bg-green-900/50 font-bold' : ''}`}>
                        <span className="text-sm flex-1 truncate">{p?.name || 'A definir'}</span>
                        <span className="w-8 text-center text-sm font-semibold">{match.score[index] ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                  { (quadra || match.date) &&
                    <div className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-3 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-700 flex items-center justify-between">
                        {quadra && <span className="flex items-center"><MapPin className="h-3 w-3 mr-1"/>{quadra.name}</span>}
                        {match.date && <span className="flex items-center"><Calendar className="h-3 w-3 mr-1"/>{format(parseDateStringAsLocal(match.date), 'dd/MM')} às {match.start_time}</span>}
                    </div>
                  }
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const PublicResultsTab: React.FC<{ torneio: Torneio }> = ({ torneio }) => {
    const resultsByCategory = useMemo(() => {
        return torneio.categories.map(category => {
          const categoryMatches = torneio.matches.filter(m => m.categoryId === category.id);
          if (categoryMatches.length === 0) return { category, first: null, second: null, third: null };
    
          const maxRound = Math.max(...categoryMatches.map(m => m.round));
          const finalMatch = categoryMatches.find(m => m.round === maxRound);
    
          let first: any = null, second: any = null, third: any = null;
    
          if (finalMatch && finalMatch.winner_id) {
            first = torneio.participants.find(p => p.id === finalMatch.winner_id) || null;
            const loserId = finalMatch.participant_ids.find(id => id !== finalMatch.winner_id);
            second = torneio.participants.find(p => p.id === loserId) || null;
          }
          
          if (category.third_place_winner_id) {
            third = torneio.participants.find(p => p.id === category.third_place_winner_id) || null;
          }
    
          return { category, first, second, third };
        });
    }, [torneio]);

    const getDisplayName = (p: any) => p ? (p.players.map((pl: any) => pl.name).join(' / ') || p.name) : 'A definir';

    return (
        <div className="space-y-6">
            {resultsByCategory.map(result => (
                <div key={result.category.id} className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">{result.category.group} - {result.category.level}</h3>
                    <div className="space-y-3">
                        <PodiumPlace place={1} displayName={getDisplayName(result.first)} prize={result.category.prize_1st} />
                        <PodiumPlace place={2} displayName={getDisplayName(result.second)} prize={result.category.prize_2nd} />
                        <PodiumPlace place={3} displayName={getDisplayName(result.third)} prize={result.category.prize_3rd} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const PodiumPlace: React.FC<{ place: number, displayName: string, prize?: string }> = ({ place, displayName, prize }) => {
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

export default TorneioPublico;
