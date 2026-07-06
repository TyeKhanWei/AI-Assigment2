@echo off
start "UCS Backend (Python)" cmd /k "cd /d %~dp0backend && python server.py"
start "UCS Frontend (React)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both windows opened. Frontend: http://localhost:5173
