#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  PULSO a la IA — Instalador macOS / Linux
#  EMPRENDEDORES.LTD
#  Uso: bash install_mac.sh
# ═══════════════════════════════════════════════════════════
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_TAG="# pulso-ia"

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════"
echo "   PULSO a la IA — Instalador macOS"
echo "   EMPRENDEDORES.LTD"
echo "═══════════════════════════════════════════════════════"
echo -e "${NC}"

# 1. Entorno Python
echo -e "${YELLOW}[1/6] Entorno Python (venv)...${NC}"
cd "$SCRIPT_DIR"

if [ -f "$HOME/miniconda3/bin/python3" ]; then
    PYTHON="$HOME/miniconda3/bin/python3"
elif command -v python3 &>/dev/null; then
    PYTHON="$(command -v python3)"
else
    echo -e "${RED}✗ python3 no encontrado. Instala miniconda o Python 3.${NC}"
    exit 1
fi

"$PYTHON" -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q feedparser google-genai python-docx pyyaml requests
echo -e "${GREEN}✓ OK — usando $(./venv/bin/python3 --version)${NC}"



# 2. Dependencias del Dashboard (Node.js)
echo -e "${YELLOW}[2/6] Instalando dependencias del Dashboard (Node.js)...${NC}"
cd "$SCRIPT_DIR/backend"
npm install --silent
cd "$SCRIPT_DIR/frontend"
npm install --silent
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ OK${NC}"

# 3. Directorios
echo -e "${YELLOW}[3/6] Directorios...${NC}"
mkdir -p "$SCRIPT_DIR"/{logs,cache,output}
echo -e "${GREEN}✓ OK${NC}"

# 4. Configuración
echo -e "${YELLOW}[4/6] Configuración...${NC}"
if [ ! -f "$SCRIPT_DIR/config.yaml" ]; then
    cp "$SCRIPT_DIR/config.yaml.example" "$SCRIPT_DIR/config.yaml"
    echo -e "${YELLOW}  ⚠ config.yaml creado — edítalo antes de continuar${NC}"
else
    echo -e "${GREEN}✓ config.yaml ya existe${NC}"
fi

# 5. Cron job (lunes 8:00 AM)
echo -e "${YELLOW}[5/6] Cron job (lunes 8:00 AM)...${NC}"
CRON_LINE="0 8 * * 1 cd \"$SCRIPT_DIR\" && ./venv/bin/python3 pulso_curator.py >> \"$SCRIPT_DIR/logs/cron.log\" 2>&1 $CRON_TAG"

# Quitar entrada anterior si existe, luego agregar la nueva
( crontab -l 2>/dev/null | grep -v "$CRON_TAG" ; echo "$CRON_LINE" ) | crontab -
echo -e "${GREEN}✓ OK${NC}"

# 6. Comando Global "pulso"
echo -e "${YELLOW}[6/6] Registrando comando global 'pulso' en ~/.local/bin/pulso...${NC}"
mkdir -p "$HOME/.local/bin"
cat << EOF > "$HOME/.local/bin/pulso"
#!/bin/bash
"$SCRIPT_DIR/pulso.sh" "\$@"
EOF
chmod +x "$HOME/.local/bin/pulso"
echo -e "${GREEN}✓ OK${NC}"

# Resumen
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Instalación completada${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}PASOS SIGUIENTES:${NC}"
echo ""
echo -e "  1. Edita credenciales:"
echo -e "     ${BLUE}nano $SCRIPT_DIR/config.yaml${NC}"
echo ""
echo -e "  2. Iniciar el Dashboard desde cualquier terminal:"
echo -e "     ${BLUE}pulso${NC}"
echo ""
echo -e "  3. Prueba manual de curación (sin enviar email):"
echo -e "     ${BLUE}cd $SCRIPT_DIR && ./venv/bin/python3 pulso_curator.py --dry-run${NC}"
echo ""
echo -e "  4. Ver cron activo:"
echo -e "     ${BLUE}crontab -l${NC}"
echo ""
echo -e "  5. Ver logs:"
echo -e "     ${BLUE}tail -f $SCRIPT_DIR/logs/cron.log${NC}"
echo ""
echo -e "  6. Desactivar el timer:"
echo -e "     ${BLUE}crontab -l | grep -v '$CRON_TAG' | crontab -${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
