#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  PULSO a la IA — Instalador Ubuntu 24.04 LTS
#  EMPRENDEDORES.LTD
#  Uso: sudo bash install.sh
# ═══════════════════════════════════════════════════════════
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USUARIO="${SUDO_USER:-$USER}"
SERVICE="pulso-ia"

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════"
echo "   PULSO a la IA — Instalador"
echo "   EMPRENDEDORES.LTD"
echo "═══════════════════════════════════════════════════════"
echo -e "${NC}"

# 1. Paquetes del sistema
echo -e "${YELLOW}[1/7] Paquetes del sistema...${NC}"
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv nodejs npm libreoffice-writer poppler-utils curl
echo -e "${GREEN}✓ OK${NC}"

# 2. Python venv + dependencias
echo -e "${YELLOW}[2/7] Entorno Python...${NC}"
cd "$SCRIPT_DIR"
python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q feedparser anthropic python-docx pyyaml requests
echo -e "${GREEN}✓ OK${NC}"

# 3. Node.js dependencias
echo -e "${YELLOW}[3/7] Node.js (docx + mammoth)...${NC}"
npm install --silent
echo -e "${GREEN}✓ OK${NC}"

# 4. Permisos y directorios
echo -e "${YELLOW}[4/7] Directorios y permisos...${NC}"
mkdir -p "$SCRIPT_DIR"/{logs,cache,output}
chmod +x "$SCRIPT_DIR/pulso_curator.py"
chown -R "$USUARIO":"$USUARIO" "$SCRIPT_DIR"
echo -e "${GREEN}✓ OK${NC}"

# 5. Configuración
echo -e "${YELLOW}[5/7] Configuración...${NC}"
if [ ! -f "$SCRIPT_DIR/config.yaml" ]; then
    cp "$SCRIPT_DIR/config.yaml.example" "$SCRIPT_DIR/config.yaml"
    echo -e "${YELLOW}  ⚠ config.yaml creado — edítalo antes de continuar${NC}"
else
    echo -e "${GREEN}✓ config.yaml ya existe${NC}"
fi

# 6. Systemd timer (lunes 8:00 AM)
echo -e "${YELLOW}[6/7] Systemd timer (lunes 8:00 AM)...${NC}"
cat > /etc/systemd/system/${SERVICE}.service << EOF
[Unit]
Description=PULSO a la IA — Curador semanal
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=${USUARIO}
WorkingDirectory=${SCRIPT_DIR}
ExecStart=${SCRIPT_DIR}/venv/bin/python3 ${SCRIPT_DIR}/pulso_curator.py
StandardOutput=append:${SCRIPT_DIR}/logs/systemd.log
StandardError=append:${SCRIPT_DIR}/logs/systemd.log

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/${SERVICE}.timer << EOF
[Unit]
Description=PULSO a la IA — Timer semanal

[Timer]
OnCalendar=Mon *-*-* 08:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
echo -e "${GREEN}✓ OK${NC}"

# 7. Comando Global "pulso"
echo -e "${YELLOW}[7/7] Registrando comando global 'pulso' en /usr/local/bin/pulso...${NC}"
cat << EOF > /usr/local/bin/pulso
#!/bin/bash
"$SCRIPT_DIR/pulso.sh" "\$@"
EOF
chmod +x /usr/local/bin/pulso
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
echo -e "  3. Prueba sin enviar email:"
echo -e "     ${BLUE}cd $SCRIPT_DIR && ./venv/bin/python3 pulso_curator.py --dry-run${NC}"
echo ""
echo -e "  4. Activa el timer automático:"
echo -e "     ${BLUE}sudo systemctl enable --now ${SERVICE}.timer${NC}"
echo ""
echo -e "  5. Ejecución manual:"
echo -e "     ${BLUE}sudo systemctl start ${SERVICE}.service${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
