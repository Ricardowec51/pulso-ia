import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:4001/api';

function App() {
  const [status, setStatus] = useState({ currentEdition: 0, fecha: '', outputFiles: [] });
  const [activeTab, setActiveTab] = useState('resumen');
  const [draft, setDraft] = useState(null);
  const [logs, setLogs] = useState('Cargando logs...');
  const [loading, setLoading] = useState({ curate: false, save: false, publish: false });
  const [notification, setNotification] = useState(null);
  const terminalEndRef = useRef(null);

  // Cargar estado inicial
  const loadStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      showNotice('error', 'Error conectando con el servidor backend.');
    }
  };

  // Cargar borrador JSON
  const loadDraft = async () => {
    try {
      const res = await fetch(`${API_BASE}/draft`);
      const data = await res.json();
      if (data.success) {
        setDraft(data.data);
        showNotice('success', `Borrador de la Edición ${data.edition} cargado.`);
      } else {
        setDraft(null);
      }
    } catch (err) {
      setDraft(null);
    }
  };

  // Cargar logs del sistema
  const loadLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      setLogs('Error cargando los logs.');
    }
  };

  useEffect(() => {
    loadStatus();
    loadDraft();
    loadLogs();
    const interval = setInterval(loadLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Ejecutar Curación RSS con Gemini
  const handleCurate = async () => {
    setLoading(prev => ({ ...prev, curate: true }));
    showNotice('info', 'Ejecutando curación RSS con Google Gemini. Esto puede tomar unos segundos...');
    try {
      const res = await fetch(`${API_BASE}/curate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotice('success', 'Curación completada. Se generó un nuevo borrador.');
        await loadStatus();
        await loadDraft();
      } else {
        showNotice('error', 'Error en la curación: ' + data.error);
      }
    } catch (err) {
      showNotice('error', 'Error de conexión durante la curación.');
    } finally {
      setLoading(prev => ({ ...prev, curate: false }));
      loadLogs();
    }
  };

  // Guardar el borrador JSON editado
  const handleSaveDraft = async () => {
    if (!draft) return;
    setLoading(prev => ({ ...prev, save: true }));
    try {
      const res = await fetch(`${API_BASE}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (data.success) {
        showNotice('success', 'Borrador guardado exitosamente.');
      } else {
        showNotice('error', 'Error guardando borrador: ' + data.error);
      }
    } catch (err) {
      showNotice('error', 'Error de red guardando borrador.');
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  // Compilar Word y enviar por Correo
  const handlePublish = async () => {
    if (!window.confirm('¿Estás seguro de compilar y enviar esta edición por correo electrónico?')) return;
    setLoading(prev => ({ ...prev, publish: true }));
    showNotice('info', 'Compilando documento final y enviando correo...');
    try {
      const res = await fetch(`${API_BASE}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotice('success', data.message);
        loadStatus();
      } else {
        showNotice('error', 'Error en la publicación: ' + data.error);
      }
    } catch (err) {
      showNotice('error', 'Error de red durante la publicación.');
    } finally {
      setLoading(prev => ({ ...prev, publish: false }));
      loadLogs();
    }
  };

  // Manejar cambios en el borrador estructurado
  const updateField = (section, index, field, value) => {
    setDraft(prev => {
      const copy = { ...prev };
      if (index === null) {
        copy[section] = value;
      } else {
        copy[section][index][field] = value;
      }
      return copy;
    });
  };

  return (
    <div className="dashboard-container">
      {/* Cabecera */}
      <header className="app-header">
        <div className="brand-section">
          <h1>PULSO a la IA</h1>
          <p>Panel Administrativo y Curador Autónomo de Newsletter · EMPRENDEDORES.LTD</p>
        </div>
        <div className="status-badge">
          <div className="pulse-dot"></div>
          <span>Edición Activa: #{status.currentEdition} | {status.fecha}</span>
        </div>
      </header>

      {/* Alertas */}
      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="dashboard-grid">
        
        {/* Barra Lateral Izquierda */}
        <aside className="action-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Card de Control de Acciones */}
          <div className="glass-card">
            <h2 className="card-title">⚙️ Acciones del Pipeline</h2>
            <div className="action-list">
              <button 
                className="btn btn-primary" 
                onClick={handleCurate}
                disabled={loading.curate}
                id="btn-curate"
              >
                {loading.curate ? <div className="spinner" /> : '🤖'} Curar Feeds con Gemini
              </button>
              
              <button 
                className="btn" 
                onClick={handleSaveDraft}
                disabled={loading.save || !draft}
                id="btn-save"
              >
                {loading.save ? <div className="spinner" /> : '💾'} Guardar Borrador JSON
              </button>

              <button 
                className="btn btn-accent" 
                onClick={handlePublish}
                disabled={loading.publish || !draft}
                id="btn-publish"
              >
                {loading.publish ? <div className="spinner" /> : '✉️'} Compilar y Enviar Correo
              </button>
            </div>
          </div>

          {/* Card de Archivos Generados */}
          <div className="glass-card">
            <h2 className="card-title">📂 Historial de Ediciones</h2>
            <ul style={{ listStyle: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {status.outputFiles.length === 0 ? (
                <li>No hay ediciones compiladas aún.</li>
              ) : (
                status.outputFiles.map((file, idx) => (
                  <li key={idx} style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    📄 {file}
                  </li>
                ))
              )}
            </ul>
          </div>
          
        </aside>

        {/* Sección Central del Editor */}
        <main className="editor-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-card">
            <h2 className="card-title">📝 Editor de Edición Actual</h2>
            
            {!draft ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No hay un borrador activo cargado.</p>
                <p style={{ fontSize: '0.9rem' }}>Haz clic en <strong>Curar Feeds con Gemini</strong> en el panel izquierdo para generar un nuevo borrador de la Edición #{status.currentEdition + 1}.</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="editor-tabs">
                  <button className={`tab-btn ${activeTab === 'resumen' ? 'active' : ''}`} onClick={() => setActiveTab('resumen')}>Resumen</button>
                  <button className={`tab-btn ${activeTab === 'noticias' ? 'active' : ''}`} onClick={() => setActiveTab('noticias')}>Noticias</button>
                  <button className={`tab-btn ${activeTab === 'modelos' ? 'active' : ''}`} onClick={() => setActiveTab('modelos')}>Modelos</button>
                  <button className={`tab-btn ${activeTab === 'tendencias' ? 'active' : ''}`} onClick={() => setActiveTab('tendencias')}>Tendencias</button>
                  <button className={`tab-btn ${activeTab === 'veredicto' ? 'active' : ''}`} onClick={() => setActiveTab('veredicto')}>Veredicto</button>
                  <button className={`tab-btn ${activeTab === 'hashtags' ? 'active' : ''}`} onClick={() => setActiveTab('hashtags')}>Hashtags</button>
                </div>

                {/* Contenido de Tabs */}
                <div className="tab-content">
                  
                  {/* Resumen Ejecutivo */}
                  {activeTab === 'resumen' && (
                    <div className="form-group">
                      <label>Resumen Ejecutivo</label>
                      <textarea
                        className="form-control"
                        value={draft.resumen_ejecutivo}
                        onChange={(e) => updateField('resumen_ejecutivo', null, null, e.target.value)}
                        rows={10}
                      />
                    </div>
                  )}

                  {/* Noticias Destacadas */}
                  {activeTab === 'noticias' && (
                    <div>
                      {draft.noticias.map((n, i) => (
                        <div key={i} className="news-editor-card">
                          <div className="news-card-header">
                            <span>Noticia #{i + 1}</span>
                          </div>
                          
                          <div className="form-group">
                            <label>Título</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={n.titulo} 
                              onChange={(e) => updateField('noticias', i, 'titulo', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>Qué Pasó</label>
                            <textarea 
                              className="form-control" 
                              value={n.que_paso} 
                              onChange={(e) => updateField('noticias', i, 'que_paso', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="form-group">
                            <label>Por Qué Importa</label>
                            <textarea 
                              className="form-control" 
                              value={n.por_que_importa} 
                              onChange={(e) => updateField('noticias', i, 'por_que_importa', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="form-group">
                            <label>Te Afecta</label>
                            <textarea 
                              className="form-control" 
                              value={n.te_afecta} 
                              onChange={(e) => updateField('noticias', i, 'te_afecta', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="form-group">
                            <label>Recomendación</label>
                            <textarea 
                              className="form-control" 
                              value={n.recomendacion} 
                              onChange={(e) => updateField('noticias', i, 'recomendacion', e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="form-group">
                            <label>URL de la Fuente</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={n.url} 
                              onChange={(e) => updateField('noticias', i, 'url', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Modelos Destacados */}
                  {activeTab === 'modelos' && (
                    <div>
                      {draft.modelos.map((m, i) => (
                        <div key={i} className="news-editor-card">
                          <div className="news-card-header">
                            <span>Modelo #{i + 1}</span>
                          </div>

                          <div className="form-group">
                            <label>Título</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={m.titulo} 
                              onChange={(e) => updateField('modelos', i, 'titulo', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>Descripción</label>
                            <textarea 
                              className="form-control" 
                              value={m.descripcion} 
                              onChange={(e) => updateField('modelos', i, 'descripcion', e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="form-group">
                            <label>Recomendación</label>
                            <textarea 
                              className="form-control" 
                              value={m.recomendacion} 
                              onChange={(e) => updateField('modelos', i, 'recomendacion', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tendencias del Mercado */}
                  {activeTab === 'tendencias' && (
                    <div>
                      {draft.tendencias.map((t, i) => (
                        <div key={i} className="news-editor-card">
                          <div className="news-card-header">
                            <span>Tendencia #{i + 1}</span>
                          </div>

                          <div className="form-group">
                            <label>Título</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={t.titulo} 
                              onChange={(e) => updateField('tendencias', i, 'titulo', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>Análisis</label>
                            <textarea 
                              className="form-control" 
                              value={t.analisis} 
                              onChange={(e) => updateField('tendencias', i, 'analisis', e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Veredicto Accionable */}
                  {activeTab === 'veredicto' && (
                    <div>
                      <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem' }}>5 Recomendaciones Accionables:</h3>
                      {draft.veredicto.map((item, i) => (
                        <div key={i} className="list-editor-item">
                          <div className="item-index">{i + 1}</div>
                          <input
                            type="text"
                            className="form-control"
                            value={item}
                            onChange={(e) => {
                              const newVeredicto = [...draft.veredicto];
                              newVeredicto[i] = e.target.value;
                              updateField('veredicto', null, null, newVeredicto);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hashtags */}
                  {activeTab === 'hashtags' && (
                    <div className="form-group">
                      <label>Hashtags Dinámicos de la Edición</label>
                      <input
                        type="text"
                        className="form-control"
                        value={draft.hashtags_dinamicos ? draft.hashtags_dinamicos.join(' ') : ''}
                        onChange={(e) => {
                          const tags = e.target.value.split(/\s+/).filter(t => t.startsWith('#'));
                          updateField('hashtags_dinamicos', null, null, tags);
                        }}
                        placeholder="Ej: #AgentesIA #BancaDigital #Latam"
                      />
                      <small style={{ display: 'block', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                        Ingresa los hashtags separados por espacios. Deben comenzar con #.
                      </small>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>

          {/* Consola de Logs */}
          <div className="glass-card">
            <div className="terminal-header">
              <span className="terminal-title">🖥️ Monitor del Sistema (pulso.log)</span>
              <div>
                <span className="terminal-dot"></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En línea</span>
              </div>
            </div>
            <div className="terminal-container">
              {logs}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
