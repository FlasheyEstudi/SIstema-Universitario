#!/bin/bash

# Script de deployment automatizado para UniSystem
# Uso: ./deploy.sh [vercel|netlify|railway|docker]

set -e

echo "🚀 UniSystem Deployment Script"
echo "================================"

DEPLOY_TYPE=${1:-vercel}

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js instalado: $(node --version)${NC}"

# Instalar dependencias
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
npm install

# Build del proyecto
echo -e "${BLUE}🔨 Compilando proyecto...${NC}"
npm run build

case $DEPLOY_TYPE in
    vercel)
        echo -e "${BLUE}🌐 Desplegando en Vercel...${NC}"
        if ! command_exists vercel; then
            echo "Instalando Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    
    netlify)
        echo -e "${BLUE}🌐 Desplegando en Netlify...${NC}"
        if ! command_exists netlify; then
            echo "Instalando Netlify CLI..."
            npm install -g netlify-cli
        fi
        netlify deploy --prod --dir=dist
        ;;
    
    railway)
        echo -e "${BLUE}🚂 Desplegando en Railway...${NC}"
        if ! command_exists railway; then
            echo "Instalando Railway CLI..."
            npm install -g @railway/cli
        fi
        railway up
        ;;
    
    docker)
        echo -e "${BLUE}🐳 Construyendo imagen Docker...${NC}"
        if ! command_exists docker; then
            echo -e "${RED}❌ Docker no está instalado${NC}"
            exit 1
        fi
        docker-compose up -d --build
        echo -e "${GREEN}✓ Aplicación corriendo en http://localhost${NC}"
        ;;
    
    *)
        echo -e "${RED}❌ Tipo de deployment no válido: $DEPLOY_TYPE${NC}"
        echo "Uso: ./deploy.sh [vercel|netlify|railway|docker]"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Deployment completado!${NC}"
