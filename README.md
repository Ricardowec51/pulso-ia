# PULSO a la IA — Pipeline Autónomo
**EMPRENDEDORES.LTD**

Pipeline completamente autónomo que extrae noticias de IA, las procesa con Claude Haiku, genera un documento Word corporativo formateado y lo envía por Gmail.

## Flujo completo

```
20 Feeds RSS
     │
     ▼
pulso_curator.py
  ├─ feedparser (descarga artículos)
  ├─ filtra por keywords y fecha
  ├─ Claude Haiku (clasifica + redacta borrador editorial)
  ├─ genera borrador .docx + _data.json
     │
     ▼
pulso_publisher.js
  ├─ Lee _data.json del borrador
  ├─ Genera .docx corporativo (5 páginas, diseño azul EMPRENDEDORES.LTD)
  ├─ Banner, header/footer, índice, secciones, Veredicto Accionable
     │
     ▼
Gmail SMTP
  └─ Envía .docx final como adjunto
```

## Instalación

### macOS

```bash
bash install_mac.sh
```

Crea un venv Python, directorios, y registra un **cron job** que se ejecuta automáticamente cada **lunes a las 8:00 AM**.

```bash
# Ver cron registrado
crontab -l

# Ver logs
tail -f logs/cron.log

# Desactivar
crontab -l | grep -v "# pulso-ia" | crontab -
```

### Ubuntu 24.04

```bash
sudo bash install.sh
```

Instala dependencias del sistema, crea venv, y configura un **systemd timer** para cada **lunes a las 8:00 AM**.

El instalador configura automáticamente:
- Python 3 venv con todas las dependencias
- Node.js con docx y mammoth
- LibreOffice (para validación de páginas)
- Estructura de directorios
- Timer systemd (lunes 8:00 AM)

## Configuración

```bash
nano config.yaml
```

Campos obligatorios:
```yaml
anthropic_api_key: "sk-ant-..."
email:
  from: "tu@gmail.com"
  to:   "destino@gmail.com"
  smtp_password: "xxxx xxxx xxxx xxxx"  # App Password Gmail
```

**Gmail App Password:**
1. `myaccount.google.com` → Seguridad → Verificación en 2 pasos (activar)
2. Seguridad → Contraseñas de aplicaciones → Generar para "Mail"
3. Copiar los 16 caracteres en `config.yaml`

## Uso

```bash
# Verificar instalación
./health_check.sh

# Prueba sin enviar email
./venv/bin/python3 pulso_curator.py --dry-run

# Ejecución manual
./venv/bin/python3 pulso_curator.py

# Activar timer automático (lunes 8:00 AM)
sudo systemctl enable --now pulso-ia.timer

# Ver estado del timer
systemctl list-timers pulso-ia.timer

# Ver logs
tail -f logs/pulso.log
tail -f logs/systemd.log
```

## Estructura de archivos

```
pulso-ubuntu/
├── install.sh              # Instalador principal
├── pulso_curator.py        # Curator: RSS → Haiku → borrador
├── pulso_publisher.js      # Publisher: borrador → .docx corporativo
├── config.yaml.example     # Plantilla de configuración
├── config.yaml             # Tu configuración (NO subir a git)
├── health_check.sh         # Verificación de dependencias
├── package.json            # Dependencias Node.js
├── node_modules/           # Instaladas por npm
├── venv/                   # Entorno Python
├── logs/
│   ├── pulso.log           # Log del curador
│   └── systemd.log         # Log del timer systemd
├── cache/
│   ├── seen_articles.json  # Cache de artículos procesados
│   └── edition.txt         # Número de edición actual
└── output/
    ├── borrador_edicion_N.docx      # Borrador simple
    ├── borrador_edicion_N_data.json # Datos estructurados
    └── PULSO_a_la_IA_Edicion_N.docx # Documento final formateado
```

## Portabilidad

Todo usa paths relativos al script. Para mover a otro equipo:
```bash
# En el equipo destino:
tar xzf pulso-ubuntu.tar.gz
cd pulso-ubuntu
sudo ./install.sh         # Recrea venv y node_modules
nano config.yaml          # Verificar credenciales
./health_check.sh
```

El cache y los logs son locales y pueden eliminarse sin problema.

## Agregar/modificar feeds

En `config.yaml`:
```yaml
feeds:
  - name: "Nombre descriptivo"
    url: "https://example.com/rss"
    category: "tech"       # tech, vendors, enterprise, research, regulation, latam
    priority: 1            # 1=alta, 2=media, 3=baja
```

## Cambiar día/hora del timer

```bash
sudo nano /etc/systemd/system/pulso-ia.timer
# Cambiar: OnCalendar=Mon *-*-* 08:00:00
# Ejemplo lunes+miercoles+viernes: OnCalendar=Mon,Wed,Fri *-*-* 07:00:00
sudo systemctl daemon-reload
sudo systemctl restart pulso-ia.timer
```
