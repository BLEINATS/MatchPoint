#!/bin/bash

echo "🧹 Limpando repositório para Alpha Dualite..."
echo ""

# Limpa pasta dist
echo "📦 Limpando pasta dist..."
rm -rf dist/*
echo "✅ Pasta dist limpa"
echo ""

# Limpa arquivos temporários
echo "🗑️  Removendo arquivos temporários..."
find . -name "*.log" -type f -delete 2>/dev/null
find . -name "*.tmp" -type f -delete 2>/dev/null
echo "✅ Arquivos temporários removidos"
echo ""

# Atualiza .gitignore para garantir
echo "📝 Atualizando .gitignore..."
cat >> .gitignore << 'EOF'

# Alpha Dualite - Arquivos grandes
node_modules/
dist/
dist-ssr/
*.local
.cache/
package-lock.json

# Build outputs
build/
.vite/

# Replit
.replit
.config/
.upm/
.cache/

# Logs e temporários
/tmp/
*.log
*.tmp

# Assets grandes
attached_assets/*.png
attached_assets/*.jpg
attached_assets/*.gif
EOF
echo "✅ .gitignore atualizado"
echo ""

echo "🎯 Próximos passos:"
echo ""
echo "1. Execute no terminal:"
echo "   git rm -r --cached node_modules dist package-lock.json"
echo ""
echo "2. Depois execute:"
echo "   git add .gitignore"
echo "   git commit -m \"chore: remove node_modules e dist do repo\""
echo ""
echo "3. Finalmente:"
echo "   git add ."
echo "   git commit -m \"feat: validação CPF + cartões salvos\""
echo "   git push origin main"
echo ""
echo "Isso reduzirá o repositório de 426k para ~10k tokens! 🎉"
