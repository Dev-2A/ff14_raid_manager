# FF14 레이드 관리 시스템

파이널 판타지 14의 레이드 공대를 효율적으로 관리하기 위한 웹 애플리케이션입니다.

## 주요 기능

- 🛡️ **공대 관리**: 8인 공대 생성 및 구성원 관리
- ⚔️ **아이템 분배**: 우선순위/먹고빠지기 분배 방식 지원
- 📊 **장비 세트 관리**: 현재/출발/최종 세트 관리 및 달성률 확인
- 💎 **재화 계산**: 석판, 레이드 토큰, 보강 재료 자동 계산
- 📅 **일정 관리**: 레이드 일정 등록 및 관리

## 기술 스택

### 백엔드
- FastAPI (Python) - v0.110.0
- SQLAlchemy - v2.0.28
- Alembic - 데이터베이스 마이그레이션
- SQLite - 로컬 데이터베이스
- JWT 인증

### 프론트엔드
- React 18
- TypeScript
- TailwindCSS 3.x
- React Router v6

## 빠른 시작

### 사전 요구사항
- Python 3.8+
- Node.js 16+
- Git

### 설치 및 실행

1. **프로젝트 클론**
```bash
git clone [repository-url]
cd ff14_raid_manager
```

2. **자동 설치 (Windows)**
```bash
setup.bat
```

3. **자동 설치 (Mac/Linux)**
```bash
chmod +x setup.sh
./setup.sh
```

4. **서버 실행**
- 터미널 1: `run-backend.bat` (또는 `cd backend && venv\Scripts\activate && uvicorn app.main:app --reload`)
- 터미널 2: `run-frontend.bat` (또는 `cd frontend && npm start`)

### 수동 설치
[SETUP_GUIDE.md](./SETUP_GUIDE.md) 파일을 참조하세요.

## 테스트 계정
- 관리자: `admin` / `admin123`

## 프로젝트 구조

```
ff14_raid_manager/
├── backend/
│   ├── app/
│   │   ├── routers/    # API 엔드포인트
│   │   ├── models.py   # 데이터베이스 모델
│   │   └── main.py     # FastAPI 앱
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ # React 컴포넌트
│   │   ├── pages/      # 페이지 컴포넌트
│   │   ├── services/   # API 통신
│   │   └── utils/      # 유틸리티
│   └── package.json
└── README.md
```

## API 문서
백엔드 실행 후 http://localhost:8000/docs 에서 확인

## 기여하기

### requirements.txt 업데이트 (백엔드 패키지 추가 시)
```bash
cd backend
venv\Scripts\activate
pip freeze > requirements.txt
```

### 코드 스타일
- 백엔드: PEP 8
- 프론트엔드: ESLint + Prettier

## 라이선스
이 프로젝트는 개인 학습 목적으로 제작되었습니다.
Final Fantasy XIV는 Square Enix의 등록 상표입니다.

## 문의
문제가 있거나 제안사항이 있으면 Issues를 통해 알려주세요.