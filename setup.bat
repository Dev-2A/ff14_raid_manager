@echo off
chcp 65001 > nul
echo FF14 레이드 관리 시스템 설치 시작...
echo.

:: Python 환경변수 설정 (UTF-8 인코딩)
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

:: 백엔드 설정
echo [1/4] 백엔드 가상환경 생성중...
cd backend
python -m venv venv
call venv\Scripts\activate

echo [2/4] 백엔드 패키지 설치중...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [3/4] 환경변수 파일 생성중...
if not exist .env (
    echo SECRET_KEY=your-secret-key-here-change-this-in-production > .env
    echo ALGORITHM=HS256 >> .env
    echo ACCESS_TOKEN_EXPIRE_MINUTES=10080 >> .env
)

echo [4/4] 데이터베이스 폴더 생성중...
if not exist data mkdir data

:: 프론트엔드 설정
echo.
echo [5/6] 프론트엔드로 이동중...
cd ..\frontend

echo [6/6] 프론트엔드 패키지 설치중...
call npm install

echo.
echo ========================================
echo 설치가 완료되었습니다!
echo.
echo 실행 방법:
echo 1. 터미널 1: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo 2. 터미널 2: cd frontend ^&^& npm start
echo ========================================
pause