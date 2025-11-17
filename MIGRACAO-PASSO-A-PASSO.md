# 🚀 Migração para Supabase - Guia Completo

## ✅ Status Atual
- ✅ Conexão com Supabase: **Funcionando**
- ⚠️ Migração de dados: **Precisa de 2 correções**

---

## 📝 Próximos Passos (5 minutos)

### Passo 1: Executar Script SQL de Correção ⚡

1. **Abra**: https://supabase.com/dashboard → Seu Projeto → **SQL Editor**
2. **Copie** todo o conteúdo do arquivo **`supabase-schema-fix-2.sql`**
3. **Cole** no editor e clique em **Run** ▶️

**O que esse script faz:**
- ✅ Adiciona `clientPhone` em reservas
- ✅ Adiciona `end_time` em turmas e torneios
- ✅ Corrige `gamification_settings` com campo `id`

---

### Passo 2: Atualizar Página de Migração 🔄

A página de migração foi atualizada com **conversão automática de IDs**!

**Novidade:**
- 🔄 IDs customizados como "profile_admin_01" são **automaticamente convertidos** para UUIDs válidos
- 🔄 Mapeamento consistente: mesmo ID sempre vira o mesmo UUID
- 📊 Logs mostram conversões no console (F12)

---

### Passo 3: Executar Migração Novamente ✨

1. **Recarregue** a página: http://localhost:5000/migration
2. **Clique** em "Testar Conexão" (deve continuar ✅)
3. **Clique** em "Iniciar Migração"
4. **Acompanhe** no console (F12) as conversões de ID

**Exemplo de saída:**
```
🔄 Convertendo ID customizado: profile_admin_01 → 3a7f5c2e-8b1d-5e9a-a3c4-f6d8e2b9c1a7
🔄 Convertendo ID customizado: arena_55ba955e... → 55ba955e-55f8-464b-b073-34546b09321c
✅ profiles migrado com sucesso (5 registros)
✅ arenas migrado com sucesso (2 registros)
```

---

## 🎯 Resultado Esperado

Após os passos acima:

**✅ Migrações bem-sucedidas:**
- profiles (todos os usuários)
- arenas (todas as arenas)
- subscriptions (assinaturas)
- plans (planos)
- quadras (quadras de todas arenas)
- reservas (reservas com conversão de IDs)
- alunos (estudantes/jogadores)
- professores (instrutores)
- torneios (torneios)
- gamificação (settings, levels, rewards, achievements)
- ... e muito mais!

**⚠️ Possíveis erros residuais:**
- Alguns registros com dados incompletos podem falhar
- Isso é normal e não afeta o funcionamento geral

---

## 🔍 Verificar Dados Migrados

### No Supabase Dashboard:
1. Vá em **Table Editor**
2. Selecione uma tabela (ex: `profiles`, `arenas`, `quadras`)
3. Veja os dados migrados! 🎉

### Exemplo de query SQL:
```sql
-- Ver todos os perfis migrados
SELECT id, name, email, role FROM profiles;

-- Ver todas as arenas
SELECT id, name, sport_types FROM arenas;

-- Ver reservas com informações de quadra
SELECT r.id, r.status, r.date, q.name as quadra
FROM reservas r
JOIN quadras q ON r.quadra_id = q.id
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Erro: "Could not find column X"
- Execute novamente `supabase-schema-fix-2.sql`
- Confirme que o script rodou sem erros

### Erro: "invalid input syntax for type uuid"
- Agora resolvido com conversão automática! ✅
- Se ainda aparecer, recarregue a página e tente novamente

### Migração parcial (algumas tabelas falharam)
- **Isso é normal!** Nem todos os dados do localStorage são válidos
- As tabelas que migraram com sucesso estão funcionando
- Você pode adicionar dados novos diretamente no Supabase

---

## 📊 Próximos Passos Após Migração

### 1. Validar Dados
- Acesse o Supabase Dashboard → Table Editor
- Verifique se seus dados principais estão lá

### 2. Testar API
```typescript
import { supabaseApi } from '../lib/supabaseApi';

// Buscar quadras
const { data } = await supabaseApi.select('quadras', 'seu-arena-id');
console.log('Quadras migradas:', data);
```

### 3. Gradualmente Substituir localStorage
- Comece com uma funcionalidade simples (ex: listar quadras)
- Substitua `localApi` por `supabaseApi`
- Teste antes de mover para próxima funcionalidade

---

## 🎉 Sucesso!

Após esses passos, você terá:
- ✅ Banco de dados PostgreSQL completo no Supabase
- ✅ Dados migrados do localStorage
- ✅ API pronta para uso (`supabaseApi`)
- ✅ Base para expandir para produção

---

## 📝 Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `supabase-schema-fix-2.sql` | Script SQL de correção |
| `BACKEND-SUPABASE-GUIDE.md` | Guia completo da API |
| `CHANGELOG-SUPABASE-BACKEND.md` | Limitações conhecidas |
| `src/utils/migrateToSupabase.ts` | Script de migração atualizado |

---

**Tempo total estimado: 5-10 minutos** ⏱️

Boa sorte! 🚀
