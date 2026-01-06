#!/bin/bash

echo "🚀 Configurando o projeto Planilha de Atividades..."

# Limpar instalações anteriores
echo "🧹 Limpando instalações anteriores..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .vite

# Criar diretório utils se não existir
echo "📁 Criando estrutura de diretórios..."
mkdir -p src/utils

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Limpar cache do Vite
echo "🗑️  Limpando cache do Vite..."
rm -rf node_modules/.vite

echo "✅ Configuração concluída!"
echo ""
echo "Para executar o projeto:"
echo "  npm run dev"
echo ""
echo "Se ainda encontrar erros com o PDF.js, execute:"
echo "  npm run dev -- --force"
