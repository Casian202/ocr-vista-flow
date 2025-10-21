#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}=== OCR Vista Flow Startup Script ===${NC}"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping services...${NC}"
    if [ -n "${BACKEND_PID:-}" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID:-}" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit
}

trap cleanup SIGINT SIGTERM

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is required but not installed.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is required but not installed.${NC}"
    exit 1
fi

# Setup backend if .venv doesn't exist or requirements are not installed
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Setting up backend environment...${NC}"
    if ! ./scripts/setup_backend.sh; then
        echo -e "${RED}Failed to setup backend environment. Please check your internet connection and try again.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Backend environment already exists.${NC}"
    # Quick check if dependencies are installed
    if ! .venv/bin/python -c "import flask" 2>/dev/null; then
        echo -e "${YELLOW}Backend dependencies not found. Installing...${NC}"
        if ! ./scripts/setup_backend.sh; then
            echo -e "${RED}Failed to install backend dependencies. Please check your internet connection and try again.${NC}"
            exit 1
        fi
    fi
fi

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}Frontend dependencies already installed.${NC}"
fi

# Create .env files if they don't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
fi

if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    echo -e "${YELLOW}Creating backend/.env file from template...${NC}"
    cp backend/.env.example backend/.env
fi

echo ""
echo -e "${GREEN}Starting backend server...${NC}"
# Activate virtual environment and start backend
source .venv/bin/activate
python -m backend.app.main &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Error: Backend failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}Backend started successfully on http://localhost:8000${NC}"

echo ""
echo -e "${GREEN}Starting frontend server...${NC}"
# Start frontend
npm run dev &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}Error: Frontend failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}Frontend started successfully on http://localhost:8080${NC}"

echo ""
echo -e "${GREEN}=== Application is running ===${NC}"
echo -e "Frontend: ${GREEN}http://localhost:8080${NC}"
echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
