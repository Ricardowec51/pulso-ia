# PULSO a la IA — Pipeline Autónomo y Dashboard Web
**EMPRENDEDORES.LTD**

Este proyecto es un sistema de curación y generación de newsletters ejecutivos semanales sobre Inteligencia Artificial para el sector financiero, comercial y agroindustrial de Latinoamérica. El sistema recopila información de múltiples feeds RSS, procesa y resume las noticias de mayor impacto utilizando la API de Google Gemini, permite la previsualización y edición de borradores a través de un panel de control web moderno, y compila la versión final en un documento Word (.docx) corporativo de alta calidad para su distribución.

---

## 🛠️ Arquitectura General

El pipeline del proyecto está compuesto por los siguientes módulos integrados:

```
                  20 Feeds RSS
                       │
                       ▼
               pulso_curator.py (Google Gemini Curation)
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  [--curate-only]              [--send-only]
Genera borrador JSON y       Compila Word final y envía
docx simple en /output       por email a suscriptores
         │                           ▲
         ▼                           │
   Backend Express (Node.js - Puerto 4001) <---> Frontend Dashboard (React/Vite - Puerto 5173)
```

1. **Curador de Noticias (`pulso_curator.py`)**: Script en Python que descarga artículos de feeds RSS, los filtra por fecha y relevancia y utiliza el modelo `gemini-flash-latest` para redactar la tesis y el contenido en el formato estructurado del boletín.
2. **Formateador Word (`pulso_publisher.py`)**: Generador en Python que compila los datos del JSON en un documento Word siguiendo la identidad corporativa de EMPRENDEDORES.LTD (colores azul oscuro, azul claro y gris corporativo).
3. **Servidor API (`backend/server.js`)**: Aplicación Node.js Express en el puerto `4001` que expone los endpoints para lanzar la curación, leer borradores, guardar cambios, compilar documentos y enviar correos.
4. **Dashboard Web (`frontend/src/App.jsx`)**: Interfaz React + Vite en el puerto `5173` diseñada con tema oscuro y glassmorphism. Permite la edición interactiva del borrador de cada edición y el control del pipeline con un clic.

---

## 🎨 Reglas de Diseño y Formato (Página 1)

Para garantizar un acabado visual premium y equilibrado en la primera página, se implementan los siguientes estándares lógicos:

- **Banner de Título**: Conserva su altura completa original (con márgenes de celda de `420` dxa) para mantener el impacto visual del branding de la publicación.
- **Índice Dinámico e Informativo**: Cada elemento del índice ("En esta edición") se compacta a una sola línea dinámica con descripciones informativas (ej: `📰 Noticias Destacadas: Diagnóstico económico... (y 2 más)`) y un espaciado reducido de `Pt(3)` para evitar líneas huérfanas.
- **Resumen Ejecutivo Destacado**: Se aumenta el tamaño de la letra a **13pt** (interlineado `Pt(20)` y espaciado de párrafos `Pt(6)`) para darle máxima importancia editorial.
- **Control de Longitud por IA**: El prompt de curación exige a Gemini generar exactamente **2 párrafos con un total de 110-130 palabras**.
- **Ajuste de Margen de Página**: Configuración explícita en código a tamaño **Carta (Letter)** para evitar desajustes causados por la configuración del sistema operativo.
- **Algoritmo `LayoutTracker` (Saltos de Página Condicionales)**: Clase en `pulso_publisher.py` que estima el espacio vertical acumulado de los elementos en cada página. Si al iniciar una nueva sección (como *Modelos*, *Tendencias* o *Veredicto*) el espacio actual supera el **70% de la página** (500pt), el sistema inserta un salto de página automático condicional para evitar que el encabezado de sección quede aislado en el fondo de una página anterior.

---

## 🚀 Guía de Ejecución Local

Sigue estos pasos en tu terminal para levantar y usar el sistema:

### Paso 1: Configurar Variables y Credenciales
Abre el archivo [config.yaml](file:///Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/config.yaml) e introduce tu API Key de Gemini y tus credenciales SMTP de Gmail (utilizando una *App Password*):
```yaml
gemini_api_key: "TU_API_KEY_DE_GOOGLE_STUDIO"
gemini_model: "gemini-flash-latest"

email:
  from: "tu_correo@gmail.com"
  to: "ricardowec@gmail.com"
  smtp_server: "smtp.gmail.com"
  smtp_port: 587
  smtp_user: "tu_correo@gmail.com"
  smtp_password: "xxxx xxxx xxxx xxxx"  # Contraseña de aplicación
```

### Paso 2: Iniciar el Servidor Backend (API Express)
Abre una terminal en tu Mac Mini M4 Pro y ejecuta:
```bash
cd /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/backend
npm start
```
El servidor backend estará listo en `http://localhost:4001`.

### Paso 3: Iniciar el Cliente Frontend (React)
Abre otra ventana de la terminal y ejecuta:
```bash
cd /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/frontend
npm run dev
```
La interfaz web se levantará en `http://localhost:5173`. Abre esa dirección en tu navegador para interactuar con el panel de control.

---

## ⚙️ Uso Manual vía Terminal

Si prefieres ejecutar el pipeline desde la consola sin usar el panel de control:

1. **Simulación de Curación (Modo Dry-Run)**:
   Descarga los feeds RSS, consulta a Gemini y genera el Word final localmente en `/output` sin enviar correos:
   ```bash
   ./.venv/bin/python3 pulso_curator.py --dry-run
   ```
2. **Ejecución Completa (Cura y Envía)**:
   ```bash
   ./.venv/bin/python3 pulso_curator.py
   ```
3. **Solo Envío**:
   Envía un archivo Word compilado a la lista de correo del boletín:
   ```bash
   ./.venv/bin/python3 pulso_curator.py --send-only "/ruta/al/documento.docx" "26"
   ```

---

## ⏰ Programación Automática (Cron Job)

El instalador registra un cron job en macOS para ejecutar el proceso todos los **lunes a las 8:00 AM**.

- **Inspeccionar cron jobs activos**:
  ```bash
  crontab -l
  ```
- **Ver los logs de las ejecuciones programadas**:
  ```bash
  tail -f logs/cron.log
  ```
- **Detener el envío automático programado**:
  ```bash
  crontab -l | grep -v "# pulso-ia" | crontab -
  ```
