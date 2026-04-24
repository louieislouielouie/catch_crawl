#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "  🔍 SEO Auditor"
echo "  ──────────────"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}  ✗ Node.js not found.${NC}"
  echo "    Download it from https://nodejs.org (LTS version)"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}  ✗ Node.js 18+ required (you have $(node --version))${NC}"
  echo "    Download the LTS version from https://nodejs.org"
  exit 1
fi

echo -e "${GREEN}  ✓ Node.js $(node --version)${NC}"

# Get the directory this script lives in
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Setup backend env
if [ ! -f "$DIR/backend/.env" ]; then
  cp "$DIR/backend/.env.example" "$DIR/backend/.env"
fi

# Setup frontend env
if [ ! -f "$DIR/frontend/.env.local" ]; then
  cp "$DIR/frontend/.env.example" "$DIR/frontend/.env.local"
fi

# Install backend deps
echo ""
echo "  Installing backend dependencies..."
cd "$DIR/backend" && npm install --silent
echo -e "${GREEN}  ✓ Backend ready${NC}"

# Install frontend deps
echo "  Installing frontend dependencies..."
cd "$DIR/frontend" && npm install --silent
echo -e "${GREEN}  ✓ Frontend ready${NC}"

echo ""
echo -e "  ${YELLOW}Starting servers...${NC}"
echo ""

# Kill both servers on Ctrl+C
cleanup() {
  echo ""
  echo "  Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
cd "$DIR/backend"
npm run dev &> "$DIR/backend.log" &
BACKEND_PID=$!

# Wait for backend to be ready
echo "  Waiting for backend..."
for i in {1..20}; do
  if curl -s http://localhost:3001 &>/dev/null || lsof -i:3001 &>/dev/null; then
    break
  fi
  sleep 0.5
done

echo -e "${GREEN}  ✓ Backend running on http://localhost:3001${NC}"

# Start frontend
cd "$DIR/frontend"
npm run dev &> "$DIR/frontend.log" &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "  Waiting for frontend..."
for i in {1..30}; do
  if curl -s http://localhost:3000 &>/dev/null || lsof -i:3000 &>/dev/null; then
    break
  fi
  sleep 0.5
done

echo -e "${GREEN}  ✓ Frontend running on http://localhost:3000${NC}"

echo ""
echo "  ──────────────────────────────────────"
echo -e "  ${GREEN}Open http://localhost:3000 to start auditing${NC}"
echo "  Press Ctrl+C to stop"
echo "  ──────────────────────────────────────"
echo ""

# Open browser automatically
sleep 1
if command -v open &>/dev/null; then
  open http://localhost:3000   # macOS
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:3000  # Linux
fi

# Keep running until Ctrl+C
wait $BACKEND_PID $FRONTEND_PID
