from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite 데이터베이스 URL 설정
# 'data/ff14_raid.db' 파일에 데이터베이스가 생성됨
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/ff14_raid.db"

# 데이터베이스 엔진 생성
# check_same_thread=False는 SQLite를 FastAPI와 함께 사용하기 위한 설정
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# 세션 팩토리 생성
# 데이터베이스 작업을 위한 세션을 만들 때 사용
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모든 모델의 기본 클래스
# 이 클래스를 상속받아 데이터베이스 테이블을 정의함
Base = declarative_base()

# 데이터베이스 세션을 가져오는 함수
# 각 요청마다 새로운 세션을 생성하고, 작업이 끝나면 닫음
def get_db():
    """
    데이터베이스 세션을 생성하고 반환하는 제너레이터 함수
    FastAPI의 의존성 주입에 사용됨
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()