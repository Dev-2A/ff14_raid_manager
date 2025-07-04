from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from .. import crud, models, schemas, auth
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
async def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    새로운 사용자 등록
    
    - **username**: 사용자명 (3-50자, 중복 불가)
    - **email**: 이메일 주소 (중복 불가)
    - **password**: 비밀번호 (최소 6자 이상)
    """
    # 사용자명 중복 확인
    if auth.get_user_by_username(db, username=user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용중인 사용자명입니다"
        )
    
    # 이메일 중복 확인
    if auth.get_user_by_email(db, email=user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용중인 이메일입니다"
        )
    
    # 사용자 생성
    user = auth.create_user(db=db, user=user_data)
    return user

@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자 로그인
    
    OAuth2 호환 로그인 엔드포인트
    - **username**: 사용자명
    - **password**: 비밀번호
    
    성공시 JWT 액세스 토큰을 반환합니다.
    """
    # 사용자 인증
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    현재 로그인한 사용자 정보 조회
    
    인증 토큰 필요
    """
    return current_user

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    비밀번호 변경
    
    - **current_password**: 현재 비밀번호
    - **new_password**: 새 비밀번호 (최소 6자 이상)
    """
    # 현재 비밀번호 확인
    if not auth.verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다"
        )
    
    # 새 비밀번호 유효성 검사
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 최소 6자 이상이어야 합니다"
        )
    
    # 비밀번호 업데이트
    hashed_password = auth.get_password_hash(new_password)
    crud.update_user(db, current_user.id, {"hashed_password": hashed_password})
    
    return {"message": "비밀번호가 성공적으로 변경되었습니다"}

@router.post("/verify-token")
async def verify_token(
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    토큰 유효성 검증
    
    현재 토큰이 유효한지 확인
    """
    return {
        "valid": True,
        "username": current_user.username,
        "user_id": current_user.id,
        "is_admin": current_user.is_admin
    }

@router.post("/logout")
async def logout(
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    로그아웃
    
    클라이언트 측에서 토큰을 삭제해야 함
    서버에서는 로그아웃 로그를 남길 수 있음
    """
    #TODO - 여기서 로그아웃 관련 로직 추가
    # 예: 로그아웃 이벤트 로깅, 토큰 블랙리스트 추가 등
    
    return {"message": "로그아웃되었습니다"}

@router.post("/request-password-reset")
async def request_password_reset(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    비밀번호 재설정 요청
    
    실제 구현시 이메일로 재설정 링크를 보내는 로직 필요
    """
    user = auth.get_user_by_email(db, email=email)
    if not user:
        # 보안상 사용자 존재 여부를 노출하지 않음
        return {"message": "이메일이 등록되어 있다면 비밀번호 재설정 링크가 전송됩니다"}
    
    #TODO - 실제로는 여기서 이메일 전송 로직 구현
    # - 재설정 토큰 생성
    # - 이메일 전송
    # - 토큰 저장
    
    return {"mesage": "이메일이 등록되어 있다면 비밀번호 재설정 링크가 전송됩니다"}