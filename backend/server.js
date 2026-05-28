const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4001;

// Configuración de rutas relativas
const PROJECT_ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(PROJECT_ROOT, 'cache');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

let pythonBin = path.join(PROJECT_ROOT, '.venv', 'bin', 'python3');
if (!fs.existsSync(pythonBin)) {
  pythonBin = path.join(PROJECT_ROOT, 'venv', 'bin', 'python3');
}
const VENV_PYTHON = pythonBin;


app.use(cors());
app.use(express.json());

// Helper para calcular la semana ISO anterior
function getPreviousWeekNumber() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper para obtener el número de edición actual
function getCurrentEdition() {
  const file = path.join(CACHE_DIR, 'edition.txt');
  if (fs.existsSync(file)) {
    return parseInt(fs.readFileSync(file, 'utf8').trim(), 10);
  }
  return getPreviousWeekNumber();
}

// Helper para formatear la fecha actual en español
function getFechaEspanol() {
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const d = new Date();
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

// Endpoints

// 1. Estado general
app.get('/api/status', (req, res) => {
  try {
    const edition = getCurrentEdition();
    const configPath = path.join(PROJECT_ROOT, 'config.yaml');
    const hasConfig = fs.existsSync(configPath);
    
    // Buscar archivos disponibles
    const files = fs.existsSync(OUTPUT_DIR) ? fs.readdirSync(OUTPUT_DIR) : [];
    const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
    
    res.json({
      success: true,
      currentEdition: edition,
      hasConfig,
      outputFiles: docxFiles,
      fecha: getFechaEspanol()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Ejecutar curación (RSS + Gemini JSON Draft)
app.post('/api/curate', (req, res) => {
  console.log("Iniciando curación RSS con Gemini...");
  const cmd = `"${VENV_PYTHON}" "${path.join(PROJECT_ROOT, 'pulso_curator.py')}" --curate-only`;
  
  exec(cmd, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error de ejecución: ${error}`);
      return res.status(500).json({ success: false, error: error.message, stderr });
    }
    
    const edition = getCurrentEdition();
    res.json({
      success: true,
      message: "Curación completada con éxito.",
      edition,
      stdout
    });
  });
});

// 3. Obtener el borrador JSON de la edición actual
app.get('/api/draft', (req, res) => {
  try {
    const edition = getCurrentEdition();
    const jsonPath = path.join(OUTPUT_DIR, `borrador_edicion_${edition}_data.json`);
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        error: `No se encontró borrador JSON para la edición ${edition}. Por favor ejecuta la curación primero.`
      });
    }
    
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    res.json({ success: true, edition, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Guardar cambios hechos en el borrador JSON (y opcionalmente actualizar número de edición)
app.post('/api/draft', (req, res) => {
  try {
    let edition = getCurrentEdition();
    let draftData = req.body;

    // Si viene estructurado con currentEdition y data para renombrar/guardar en otra edición
    if (req.body.currentEdition !== undefined && req.body.data !== undefined) {
      const newEdition = parseInt(req.body.currentEdition, 10);
      if (!isNaN(newEdition)) {
        const file = path.join(CACHE_DIR, 'edition.txt');
        fs.writeFileSync(file, newEdition.toString(), 'utf8');
        edition = newEdition;
      }
      draftData = req.body.data;
    }

    const jsonPath = path.join(OUTPUT_DIR, `borrador_edicion_${edition}_data.json`);
    
    fs.writeFileSync(jsonPath, JSON.stringify(draftData, null, 2), 'utf8');
    console.log(`Borrador JSON de la edición ${edition} actualizado.`);
    
    res.json({ success: true, message: "Borrador guardado exitosamente.", edition });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.5. Cambiar el número de edición activa en cache/edition.txt
app.post('/api/edition', (req, res) => {
  try {
    const { edition } = req.body;
    if (edition === undefined || isNaN(parseInt(edition, 10))) {
      return res.status(400).json({ success: false, error: "Número de edición inválido." });
    }
    const file = path.join(CACHE_DIR, 'edition.txt');
    fs.writeFileSync(file, parseInt(edition, 10).toString(), 'utf8');
    console.log(`Edición activa cambiada a: ${edition}`);
    res.json({ success: true, message: "Edición activa actualizada con éxito.", edition: parseInt(edition, 10) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// 5. Compilar Word y enviar por Email
app.post('/api/publish', (req, res) => {
  try {
    const edition = getCurrentEdition();
    const draftJsonPath = path.join(OUTPUT_DIR, `borrador_edicion_${edition}_data.json`);
    const finalDocxPath = path.join(OUTPUT_DIR, `PULSO_a_la_IA_Edicion_${edition}.docx`);
    const dateStr = getFechaEspanol();
    
    if (!fs.existsSync(draftJsonPath)) {
      return res.status(400).json({
        success: false,
        error: "Borrador de datos no encontrado. Ejecuta la curación primero."
      });
    }
    
    // Paso 5.1: Ejecutar el formateador pulso_publisher.py
    console.log(`Compilando Word para edición ${edition}...`);
    const publishCmd = `"${VENV_PYTHON}" "${path.join(PROJECT_ROOT, 'pulso_publisher.py')}" "${draftJsonPath}" "${finalDocxPath}" "${edition}" "${dateStr}"`;
    
    exec(publishCmd, { cwd: PROJECT_ROOT }, (pubErr, pubStdout, pubStderr) => {
      if (pubErr) {
        console.error("Error compilando Word:", pubErr);
        return res.status(500).json({ success: false, error: "Error compilando documento Word.", details: pubStderr });
      }
      
      // Copiar de forma automática el archivo compilado a la carpeta principal de Descargas del usuario
      try {
        const downloadsDest = path.join('/Users/rwagner/Downloads', `PULSO_a_la_IA_Edicion_${edition}.docx`);
        fs.copyFileSync(finalDocxPath, downloadsDest);
        console.log(`✓ Archivo copiado automáticamente a Descargas: ${downloadsDest}`);
      } catch (copyErr) {
        console.error("Error copiando el archivo a Descargas:", copyErr);
      }
      
      // Paso 5.2: Enviar el correo electrónico con --send-only
      console.log(`Enviando correo para edición ${edition}...`);
      const sendCmd = `"${VENV_PYTHON}" "${path.join(PROJECT_ROOT, 'pulso_curator.py')}" --send-only "${finalDocxPath}" "${edition}"`;
      
      exec(sendCmd, { cwd: PROJECT_ROOT }, (sendErr, sendStdout, sendStderr) => {
        if (sendErr) {
          console.error("Error enviando email:", sendErr);
          return res.status(500).json({ success: false, error: "Error enviando correo electrónico.", details: sendStderr });
        }
        
        res.json({
          success: true,
          message: `Edición ${edition} compilada y enviada por correo con éxito.`,
          docxFile: `PULSO_a_la_IA_Edicion_${edition}.docx`
        });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Obtener los logs
app.get('/api/logs', (req, res) => {
  try {
    const logFile = path.join(LOGS_DIR, 'pulso.log');
    if (!fs.existsSync(logFile)) {
      return res.json({ success: true, logs: "No hay logs disponibles." });
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    const lastLines = lines.slice(-100).join('\n');
    res.json({ success: true, logs: lastLines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Apagar Dashboard (Frontend y Backend)
app.post('/api/shutdown', (req, res) => {
  console.log("Recibida solicitud de apagado del Dashboard...");
  res.json({ success: true, message: "Apagando servidores..." });
  
  setTimeout(() => {
    // 1. Terminar el Frontend Vite en el puerto 5173 (si está activo)
    exec('lsof -t -i:5173 | xargs kill -9 2>/dev/null || true', (err) => {
      if (err) console.log("Detención de frontend ignorada o completada:", err.message);
      
      // 2. Apagarse a sí mismo (Backend)
      console.log("Apagando servidor Backend Express...");
      process.exit(0);
    });
  }, 1000);
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});

