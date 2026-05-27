#!/bin/bash

# pulso_start.sh - Control para el Dashboard de PULSO a la IA
# Compatible con macOS (Mac Mini M4 Pro) y Linux.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$DIR/backend"
FRONTEND_DIR="$DIR/frontend"

# Crear directorios necesarios
mkdir -p "$DIR/logs"
mkdir -p "$DIR/cache"

PORT_BACKEND=4001
PORT_FRONTEND=5173

start_dashboard() {
    echo "=== Iniciando Dashboard de PULSO a la IA ==="

    # Verificar si el backend ya está corriendo
    if lsof -Pi :$PORT_BACKEND -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  El Backend ya está corriendo en el puerto $PORT_BACKEND."
    else
        echo "🚀 Iniciando Backend Express en el puerto $PORT_BACKEND..."
        cd "$BACKEND_DIR" || exit 1
        nohup npm start > "$DIR/logs/backend.log" 2>&1 &
        echo $! > "$DIR/cache/backend.pid"
        cd "$DIR" || exit 1
    fi

    # Verificar si el frontend ya está corriendo
    if lsof -Pi :$PORT_FRONTEND -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  El Frontend ya está corriendo en el puerto $PORT_FRONTEND."
    else
        echo "🚀 Iniciando Frontend Vite en el puerto $PORT_FRONTEND..."
        cd "$FRONTEND_DIR" || exit 1
        nohup npm run dev > "$DIR/logs/frontend.log" 2>&1 &
        echo $! > "$DIR/cache/frontend.pid"
        cd "$DIR" || exit 1
    fi

    echo "✅ Dashboard iniciado."
    echo "👉 Backend: http://localhost:$PORT_BACKEND"
    echo "👉 Frontend: http://localhost:$PORT_FRONTEND"
}

stop_dashboard() {
    echo "=== Deteniendo Dashboard de PULSO a la IA ==="
    
    # Detener backend por puerto
    PID_BACKEND=$(lsof -t -i:$PORT_BACKEND)
    if [ -n "$PID_BACKEND" ]; then
        echo "🛑 Deteniendo Backend Express (PID: $PID_BACKEND)..."
        kill -9 $PID_BACKEND 2>/dev/null
    else
        echo "ℹ️  Backend Express no está activo en el puerto $PORT_BACKEND."
    fi

    # Detener frontend por puerto
    PID_FRONTEND=$(lsof -t -i:$PORT_FRONTEND)
    if [ -n "$PID_FRONTEND" ]; then
        echo "🛑 Deteniendo Frontend Vite (PID: $PID_FRONTEND)..."
        kill -9 $PID_FRONTEND 2>/dev/null
    else
        echo "ℹ️  Frontend Vite no está activo en el puerto $PORT_FRONTEND."
    fi

    # Limpiar archivos de PIDs si existen
    rm -f "$DIR/cache/backend.pid" "$DIR/cache/frontend.pid"
    echo "✅ Dashboard detenido por completo."
}

status_dashboard() {
    echo "=== Estado del Dashboard ==="
    
    PID_BACKEND=$(lsof -t -i:$PORT_BACKEND)
    if [ -n "$PID_BACKEND" ]; then
        echo "🟢 Backend Express: Activo en puerto $PORT_BACKEND (PID: $PID_BACKEND)"
    else
        echo "🔴 Backend Express: Inactivo"
    fi

    PID_FRONTEND=$(lsof -t -i:$PORT_FRONTEND)
    if [ -n "$PID_FRONTEND" ]; then
        echo "🟢 Frontend Vite: Activo en puerto $PORT_FRONTEND (PID: $PID_FRONTEND)"
    else
        echo "🔴 Frontend Vite: Inactivo"
    fi
}

case "$1" in
    start)
        start_dashboard
        ;;
    stop)
        stop_dashboard
        ;;
    status)
        status_dashboard
        ;;
    restart)
        stop_dashboard
        sleep 1
        start_dashboard
        ;;
    *)
        echo "Uso: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac
