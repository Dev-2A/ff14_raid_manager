from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from . import models
from .database import engine
from .routers import auth, users, raids, parties, items, distribution, jobs

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 데이터베이스 테이블 생성 및 초기 데이터 설정
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작 시 실행되는 함수"""
    logger.info("애플리케이션 시작 중...")
    
    # 데이터베이스 테이블 생성
    models.Base.metadata.create_all(bind=engine)
    logger.info("데이터베이스 테이블 생성 완료")
    
    # 초기 데이터 설정 (직업 데이터 등)
    from .init_data import initialize_jobs, initialize_test_data
    initialize_jobs()
    
    # 개발 환경에서는 테스트 데이터도 생성
    import os
    if os.getenv("ENVIRONMENT", "development") == "development":
        initialize_test_data()
    
    yield
    
    # 애플리케이션 종료 시 실행
    logger.info("애플리케이션 종료 중...")

# FastAPI 앱 생성
app = FastAPI(
    title="FF14 레이드 관리 시스템",
    description="파이널 판타지 14 레이드 공대 관리를 위한 API 서버",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 (프론트엔드 연동을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # 프론트엔드 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api/auth", tags=["인증"])
app.include_router(users.router, prefix="/api/users", tags=["사용자"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["직업"])
app.include_router(raids.router, prefix="/api/raids", tags=["레이드"])
app.include_router(parties.router, prefix="/api/parties", tags=["공대"])
app.include_router(items.router, prefix="/api/items", tags=["아이템"])
app.include_router(distribution.router, prefix="/api/distribution", tags=["분배"])

# 루트 엔드포인트
@app.get("/")
async def root():
    """API 서버 상태 확인"""
    return {
        "message": "FF14 레이드 관리 시스템 API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "database": "connected"
    }

# 에러 핸들러
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """404 에러 핸들러"""
    return {
        "error": "Not Found",
        "message": "요청한 리소스를 찾을 수 없습니다",
        "path": str(request.url)
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """500 에러 핸들러"""
    logger.error(f"Internal error: {exc}")
    return {
        "error": "Internal Server Error",
        "message": "서버 내부 오류가 발생했습니다"
    }

# 개발 서버 실행을 위한 코드
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )