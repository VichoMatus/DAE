#!/bin/bash

# Estilos de terminal (Colores)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
NODE_ENV_DIR="$ROOT_DIR/node-env"
VENV_DIR="$ROOT_DIR/.venv"

# Configurar el PATH de Node local
export PATH="$NODE_ENV_DIR/bin:$PATH"

function show_help() {
    echo -e "${BOLD}Sistema de Control - DAE ACTIVA${NC}"
    echo -e "Uso: ./control.sh [comando]"
    echo ""
    echo -e "${CYAN}Comandos disponibles:${NC}"
    echo -e "  ${GREEN}setup${NC}      Instala las dependencias del Backend (Python) y Frontend (Next.js)"
    echo -e "  ${GREEN}start${NC}      Inicia los servidores de Backend y Frontend simultáneamente"
    echo -e "  ${GREEN}reset${NC}      Restablece la base de datos a su estado inicial de fábrica"
    echo -e "  ${GREEN}help${NC}       Muestra este mensaje de ayuda"
    echo ""
}

function run_setup() {
    echo -e "${BLUE}=== Iniciando Configuración del Proyecto ===${NC}"
    
    # 1. Configurar Backend (Python virtual env)
    echo -e "\n${CYAN}[1/2] Configurando entorno del Backend (Flask)...${NC}"
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}Creando entorno virtual (.venv)...${NC}"
        python3 -m venv "$VENV_DIR"
    fi
    
    echo -e "${YELLOW}Instalando dependencias de Python...${NC}"
    "$VENV_DIR/bin/pip" install --upgrade pip
    "$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
    echo -e "${GREEN}✓ Backend configurado correctamente.${NC}"

    # 2. Configurar Frontend (Next.js)
    echo -e "\n${CYAN}[2/2] Configurando entorno del Frontend (Next.js)...${NC}"
    if [ ! -d "$NODE_ENV_DIR" ]; then
        echo -e "${RED}⚠️ No se encontró la carpeta local node-env/. Asegúrate de tener Node.js instalado globalmente.${NC}"
    else
        echo -e "${GREEN}✓ Usando entorno local de Node.js en: $NODE_ENV_DIR${NC}"
    fi
    
    echo -e "${YELLOW}Instalando dependencias de npm...${NC}"
    cd "$FRONTEND_DIR" || exit 1
    npm install
    cd "$ROOT_DIR" || exit 1
    echo -e "${GREEN}✓ Frontend configurado correctamente.${NC}"
    
    echo -e "\n${GREEN}${BOLD}✓ ¡Configuración completada con éxito!${NC}"
    echo -e "Puedes iniciar la plataforma ejecutando: ${CYAN}./control.sh start${NC}"
}

function run_start() {
    echo -e "${BLUE}=== Iniciando Servidores de DAE ACTIVA ===${NC}"
    
    # Validar que los entornos estén listos
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${RED}Error: El entorno virtual .venv no existe. Ejecuta './control.sh setup' primero.${NC}"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${RED}Error: Las dependencias de Node.js no están instaladas. Ejecuta './control.sh setup' primero.${NC}"
        exit 1
    fi

    # Iniciar backend
    echo -e "${CYAN}Iniciando Backend (Flask) en puerto 5000...${NC}"
    cd "$BACKEND_DIR" || exit 1
    "$VENV_DIR/bin/python" app.py &
    BACKEND_PID=$!
    cd "$ROOT_DIR" || exit 1

    # Iniciar frontend
    echo -e "${CYAN}Iniciando Frontend (Next.js) en puerto 3000...${NC}"
    cd "$FRONTEND_DIR" || exit 1
    npm run dev &
    FRONTEND_PID=$!
    cd "$ROOT_DIR" || exit 1

    # Manejar apagado controlado con Ctrl+C
    trap "echo -e '\n${YELLOW}Deteniendo servidores...${NC}'; kill $BACKEND_PID $FRONTEND_PID; echo -e '${GREEN}Servidores detenidos con éxito.${NC}'; exit 0" SIGINT SIGTERM

    echo -e "\n${GREEN}${BOLD}¡Plataforma en ejecución!${NC}"
    echo -e "${CYAN}Backend API:${NC}     http://localhost:5000"
    echo -e "${CYAN}Frontend App:${NC}    http://localhost:3000"
    echo -e "${YELLOW}Presiona Ctrl+C para detener ambos servidores.${NC}\n"

    # Mantener el script activo y canalizar logs
    wait
}

function run_reset() {
    echo -e "${BLUE}=== Restableciendo Base de Datos ===${NC}"
    echo -e "${YELLOW}Enviando petición de restauración al servidor...${NC}"
    
    RESPONSE=$(curl -s -X POST http://localhost:5000/api/reset)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Base de datos restablecida a su estado original con éxito.${NC}"
        echo -e "Datos devueltos: $RESPONSE"
    else
        echo -e "${RED}Error: No se pudo contactar al servidor. Asegúrate de que el backend esté corriendo (./control.sh start).${NC}"
    fi
}

# Evaluar argumento de entrada
case "$1" in
    setup)
        run_setup
        ;;
    start)
        run_start
        ;;
    reset)
        run_reset
        ;;
    help|*)
        show_help
        ;;
esac
