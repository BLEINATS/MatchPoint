import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import { Profile, PermissionLevel, ProfilePermissions } from '../../types';
import { Loader2, Plus, Edit, Trash2, Shield } from 'lucide-react';
import Button from '../Forms/Button';
import ConfirmationModal from '../Shared/ConfirmationModal';
import TeamMemberModal from './TeamMemberModal';

export const PERMISSIONS_CONFIG: Record<keyof ProfilePermissions, { label: string; levels: Record<string, string> }> = {
  reservas: { label: 'Reservas', levels: { none: 'Nenhum Acesso', view: 'Visualizar', edit: 'Gerenciar' } },
  quadras: { label: 'Quadras', levels: { none: 'Nenhum Acesso', view: 'Visualizar', edit: 'Gerenciar' } },
  gerenciamento_arena: { label: 'Gerenciamento Arena', levels: { none: 'Nenhum Acesso', view: 'Visualizar', edit: 'Gerenciar' } },
  torneios: { label: 'Torneios', levels: { none: 'Nenhum Acesso', view: 'Visualizar', edit: 'Gerenciar' } },
  eventos: { label: 'Eventos Privados', levels: { none: 'Nenhum Acesso', view: 'Visualizar', edit: 'Gerenciar' } },
  financeiro: { label: 'Financeiro', levels: { none: 'Nenhum Acesso', view: 'Visualizar', edit: 'Gerenciar' } },
  gamification: { label: 'Gamificação', levels: { none: 'Nenhum Acesso', edit: 'Gerenciar' } },
  planos_aulas: { label: 'Planos de Aulas', levels: { none: 'Nenhum Acesso', edit: 'Gerenciar' } },
};

const TeamSettingsTab: React.FC = () => {
  const { arena } = useAuth();
  const { addToast } = useToast();
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Profile | null>(null);

  const loadTeamMembers = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const { data: allProfiles, error } = await localApi.select<Profile>('profiles', 'all');
      if (error) throw error;
      
      const members = (allProfiles || []).filter(p => p.role === 'funcionario' && p.arena_id === arena.id);
      setTeamMembers(members);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar equipe: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const handleSaveMember = async (memberData: Omit<Profile, 'id' | 'created_at'> | Profile) => {
    if (!arena) return;
    try {
      const payload = { 
        ...memberData, 
        arena_id: arena.id, 
        role: 'funcionario' as 'funcionario' 
      };
      await localApi.upsert('profiles', [payload], 'all');
      addToast({ message: 'Membro da equipe salvo com sucesso!', type: 'success' });
      await loadTeamMembers();
      setIsModalOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      addToast({ message: `Erro ao salvar membro: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteRequest = (member: Profile) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await localApi.delete('profiles', [memberToDelete.id], 'all');
      addToast({ message: 'Membro da equipe excluído com sucesso.', type: 'success' });
      await loadTeamMembers();
    } catch (error: any) {
      addToast({ message: `Erro ao excluir membro: ${error.message}`, type: 'error' });
    } finally {
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const openModal = (member: Profile | null = null) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Equipe e Permissões</h3>
          <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Adicione funcionários e defina o que cada um pode acessar.</p>
        </div>
        <Button onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" />Novo Membro</Button>
      </div>
      
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase">Permissões</th>
                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
              {teamMembers.map(member => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full object-cover" src={member.avatar_url || `https://avatar.vercel.sh/${member.id}.svg`} alt={member.name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-brand-gray-900 dark:text-white">{member.name}</div>
                        <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(member.permissions || {}).filter(([, value]) => value !== 'none').map(([key, value]) => (
                        <span key={key} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {PERMISSIONS_CONFIG[key as keyof ProfilePermissions]?.label}: {PERMISSIONS_CONFIG[key as keyof ProfilePermissions]?.levels[value as PermissionLevel]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => openModal(member)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(member)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teamMembers.length === 0 && <p className="text-center text-sm text-brand-gray-500 py-8">Nenhum membro da equipe cadastrado.</p>}
        </div>
      </div>

      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
        initialData={editingMember}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={<p>Tem certeza que deseja remover <strong>{memberToDelete?.name}</strong> da equipe?</p>}
        confirmText="Sim, Excluir"
      />
    </div>
  );
};

export default TeamSettingsTab;
