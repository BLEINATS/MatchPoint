import { localApi } from './localApi';
import { Arena, Profile, Quadra, PricingRule, PlanoAula, Aluno, Friendship, Reserva, GamificationSettings, GamificationLevel, GamificationReward, GamificationAchievement, Professor, Turma } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { subDays, format, addDays } from 'date-fns';

const createMinimalPricingRule = (quadraId: string, arenaId: string): PricingRule[] => [
  {
    id: uuidv4(),
    client_id: uuidv4(),
    quadra_id: quadraId,
    arena_id: arenaId,
    sport_type: 'Qualquer Esporte',
    start_time: '00:00',
    end_time: '23:59',
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    price_single: 90,
    price_monthly: 0,
    is_active: true,
    is_default: true,
  }
];

export const seedInitialData = async () => {
  // localStorage.clear(); // This was causing data loss on reload. It is now removed.
  console.log("Seeding initial data. All previous data cleared.");
  
  // 1. Profiles
  const adminProfile: Profile = { id: 'profile_admin_01', name: 'Admin MatchPlay', email: 'admin@matchplay.com', role: 'admin_arena', avatar_url: null, created_at: new Date().toISOString() };
  const viniProfile: Profile = { id: 'profile_vini_01', name: 'Vini Bleinat', email: 'vini@bleinat.com.br', role: 'cliente', avatar_url: null, created_at: new Date().toISOString(), phone: '(11) 98765-4321', notification_preferences: { game_invites: true, friend_requests: true, arena_news: true } };
  const anaProfile: Profile = { id: 'profile_ana_01', name: 'Ana Pereira', email: 'ana@email.com', role: 'cliente', avatar_url: null, created_at: new Date().toISOString(), phone: '(21) 91234-5678', notification_preferences: { game_invites: true, friend_requests: true, arena_news: true } };
  const brunoProfile: Profile = { id: 'profile_bruno_01', name: 'Bruno Lima', email: 'bruno@email.com', role: 'cliente', avatar_url: null, created_at: new Date().toISOString(), phone: '(31) 95555-4444', notification_preferences: { game_invites: true, friend_requests: true, arena_news: true } };
  
  await localApi.upsert('profiles', [adminProfile, viniProfile, anaProfile, brunoProfile], 'all', true);

  // 2. Arena
  const arenaId = `arena_${uuidv4()}`;
  const arena: Arena = {
    id: arenaId,
    owner_id: adminProfile.id,
    name: 'Arena MatchPlay',
    slug: 'arena-matchplay',
    city: 'São Paulo',
    state: 'SP',
    created_at: new Date().toISOString(),
    cancellation_policy: 'Padrão',
    terms_of_use: 'Padrão'
  };
  await localApi.upsert('arenas', [arena], 'all', true);

  // 3. Quadra
  const quadraId = `quadra_${uuidv4()}`;
  const quadra: Quadra = {
    id: quadraId,
    arena_id: arenaId,
    name: 'Quadra Central',
    court_type: 'Areia',
    sports: ['Beach Tennis'],
    status: 'ativa',
    description: 'Quadra principal.',
    amenities: ['Iluminação'],
    horarios: {
      weekday: { start: '08:00', end: '23:00' },
      saturday: { start: '08:00', end: '22:00' },
      sunday: { start: '08:00', end: '20:00' },
    },
    booking_duration_minutes: 60,
    capacity: 4,
    photos: [],
    cover_photo: null,
    created_at: new Date().toISOString(),
    pricing_rules: createMinimalPricingRule(quadraId, arenaId),
  };
  await localApi.upsert('quadras', [quadra], arenaId, true);

  // 4. Professor
  const profId = `prof_${uuidv4()}`;
  const professor: Omit<Professor, 'id' | 'created_at'> = {
    arena_id: arenaId,
    name: 'Klaus Bleinat',
    email: 'klaus@email.com',
    specialties: ['Beach Tennis', 'Futevôlei'],
    status: 'ativo',
  };
  await localApi.upsert('professores', [professor], arenaId, true);

  // 5. Turma
  const turmaId = `turma_${uuidv4()}`;
  const turma: Omit<Turma, 'id' | 'created_at'> = {
    arena_id: arenaId,
    name: 'Beach Tennis - Noite',
    sport: 'Beach Tennis',
    professor_id: profId,
    quadra_id: quadraId,
    daysOfWeek: [1, 3], // Monday, Wednesday
    start_time: '19:00',
    end_time: '21:00',
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    alunos_por_horario: 8,
    matriculas: [],
  };
  await localApi.upsert('turmas', [turma], arenaId, true);

  // 6. Planos de Aula
  const planoMensal1x: PlanoAula = { id: `plano_${uuidv4()}`, arena_id: arenaId, name: 'Plano Mensal - 1x/semana', duration_type: 'mensal', price: 280, num_aulas: 4, description: 'Pacote com 4 aulas no mês.', is_active: true, created_at: new Date().toISOString() };
  const planoMensal2x: PlanoAula = { id: `plano_${uuidv4()}`, arena_id: arenaId, name: 'Plano Mensal - 2x/semana', duration_type: 'mensal', price: 480, num_aulas: 8, description: 'Pacote com 8 aulas no mês.', is_active: true, created_at: new Date().toISOString() };
  const planoAnualLivre: PlanoAula = { id: `plano_${uuidv4()}`, arena_id: arenaId, name: 'Plano Anual - Livre', duration_type: 'anual', price: 5000, num_aulas: null, description: 'Acesso livre às aulas, limitado a uma por dia.', is_active: true, created_at: new Date().toISOString() };
  
  await localApi.upsert('planos_aulas', [planoMensal1x, planoMensal2x, planoAnualLivre], arenaId, true);

  // 7. Alunos e Clientes
  const alunos: Omit<Aluno, 'id' | 'created_at'>[] = [
    {
      arena_id: arenaId, profile_id: viniProfile.id, name: viniProfile.name, email: viniProfile.email, phone: viniProfile.phone, status: 'ativo',
      sport: 'Beach Tennis', plan_id: planoAnualLivre.id, plan_name: planoAnualLivre.name, monthly_fee: planoAnualLivre.price / 12,
      aulas_restantes: null, 
      aulas_agendadas: [
        { turma_id: turmaId, date: format(subDays(new Date(), 9), 'yyyy-MM-dd'), time: '20:00' },
        { turma_id: turmaId, date: format(subDays(new Date(), 7), 'yyyy-MM-dd'), time: '19:00' },
        { turma_id: turmaId, date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), time: '19:00' },
        { turma_id: turmaId, date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), time: '19:00' },
      ], 
      join_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'), 
      credit_balance: 50, gamification_points: 1250,
    },
    {
      arena_id: arenaId, profile_id: anaProfile.id, name: anaProfile.name, email: anaProfile.email, phone: anaProfile.phone, status: 'ativo',
      sport: 'Beach Tennis', plan_id: planoMensal1x.id, plan_name: planoMensal1x.name, monthly_fee: planoMensal1x.price,
      aulas_restantes: 4, aulas_agendadas: [], join_date: new Date().toISOString().split('T')[0], credit_balance: 0, gamification_points: 800,
    },
    {
      arena_id: arenaId, profile_id: brunoProfile.id, name: brunoProfile.name, email: brunoProfile.email, phone: brunoProfile.phone, status: 'ativo',
      sport: 'Futevôlei', plan_id: null, plan_name: 'Avulso', monthly_fee: 0,
      aulas_restantes: 0, aulas_agendadas: [], join_date: new Date().toISOString().split('T')[0], credit_balance: 15, gamification_points: 200,
    },
    {
      arena_id: arenaId, profile_id: null, name: 'Carla Dias', email: 'carla.dias@example.com', phone: '(41) 99999-8888', status: 'ativo',
      sport: 'Beach Tennis', plan_id: null, plan_name: 'Avulso', monthly_fee: 0,
      aulas_restantes: 0, aulas_agendadas: [], join_date: new Date().toISOString().split('T')[0], credit_balance: 0, gamification_points: 0,
    },
    {
      arena_id: arenaId, profile_id: null, name: 'Fernando Costa', email: 'fernando.costa@example.com', phone: '(51) 98888-7777', status: 'inativo',
      sport: 'Padel', plan_id: null, plan_name: 'Avulso', monthly_fee: 0,
      aulas_restantes: 0, aulas_agendadas: [], join_date: new Date().toISOString().split('T')[0], credit_balance: 0, gamification_points: 50,
    }
  ];
  await localApi.upsert('alunos', alunos, arenaId, true);

  // 8. Friendships
  const friendships: Friendship[] = [
    { id: uuidv4(), user1_id: viniProfile.id, user2_id: anaProfile.id, status: 'accepted', requested_by: viniProfile.id, created_at: new Date().toISOString() },
    { id: uuidv4(), user1_id: brunoProfile.id, user2_id: viniProfile.id, status: 'pending', requested_by: brunoProfile.id, created_at: new Date().toISOString() },
  ];
  await localApi.upsert('friendships', friendships, 'all', true);

  // 9. Sample Reservation with Participants
  const sampleReservation: Reserva = {
    id: `reserva_${uuidv4()}`,
    arena_id: arenaId,
    quadra_id: quadraId,
    profile_id: viniProfile.id,
    clientName: viniProfile.name,
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    start_time: '19:00',
    end_time: '20:00',
    status: 'confirmada',
    type: 'avulsa',
    total_price: 90,
    payment_status: 'pendente',
    sport_type: 'Beach Tennis',
    created_at: new Date().toISOString(),
    created_by_name: viniProfile.name,
    participants: [
      { profile_id: viniProfile.id, name: viniProfile.name, avatar_url: viniProfile.avatar_url, status: 'accepted', payment_status: 'pendente' },
      { profile_id: anaProfile.id, name: anaProfile.name, avatar_url: anaProfile.avatar_url, status: 'pending', payment_status: 'pendente' },
      { profile_id: brunoProfile.id, name: brunoProfile.name, avatar_url: brunoProfile.avatar_url, status: 'pending', payment_status: 'pendente' },
    ],
    invites_closed: false,
  };
  await localApi.upsert('reservas', [sampleReservation], arenaId, true);
  
  // 10. Gamification Settings
  const gamificationSettings: GamificationSettings = {
    arena_id: arenaId,
    is_enabled: true,
    points_per_reservation: 10,
    points_per_real: 1,
  };
  await localApi.upsert('gamification_settings', [gamificationSettings], arenaId, true);

  // 11. Gamification Levels
  const levels: Omit<GamificationLevel, 'id'>[] = [
    { arena_id: arenaId, name: 'Bronze', points_required: 0, level_rank: 1 },
    { arena_id: arenaId, name: 'Prata', points_required: 1000, level_rank: 2 },
    { arena_id: arenaId, name: 'Ouro', points_required: 5000, level_rank: 3 },
  ];
  await localApi.upsert('gamification_levels', levels, arenaId, true);

  // 12. Gamification Rewards
  const rewards: Omit<GamificationReward, 'id'>[] = [
    { arena_id: arenaId, title: 'Desconto de R$10', description: 'Use seus pontos para ganhar um desconto na sua próxima reserva.', points_cost: 500, type: 'discount', value: 10, quantity: null, is_active: true },
    { arena_id: arenaId, title: '1 Hora Grátis', description: 'Troque seus pontos por uma hora de jogo por nossa conta!', points_cost: 1200, type: 'free_hour', value: 1, quantity: 10, is_active: true },
  ];
  await localApi.upsert('gamification_rewards', rewards, arenaId, true);

  // 13. Gamification Achievements
  const achievements: Omit<GamificationAchievement, 'id'>[] = [
    { arena_id: arenaId, name: 'Primeira Reserva', description: 'Bem-vindo! Ganhe pontos na sua primeira reserva.', type: 'first_reservation', points_reward: 100, icon: 'PartyPopper' },
    { arena_id: arenaId, name: 'Fidelidade Bronze', description: 'Complete 10 reservas e mostre sua lealdade.', type: 'loyalty_10', points_reward: 250, icon: 'Medal' },
    { arena_id: arenaId, name: 'Fidelidade Prata', description: 'Incrível! 50 reservas completadas.', type: 'loyalty_50', points_reward: 1000, icon: 'Award' },
    { arena_id: arenaId, name: 'Fidelidade Ouro', description: 'Lenda da arena! 100 reservas completadas.', type: 'loyalty_100', points_reward: 2500, icon: 'Trophy' },
  ];
  await localApi.upsert('gamification_achievements', achievements, arenaId, true);

  // Clear other tables
  await localApi.upsert('atletas_aluguel', [], arenaId, true);
  await localApi.upsert('finance_transactions', [], arenaId, true);
  
  console.log("Seeding with test users and gamification complete.");
};
