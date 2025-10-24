import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, User, Profile, Arena, ArenaMembership, Aluno } from '../types';
import { useToast } from './ToastContext';
import { localApi } from '../lib/localApi';
import { v4 as uuidv4 } from 'uuid';
import { seedInitialData } from '../lib/seedData';
import { format } from 'date-fns';

interface AuthContextType extends AuthState {
  allArenas: Arena[];
  alunoProfileForSelectedArena: Aluno | null;
  signUp: (email: string, password: string, name?: string, role?: 'cliente' | 'admin_arena') => Promise<void>;
  signIn: (email: string, password: string) => Promise<Profile | null>;
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
        const seedKey = 'initial_data_seeded_v15_persistent';
        if (!localStorage.getItem(seedKey)) {
          await seedInitialData();
          localStorage.setItem(seedKey, 'true');
        }

        const { data: currentArenas } = await localApi.select<Arena>('arenas', 'all');
        setAllArenas(currentArenas || []);

        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (!loggedInUserStr) {
            setIsLoading(false);
            return;
        }

        const loggedInProfile: Profile = JSON.parse(loggedInUserStr);
        const loggedInUser: User = { id: loggedInProfile.id, email: loggedInProfile.email, created_at: loggedInProfile.created_at };
        
        setUser(loggedInUser);
        setProfile(loggedInProfile);

        if (loggedInProfile.role === 'super_admin') {
            setArena(null);
            setSelectedArenaContext(null);
        } else if (loggedInProfile.role === 'admin_arena') {
            const userArena = (currentArenas || []).find(a => a.owner_id === loggedInProfile.id);
            if (userArena) {
                setArena(userArena);
                setSelectedArenaContext(userArena);
            }
        } else if (loggedInProfile.role === 'funcionario') {
            const employeeArena = (currentArenas || []).find(a => a.id === loggedInProfile.arena_id);
            if (employeeArena) {
              setArena(null);
              setSelectedArenaContext(employeeArena);
            }
        } else { // cliente
            const { data: allAlunos } = await localApi.select<Aluno>('alunos', 'all');
            const myArenaIds = new Set((allAlunos || []).filter(a => a.profile_id === loggedInProfile.id).map(a => a.arena_id));
            const myArenas = (currentArenas || []).filter(a => myArenaIds.has(a.id));
            setMemberships(myArenas.map(a => ({ profile_id: loggedInProfile.id, arena_id: a.id })));
            
            if (myArenas.length > 0) {
                setSelectedArenaContext(myArenas[0]);
            } else if (currentArenas && currentArenas.length > 0) {
                setSelectedArenaContext(currentArenas[0]);
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

  const signIn = async (email: string, password: string): Promise<Profile | null> => {
    setIsLoading(true);
    try {
        let { data: allProfiles } = await localApi.select<Profile>('profiles', 'all');
        allProfiles = allProfiles || [];

        // HACK/FIX: Ensure superadmin exists for login, in case seeding failed or was missed.
        if (email.toLowerCase() === 'superadmin@matchplay.com' && !allProfiles.some(p => p.email.toLowerCase() === 'superadmin@matchplay.com')) {
            const superAdminProfile: Profile = { id: 'profile_superadmin_01', name: 'Super Admin', email: 'superadmin@matchplay.com', role: 'super_admin', avatar_url: null, created_at: new Date().toISOString() };
            await localApi.upsert('profiles', [superAdminProfile], 'all');
            // Re-fetch profiles to include the new one
            const { data: updatedProfiles } = await localApi.select<Profile>('profiles', 'all');
            allProfiles = updatedProfiles || [];
        }

        const userProfile = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());

        if (!userProfile) {
            throw new Error("Usuário ou senha inválidos.");
        }

        const { data: arenas } = await localApi.select<Arena>('arenas', 'all');
        setAllArenas(arenas || []);

        if (userProfile.role === 'super_admin') {
            setArena(null);
            setSelectedArenaContext(null);
        } else if (userProfile.role === 'admin_arena') {
            const userArena = (arenas || []).find(a => a.owner_id === userProfile.id);
            setArena(userArena || null);
            setSelectedArenaContext(userArena || null);
        } else if (userProfile.role === 'funcionario') {
            const employeeArena = (arenas || []).find(a => a.id === userProfile.arena_id);
            setArena(null);
            setSelectedArenaContext(employeeArena || null);
        } else { // cliente
            const { data: allAlunos } = await localApi.select<Aluno>('alunos', 'all');
            const myArenaIds = new Set((allAlunos || []).filter(a => a.profile_id === userProfile.id).map(a => a.arena_id));
            const myArenas = (arenas || []).filter(a => myArenaIds.has(a.id));
            setMemberships(myArenas.map(a => ({ profile_id: userProfile.id, arena_id: a.id })));
            
            if (myArenas.length > 0) {
                setSelectedArenaContext(myArenas[0]);
            } else if (arenas && arenas.length > 0) {
                setSelectedArenaContext(arenas[0]);
            }
        }
        
        const loggedInUser: User = { id: userProfile.id, email: userProfile.email, created_at: userProfile.created_at };
        localStorage.setItem('loggedInUser', JSON.stringify(userProfile));
        setUser(loggedInUser);
        setProfile(userProfile);
        return userProfile;
    } catch (error) {
        setIsLoading(false);
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('loggedInUser');
    setUser(null); setProfile(null); setArena(null); setMemberships([]);
    setSelectedArenaContext(null); setAlunoProfileForSelectedArena(null);
  };

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updatedProfile };
    await localApi.upsert('profiles', [newProfile], 'all');
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
