# FF14 레이드 관리 시스템 - 설치 가이드

## 사전 준비사항
1. **Git** 설치: https://git-scm.com/
2. **Python 3.8+** 설치: https://www.python.org/
3. **Node.js 16+** 설치: https://nodejs.org/

## 1단계: 프로젝트 클론

```bash
# GitHub에서 프로젝트 클론
git clone [깃허브_리포지토리_주소]
cd ff14_raid_manager
```

## 2단계: 백엔드 설정

### 2-1. Python 가상환경 생성 및 활성화

```bash
# backend 폴더로 이동
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 가상환경 활성화 (Mac/Linux)
# source venv/bin/activate
```

### 2-2. 백엔드 패키지 설치

```bash
# requirements.txt로 설치 (권장)
pip install -r requirements.txt

# requirements.txt가 없다면 수동 설치
pip install fastapi==0.110.0
pip install uvicorn[standard]==0.27.1
pip install python-multipart==0.0.9
pip install sqlalchemy==2.0.28
pip install alembic==1.13.1
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4
pip install python-dotenv==1.0.1
pip install pydantic==2.6.3
pip install pydantic[email]==2.6.3
pip install email-validator==2.1.1
pip install requests==2.31.0
pip install python-dateutil==2.9.0
```

### 2-3. 환경변수 파일 생성

```bash
# .env 파일 생성 (backend 폴더 안에)
# 메모장이나 VS Code로 .env 파일을 만들고 다음 내용 입력:
```

**.env 파일 내용:**
```
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 2-4. 데이터베이스 초기화

```bash
# Python 실행
python

# Python 콘솔에서 다음 명령 실행
>>> from app.database import engine
>>> from app.models import Base
>>> Base.metadata.create_all(bind=engine)
>>> exit()
```

### 2-5. 백엔드 서버 실행

```bash
# backend 폴더에서
uvicorn app.main:app --reload
```

브라우저에서 http://localhost:8000/docs 접속하여 API 문서 확인

## 3단계: 프론트엔드 설정

### 3-1. 새 터미널/명령 프롬프트 열기

```bash
# 프로젝트 루트로 이동
cd ff14_raid_manager

# frontend 폴더로 이동
cd frontend
```

### 3-2. 프론트엔드 패키지 설치

```bash
# package.json에 정의된 모든 패키지 설치
npm install
```

### 3-3. 환경변수 파일 생성 (선택사항)

```bash
# .env 파일 생성 (frontend 폴더 안에)
# .env.example이 있다면 복사
copy .env.example .env

# Mac/Linux:
# cp .env.example .env
```

### 3-4. 프론트엔드 서버 실행

```bash
# frontend 폴더에서
npm start
```

브라우저가 자동으로 http://localhost:3000 열림

## 4단계: 프로젝트 확인

1. **백엔드 확인**: http://localhost:8000/docs
2. **프론트엔드 확인**: http://localhost:3000
3. **테스트 로그인**: admin / admin123

## 문제 해결

### Python 가상환경 활성화 안 될 때
```bash
# PowerShell 실행 정책 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### npm install 에러
```bash
# 캐시 삭제 후 재설치
npm cache clean --force
npm install
```

### 포트 충돌 (이미 사용중)
```bash
# Windows에서 포트 사용 프로세스 확인
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

### CORS 에러
- 백엔드가 실행 중인지 확인
- frontend/package.json에 proxy 설정 확인

## 팀 협업 시 주의사항

### .gitignore에 포함되는 파일들
다음 파일/폴더는 git에 포함되지 않으므로 각자 생성해야 함:

**백엔드:**
- `venv/` - Python 가상환경
- `.env` - 환경변수 파일
- `__pycache__/` - Python 캐시
- `data/ff14_raid.db` - SQLite 데이터베이스 (초기 데이터는 자동 생성)

**프론트엔드:**
- `node_modules/` - npm 패키지들
- `.env` - 환경변수 파일
- `build/` - 빌드 결과물

### 권장 .gitignore 파일

**backend/.gitignore:**
```
venv/
__pycache__/
*.pyc
.env
data/*.db
.pytest_cache/
```

**frontend/.gitignore:**
```
node_modules/
build/
.env
.DS_Store
*.log
```

## 빠른 시작 명령어 모음

### Windows 환경
```bash
# 터미널 1 - 백엔드
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# 터미널 2 - 프론트엔드
cd frontend
npm start
```

### Mac/Linux 환경
```bash
# 터미널 1 - 백엔드
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 터미널 2 - 프론트엔드
cd frontend
npm start
```