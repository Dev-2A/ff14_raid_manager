from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from . import models, schemas, auth
from .database import get_db

# OAuth2 인증 스키마 설정
# tokenUrl은 로그인 엔드포인트의 경로를 지정함
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    현재 인증된 사용자를 가져오는 의존성

    Args:
        token: JWT 토큰
        db: 데이터베이스 세션

    Returns:
        User: 현재 사용자 객체
    
    Raises:
        HTTPException: 인증 실패시
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    # 토큰 검증
    token_data = auth.verify_token(token, credentials_exception)
    
    # 사용자 조회
    user = auth.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    현재 활성화된 사용자를 가져오는 의존성

    Args:
        current_user: 현재 사용자

    Returns:
        User: 활성화된 사용자 객체
    
    Raises:
        HTTPException: 사용자가 비활성화된 경우
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비활성화된 사용자입니다"
        )
    return current_user

async def get_current_admin_user(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """
    관리자 권한을 가진 사용자를 가져오는 의존성

    Args:
        current_user: 현재 활성 사용자

    Returns:
        User: 관리자 사용자 객체
    
    Raises:
        HTTPException: 관리자 권한이 없는 경우
    """
    if not auth.check_admin_permission(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    return current_user

class PartyPermissionChecker:
    """공대 권한 확인을 위한 의존성 클래스"""
    
    def __init__(self, allow_member: bool = True, require_leader: bool = False):
        """
        Args:
            allow_member: 일반 공대원도 허용할지 여부
            require_leader: 공대장 권한이 반드시 필요한지 여부
        """
        self.allow_member = allow_member
        self.require_leader = require_leader
    
    async def __call__(
        self,
        party_id: int,
        current_user: models.User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> models.User:
        """
        공대 권한을 확인하고 현재 사용자를 반환

        Args:
            party_id: 공대 ID
            current_user: 현재 사용자
            db: 데이터베이스 세션

        Returns:
            User: 권한이 확인된 사용자
        
        Raises:
            HTTPException: 권한이 없는 경우
        """
        # 관리자는 모든 권한 가능
        if current_user.is_admin:
            return current_user
        
        # 공대장 권한 필요시
        if self.require_leader:
            if not auth.check_party_leader_permission(db, party_id, current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="공대장 권한이 필요합니다"
                )
            return current_user
        
        # 일반 공대원 허용시
        if self.allow_member:
            if not auth.check_party_member_permission(db, party_id, current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="해당 공대의 멤버가 아닙니다"
                )
            return current_user
        
        # 공대 관리 권한 확인 (공대장 또는 관리자)
        if not auth.has_party_management_permission(db, party_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="공대 관리 권한이 필요합니다"
            )
        
        return current_user

# 자주 사용되는 의존성 인스턴스
get_party_member = PartyPermissionChecker(allow_member=True, require_leader=False)
get_party_leader = PartyPermissionChecker(allow_member=False, require_leader=True)
get_party_manager = PartyPermissionChecker(allow_member=False, require_leader=False)

async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    선택적 인증 - 로그인하지 않아도 접근 가능하지만
    로그인한 경우 사용자 정보를 가져오는 의존성

    Args:
        token: JWT 토큰 (선택적)
        db: 데이터베이스 세션

    Returns:
        User or None: 사용자 객체 또는 None
    """
    if not token:
        return None
    
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None

# 페이지네이션을 위한 공통 파라미터
class CommonQueryParams:
    """공통 쿼리 파라미터"""
    
    def __init__(
        self,
        skip: int=0,
        limit: int=20,
        sort_by: Optional[str] = None,
        order: str = "desc"
    ):
        """
        Args:
            skip: 건너뛸 항목 수
            limit: 가져올 항목 수 (최대 100)
            sort_by: 정렬 기준 필드
            order: 정렬 순서 (asc/desc)
        """
        self.skip = skip
        self.limit = min(limit, 100) # 최대 100개로 제한
        self.sort_by = sort_by
        self.order = order if order in ["asc", "desc"] else "desc"