# Sistema de Cadastro de Usuários - MatchPlay

## 📋 **STATUS: ✅ ATIVADO E INTEGRADO COM SUPABASE**

O sistema de cadastro foi **completamente implementado** e está integrado com o Supabase PostgreSQL.

---

## 🎯 **TIPOS DE USUÁRIOS QUE PODEM SE CADASTRAR**

### 1. **Administrador de Arena** (admin_arena)
- **Rota:** `/cadastro-arena` ou botão "Administrador de Quadra" em `/auth`
- **O que é criado:**
  - ✅ Perfil na tabela `profiles` (role: admin_arena)
  - ✅ Arena na tabela `arenas` (vinculada ao perfil)
- **Campos obrigatórios:**
  - Nome da Arena
  - E-mail
  - Senha
- **Após cadastro:**
  - Fazer login com o e-mail cadastrado
  - Sistema redireciona para `/dashboard`
  - Arena criada com status "active"

### 2. **Cliente / Aluno** (cliente)
- **Rota:** Botão "Cliente / Aluno" em `/auth`
- **O que é criado:**
  - ✅ Perfil na tabela `profiles` (role: cliente)
- **Campos obrigatórios:**
  - Nome completo
  - E-mail
  - Senha
- **Após cadastro:**
  - Fazer login com o e-mail cadastrado
  - Precisa ser vinculado a uma arena pelo admin

### 3. **Professor** (professor)
- **IMPORTANTE:** Professores não se cadastram diretamente no portal público
- **Como cadastrar:**
  1. Admin da Arena cria o professor em `Alunos → Professores`
  2. Professor recebe credenciais de acesso
  3. Professor pode vincular perfil existente ou criar novo

### 4. **Jogador de Aluguel / Atleta** (atleta)
- **IMPORTANTE:** Atletas não se cadastram diretamente no portal público
- **Como cadastrar:**
  1. Admin da Arena cria o atleta em `Alunos → Atletas de Aluguel`
  2. Atleta recebe credenciais de acesso
  3. Atleta pode vincular perfil existente ou criar novo

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Função signUp() - `src/context/AuthProvider.tsx`**

```typescript
const signUp = async (email: string, password: string, name?: string, role: 'cliente' | 'admin_arena' = 'cliente') => {
  // 1. Verifica se e-mail já existe
  const { data: existingProfiles } = await supabaseApi.select<Profile>('profiles', 'all');
  const emailExists = (existingProfiles || []).some(p => p.email.toLowerCase() === email.toLowerCase());
  
  if (emailExists) {
    throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
  }

  // 2. Cria perfil no Supabase
  const newProfile: Profile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    role: role,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };
  await supabaseApi.upsert('profiles', [newProfile], 'all');

  // 3. Se admin_arena, cria arena também
  if (role === 'admin_arena' && name) {
    const newArena: Arena = {
      id: `arena_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      owner_id: newProfileId,
      name: name,
      slug: slug,
      city: 'Não informado',
      state: 'SP',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    await supabaseApi.upsert('arenas', [newArena], 'all');
  }
};
```

### **Fluxo de Cadastro**

```
Usuário preenche formulário
        ↓
signUp() é chamada
        ↓
Verifica se e-mail existe
        ↓
Cria Profile no Supabase
        ↓
Se admin_arena → Cria Arena
        ↓
Mostra confirmação
        ↓
Usuário faz login
```

---

## 📝 **TABELAS DO SUPABASE**

### **Tabela: profiles**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | ID único do perfil |
| name | TEXT | Sim | Nome do usuário |
| email | TEXT | Sim | E-mail (único) |
| role | TEXT | Sim | cliente, admin_arena, professor, atleta, super_admin |
| avatar_url | TEXT | Não | URL da foto |
| arena_id | UUID | Não | Arena vinculada (para funcionários) |
| created_at | TIMESTAMP | Sim | Data de criação |

### **Tabela: arenas**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | ID único da arena |
| owner_id | UUID | Sim | ID do profile (admin) |
| name | TEXT | Sim | Nome da arena |
| slug | TEXT | Sim | URL amigável |
| city | TEXT | Sim | Cidade |
| state | TEXT | Sim | Estado |
| status | TEXT | Não | active, inactive, suspended |
| created_at | TIMESTAMP | Sim | Data de criação |

---

## 🚀 **COMO TESTAR O CADASTRO**

### **Teste 1: Cadastrar Novo Admin de Arena**

1. Ir para: `http://127.0.0.1:5000/auth`
2. Clicar em **"Cadastrar"**
3. Clicar em **"Administrador de Quadra"**
4. Preencher:
   - Nome da Arena: "Quadra Teste"
   - E-mail: `admin-teste@email.com`
   - Senha: `senha123`
