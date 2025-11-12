import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../Layout/Layout';
import Button from '../Forms/Button';
import { localApi } from '../../lib/localApi';
import { Torneio, Quadra, Participant, Arena, Profile, Aluno, Friendship, FinanceTransaction } from '../../types';
import { Loader2, Trophy, Users, BarChart3, Info, Calendar, MapPin, DollarSign, Users2, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../Forms/Input';
import { v4 as uuidv4 } from 'uuid';
import RegistrationReceiptModal from './RegistrationReceiptModal';
import TournamentPaymentModal from './TournamentPaymentModal';

type TabType = 'overview' | 'participants' | 'bracket' | 'results';

const getModalityProps = (modality: Torneio['modality']) => {
    switch (modality) {
        case 'individual': return { icon: User, label: 'Individual' };
        case 'duplas': return { icon: Users, label: 'Duplas' };
        case 'equipes': return { icon: Users2, label: 'Equipes' };
        default: return { icon: Users, label: 'N/A' };
    }
};

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 dark:bg-brand-gray-800/50 p-4 rounded-lg text-center backdrop-blur-sm">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-brand-blue-400 mx-auto mb-2" />
        <h3 className="text-lg sm:text-xl font-bold text-white truncate">{value}</h3>
        <p className="text-xs sm:text-sm text-blue-200 dark:text-brand-gray-400 truncate">{label}</p>
    </motion.div>
);

