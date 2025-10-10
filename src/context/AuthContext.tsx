import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, User, Profile, Arena, ArenaMembership, Aluno } from '../types';
import { useToast } from './ToastContext';
import { localApi } from '../lib/localApi';
import { v4 as uuidv4 } from 'uuid';
import { seedInitialData } from '../lib/seedData';

interface AuthContextType extends AuthState {
  allArenas: Arena[];
  alunoProfileForSelectedArena: Aluno | null;
  signUp: (email: string, password: string, name?: string, role?: 'cliente' | 'admin_arena') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updatedProfile: Partial<Profile>) => Promise<void>;
  updateArena: (updatedArena: Partial<Arena>) => Promise<void>;
  followArena: (arenaId: string) => Promise<void>;
  unfollowArena: (arenaId: string) => Promise<void>;
  switchArenaContext: (arena: Arena | null) => void;
  refreshAlunoProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [arena, setArena] = useState<Arena | null>(null);
  const [memberships, setMemberships] = useState<ArenaMembership[]>([]);
  const [allArenas, setAllArenas] = useState<Arena[]>([]);
  const [selectedArenaContext, setSelectedArenaContext] = useState<Arena | null>(null);
  const [alunoProfileForSelectedArena, setAlunoProfileForSelectedArena] = useState<Aluno | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        const seedKey = 'initial_data_seeded_v2';
        if (!localStorage.getItem(seedKey)) {
          await seedInitialData();
          localStorage.setItem(seedKey, 'true');
        }

        const { data: existingArenas } = await localApi.select<Arena>('arenas', 'all');
        const currentArenas = existingArenas || [];
        setAllArenas(currentArenas);

        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (!loggedInUserStr) {
            setIsLoading(false);
            return;
        }

        const loggedInProfile: Profile = JSON.parse(loggedInUserStr);
        const loggedInUser: User = { id: loggedInProfile.id, email: loggedInProfile.email, created_at: loggedInProfile.created_at };
        
        setUser(loggedInUser);
        setProfile(loggedInProfile);

        if (loggedInProfile.role === 'admin_arena') {
            const userArena = currentArenas.find(a => a.owner_id === loggedInProfile.id);
            if (userArena) {
                setArena(userArena);
                setSelectedArenaContext(userArena);
            }
        } else {
            const defaultArena = currentArenas[0];
            if (defaultArena) {
                setSelectedArenaContext(defaultArena);
                setMemberships([{ profile_id: loggedInProfile.id, arena_id: defaultArena.id }]);
            }
        }
      } catch (error) {
        console.error("Error during session initialization:", error);
        localStorage.removeItem('loggedInUser');
      } finally {
        setIsLoading(false);
      }
    };
    initializeSession();
  }, []);

  const refreshAlunoProfile = useCallback(async () => {
    if (profile?.role === 'cliente' && selectedArenaContext) {
        const { data: alunos } = await localApi.select<Aluno>('alunos', selectedArenaContext.id);
        const alunoProfile = alunos.find(a => a.profile_id === profile.id);
        setAlunoProfileForSelectedArena(alunoProfile || null);
    }
  }, [profile, selectedArenaContext]);

  useEffect(() => {
    if (!isLoading) {
        refreshAlunoProfile();
    }
  }, [profile, selectedArenaContext, isLoading, refreshAlunoProfile]);


  const signUp = async (email: string, password: string, name?: string, role: 'cliente' | 'admin_arena' = 'cliente') => {
    return Promise.resolve();
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    let userProfile: Profile;
    let alunoForArena: Aluno | null = null;
    const { data: arenas } = await localApi.select<Arena>('arenas', 'all');
    const defaultArena = arenas[0];

    if (email.toLowerCase() === 'admin@matchplay.com') {
        const { data: adminProfiles } = await localApi.select<Profile>('profiles', 'all');
        const adminProfile = adminProfiles.find(p => p.email === email.toLowerCase());
        if (!adminProfile) throw new Error("Perfil de administrador não encontrado.");
        userProfile = adminProfile;

        const userArena = arenas.find(a => a.owner_id === userProfile.id);
        setArena(userArena || null);
        setSelectedArenaContext(userArena || null);
    } else {
        if (!defaultArena) {
            setIsLoading(false);
            throw new Error("Nenhuma arena configurada no sistema.");
        }

        const { data: allAlunos } = await localApi.select<Aluno>('alunos', defaultArena.id);
        let existingAluno = allAlunos.find(a => a.email?.toLowerCase() === email.toLowerCase());

        if (existingAluno) {
            if (!existingAluno.profile_id) {
                const newProfileId = `profile_${uuidv4()}`;
                existingAluno.profile_id = newProfileId;
                await localApi.upsert('alunos', [existingAluno], defaultArena.id);
            }

            alunoForArena = existingAluno;
            userProfile = {
                id: existingAluno.profile_id!,
                name: existingAluno.name,
                email: existingAluno.email!,
                role: 'cliente',
                avatar_url: existingAluno.avatar_url || null,
                phone: existingAluno.phone || null,
                created_at: existingAluno.created_at,
            };
        } else {
            const { data: allProfiles } = await localApi.select<Profile>('profiles', 'all');
            const existingProfile = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());

            if (existingProfile) {
                userProfile = existingProfile;
            } else {
                const newProfile = {
                    id: `profile_${uuidv4()}`,
                    name: `Cliente ${email.split('@')[0]}`,
                    email: email,
                    role: 'cliente' as 'cliente',
                    created_at: new Date().toISOString(),
                };
                await localApi.upsert('profiles', [newProfile], 'all');
                userProfile = newProfile;
            }

            const newAlunoPayload: Omit<Aluno, 'id' | 'created_at'> = {
                arena_id: defaultArena.id,
                profile_id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                phone: null,
                status: 'ativo',
                plan_name: 'Avulso',
                join_date: new Date().toISOString().split('T')[0],
                credit_balance: 0,
                gamification_points: 0,
                aulas_restantes: 0,
                aulas_agendadas: [],
            };
            const { data: createdAlunos } = await localApi.upsert('alunos', [newAlunoPayload], defaultArena.id);
            alunoForArena = createdAlunos[0];
        }
        
        setSelectedArenaContext(defaultArena);
        setMemberships([{ profile_id: userProfile.id, arena_id: defaultArena.id }]);
    }
    
    const loggedInUser: User = { id: userProfile.id, email: userProfile.email, created_at: userProfile.created_at };

    localStorage.setItem('loggedInUser', JSON.stringify(userProfile));
    setUser(loggedInUser);
    setProfile(userProfile);
    setAlunoProfileForSelectedArena(alunoForArena);
    
    setIsLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem('loggedInUser');
    setUser(null); setProfile(null); setArena(null); setMemberships([]);
    setSelectedArenaContext(null); setAlunoProfileForSelectedArena(null);
  };

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updatedProfile };
    setProfile(newProfile);
    localStorage.setItem('loggedInUser', JSON.stringify(newProfile));
    addToast({ message: 'Perfil atualizado!', type: 'success' });
  };

  const updateArena = async (updatedArenaData: Partial<Arena>) => {
    if (!arena) return;
    const newArena = { ...arena, ...updatedArenaData };
    
    const updatedArenas = allArenas.map(a => a.id === newArena.id ? newArena : a);
    
    await localApi.upsert('arenas', updatedArenas, 'all');
    
    setAllArenas(updatedArenas);
    setArena(newArena);
    if (selectedArenaContext?.id === newArena.id) {
        setSelectedArenaContext(newArena);
    }

    addToast({ message: 'Dados da arena atualizados!', type: 'success' });
  };

  const followArena = async (arenaId: string) => {
    if (!profile) return;
    const newMembership = { profile_id: profile.id, arena_id: arenaId };
    if (!memberships.some(m => m.arena_id === arenaId)) {
        setMemberships([...memberships, newMembership]);
    }
    addToast({ message: 'Agora você segue esta arena!', type: 'success' });
  };

  const unfollowArena = async (arenaId: string) => {
    setMemberships(memberships.filter(m => m.arena_id !== arenaId));
    addToast({ message: 'Você deixou de seguir a arena.', type: 'info' });
  };

  const switchArenaContext = (arena: Arena | null) => {
    setSelectedArenaContext(arena);
  };
  
  const authState: AuthState = { user, profile, arena, memberships, selectedArenaContext, isLoading };

  return (
    <AuthContext.Provider value={{ ...authState, allArenas, alunoProfileForSelectedArena, signUp, signIn, signOut, updateProfile, updateArena, followArena, unfollowArena, switchArenaContext, refreshAlunoProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
