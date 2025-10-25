import { PostgrestError } from "@supabase/supabase-js";

export type PermissionLevel = 'none' | 'view' | 'edit';

export interface ProfilePermissions {
  reservas: PermissionLevel;
  quadras: PermissionLevel;
  gerenciamento_arena: PermissionLevel;
  torneios: PermissionLevel;
  eventos: PermissionLevel;
  financeiro: PermissionLevel;
  gamification: 'none' | 'edit';
  planos_aulas: 'none' | 'edit';
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  arena: Arena | null;
  memberships: ArenaMembership[];
  selectedArenaContext: Arena | null;
  isLoading: boolean;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface CreditCardInfo {
  id: string;
  last4: string;
  brand: string;
  cardholder_name: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'cliente' | 'admin_arena' | 'professor' | 'atleta' | 'funcionario' | 'super_admin';
  arena_id?: string;
  permissions?: ProfilePermissions;
  phone?: string | null;
  clientType?: 'cliente' | 'aluno' | 'mensalista';
  birth_date?: string | null;
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informado' | null;
  cpf?: string | null;
  created_at: string;
  credit_cards?: CreditCardInfo[];
  notification_preferences?: {
    game_invites?: boolean;
    friend_requests?: boolean;
    arena_news?: boolean;
  };
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  arena_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled';
  start_date: string;
  end_date: string | null;
}

export interface Arena {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  main_image?: string;
  cnpj_cpf?: string;
  responsible_name?: string;
  contact_phone?: string;
  public_email?: string;
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city: string;
  state: string;
  google_maps_link?: string;
  cancellation_policy?: string;
  terms_of_use?: string;
  created_at: string;
  asaas_api_key?: string;
  status?: 'active' | 'suspended';
  plan_id?: string;
  billing_day?: number;
  billing_grace_period_value?: number;
  billing_grace_period_unit?: 'hours' | 'days';
  billing_warning_1_enabled?: boolean;
  billing_warning_2_enabled?: boolean;
  billing_warning_3_enabled?: boolean;
  single_booking_payment_window_minutes?: number;
}

export interface ArenaMembership {
  profile_id: string;
  arena_id: string;
}

export interface Quadra {
  id: string;
  arena_id: string;
  name: string;
  court_type: string;
  sports: string[];
  status: 'ativa' | 'inativa' | 'manutencao';
  description: string;
  rules?: string;
  amenities: string[];
  horarios: {
    weekday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };
  booking_duration_minutes: number;
  capacity?: number;
  photos: string[];
  cover_photo: string | null;
  created_at: string;
  pricing_rules: PricingRule[];
}

export interface PricingRule {
  id?: string;
  client_id?: string;
  quadra_id: string;
  arena_id: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  price_single: number;
  price_monthly: number;
  is_active: boolean;
  is_default: boolean;
}

export interface DurationDiscount {
  id: string;
  arena_id: string;
  duration_hours: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface Aluno {
  id: string;
  arena_id: string;
  profile_id?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informado' | null;
  status: 'ativo' | 'inativo' | 'experimental';
  sport: string | null;
  plan_id: string | null;
  plan_name: string;
  monthly_fee: number | null;
  aulas_restantes: number | null;
  aulas_agendadas: { turma_id: string; date: string; time: string }[];
  attendance_history?: { date: string; status: 'present' | 'absent' }[];
  join_date: string;
  created_at: string;
  avatar_url?: string;
  credit_balance?: number;
  gamification_points?: number;
  gamification_level_id?: string | null;
  gamification_levels?: { name: string } | null;
  gamification_point_transactions?: { points: number }[];
}

export interface Professor {
  id: string;
  arena_id: string;
  profile_id?: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  specialties: string[];
  status: 'ativo' | 'inativo';
  nivel_experiencia?: 'Júnior' | 'Pleno' | 'Sênior' | null;
  valor_hora_aula?: number | null;
  metodologia?: string | null;
  portfolio_url?: string | null;
  comissao?: number;
  created_at: string;
}

export interface AtletaAluguel {
  id: string;
  arena_id: string;
  name: string;
  email?: string | null;
  phone: string | null;
  avatar_url?: string | null;
  profile_id?: string | null;
  esportes: { sport: string; position: string }[];
  nivel_tecnico?: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Profissional' | null;
  experiencia_anos?: number | null;
  raio_atuacao?: number | null;
  taxa_hora: number;
  comissao_arena: number;
  biografia?: string | null;
  certificacoes?: string | null;
  palavras_chave?: string[];
  status: 'disponivel' | 'indisponivel';
  created_at: string;
  partidas_jogadas?: number;
}

export interface PlanoAula {
  id: string;
  arena_id: string;
  name: string;
  duration_type: 'avulso' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
  price: number;
  num_aulas: number | null;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Matricula {
  dayOfWeek: number;
  time: string; // e.g., "18:00"
  student_ids: string[];
}

export interface TurmaSchedule {
  day: number;
  start_time: string;
  end_time: string;
}

export interface Turma {
  id: string;
  arena_id: string;
  name: string;
  sport: string;
  professor_id: string;
  quadra_id: string;
  schedule: TurmaSchedule[];
  start_date: string;
  end_date?: string | null;
  alunos_por_horario: number;
  matriculas: Matricula[];
  created_at: string;
  // Deprecated fields for migration
  daysOfWeek?: number[];
  start_time?: string;
  end_time?: string;
}

export type ReservationType = 'avulsa' | 'aula' | 'torneio' | 'evento' | 'bloqueio';
export type RecurringType = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface Reserva {
  id: string;
  arena_id: string;
  quadra_id: string;
  profile_id?: string | null;
  aluno_id?: string | null;
  turma_id?: string | null;
  torneio_id?: string | null;
  evento_id?: string | null;
  clientName: string;
  clientPhone?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'confirmada' | 'pendente' | 'cancelada' | 'realizada' | 'aguardando_aceite_profissional' | 'aguardando_pagamento';
  type: ReservationType;
  total_price?: number;
  credit_used?: number;
  payment_status?: 'pago' | 'pendente' | 'parcialmente_pago';
  payment_deadline?: string | null;
  sport_type?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringType?: RecurringType;
  recurringEndDate?: string | null;
  masterId?: string;
  master_id?: string;
  created_at: string;
  created_by_name?: string | null;
  updated_at?: string;
  rented_items?: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[] | null;
  atleta_aluguel_id?: string | null;
  atleta_aceite_status?: 'pendente' | 'aceito' | 'recusado' | null;
  participants?: {
    profile_id: string;
    name: string;
    avatar_url: string | null;
    status: 'pending' | 'accepted' | 'declined';
    payment_status: 'pendente' | 'pago';
  }[] | null;
  invites_closed?: boolean;
}

// Alias para compatibilidade
export type Reservation = Reserva;

export interface CreditTransaction {
  id?: string;
  aluno_id: string;
  arena_id: string;
  amount: number;
  type: 'cancellation_credit' | 'manual_adjustment' | 'reservation_payment' | 'goodwill_credit';
  description?: string;
  related_reservation_id?: string;
  created_at?: string;
}

export interface RentalItem {
  id: string;
  arena_id: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
}

export type TorneioTipo = 'torneio' | 'campeonato' | 'clinica' | 'evento_especial';
export type TorneioStatus = 'planejado' | 'inscricoes_abertas' | 'em_andamento' | 'concluido' | 'cancelado';
export type TorneioModality = 'individual' | 'duplas' | 'equipes';
export type TorneioCategoryGroup = 'Masculino' | 'Feminino' | 'Mista';
export const TORNEIO_CATEGORY_GROUPS: TorneioCategoryGroup[] = ['Masculino', 'Feminino', 'Mista'];
export const TORNEIO_CATEGORY_LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Amador', 'Profissional', 'Carregador'];

export interface TorneioCategory {
  id: string;
  group: TorneioCategoryGroup;
  level: string;
  prize_1st?: string;
  prize_2nd?: string;
  prize_3rd?: string;
  third_place_winner_id?: string | null;
}

export interface Torneio {
  id: string;
  arena_id: string;
  name: string;
  type: TorneioTipo;
  status: TorneioStatus;
  modality: TorneioModality;
  team_size?: number;
  start_date: string;
  end_date: string;
  description: string;
  quadras_ids: string[];
  start_time: string;
  end_time: string;
  categories: TorneioCategory[];
  max_participants: number;
  registration_fee: number;
  participants: Participant[];
  matches: Match[];
  expenses?: { id: string; description: string; amount: number }[];
  sponsors?: { id: string; name: string; amount: number }[];
  created_at: string;
}

export type EventoTipoPrivado = 'festa' | 'corporativo' | 'aniversario' | 'show' | 'outro';
export type EventoStatus = 'orcamento' | 'pendente' | 'confirmado' | 'realizado' | 'concluido' | 'cancelado';

export interface Evento {
  id: string;
  arena_id: string;
  name: string;
  type: EventoTipoPrivado;
  status: EventoStatus;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  courtStartTime?: string;
  courtEndTime?: string;
  expectedGuests: number;
  quadras_ids: string[];
  additionalSpaces: string[];
  services: { name: string; price: number; included: boolean }[];
  totalValue: number;
  depositValue: number;
  discount?: number;
  paymentConditions: string;
  notes: string;
  checklist: { id: string; text: string; completed: boolean }[];
  payments: { id: string; date: string; amount: number; method: string }[];
  created_at: string;
}

export interface Participant {
  id: string;
  categoryId: string;
  name: string; // Team name or individual's name
  players: {
    name: string;
    aluno_id: string | null;
    phone?: string | null;
  }[]; // List of player objects
  email: string;
  checked_in: boolean;
  on_waitlist?: boolean;
  ranking_points?: number;
  payment_status?: 'pendente' | 'pago';
  payment_method?: 'pix' | 'cartao' | 'dinheiro' | null;
}

export interface Match {
  id: string;
  categoryId: string;
  round: number;
  matchNumber: number;
  participant_ids: (string | null)[];
  score: (number | null)[];
  winner_id: string | null;
  nextMatchId: string | null;
  quadra_id?: string | null;
  date?: string | null;
  start_time?: string | null;
}

export interface Notificacao {
  id: string;
  arena_id: string;
  profile_id?: string | null;
  message: string;
  type: string;
  read: boolean;
  link_to?: string | null;
  created_at: string;
}

// Gamification Types
export interface GamificationSettings {
  arena_id: string;
  is_enabled: boolean;
  points_per_reservation: number;
  points_per_real: number;
}

export interface GamificationLevel {
  id: string;
  arena_id: string;
  name: string;
  points_required: number;
  level_rank: number;
}

export interface GamificationReward {
  id: string;
  arena_id: string;
  title: string;
  description: string;
  points_cost: number;
  type: 'discount' | 'free_hour' | 'free_item';
  value: number | null;
  quantity: number | null;
  is_active: boolean;
}

export interface GamificationAchievement {
  id: string;
  arena_id: string;
  name: string;
  description: string;
  type: 'first_reservation' | 'play_all_courts' | 'weekly_frequency' | 'loyalty_10' | 'loyalty_50' | 'loyalty_100';
  points_reward: number;
  icon: string;
}

export interface AlunoAchievement {
  aluno_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface GamificationPointTransaction {
  id: string;
  arena_id: string;
  aluno_id: string;
  points: number;
  type: 'reservation_created' | 'reservation_completed' | 'manual_adjustment' | 'achievement_unlocked' | 'reward_redemption' | 'cancellation_deduction';
  description: string;
  related_reservation_id: string | null;
  related_achievement_id: string | null;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  arena_id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user1_id: string; // profile_id
  user2_id: string; // profile_id
  status: 'pending' | 'accepted';
  requested_by: string; // profile_id of the requester
  created_at: string;
}

export type SupabaseData<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

export type SupabaseSingleData<T> = {
  data: T | null;
  error: PostgrestError | null;
};
