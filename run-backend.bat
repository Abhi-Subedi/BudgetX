@echo off
echo Starting BudgetX Backend on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
