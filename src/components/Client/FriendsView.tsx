import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseApi } from '../../lib/supabaseApi';
import { Profile, Friendship, Aluno } from '../../types';
import { useToast } from '../../context/ToastContext';
import Input from '../Forms/Input';
import Button from '../Forms/Button';
import { Search, UserPlus, UserCheck, UserX, Loader2, Users, Check, Clock, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import SendMessageModal from './SendMessageModal';

const FriendsView: React.FC = () => {
  const { profile, selectedArenaContext } = useAuth();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [allArenaUsers, setAllArenaUsers] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [friendToMessage, setFriendToMessage] = useState<Profile | null>(null);

  const loadData = useCallback(async () => {
    if (!profile || !selectedArenaContext) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [allProfilesRes, friendshipsRes, arenaAlunosRes] = await Promise.all([
        supabaseApi.select<Profile>('profiles', 'all'),
        supabaseApi.select<Friendship>('friendships', 'all'),
        supabaseApi.select<Aluno>('alunos', selectedArenaContext.id),
      ]);

      const allProfiles = allProfilesRes.data || [];
      const arenaAlunos = arenaAlunosRes.data || [];
      
      const arenaProfileIds = new Set(arenaAlunos.map(a => a.profile_id).filter(Boolean));
      const arenaUsers = allProfiles.filter(p => arenaProfileIds.has(p.id));
      
      setAllArenaUsers(arenaUsers);
      setFriendships(friendshipsRes.data || []);
    } catch (error: any) {
      addToast({ message: 'Erro ao carregar dados de amigos.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [profile, selectedArenaContext, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { friends, incomingRequests, outgoingRequests } = useMemo(() => {
    if (!profile) return { friends: [], incomingRequests: [], outgoingRequests: [] };

    const friendsList: Profile[] = [];
    const incoming: { request: Friendship; user: Profile }[] = [];
    const outgoing: { request: Friendship; user: Profile }[] = [];

    friendships.forEach(f => {
      if (f.status === 'accepted') {
        if (f.user1_id === profile.id) {
          const friendProfile = allArenaUsers.find(u => u.id === f.user2_id);
          if (friendProfile) friendsList.push(friendProfile);
        } else if (f.user2_id === profile.id) {
          const friendProfile = allArenaUsers.find(u => u.id === f.user1_id);
          if (friendProfile) friendsList.push(friendProfile);
        }
      } else if (f.status === 'pending') {
        if (f.user2_id === profile.id && f.requested_by !== profile.id) {
          const requesterProfile = allArenaUsers.find(u => u.id === f.user1_id);
          if (requesterProfile) incoming.push({ request: f, user: requesterProfile });
        } else if (f.user1_id === profile.id && f.requested_by === profile.id) {
          const requestedProfile = allArenaUsers.find(u => u.id === f.user2_id);
          if (requestedProfile) outgoing.push({ request: f, user: requestedProfile });
        }
      }
    });

    return { friends: friendsList, incomingRequests: incoming, outgoingRequests: outgoing };
  }, [friendships, allArenaUsers, profile]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allArenaUsers.filter(u =>
      u.id !== profile?.id &&
      u.name.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, allArenaUsers, profile]);

  const getFriendshipStatus = useCallback((targetUserId: string) => {
    if (friends.some(f => f.id === targetUserId)) {
      return { status: 'friends' as const };
    }
    const incoming = incomingRequests.find(r => r.user.id === targetUserId);
    if (incoming) {
      return { status: 'incoming' as const, request: incoming.request };
    }
    if (outgoingRequests.some(r => r.user.id === targetUserId)) {
      return { status: 'outgoing' as const };
    }
    return { status: 'none' as const };
  }, [friends, incomingRequests, outgoingRequests]);


  const handleFriendAction = async (friendship: Friendship, newStatus: 'accepted' | 'declined') => {
    if (!profile || !selectedArenaContext) return;
    
    if (newStatus === 'declined') {
        await supabaseApi.delete('friendships', [friendship.id], 'all');
    } else {
        const updatedFriendship = { ...friendship, status: 'accepted' as 'accepted' };
        await supabaseApi.upsert('friendships', [updatedFriendship], 'all');
        
        const originalRequesterId = friendship.requested_by;
        const { data: allProfiles } = await supabaseApi.select<Profile>('profiles', 'all');
        const originalRequesterProfile = allProfiles.find(p => p.id === originalRequesterId);
        
        if (originalRequesterProfile) {
            const wantsFriendRequests = originalRequesterProfile.notification_preferences?.friend_requests ?? true;
            if (wantsFriendRequests) {
                await supabaseApi.upsert('notificacoes', [{
                    profile_id: originalRequesterId,
                    arena_id: selectedArenaContext.id,
                    message: `aceitou sua solicitação de amizade.`,
                    type: 'friend_requests',
                    link_to: '/perfil',
                    sender_id: profile.id,
                    sender_name: profile.name,
                    sender_avatar_url: profile.avatar_url,
                }], selectedArenaContext.id);
            }
        }
    }
    loadData();
    addToast({ message: newStatus === 'accepted' ? 'Amigo adicionado!' : 'Solicitação recusada.', type: 'success' });
  };

  const handleSendRequest = async (targetUserId: string) => {
    if (!profile || !selectedArenaContext) return;
    const newFriendship: Friendship = {
      id: uuidv4(),
      user1_id: profile.id,
      user2_id: targetUserId,
      status: 'pending',
      requested_by: profile.id,
      created_at: new Date().toISOString(),
    };
    await supabaseApi.upsert('friendships', [newFriendship], 'all');

    const { data: allProfiles } = await supabaseApi.select<Profile>('profiles', 'all');
    const targetProfile = allProfiles.find(p => p.id === targetUserId);
    if (targetProfile) {
        const wantsFriendRequests = targetProfile.notification_preferences?.friend_requests ?? true;
        if (wantsFriendRequests) {
            await supabaseApi.upsert('notificacoes', [{
                profile_id: targetUserId,
                arena_id: selectedArenaContext.id,
                message: `enviou uma solicitação de amizade.`,
                type: 'friend_requests',
                link_to: '/perfil',
                sender_id: profile.id,
                sender_name: profile.name,
                sender_avatar_url: profile.avatar_url,
            }], selectedArenaContext.id);
        }
    }

    loadData();
    addToast({ message: 'Solicitação de amizade enviada!', type: 'success' });
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!profile) return;
    const friendship = friendships.find(f => 
        f.status === 'accepted' &&
        ((f.user1_id === profile.id && f.user2_id === friendId) || 
        (f.user2_id === profile.id && f.user1_id === friendId))
    );
    if (friendship) {
        await supabaseApi.delete('friendships', [friendship.id], 'all');
        loadData();
        addToast({ message: 'Amigo removido.', type: 'info' });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!friendToMessage || !profile || !selectedArenaContext) {
      addToast({ message: 'Erro ao enviar mensagem.', type: 'error' });
      return;
    }

    try {
      await supabaseApi.upsert('notificacoes', [{
        profile_id: friendToMessage.id,
        arena_id: selectedArenaContext.id,
        message: message,
        type: 'direct_message',
        link_to: '/perfil?tab=amigos',
        sender_id: profile.id,
        sender_name: profile.name,
        sender_avatar_url: profile.avatar_url,
      }], selectedArenaContext.id);

      addToast({ message: `Mensagem enviada para ${friendToMessage.name}!`, type: 'success' });
      setIsMessageModalOpen(false);
      setFriendToMessage(null);
    } catch (error: any) {
      addToast({ message: `Erro: ${error.message}`, type: 'error' });
    }
  };

  const openMessageModal = (friend: Profile) => {
    setFriendToMessage(friend);
    setIsMessageModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
  }

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-white">Amigos na Arena</h2>
        
        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4">Encontrar Jogadores</h3>
          <Input
            placeholder="Buscar por nome..."
            icon={<Search className="h-4 w-4 text-brand-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(user => {
                const { status, request } = getFriendshipStatus(user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-md">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar_url || `https://avatar.vercel.sh/${user.id}.svg`} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      <span>{user.name}</span>
                    </div>
                    <div>
                      {status === 'friends' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"><UserCheck className="h-3 w-3" /> Amigo</span>}
                      {status === 'outgoing' && <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"><Clock className="h-3 w-3" /> Enviado</span>}
                      {status === 'incoming' && request && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleFriendAction(request, 'accepted')}><UserCheck className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => handleFriendAction(request, 'declined')}><UserX className="h-4 w-4" /></Button>
                        </div>
                      )}
                      {status === 'none' && <Button size="sm" onClick={() => handleSendRequest(user.id)}><UserPlus className="h-4 w-4 mr-2" /> Adicionar</Button>}
                    </div>
                  </div>
                );
              })}
              {searchResults.length === 0 && <p className="text-sm text-center text-brand-gray-500 py-4">Nenhum jogador encontrado com este nome.</p>}
            </div>
          )}
        </div>

        {incomingRequests.length > 0 && (
          <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="text-xl font-semibold mb-4">Solicitações Pendentes</h3>
            <div className="space-y-3">
              {incomingRequests.map(({ request, user }) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                      <img src={user.avatar_url || `https://avatar.vercel.sh/${user.id}.svg`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFriendAction(request, 'accepted')}><UserCheck className="h-4 w-4 mr-1" /> Aceitar</Button>
                    <Button size="sm" variant="outline" onClick={() => handleFriendAction(request, 'declined')}><UserX className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><Users className="h-5 w-5 mr-2" />Meus Amigos ({friends.length})</h3>
          {friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="w-full text-left flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg transition-colors hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
                >
                  <div 
                    className="flex items-center gap-3 flex-grow cursor-pointer"
                    onClick={() => openMessageModal(friend)}
                  >
                      <img src={friend.avatar_url || `https://avatar.vercel.sh/${friend.id}.svg`} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                      <span className="font-medium">{friend.name}</span>
                  </div>
                  <div className="flex items-center">
                    <button 
                      className="p-2 text-brand-blue-500" 
                      title={`Enviar mensagem para ${friend.name}`}
                      onClick={() => openMessageModal(friend)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveFriend(friend.id)} 
                      className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" 
                      title="Remover amizade. Esta ação é irreversível."
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-center text-brand-gray-500 py-8">Você ainda não adicionou nenhum amigo.</p>}
        </div>
      </div>
      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onConfirm={handleSendMessage}
        friend={friendToMessage}
      />
    </>
  );
};

export default FriendsView;
