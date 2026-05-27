---
name: pulso-ia-curator-and-publisher
description: Pipeline de curación de feeds RSS de IA con Gemini y maquetación corporativa Word con control de página dinámico.
---

# Skill: Curador y Publicador de PULSO a la IA

Este skill define los procedimientos y criterios de maquetación para generar el newsletter ejecutivo semanal de **EMPRENDEDORES.LTD**.

## 🧠 Flujo de Trabajo (Workflow)

El pipeline opera de forma secuencial en las siguientes fases:

### 1. Curación con Google Gemini
El script `pulso_curator.py` procesa los feeds RSS locales, filtra las noticias de los últimos 7 días y llama a la API de Gemini (`gemini-flash-latest`) para:
- Escribir la tesis de la semana en el **Resumen Ejecutivo** (máximo 2 párrafos de 110 a 130 palabras en total).
- Redactar exactamente **3 noticias destacadas** con estructura fija (Qué pasó, Por qué importa, Te afecta, Recomendación).
- Mapear **2 modelos destacados** y **2 tendencias de mercado**.
- Generar **5 veredictos accionables** y hashtags dinámicos.
- Guardar la salida estructurada en `/output/borrador_edicion_N_data.json`.

### 2. Maquetación Premium en Word (`pulso_publisher.py`)
El formateador de Python lee el JSON y compila el documento aplicando la identidad visual de EMPRENDEDORES.LTD en una hoja tamaño **Carta (Letter)**:

- **Página 1 (Portada y Tesis)**:
  - **Banner de Título**: Altura de celda fija de `420` dxa.
  - **Índice Explicativo**: Compactado a exactamente **una sola línea por tema**, con espaciado de `Pt(3)`. Utiliza las utilidades `truncate_text` y `format_list_index` para sintetizar titulares y recuentos de forma compacta (ej: `Simulación Financiera... (y 2 más)`).
  - **Resumen Ejecutivo**: Formateado en fuente de **13pt** (interlineado `Pt(20)` y espaciado de párrafo `Pt(6)`) en un recuadro celeste con márgenes internos de `240` dxa, de modo que ocupe todo el espacio útil restante hasta el final de la página.
  - **Salto de Página**: Se fuerza un salto de página al final del resumen para que la sección de noticias comience siempre limpia en la Página 2.

- **Páginas Siguientes (Control de Saltos Condicionales)**:
  - Utiliza el objeto **`LayoutTracker`** para calcular la altura vertical acumulada de los elementos de texto añadidos en cada página.
  - Antes de escribir las cabeceras de secciones importantes (*Modelos*, *Tendencias*, *Veredicto*), invoca a `tracker.check_break_before_section()`. Si el espacio acumulado supera el **70% de la página** (500pt) o si al añadir la sección se excede la altura imprimible (700pt), inserta automáticamente un salto de página para evitar encabezados huérfanos o recuadros cortados de forma poco estética.

---

## 🛠️ Comandos de Control y Verificación

Para operar y probar esta habilidad localmente en la Mac Mini M4 Pro:

- **Iniciar el Dashboard Web** (Backend + Frontend):
  ```bash
  /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/pulso_start.sh start
  ```
- **Detener el Dashboard Web** (o usar el botón 🔌 en la interfaz web):
  ```bash
  /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/pulso_start.sh stop
  ```
- **Verificar Estado de Servicios**:
  ```bash
  /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/pulso_start.sh status
  ```
- **Corrida Completa Manual** (Cura, Compila y Envía):
  ```bash
  /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/.venv/bin/python3 pulso_curator.py
  ```
- **Modo Simulación (Dry-Run)** (Cura y compila Word en /output sin enviar):
  ```bash
  /Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/.venv/bin/python3 pulso_curator.py --dry-run
  ```

---

## 📝 Resolución de Problemas (Troubleshooting)

- **La tabla del Resumen se desplaza a la Página 2**:
  - *Causa*: El texto del resumen ejecutivo generado por Gemini es demasiado largo (> 160 palabras) o contiene más de 2 párrafos.
  - *Solución*: Edita el borrador JSON en `/output/borrador_edicion_N_data.json` para reducir el total de palabras a ~120, o vuelve a curar el boletín.
- **Error de API Gemini (404 o 503)**:
  - *Solución*: La API de Gemini puede presentar saturación temporal. El script reintenta automáticamente con retardo exponencial. Si persiste, valida que tu API Key en `config.yaml` o en la variable de entorno `GEMINI_API_KEY` sea correcta y que el modelo esté configurado como `"gemini-flash-latest"`.