const TorneioPublico: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [arena, setArena] = useState<Arena | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptParticipant, setReceiptParticipant] = useState<Participant | null>(null);
  
  const { user, profile, alunoProfileForSelectedArena, switchArenaContext, followArena, memberships, allArenas, refreshAlunoProfile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Profile[]>([]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [participantToPay, setParticipantToPay] = useState<Participant | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    try {
      let foundTorneio: Torneio | null = null;
      let arenaForTorneio: Arena | null = null;

      for (const currentArena of allArenas) {
        const { data: torneiosInArena } = await localApi.select<Torneio>('torneios', currentArena.id);
        const match = torneiosInArena.find(t => t.id === id);
        if (match) {
          foundTorneio = match;
          arenaForTorneio = currentArena;
          break;
        }
      }

      if (foundTorneio && arenaForTorneio) {
        setTorneio(foundTorneio);
        setArena(arenaForTorneio);
        const { data: quadrasData } = await localApi.select<Quadra>('quadras', arenaForTorneio.id);
        setQuadras(quadrasData || []);
      } else {
        setTorneio(null);
        setArena(null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do torneio público:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, allArenas]);

  useEffect(() => {
    const fetchFriends = async () => {
        if (!profile) return;
        try {
            const [friendshipsRes, profilesRes] = await Promise.all([
                localApi.select<Friendship>('friendships', 'all'),
                localApi.select<Profile>('profiles', 'all')
            ]);

            const userFriendships = (friendshipsRes.data || []).filter(f => f.status === 'accepted' && (f.user1_id === profile.id || f.user2_id === profile.id));
            const friendIds = userFriendships.map(f => f.user1_id === profile.id ? f.user2_id : f.user1_id);
            const friendProfiles = (profilesRes.data || []).filter(p => friendIds.includes(p.id));
            setFriends(friendProfiles);
        } catch (error) {
            console.error("Failed to fetch friends", error);
        }
    };
    fetchFriends();
  }, [profile]);

  useEffect(() => {
    if (allArenas.length > 0) {
        loadData();
    }
  }, [loadData, allArenas]);

  const myRegistrations = useMemo(() => {
    if (!torneio || !profile) return [];
    return torneio.participants.filter(p => 
        p.players.some(player => player.profile_id === profile.id)
    );
  }, [torneio, profile]);

  const handleInscricao = async (categoryId: string, teamName: string, partner: Profile | null) => {
    if (!torneio || !arena || !profile || !user) {
        addToast({ message: 'Você precisa estar logado para se inscrever.', type: 'error' });
        navigate('/auth');
        return;
    }

    const isFollowing = memberships.some(m => m.arena_id === arena.id);
    if (!isFollowing) {
        await followArena(arena.id);
    }
    switchArenaContext(arena);

    if (!alunoProfileForSelectedArena) {
        addToast({ message: 'Perfil de aluno não encontrado para esta arena. Atualizando...', type: 'info' });
        setTimeout(() => handleInscricao(categoryId, teamName, partner), 1000);
        return;
    }

    if (!categoryId) {
        addToast({ message: 'Por favor, selecione uma categoria.', type: 'error' });
        return;
    }
    if (torneio.modality !== 'individual' && !teamName.trim()) {
        addToast({ message: 'Por favor, insira o nome da sua dupla/equipe.', type: 'error' });
        return;
    }
    const alreadyRegisteredInCategory = torneio.participants.some(p => 
        p.categoryId === categoryId && 
        p.players.some(player => player.profile_id === profile.id)
    );
    if (alreadyRegisteredInCategory) {
        addToast({ message: 'Você já está inscrito nesta categoria.', type: 'error' });
        return;
    }

    setIsRegistering(true);
    try {
        const players: Participant['players'] = [{
            profile_id: profile.id,
            aluno_id: alunoProfileForSelectedArena.id,
            name: profile.name,
            phone: profile.phone || null,
            status: 'accepted',
            payment_status: 'pendente',
            checked_in: false,
        }];

        if ((torneio.modality === 'duplas' || torneio.modality === 'equipes') && partner) {
            players.push({
                profile_id: partner.id,
                aluno_id: null,
                name: partner.name,
                phone: partner.phone || null,
                status: 'pending',
                payment_status: 'pendente',
                checked_in: false,
            });
        }

        const newParticipant: Participant = {
            id: `participant_${uuidv4()}`,
            categoryId: categoryId,
            name: torneio.modality === 'individual' ? profile.name : teamName,
            email: profile.email,
            players,
            on_waitlist: false,
            payment_status: torneio.registration_fee > 0 ? 'pendente' : 'pago',
        };

        const updatedTorneio = {
            ...torneio,
            participants: [...torneio.participants, newParticipant]
        };

        await localApi.upsert('torneios', [updatedTorneio], arena.id);

        if (partner) {
            await localApi.upsert('notificacoes', [{
                profile_id: partner.id,
                arena_id: arena.id,
                message: `${profile.name} convidou você para o torneio "${torneio.name}".`,
                type: 'tournament_invite',
                link_to: '/perfil',
                sender_id: profile.id,
                sender_name: profile.name,
                sender_avatar_url: profile.avatar_url,
            }], arena.id);
        }

        addToast({ message: 'Inscrição realizada com sucesso! Efetue o pagamento para confirmar.', type: 'success' });
        loadData();
    } catch (error: any) {
        addToast({ message: `Erro ao realizar inscrição: ${error.message}`, type: 'error' });
    } finally {
        setIsRegistering(false);
    }
  };

  const handleOpenPaymentModal = (participant: Participant) => {
    setParticipantToPay(participant);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (method: 'pix' | 'cartao' | 'dinheiro') => {
    if (!torneio || !participantToPay || !arena || !profile) return;
    setIsProcessingPayment(true);
    try {
        const updatedParticipants = torneio.participants.map(p => {
            if (p.id === participantToPay.id) {
                const updatedPlayers = p.players.map(player => {
                    if (player.profile_id === profile.id) {
                        return { ...player, payment_status: 'pago' as 'pago' };
                    }
                    return player;
                });

                const acceptedPlayers = updatedPlayers.filter(pl => pl.status === 'accepted');
                const allPaid = acceptedPlayers.length > 0 && acceptedPlayers.every(pl => pl.payment_status === 'pago');
                const somePaid = updatedPlayers.some(pl => pl.payment_status === 'pago');

                let newParticipantStatus: Participant['payment_status'] = 'pendente';
                if (allPaid) {
                    newParticipantStatus = 'pago';
                } else if (somePaid) {
                    newParticipantStatus = 'parcialmente_pago';
                }

                return { ...p, players: updatedPlayers, payment_status: newParticipantStatus };
            }
            return p;
        });

        const updatedTorneio = { ...torneio, participants: updatedParticipants };

        await localApi.upsert('torneios', [updatedTorneio], arena.id);

        const category = torneio.categories.find(c => c.id === participantToPay.categoryId);
        const amount = category?.registration_fee || torneio.registration_fee || 0;
        
        await localApi.upsert('finance_transactions', [{
            arena_id: arena.id,
            description: `Inscrição Torneio: ${torneio.name} - ${profile.name} (Equipe: ${participantToPay.name})`,
            amount: amount,
            type: 'receita' as 'receita',
            category: 'Torneio',
            date: new Date().toISOString().split('T')[0],
        }], arena.id);

        addToast({ message: 'Pagamento confirmado com sucesso!', type: 'success' });
        loadData();
    } catch (error: any) {
        addToast({ message: `Erro ao confirmar pagamento: ${error.message}`, type: 'error' });
    } finally {
        setIsProcessingPayment(false);
        setIsPaymentModalOpen(false);
        setParticipantToPay(null);
    }
  };

  const totalPrizeMoney = useMemo(() => {
    if (!torneio) return 0;
    return torneio.categories.reduce((total, cat) => {
        const p1 = parseFloat(cat.prize_1st?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
        const p2 = parseFloat(cat.prize_2nd?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
        const p3 = parseFloat(cat.prize_3rd?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
        return total + p1 + p2 + p3;
    }, 0);
  }, [torneio]);

  const registrationFeeToDisplay = useMemo(() => {
    if (!torneio) return '-';

    if (selectedCategoryId) {
        const category = torneio.categories.find(c => c.id === selectedCategoryId);
        return formatCurrency(category?.registration_fee);
    }
    
    if (!torneio.categories || torneio.categories.length === 0) {
        return '-';
    }

    const fees = torneio.categories.map(c => c.registration_fee);
    const uniqueFees = [...new Set(fees)];

    if (uniqueFees.length === 1) {
        return formatCurrency(uniqueFees[0]);
    }

    const minFee = Math.min(...fees);
    const maxFee = Math.max(...fees);
    
    const minFormatted = formatCurrency(minFee);
    const maxFormatted = formatCurrency(maxFee);

    if (minFormatted === maxFormatted) return minFormatted;

    return `${minFormatted} a ${maxFormatted}`;
  }, [torneio, selectedCategoryId]);

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

  if (!torneio || !arena) {
    return <Layout><div className="text-center p-8">Torneio não encontrado.</div></Layout>;
  }

  const modalityProps = getModalityProps(torneio.modality);
  const dateString = format(parseDateStringAsLocal(torneio.start_date), 'dd/MM/yyyy') + (torneio.start_date !== torneio.end_date ? ` - ${format(parseDateStringAsLocal(torneio.end_date), 'dd/MM/yyyy')}` : '');

  return (
    <Layout>
      <div className="overflow-y-auto flex-1">
        <div className="bg-brand-gray-900 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-600/30 to-purple-600/30 opacity-50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl font-extrabold text-white text-center">{torneio.name}</h1>
              <p className="text-center text-lg text-blue-200 mt-2">{dateString}</p>
            </motion.div>
            
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <StatCard icon={modalityProps.icon} label="Modalidade" value={modalityProps.label} />
              <StatCard icon={DollarSign} label="Inscrição" value={registrationFeeToDisplay} />
              <StatCard icon={Trophy} label="Premiação Total" value={formatCurrency(totalPrizeMoney)} />
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RegistrationSection 
            torneio={torneio}
            myRegistrations={myRegistrations}
            onRegister={handleInscricao}
            isLoading={isRegistering}
            friends={friends}
            onShowReceipt={(p) => { setReceiptParticipant(p); setIsReceiptModalOpen(true); }}
            onPay={handleOpenPaymentModal}
          />
          <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 my-8">
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
      </div>
      <RegistrationReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        torneio={torneio}
        arena={arena}
        participant={receiptParticipant}
      />
      <TournamentPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        torneio={torneio}
        participant={participantToPay!}
        playerProfile={profile!}
        isProcessing={isProcessingPayment}
      />
    </Layout>
  );
};

interface RegistrationSectionProps {
  torneio: Torneio;
  myRegistrations: Participant[];
  onRegister: (categoryId: string, teamName: string, partner: Profile | null) => void;
  isLoading: boolean;
  friends: Profile[];
  onShowReceipt: (participant: Participant) => void;
  onPay: (participant: Participant) => void;
}

const RegistrationSection: React.FC<RegistrationSectionProps> = ({ torneio, myRegistrations, onRegister, isLoading, friends, onShowReceipt, onPay }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const availableCategories = useMemo(() => {
    const myRegisteredCategoryIds = new Set(myRegistrations.map(r => r.categoryId));
    return torneio.categories.filter(cat => !myRegisteredCategoryIds.has(cat.id));
  }, [torneio.categories, myRegistrations]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(availableCategories[0]?.id || '');
  const [teamName, setTeamName] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, selectedCategoryId]);

  const selectedCategory = useMemo(() => {
    return torneio.categories.find(c => c.id === selectedCategoryId);
  }, [torneio.categories, selectedCategoryId]);

  const registrationFeeToDisplay = useMemo(() => {
    if (selectedCategory) {
        return formatCurrency(selectedCategory.registration_fee);
    }
    return formatCurrency(torneio.registration_fee);
  }, [torneio, selectedCategory]);

  if (torneio.status !== 'inscricoes_abertas') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/50 p-6 rounded-lg text-center my-6">
        <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">Inscrições Encerradas</h3>
        <p className="text-yellow-700 dark:text-yellow-300 mt-2">As inscrições para este torneio não estão abertas no momento.</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/50 p-6 rounded-lg text-center my-6">
        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Faça parte do torneio!</h3>
        <p className="text-blue-700 dark:text-blue-300 mt-2">Faça login ou crie sua conta para se inscrever.</p>
        <Button onClick={() => navigate('/auth')} className="mt-4">Entrar ou Cadastrar</Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = selectedPartnerId ? friends.find(f => f.id === selectedPartnerId) : null;
    onRegister(selectedCategoryId, teamName, partner);
  };

  return (
    <div className="my-6">
      {myRegistrations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Minhas Inscrições</h3>
          <div className="space-y-4">
            {myRegistrations.map(participant => (
              <MyRegistrationCard
                key={participant.id}
                participant={participant}
                torneio={torneio}
                onPay={onPay}
                onShowReceipt={onShowReceipt}
              />
            ))}
          </div>
        </div>
      )}

      {availableCategories.length > 0 && (
        <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-2xl font-bold mb-1">Inscreva-se em outra Categoria</h3>
          <p className="text-brand-gray-500 dark:text-brand-gray-400 mb-4">Valor da inscrição: <span className="font-bold text-green-600">{registrationFeeToDisplay}</span> por jogador.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Categoria Disponível</label>
              <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="w-full form-select rounded-md dark:bg-brand-gray-700 dark:border-brand-gray-600">
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.group} - {cat.level}</option>
                ))}
              </select>
            </div>
            
            {torneio.modality !== 'individual' && (
              <Input label={`Nome da ${torneio.modality === 'duplas' ? 'Dupla' : 'Equipe'}`} value={teamName} onChange={e => setTeamName(e.target.value)} required />
            )}
    
            <div className="p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50">
              <p className="font-semibold">Jogador 1 (Você)</p>
              <p className="text-sm text-brand-gray-500">{profile.name}</p>
            </div>
    
            {torneio.modality === 'duplas' && (
              <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Jogador 2 (Parceiro/a)</label>
                  <select 
                      value={selectedPartnerId || ''}
                      onChange={e => setSelectedPartnerId(e.target.value || null)}
                      className="w-full form-select rounded-md dark:bg-brand-gray-700 dark:border-brand-gray-600"
                  >
                      <option value="">Convidar um amigo...</option>
                      {friends.map(friend => (
                          <option key={friend.id} value={friend.id}>{friend.name}</option>
                      ))}
                  </select>
                  <p className="text-xs text-brand-gray-500 mt-1">Seu amigo não está na lista? Peça para ele se cadastrar na arena e adicione-o como amigo.</p>
              </div>
            )}
            
            <div className="pt-2">
              <Button type="submit" isLoading={isLoading} className="w-full">Inscrever-se</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const MyRegistrationCard: React.FC<{ participant: Participant, torneio: Torneio, onPay: (p: Participant) => void, onShowReceipt: (p: Participant) => void }> = ({ participant, torneio, onPay, onShowReceipt }) => {
  const { profile } = useAuth();
  const category = torneio.categories.find(c => c.id === participant.categoryId);
  const myPlayerInfo = participant.players.find(p => p.profile_id === profile?.id);
  const hasPaid = myPlayerInfo?.payment_status === 'pago';

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-4 rounded-lg shadow border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <p className="font-bold">{category?.group} - {category?.level}</p>
          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Equipe: {participant.name}</p>
        </div>
        <div className="flex items-center gap-4">
          {hasPaid ? (
            <span className="flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" /> Pagamento Confirmado
            </span>
          ) : (
            <span className="flex items-center text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              <DollarSign className="h-5 w-5 mr-2" /> Pagamento Pendente
            </span>
          )}
          {hasPaid ? (
            <Button variant="outline" size="sm" onClick={() => onShowReceipt(participant)}>Ver Comprovante</Button>
          ) : (
            <Button size="sm" onClick={() => onPay(participant)}>Pagar Agora</Button>
          )}
        </div>
      </div>
    </div>
  );
};

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
                  {(quadra || (match.date && match.start_time)) && (
                    <div className="mt-3 pt-3 border-t border-brand-gray-200 dark:border-brand-gray-700 space-y-2 text-sm">
                        {quadra && (
                            <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
                                <MapPin className="h-4 w-4 mr-2 text-brand-blue-500" />
                                <span className="font-semibold">{quadra.name}</span>
                            </div>
                        )}
                        {match.date && match.start_time && (
                            <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
                                <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
                                <span className="font-semibold">{format(parseDateStringAsLocal(match.date), 'dd/MM')} às {match.start_time}</span>
                            </div>
                        )}
                    </div>
                  )}
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