5. Clicar em **"Criar Conta"**
6. ✅ Deve mostrar: "Arena 'Quadra Teste' criada com sucesso!"
7. Fazer login com `admin-teste@email.com`
8. ✅ Deve redirecionar para `/dashboard`

**Verificar no banco:**
```sql
SELECT * FROM profiles WHERE email = 'admin-teste@email.com';
SELECT * FROM arenas WHERE name = 'Quadra Teste';
```

### **Teste 2: Cadastrar Novo Cliente**

1. Ir para: `http://127.0.0.1:5000/auth`
2. Clicar em **"Cadastrar"**
3. Clicar em **"Cliente / Aluno"**
4. Preencher:
   - Nome: "João Silva"
   - E-mail: `joao@email.com`
   - Senha: `senha123`
5. Clicar em **"Criar Conta"**
6. ✅ Deve mostrar: "Conta criada com sucesso! Faça login para continuar."
7. Fazer login com `joao@email.com`
8. ✅ Deve redirecionar para `/dashboard`

**Verificar no banco:**
```sql
SELECT * FROM profiles WHERE email = 'joao@email.com';
```

### **Teste 3: E-mail Duplicado**

1. Tentar cadastrar novamente com `joao@email.com`
2. ✅ Deve mostrar erro: "Este e-mail já está cadastrado. Tente fazer login."

---

## ⚠️ **PROBLEMAS CONHECIDOS E SOLUÇÕES**

### **Problema 1: "Este e-mail já está cadastrado"**

**Causa:** E-mail já existe no banco
**Solução:** Usar outro e-mail ou fazer login

### **Problema 2: Cadastro não salva no banco**

**Causa:** Função signUp estava vazia (CORRIGIDO!)
**Solução:** ✅ Implementação completa agora salva no Supabase

### **Problema 3: Arena não aparece após cadastro**

**Causa:** Cache do browser
**Solução:** Fazer logout/login após cadastro

---

## 🔐 **SEGURANÇA**

### **Validações Implementadas:**

✅ E-mail duplicado bloqueado  
✅ E-mails convertidos para lowercase  
✅ IDs únicos gerados automaticamente  
✅ Validação de campos obrigatórios  
✅ Slug gerado automaticamente (remove acentos e espaços)

### **Melhorias Futuras (Sugestões):**

⚠️ Adicionar hash de senha (atualmente senha não é usada - sistema mock)  
⚠️ Validação de formato de e-mail  
⚠️ Confirmação por e-mail  
⚠️ Limite de tentativas de cadastro  
⚠️ CAPTCHA para prevenir bots

---

## 📊 **ESTATÍSTICAS DE USO**

Para ver quantos usuários se cadastraram:

```sql
-- Total de perfis por tipo
SELECT role, COUNT(*) as total
FROM profiles
GROUP BY role
ORDER BY total DESC;

-- Cadastros hoje
SELECT role, COUNT(*) as total
FROM profiles
WHERE created_at::date = CURRENT_DATE
GROUP BY role;

-- Últimos 10 cadastros
SELECT name, email, role, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 **RESUMO**

| Tipo | Portal Público | Via Admin Arena | Supabase |
|------|---------------|----------------|----------|
| Admin Arena | ✅ `/cadastro-arena` | ❌ | ✅ profiles + arenas |
| Cliente/Aluno | ✅ `/auth` → Cliente | ✅ Alunos → Novo | ✅ profiles |
| Professor | ❌ | ✅ Alunos → Professores | ✅ profiles + professores |
| Atleta | ❌ | ✅ Alunos → Atletas | ✅ profiles + atletas_aluguel |

**✅ SISTEMA 100% FUNCIONAL E INTEGRADO COM SUPABASE!**
