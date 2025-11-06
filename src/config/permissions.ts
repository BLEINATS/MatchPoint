import { ProfilePermissions } from '../types';

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
