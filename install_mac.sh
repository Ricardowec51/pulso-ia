#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  PULSO a la IA — Instalador macOS
#  EMPRENDEDORES.LTD
#  Uso: bash install_mac.sh
# ═══════════════════════════════════════════════════════════
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_LABEL="ltd.emprendedores.pulso-ia"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════"
echo "   PULSO a la IA — Instalador macOS"
echo "   EMPRENDEDORES.LTD"
echo "═══════════════════════════════════════════════════════"
echo -e "${NC}"

# 1. Entorno Python
echo -e "${YELLOW}[1/4] Entorno Python (venv)...${NC}"
cd "$SCRIPT_DIR"

# Usar python3 disponible (miniconda tiene prioridad si existe)
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
./venv/bin/pip install -q feedparser anthropic python-docx pyyaml requests
echo -e "${GREEN}✓ OK — usando $(./venv/bin/python3 --version)${NC}"

# 2. Directorios
echo -e "${YELLOW}[2/4] Directorios...${NC}"
mkdir -p "$SCRIPT_DIR"/{logs,cache,output}
echo -e "${GREEN}✓ OK${NC}"

# 3. Configuración
echo -e "${YELLOW}[3/4] Configuración...${NC}"
if [ ! -f "$SCRIPT_DIR/config.yaml" ]; then
    cp "$SCRIPT_DIR/config.yaml.example" "$SCRIPT_DIR/config.yaml"
    echo -e "${YELLOW}  ⚠ config.yaml creado — edítalo antes de continuar${NC}"
else
    echo -e "${GREEN}✓ config.yaml ya existe${NC}"
fi

# 4. LaunchAgent (lunes 8:00 AM)
echo -e "${YELLOW}[4/4] LaunchAgent (lunes 8:00 AM)...${NC}"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${SCRIPT_DIR}/venv/bin/python3</string>
        <string>${SCRIPT_DIR}/pulso_curator.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/logs/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/logs/launchd.log</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
EOF

# Cargar (o recargar si ya existía)
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo -e "${GREEN}✓ OK${NC}"

# Resumen
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Instalación macOS completada${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}PASOS SIGUIENTES:${NC}"
echo ""
echo -e "  1. Edita credenciales:"
echo -e "     ${BLUE}nano $SCRIPT_DIR/config.yaml${NC}"
echo ""
echo -e "  2. Prueba manual (sin esperar el lunes):"
echo -e "     ${BLUE}cd $SCRIPT_DIR && ./venv/bin/python3 pulso_curator.py${NC}"
echo ""
echo -e "  3. Ver estado del timer:"
echo -e "     ${BLUE}launchctl list | grep pulso${NC}"
echo ""
echo -e "  4. Ver logs:"
echo -e "     ${BLUE}tail -f $SCRIPT_DIR/logs/launchd.log${NC}"
echo ""
echo -e "  5. Desactivar el timer:"
echo -e "     ${BLUE}launchctl unload $PLIST_PATH${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
