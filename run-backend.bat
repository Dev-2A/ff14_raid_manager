@echo off
chcp 65001 > nul
cd backend
call venv\Scripts\activate
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1
echo 백엔드 서버 시작중... (http://localhost:8000)
uvicorn app.main:app --reload