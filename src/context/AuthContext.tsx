import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, User, Profile, Arena, ArenaMembership, Aluno } from '../types';
import { useToast } from './ToastContext';
import { localApi } from '../lib/localApi';
import { v4 as uuidv4 } from 'uuid';

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

const MOCK_ADMIN_USER_ID = 'mock-admin-user-id-1';
const MOCK_ARENA_ID = 'mock-arena-id-1';

const getMockAdminProfile = (): Profile => ({
  id: MOCK_ADMIN_USER_ID,
  name: 'Admin da Arena',
  email: 'admin@matchplay.com',
  role: 'admin_arena',
  avatar_url: null,
  created_at: new Date().toISOString(),
});

const getMockClientProfile = (email: string): Profile => ({
    id: `client_${uuidv4()}`,
    name: 'Cliente Teste',
    email: email,
    role: 'cliente',
    avatar_url: null,
    created_at: new Date().toISOString(),
});

const getMockArena = (): Arena => ({
  id: MOCK_ARENA_ID,
  owner_id: MOCK_ADMIN_USER_ID,
  name: 'Minha Arena Local',
  slug: 'minha-arena-local',
  city: 'Sua Cidade',
  state: 'UF',
  created_at: new Date().toISOString(),
  logo_url: '', main_image: '', cnpj_cpf: '', responsible_name: '',
  contact_phone: '', public_email: '', cep: '', address: '', number: '',
  neighborhood: '', google_maps_link: '', cancellation_policy: '', terms_of_use: '',
});

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

  // Effect for one-time session initialization
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        const { data: existingArenas } = await localApi.select<Arena>('arenas', 'all');
        let currentArenas = existingArenas || [];
        if (currentArenas.length === 0) {
            console.log("Seeding initial mock data to localStorage...");
            const mockArena = getMockArena();
            await localApi.upsert<Arena>('arenas', [mockArena], 'all');
            currentArenas = [mockArena];
        }
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
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to refresh the student profile whenever the user or selected arena changes
  useEffect(() => {
    const refresh = async () => {
        if (profile?.role === 'cliente' && selectedArenaContext) {
            const { data: alunos } = await localApi.select<Aluno>('alunos', selectedArenaContext.id);
            const alunoProfile = alunos.find(a => a.profile_id === profile.id);
            setAlunoProfileForSelectedArena(alunoProfile || null);
        } else {
            setAlunoProfileForSelectedArena(null); // Clear profile if not applicable
        }
    };
    if (!isLoading) { // Avoid running on initial load before session is ready
        refresh();
    }
  }, [profile, selectedArenaContext, isLoading]);

  // A manual refresh function, wrapped in useCallback for stability
  const refreshAlunoProfile = useCallback(async () => {
    if (profile?.role === 'cliente' && selectedArenaContext) {
        const { data: alunos } = await localApi.select<Aluno>('alunos', selectedArenaContext.id);
        const alunoProfile = alunos.find(a => a.profile_id === profile.id);
        setAlunoProfileForSelectedArena(alunoProfile || null);
    }
  }, [profile, selectedArenaContext]);

  const signUp = async (email: string, password: string, name?: string, role: 'cliente' | 'admin_arena' = 'cliente') => {
    return Promise.resolve();
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    let userProfile: Profile;

    if (email.toLowerCase() === 'admin@matchplay.com') {
        userProfile = getMockAdminProfile();
    } else {
        userProfile = getMockClientProfile(email);
        if (name) userProfile.name = name;
    }
    
    const loggedInUser: User = { id: userProfile.id, email: userProfile.email, created_at: userProfile.created_at };

    localStorage.setItem('loggedInUser', JSON.stringify(userProfile));
    setUser(loggedInUser);
    setProfile(userProfile);

    const { data: arenas } = await localApi.select<Arena>('arenas', 'all');
    if (userProfile.role === 'admin_arena') {
        const userArena = arenas.find(a => a.owner_id === userProfile.id);
        setArena(userArena || null);
        setSelectedArenaContext(userArena || null);
    } else {
        const defaultArena = arenas[0];
        if (defaultArena) {
            setSelectedArenaContext(defaultArena);
            setMemberships([{ profile_id: userProfile.id, arena_id: defaultArena.id }]);
            // The useEffect will handle refreshing the aluno profile
        }
    }
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
    await localApi.upsert('arenas', [newArena], 'all');
    setArena(newArena);
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

  // Simplified switch function
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
