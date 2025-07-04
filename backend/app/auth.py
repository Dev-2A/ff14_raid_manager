from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from . import models, schemas
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# 환경 변수에서 시크릿 키 가져오기
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24시간

# 비밀번호 암호화 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    평문 비밀번호와 해시된 비밀번호를 비교

    Args:
        plain_password: 사용자가 입력한 평문 비밀번호
        hashed_password: 데이터베이스에 저장된 해시된 비밀번호

    Returns:
        bool: 비밀번호 일치 여부
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    비밀번호를 해시화

    Args:
        password: 평문 비밀번호

    Returns:
        str: 해시된 비밀번호
    """
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    사용자 인증

    Args:
        db: 데이터베이스 세션
        username: 사용자명
        password: 비밀번호

    Returns:
        User: 인증 성공시 사용자 객체, 실패시 None
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰 생성

    Args:
        data: 토큰에 포함할 데이터
        expires_delta: 토큰 만료 시간

    Returns:
        str: 생성된 JWT 토큰
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception) -> schemas.TokenData:
    """
    JWT 토큰 검증

    Args:
        token: JWT 토큰
        credentials_exception: 인증 실패시 발생시킬 예외

    Returns:
        TokenData: 토큰 데이터
    
    Raises:
        credentials_exception: 토큰 검증 실패시
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """
    사용자명으로 사용자 조회

    Args:
        db: 데이터베이스 세션
        username: 사용자명

    Returns:
        User: 사용자 객체
    """
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    이메일로 사용자 조회
    
    Args:
        db: 데이터베이스 세션
        email: 이메일 주소
    
    Returns:
        User: 사용자 객체
    """
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    새 사용자 생성
    
    Args:
        db: 데이터베이스 세션
        user: 사용자 생성 정보
    
    Returns:
        User: 생성된 사용자 객체
    """
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def check_admin_permission(current_user: models.User) -> bool:
    """
    관리자 권한 확인

    Args:
        current_user: 현재 사용자

    Returns:
        bool: 관리자 여부
    """
    return current_user.is_admin

def check_party_leader_permission(db: Session, party_id: int, user_id: int) -> bool:
    """
    공대장 권한 확인

    Args:
        db: 데이터베이스 세션
        party_id: 공대 ID
        user_id: 사용자 ID

    Returns:
        bool: 공대장 여부
    """
    party = db.query(models.Party).filter(
        models.Party.id == party_id,
        models.Party.leader_id == user_id
    ).first()
    return party is not None

def check_party_member_permission(db: Session, party_id: int, user_id: int) -> bool:
    """
    공대원 권한 확인 (공대에 속해있는지)
    
    Args:
        db: 데이터베이스 세션
        party_id: 공대 ID
        user_id: 사용자 ID
    
    Returns:
        bool: 공대원 여부
    """
    member = db.query(models.PartyMember).filter(
        models.PartyMember.party_id == party_id,
        models.PartyMember.user_id == user_id,
        models.PartyMember.is_active == True
    ).first()
    return member is not None

def has_party_management_permission(db: Session, party_id: int, user: models.User) -> bool:
    """
    공대 관리 권한 확인 (공대장 또는 관리자)
    
    Args:
        db: 데이터베이스 세션
        party_id: 공대 ID
        user: 사용자 객체
    
    Returns:
        bool: 관리 권한 여부
    """
    # 관리자는 모든 공대 관리 가능
    if user.is_admin:
        return True
    
    # 공대장 확인
    return check_party_leader_permission(db, party_id, user.id)