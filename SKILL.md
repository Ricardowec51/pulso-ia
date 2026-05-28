---
name: pulso-ia-curator-and-publisher
description: Pipeline de curación de feeds RSS de IA con Gemini y maquetación corporativa Word con control de página dinámico.
---

# Skill: Curador y Publicador de PULSO a la IA

Este skill define los procedimientos y criterios de maquetación para generar el newsletter ejecutivo semanal de **EMPRENDEDORES.LTD**.

## 🧠 Flujo de Trabajo (Workflow)

El pipeline opera de forma secuencial en las siguientes fases:

### 1. Curación con Google Gemini
El script `pulso_curator.py` procesa los feeds RSS locales, filtra las noticias de los últimos 7 días y llama a la API de Gemini (`gemini-2.5-flash` o `gemini-2.5-pro` según `config.yaml`) para:
- Escribir la tesis de la semana en el **Resumen Ejecutivo** (máximo 2 párrafos de 110 a 130 palabras en total).
- Redactar exactamente **3 noticias destacadas** con estructura fija (Qué pasó, Por qué importa, Te afecta, Recomendación).
- Mapear **2 modelos destacados** y **2 tendencias de mercado**.
- Generar **5 veredictos accionables** y hashtags dinámicos.
- Guardar la salida estructurada en `/output/borrador_edicion_N_data.json`.

### 2. Maquetación Premium en Word (`pulso_publisher.py`)
El formateador de Python lee el JSON y compila el documento aplicando la identidad visual de EMPRENDEDORES.LTD en una hoja tamaño **Carta (Letter)**:

- **Página 1 (Portada y Tesis)**:
  - **Banner de Título**: Altura de celda fija de `300` dxa. Espaciado interno ultra-compactado.
  - **Índice Explicativo**: Cada elemento del índice ("En esta edición") se compacta a exactamente **una sola línea por tema**, con espaciado de `Pt(1)`. Cabecera con `8pt antes / 2pt después`.
  - **Resumen Ejecutivo**: Formateado en fuente de **13pt** (interlineado `Pt(18)` y espaciado de párrafo `Pt(2)`) en un recuadro celeste con márgenes internos de `180` dxa, garantizando que quepa completo en la primera página sin desbordamientos automáticos.
  - **Salto de Página**: Se fuerza un salto de página al final del resumen para que la sección de noticias comience siempre limpia en la Página 2.

- **Páginas Siguientes (Paginación Libre)**:
  - El algoritmo `LayoutTracker` está desactivado (retorna siempre `False` en `check_break_before_section()`) para permitir que Word maneje la paginación de forma natural, a petición del usuario.
  - Las secciones del documento fluyen de corrido, separadas únicamente por espaciados de párrafo estándar.

- **Cabeceras Dinámicas (Páginas 2+)**:
  - Se genera una tabla XML `<w:tbl>` de dos columnas fijas dentro de `patch_headers_xml` para garantizar que la marca `EMPRENDEDORES.LTD` esté perfectamente alineada a la derecha y los metadatos de Edición/Fecha cargados del Dashboard a la izquierda.

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
  - *Causa*: El texto del resumen ejecutivo generado por Gemini es demasiado largo (> 150 palabras) o se han reintroducido espaciados manuales altos.
  - *Solución*: Edita el borrador JSON en `/output/borrador_edicion_N_data.json` para reducir el total de palabras a ~120, o vuelve a compilar.
- **Copiado de Archivos**:
  - *Comportamiento*: Al compilar desde el Dashboard, el servidor copia automáticamente el archivo `.docx` generado directamente al directorio `/Users/rwagner/Downloads/` para su comodidad.
