import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { useToast } from './ToastContext';
import { supabaseApi } from '../lib/supabaseApi';
import { isBefore } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';
import { awardPointsForCompletedReservation } from '../utils/gamificationUtils';
import { AuthState, User, Profile, Arena, ArenaMembership, Aluno, Reserva, GamificationSettings, GamificationPointTransaction, Quadra, AtletaAluguel, Professor } from '../types';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [arena, setArena] = useState<Arena | null>(null);
  const [memberships, setMemberships] = useState<ArenaMembership[]>([]);
  const [allArenas, setAllArenas] = useState<Arena[]>([]);
  const [selectedArenaContext, setSelectedArenaContext] = useState<Arena | null>(null);
  const [alunoProfileForSelectedArena, setAlunoProfileForSelectedArena] = useState<Aluno | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quadraCount, setQuadraCount] = useState(0);
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [currentProfessorId, setCurrentProfessorId] = useState<string | null>(null);
  const [currentAtletaId, setCurrentAtletaId] = useState<string | null>(null);
  const { addToast } = useToast();

  const setupUserContext = useCallback(async (profileToSetup: Profile) => {
    const { data: allArenasData } = await supabaseApi.select<Arena>('arenas', 'all');
    const allArenas = allArenasData || [];
    setAllArenas(allArenas);

    if (profileToSetup.role === 'super_admin') {
        setArena(null);
        setSelectedArenaContext(null);
    } else if (profileToSetup.role === 'admin_arena') {
        const userArena = allArenas.find(a => a.owner_id === profileToSetup.id);
        setArena(userArena || null);
        setSelectedArenaContext(userArena || null);
    } else if (profileToSetup.role === 'funcionario') {
        const employeeArena = allArenas.find(a => a.id === profileToSetup.arena_id);
        setArena(null);
        setSelectedArenaContext(employeeArena || null);
    } else { // cliente, atleta, professor
        const [alunosRes, atletasRes, profsRes] = await Promise.all([
            supabaseApi.select<Aluno>('alunos', 'all'),
            supabaseApi.select<AtletaAluguel>('atletas_aluguel', 'all'),
            supabaseApi.select<Professor>('professores', 'all')
        ]);

        const alunoArenaIds = (alunosRes.data || []).filter(a => a.profile_id === profileToSetup.id).map(a => a.arena_id);
        const atletaArenaIds = (atletasRes.data || []).filter(a => a.profile_id === profileToSetup.id).map(a => a.arena_id);
        const profArenaIds = (profsRes.data || []).filter(p => p.profile_id === profileToSetup.id).map(p => p.arena_id);

        const myArenaIds = new Set([...alunoArenaIds, ...atletaArenaIds, ...profArenaIds]);

        const myArenas = allArenas.filter(a => myArenaIds.has(a.id));

        setMemberships(Array.from(myArenaIds).map(arenaId => ({ profile_id: profileToSetup.id, arena_id: arenaId })));
        
        const lastSelectedArenaId = localStorage.getItem('lastSelectedArenaId');
        const lastArena = lastSelectedArenaId ? myArenas.find(a => a.id === lastSelectedArenaId) : null;

        if (lastArena) {
            setSelectedArenaContext(lastArena);
        } else if (myArenas.length > 0) {
            setSelectedArenaContext(myArenas[0]);
        } else {
            setSelectedArenaContext(null);
        }
    }
  }, []);

  const refreshResourceCounts = useCallback(async () => {
    if (selectedArenaContext && (profile?.role === 'admin_arena' || profile?.role === 'funcionario')) {
        try {
            const [quadrasRes, profilesRes] = await Promise.all([
                supabaseApi.select<Quadra>('quadras', selectedArenaContext.id),
                supabaseApi.select<Profile>('profiles', 'all'),
            ]);
            const quadrasCount = quadrasRes.data?.length || 0;
            const teamMemberCount = profilesRes.data?.filter(p => p.arena_id === selectedArenaContext.id && p.role === 'funcionario').length || 0;
            setQuadraCount(quadrasCount);
            setTeamMemberCount(teamMemberCount);
        } catch (e) {
            console.error("Failed to refresh resource counts", e);
            setQuadraCount(0);
            setTeamMemberCount(0);
        }
    } else {
        setQuadraCount(0);
        setTeamMemberCount(0);
    }
  }, [selectedArenaContext, profile]);

  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        // Seeding desabilitado - dados agora no Supabase
        // const seedKey = 'initial_data_seeded_v15_persistent';
        // if (!localStorage.getItem(seedKey)) {
        //   await seedInitialData();
        //   localStorage.setItem(seedKey, 'true');
        // }

        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (!loggedInUserStr) {
            setIsLoading(false);
            return;
        }

        const loggedInProfile: Profile = JSON.parse(loggedInUserStr);
        
        // Validate profile still exists in database
        const { data: profilesData } = await supabaseApi.select<Profile>('profiles', 'all');
        const currentProfile = profilesData?.find(p => p.id === loggedInProfile.id);
        
        if (!currentProfile) {
          console.log('[AuthProvider] Profile not found in database, clearing localStorage');
          localStorage.removeItem('loggedInUser');
          setIsLoading(false);
          return;
        }

        const loggedInUser: User = { id: currentProfile.id, email: currentProfile.email, created_at: currentProfile.created_at };
        
        setUser(loggedInUser);
        setProfile(currentProfile);
        await setupUserContext(currentProfile);

      } catch (error) {
        console.error("Error during session initialization:", error);
        localStorage.removeItem('loggedInUser');
      } finally {
        setIsLoading(false);
      }
    };
    initializeSession();
  }, [setupUserContext]);

  const refreshAlunoProfile = useCallback(async () => {
    if (profile?.role === 'cliente' && selectedArenaContext) {
        const { data: alunos } = await supabaseApi.select<Aluno>('alunos', selectedArenaContext.id);
        const alunoProfile = alunos.find(a => a.profile_id === profile.id);
        setAlunoProfileForSelectedArena(alunoProfile || null);
    }
  }, [profile, selectedArenaContext]);

  useEffect(() => {
    const checkProfessionalRoles = async () => {
        if (!profile || !selectedArenaContext) {
            setCurrentProfessorId(null);
            setCurrentAtletaId(null);
            return;
        }

        const [profRes, atletaRes] = await Promise.all([
            supabaseApi.select<Professor>('professores', selectedArenaContext.id),
            supabaseApi.select<AtletaAluguel>('atletas_aluguel', selectedArenaContext.id)
        ]);

        const professorProfile = (profRes.data || []).find(p => p.profile_id === profile.id);
        const atletaProfile = (atletaRes.data || []).find(a => a.profile_id === profile.id);

        setCurrentProfessorId(professorProfile?.id || null);
        setCurrentAtletaId(atletaProfile?.id || null);
    };

    checkProfessionalRoles();
  }, [profile, selectedArenaContext]);

  useEffect(() => {
    if (!isLoading) {
      refreshResourceCounts();
      refreshAlunoProfile();
    }
  }, [isLoading, refreshResourceCounts, refreshAlunoProfile]);

  const processCompletedReservations = useCallback(async () => {
    if (!profile || !selectedArenaContext || profile.role !== 'admin_arena') {
      return;
    }

    try {
      const { data: settingsData } = await supabaseApi.select<GamificationSettings>('gamification_settings', selectedArenaContext.id);
      const settings = settingsData?.[0];
      if (!settings || !settings.is_enabled) return;

      const { data: allReservas } = await supabaseApi.select<Reserva>('reservas', selectedArenaContext.id);
      if (!allReservas || allReservas.length === 0) return;

      const now = new Date();
      const completedReservations = allReservas.filter(r => {
        if (r.status !== 'confirmada' && r.status !== 'realizada') return false;
        try {
          const endDateTime = parseDateStringAsLocal(`${r.date}T${r.end_time}`);
          return isBefore(endDateTime, now);
        } catch { return false; }
      });

      if (completedReservations.length === 0) return;

      const { data: transactions } = await supabaseApi.select<GamificationPointTransaction>('gamification_point_transactions', selectedArenaContext.id);
      const processedIds = new Set((transactions || []).filter(t => t.type === 'reservation_completed').map(t => t.related_reservation_id));
      
      const reservationsToProcess = completedReservations.filter(r => !r.id || !processedIds.has(r.id));
      
      if (reservationsToProcess.length > 0) {
        let pointsAwarded = false;
        for (const reserva of reservationsToProcess) {
          await awardPointsForCompletedReservation(reserva, selectedArenaContext.id);
          pointsAwarded = true;
        }
        if (pointsAwarded) {
          console.log(`[AuthContext] ${reservationsToProcess.length} reservation(s) processed for gamification points.`);
        }
      }
    } catch (error) {
      console.error("Error processing completed reservations in AuthContext:", error);
    }
  }, [profile, selectedArenaContext]);

  useEffect(() => {
    if (profile?.role === 'admin_arena') {
      const interval = setInterval(() => {
        processCompletedReservations();
      }, 60 * 1000); // Check every minute

      processCompletedReservations(); // Also run on load

      return () => clearInterval(interval);
    }
  }, [processCompletedReservations, profile]);

  const signUp = async (email: string, password: string, name?: string, role: 'cliente' | 'admin_arena' = 'cliente') => {
    return Promise.resolve();
  };

  const signIn = async (email: string, password: string): Promise<Profile | null> => {
    setIsLoading(true);
    try {
        let { data: allProfiles } = await supabaseApi.select<Profile>('profiles', 'all');
        allProfiles = allProfiles || [];

        if (email.toLowerCase() === 'superadmin@matchplay.com' && !allProfiles.some(p => p.email.toLowerCase() === 'superadmin@matchplay.com')) {
            const superAdminProfile: Profile = { id: 'profile_superadmin_01', name: 'Super Admin', email: 'superadmin@matchplay.com', role: 'super_admin', avatar_url: null, created_at: new Date().toISOString() };
            await supabaseApi.upsert('profiles', [superAdminProfile], 'all');
            const { data: updatedProfiles } = await supabaseApi.select<Profile>('profiles', 'all');
            allProfiles = updatedProfiles || [];
        }

        const userProfile = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());

        if (!userProfile) {
            throw new Error("Usuário ou senha inválidos.");
        }
        
        await setupUserContext(userProfile);
        
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
    localStorage.removeItem('lastSelectedArenaId');
    setUser(null); setProfile(null); setArena(null); setMemberships([]);
    setSelectedArenaContext(null); setAlunoProfileForSelectedArena(null);
  };

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updatedProfile };
    await supabaseApi.upsert('profiles', [newProfile], 'all');
    setProfile(newProfile);
    localStorage.setItem('loggedInUser', JSON.stringify(newProfile));
    addToast({ message: 'Perfil atualizado!', type: 'success' });
  };

  const updateArena = async (updatedArenaData: Partial<Arena>) => {
    if (!arena) return;
    const newArena = { ...arena, ...updatedArenaData };
    
    const updatedArenas = allArenas.map(a => a.id === newArena.id ? newArena : a);
    
    await supabaseApi.upsert('arenas', updatedArenas, 'all');
    
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
    if (arena) {
        localStorage.setItem('lastSelectedArenaId', arena.id);
    } else {
        localStorage.removeItem('lastSelectedArenaId');
    }
  };
  
  const authState: AuthState = { user, profile, arena, memberships, selectedArenaContext, isLoading };

  const value = { ...authState, allArenas, alunoProfileForSelectedArena, quadraCount, teamMemberCount, refreshResourceCounts, signUp, signIn, signOut, updateProfile, updateArena, followArena, unfollowArena, switchArenaContext, refreshAlunoProfile, currentProfessorId, currentAtletaId };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
