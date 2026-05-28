#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  PULSO a la IA — Script de Cierre de Sesión Automatizado
#  EMPRENDEDORES.LTD
#  Uso: ./pulso_cierre.sh
# ═══════════════════════════════════════════════════════════
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROD_DIR="/Users/rwagner/Downloads/pulso-final"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Iniciando Cierre Automático del Día — PULSO a la IA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# 1. Copiar/Sincronizar archivos modificados a Descargas (producción)
echo -e "${YELLOW}[1/4] Sincronizando archivos de desarrollo a Descargas/producción...${NC}"
if [ -d "$PROD_DIR" ]; then
    # Copiar scripts de Python y Markdown de la raíz
    for file in pulso_publisher.py pulso_curator.py generar_edicion_especial.py ACTIVIDADES_ANTIGRAVITY.md SKILL.md README.md config.yaml.example install.sh install_mac.sh pulso.sh pulso_start.sh compare_docx.py; do
        if [ -f "$DIR/$file" ]; then
            cp "$DIR/$file" "$PROD_DIR/$file"
        fi
    done

    # Sincronizar carpeta backend (evitando node_modules y cache)
    mkdir -p "$PROD_DIR/backend"
    cp "$DIR/backend/server.js" "$PROD_DIR/backend/"
    cp "$DIR/backend/package.json" "$PROD_DIR/backend/"
    cp "$DIR/backend/package-lock.json" "$PROD_DIR/backend/"

    # Sincronizar carpeta frontend (evitando node_modules y dist)
    mkdir -p "$PROD_DIR/frontend"
    cp -R "$DIR/frontend/src" "$PROD_DIR/frontend/"
    cp -R "$DIR/frontend/public" "$PROD_DIR/frontend/" 2>/dev/null || true
    cp "$DIR/frontend/package.json" "$PROD_DIR/frontend/"
    cp "$DIR/frontend/package-lock.json" "$PROD_DIR/frontend/"
    cp "$DIR/frontend/index.html" "$PROD_DIR/frontend/"
    cp "$DIR/frontend/vite.config.js" "$PROD_DIR/frontend/"

    echo -e "${GREEN}✓ Archivos sincronizados en $PROD_DIR${NC}"
else
    echo -e "${RED}✗ Error: Carpeta de producción en Descargas ($PROD_DIR) no encontrada.${NC}"
    exit 1
fi

# 2. Detener servidores del Dashboard
echo -e "${YELLOW}[2/4] Deteniendo servidores del Dashboard en segundo plano...${NC}"
if [ -f "$DIR/pulso_start.sh" ]; then
    bash "$DIR/pulso_start.sh" stop
else
    echo -e "${YELLOW}⚠️ pulso_start.sh no encontrado en la raíz. Deteniendo por puertos...${NC}"
    PID_BACKEND=$(lsof -t -i:4001 || true)
    [ -n "$PID_BACKEND" ] && kill -9 $PID_BACKEND 2>/dev/null && echo "🛑 Backend Express detenido."
    PID_FRONTEND=$(lsof -t -i:5173 || true)
    [ -n "$PID_FRONTEND" ] && kill -9 $PID_FRONTEND 2>/dev/null && echo "🛑 Frontend Vite detenido."
fi

# 3. Subir cambios a GitHub
echo -e "${YELLOW}[3/4] Gestionando repositorio Git en producción...${NC}"
cd "$PROD_DIR"

if git rev-parse --is-inside-work-tree &>/dev/null; then
    # Verificar si hay cambios
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}  Cambios detectados en el repositorio:${NC}"
        git status -s
        echo ""
        
        # Pedir mensaje de commit (con timeout por si acaso, o valor por defecto)
        echo -e "${BLUE}Escribe el mensaje de commit para GitHub (presiona Enter para usar mensaje por defecto):${NC}"
        read -r COMMIT_MSG
        if [ -z "$COMMIT_MSG" ]; then
            FECHA=$(date +"%Y-%m-%d %H:%M")
            COMMIT_MSG="Cierre de sesión automático - $FECHA"
        fi
        
        echo -e "${YELLOW}  Subiendo cambios...${NC}"
        git add .
        git commit -m "$COMMIT_MSG"
        git push origin main
        echo -e "${GREEN}✓ Cambios subidos a GitHub con éxito.${NC}"
    else
        echo -e "${GREEN}✓ Sin cambios locales pendientes. Repositorio limpio.${NC}"
    fi
else
    echo -e "${RED}✗ Error: La carpeta de producción no es un repositorio Git válido.${NC}"
fi

# 4. Finalizado
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ TODO CERRADO EN ORDEN Y COMPLETO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ¡Hasta mañana, Ricardo!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
