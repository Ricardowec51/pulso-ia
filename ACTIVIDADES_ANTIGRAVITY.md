# Registro de Actividades - Antigravity

**Proyecto:** PULSO a la IA - Migración a Gemini y Dashboard Web
**Fecha de Inicio:** 27 de mayo de 2026
**Sistema:** Mac Mini M4 Pro (macOS)
**Desarrollador:** Ricardo Wagner / Antigravity

---

## Estado Actual y Tareas

- [x] **Preparación del Espacio de Trabajo**:
  - Fusionados los cambios del branch `publisher-python` con `main` y empujados a GitHub.
  - Copiados los archivos base del proyecto desde `Downloads/pulso-final/` a `/Users/rwagner/.gemini/antigravity/scratch/pulso-ia-gemini/` (excluyendo entornos virtuales y dependencias pesadas).
- [x] **Migración a Gemini**:
  - Reemplazado el cliente de Anthropic por el de Google Gemini (`google-genai`) en `pulso_curator.py`.
  - Configurado el modelo dinámico `gemini-2.5-flash` o `gemini-2.5-pro` en `config.yaml`.
  - Actualizado el script para usar de forma nativa el binario de Python del entorno virtual `.venv`.
- [x] **Desarrollo del Backend en Node.js**:
  - Creado el servidor Express (`server.js`) con endpoints para consultar estado, lanzar curación, leer/actualizar borradores JSON, compilar Word (`pulso_publisher.py`) y enviar por email (`--send-only`).
  - Instaladas las dependencias (`express` y `cors`) mediante `npm install`.
- [x] **Desarrollo del Frontend en React**:
  - Inicializada la aplicación React con Vite.
  - Creada una interfaz moderna con tema oscuro, glassmorphism y transiciones fluidas.
  - Desarrollada la lógica de control (`App.jsx`) para integrarse con la API Express del backend, editar borradores de noticias, modelos y veredicto, y mandar la compilación y el correo.
- [x] **Despliegue y Puesta en Producción**:
  - Creada la guía de inicio rápido y manual de ejecución.
  - Listo para correr localmente en la Mac Mini M4 Pro de Ricardo.
- [x] **Mejoras de Diseño - Fase 1 (Índice, Resumen 13pt y LayoutTracker)**:
  - Compactación del índice ("En esta edición") a una sola línea dinámica con títulos y conteos (ej. `3 noticias de la semana`, `Helicase y BRANE`).
  - Ajuste del tamaño del Resumen Ejecutivo a **13pt** (interlineado `Pt(20)`, espaciado `Pt(6)` y márgenes de celda `240` dxa) para darle máxima relevancia e importancia.
  - Modificación del prompt de curación en `pulso_curator.py` a un rango de **130-155 palabras** para llenar la primera página sin riesgo de desborde.
  - Creación del algoritmo **`LayoutTracker`** en `pulso_publisher.py` para calcular el espacio vertical acumulado de los párrafos e insertar saltos de página condicionales automáticos antes de cada nueva sección grande (Noticias, Modelos, Tendencias, Veredicto).
  - Eliminación de espacios muertos al inicio del documento y separadores innecesarios para optimizar la primera página.
- [x] **Script de Control y Botón de Apagado (Cierre del Proyecto)**:
  - Creado el script unificado de control `pulso_start.sh` para iniciar, detener, reiniciar y verificar el estado del Dashboard de forma centralizada.
  - Implementado el endpoint de apagado `POST /api/shutdown` en el Backend Express para detener el Frontend Vite en el puerto 5173 y auto-detenerse limpiamente.
  - Diseñado y acoplado el botón **Apagar Dashboard** en la barra lateral del Frontend en React con animación y pantalla de confirmación estilizada al completarse.
  - Actualizados `README.md` y `SKILL.md` con las explicaciones del flujo manual frente a la ejecución autónoma semanal del Cron Job.
  - Sincronizados todos los cambios locales con la carpeta `/Users/rwagner/Downloads/pulso-final/` y subido el código al repositorio remoto GitHub.





