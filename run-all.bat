@echo off
echo ========================================
echo   BudgetX - Starting Full Stack
echo ========================================
echo.

REM Start Backend in a new window
echo Starting Backend (port 8000)...
start "BudgetX Backend" cmd /c "cd /d \"%~dp0backend\" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

REM Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

REM Start Frontend in a new window
echo Starting Frontend (port 3000)...
start "BudgetX Frontend" cmd /c "cd /d \"%~dp0frontend\" && npm run dev"

echo.
echo ========================================
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://127.0.0.1:3000
echo   API Docs: http://127.0.0.1:8000/docs
echo ========================================
echo.
echo Close the server windows to stop.
pause
