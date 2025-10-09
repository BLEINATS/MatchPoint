# MachPoint - Sistema de Gestão de Arenas Esportivas

## Visão Geral
MachPoint é um sistema completo de gestão para arenas esportivas, desenvolvido em React com TypeScript e Vite. O sistema permite o gerenciamento de quadras, reservas, alunos, eventos e torneios.

## Estado Atual do Projeto
**Data da restauração:** 25 de setembro de 2025
**Status:** ✅ Projeto restaurado com sucesso do repositório GitHub
**URL do repositório:** https://github.com/BLEINATS/MachPoint

### Estrutura do Projeto
- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** Tailwind CSS + Framer Motion
- **Banco de dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Roteamento:** React Router DOM
- **Charts:** ECharts
- **Ícones:** Lucide React

### Principais Funcionalidades
- **Dashboard Cliente:** Painel personalizado para clientes e alunos
- **Gestão de Quadras:** Cadastro e gerenciamento de quadras esportivas
- **Sistema de Reservas:** Agendamento com regras de preços dinâmicas
- **Gestão de Alunos:** Controle de mensalidades e créditos
- **Eventos e Torneios:** Organização de competições
- **Sistema de Créditos:** Cancelamentos e reembolsos automáticos

## Arquitetura Técnica

### Estrutura de Pastas
```
src/
├── components/           # Componentes React reutilizáveis
│   ├── Alunos/          # Gestão de alunos e turmas
│   ├── Auth/            # Autenticação
│   ├── Client/          # Dashboard do cliente
│   ├── Dashboard/       # Analytics e estatísticas
│   ├── Events/          # Eventos e torneios
│   ├── Forms/           # Componentes de formulários
│   ├── Layout/          # Layout base
│   ├── Quadras/         # Gestão de quadras
│   ├── Reservations/    # Sistema de reservas
│   └── Settings/        # Configurações
├── context/             # Context API (Auth, Theme, Toast)
├── lib/                 # Configurações externas (Supabase)
├── pages/               # Páginas principais
├── types/               # Definições TypeScript
└── utils/               # Utilitários e helpers
```

### Base de Dados
O projeto utiliza Supabase com múltiplas migrações para:
- Gestão de arenas e perfis
- Sistema de quadras e preços
- Reservas e recorrências
- Sistema de créditos
- Eventos e torneios
- RLS (Row Level Security) policies

## Configuração de Desenvolvimento

### Servidor Local
- **Host:** 0.0.0.0
- **Porta:** 5000
- **Hot Reload:** Configurado com polling para ambiente Replit

### Workflow Configurado
```bash
npm run dev  # Inicia o servidor de desenvolvimento
```

## Últimas Alterações
**25/09/2025:**
- ✅ Projeto restaurado do GitHub com sucesso
- ✅ Dependências instaladas com `--legacy-peer-deps`
- ✅ Corrigido problema de export/import do ClientDashboard
- ✅ Adicionado tipo `Reserva` como alias de `Reservation`
- ✅ Workflow configurado e executando na porta 5000
- ✅ Supabase configurado e conectado

## Próximos Passos
1. Revisar e resolver avisos LSP restantes
2. Testar funcionalidades principais
3. Verificar integrações com Supabase
4. Configurar variáveis de ambiente se necessário

## Notas Técnicas
- ECharts versão 6.x com echarts-for-react pode gerar avisos de peer dependency
- React Router futuro flags configuráveis para v7
- Projeto otimizado para desenvolvimento no Replit com allowedHosts automático
