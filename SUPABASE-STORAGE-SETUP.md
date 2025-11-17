# 📸 Configuração do Supabase Storage para Fotos

## ⚠️ Erro Encontrado
```
Error creating storage bucket: new row violates row-level security policy
```

Este erro ocorre porque **criar buckets requer permissões de administrador** no Supabase. A solução é criar o bucket manualmente no dashboard.

---

## ✅ Configuração Manual (5 minutos)

### 1️⃣ Acessar o Dashboard do Supabase

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto usado pelo MatchPlay

### 2️⃣ Criar o Bucket 'photos'

1. No menu lateral, clique em **Storage**
2. Clique no botão **"New bucket"**
3. Configure:
   - **Name:** `photos`
   - **Public bucket:** ✅ ATIVAR (importante!)
   - **File size limit:** `5 MB` (ou conforme preferência)
4. Clique em **Create bucket**

### 3️⃣ Configurar Políticas de Acesso (RLS)

Após criar o bucket, configure as permissões:

1. Clique no bucket `photos` que você acabou de criar
2. Vá na aba **Policies**
3. Clique em **New Policy**

**Política 1: Upload de Fotos (INSERT)**
- Template: **"Enable insert for authenticated users"**
- Nome: `Allow authenticated uploads`
- Target roles: `authenticated`
- Click em **Review** e depois **Save**

**Política 2: Leitura Pública (SELECT)**
- Template: **"Enable read access for all users"**
- Nome: `Allow public read`
- Target roles: `anon` + `authenticated`
- Click em **Review** e depois **Save**

**Política 3: Deletar Fotos (DELETE)**
- Template: **"Enable delete for authenticated users"**
- Nome: `Allow authenticated delete`
- Target roles: `authenticated`
- Click em **Review** e depois **Save**

---

## 🎯 Resultado Esperado

Após a configuração:

✅ **Logo da Arena** - Persiste após refresh  
✅ **Fotos das Quadras** - Salvas permanentemente  
✅ **Fotos dos Alunos** - Mantidas no banco  
✅ **Produtos da Loja** - Imagens persistem  
✅ **Todos os Uploads** - Sincronizam entre Deploy ↔ Development

---

## 🔄 Verificar Configuração

1. Recarregue a página do MatchPlay
2. Tente fazer upload de uma foto (ex: logo da arena)
3. Verifique no console do navegador (F12):
   - ✅ Se não houver erro: Configurado corretamente!
   - ❌ Se aparecer erro 403: Revise as políticas RLS

---

## 💡 Notas Importantes

- O bucket `photos` será **compartilhado** entre Deploy e Development (se usarem mesmas credenciais)
- Fotos antigas (blob URLs) **não migram automaticamente** - será necessário re-upload
- Tamanho máximo: 5 MB por foto (ajustável nas configurações do bucket)
- Formatos suportados: JPG, PNG, GIF, WEBP, etc.

---

## 🆘 Problemas Comuns

**Erro 403 ao fazer upload:**
→ Verifique se as políticas RLS estão configuradas corretamente

**Fotos não aparecem:**
→ Confirme que o bucket está marcado como "Public"

**Storage não encontrado:**
→ Verifique se o nome do bucket é exatamente `photos` (minúsculo)

---

**Após configurar, recarregue o MatchPlay e as fotos funcionarão! 🎉**
