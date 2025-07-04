from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import (
    get_current_active_user,
    get_current_admin_user,
    CommonQueryParams
)

router = APIRouter()

@router.get("/", response_model=List[schemas.UserResponse])
async def get_users(
    commons: CommonQueryParams = Depends(),
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    모든 사용자 목록 조회 (관리자 전용)
    
    - **skip**: 건너뛸 항목 수
    - **limit**: 가져올 항목 수 (최대 100)
    """
    users = crud.get_users(db, skip=commons.skip, limit=commons.limit)
    return users

@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    특정 사용자 정보 조회
    
    - 본인 정보는 누구나 조회 가능
    - 다른 사용자 정보는 관리자만 조회 가능
    """
    # 본인이 아닌 경우 관리자 권한 확인
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 사용자의 정보를 조회할 권한이 없습니다"
        )
    
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    return user

@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    user_update: schemas.UserBase,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자 정보 수정
    
    - 본인 정보는 누구나 수정 가능
    - 다른 사용자 정보는 관리자만 수정 가능
    - **username**: 새로운 사용자명
    - **email**: 새로운 이메일
    """
    # 본인이 아닌 경우 관리자 권한 확인
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 사용자의 정보를 수정할 권한이 없습니다"
        )
    
    # 사용자 존재 확인
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    # 사용자명 중복 확인 (변경하려는 경우)
    if user_update.username != user.username:
        existing_user = db.query(models.User).filter(
            models.User.username == user_update.username
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용중인 사용자명입니다"
            )
    
    # 이메일 중복 확인 (변경하려는 경우)
    if user_update.email != user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용중인 이메일입니다"
            )
    
    # 업데이트
    updated_user = crud.update_user(db, user_id, user_update.model_dump())
    return updated_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자 삭제 (비활성화) - 관리자 전용
    
    실제로 삭제하지 않고 비활성화 처리합니다.
    """
    # 자기 자신은 삭제할 수 없음
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신은 삭제할 수 없습니다"
        )
    
    # 사용자 존재 확인
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    # 삭제 (비활성화)
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 삭제에 실패했습니다"
        )
    
    return {"message": "사용자가 비활성화되었습니다"}

@router.get("/{user_id}/parties", response_model=List[schemas.PartyResponse])
async def get_user_parties(
    user_id: int,
    is_active: Optional[bool] = Query(None, description="활성 상태 필터"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자가 속한 공대 목록 조회
    
    - 본인의 공대 목록은 누구나 조회 가능
    - 다른 사용자의 공대 목록은 관리자만 조회 가능
    """
    # 본인이 아닌 경우 관리자 권한 확인
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 사용자의 공대 목록을 조회할 권한이 없습니다"
        )
    
    # 사용자가 속한 공대 조회
    parties = crud.get_parties(db, user_id=user_id, is_active=is_active)
    
    # 공대별 멤버 수 계산
    for party in parties:
        party.member_count = len(party.members)
    
    return parties

@router.get("/{user_id}/characters")
async def get_user_characters(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자의 캐릭터(공대원) 목록 조회
    
    각 공대에서 사용하는 캐릭터 정보를 조회합니다.
    """
    # 본인이 아닌 경우 관리자 권한 확인
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 사용자의 캐릭터 목록을 조회할 권한이 없습니다"
        )
    
    # 사용자의 모든 공대원 정보 조회
    characters = db.query(models.PartyMember).filter(
        models.PartyMember.user_id == user_id,
        models.PartyMember.is_active == True
    ).join(
        models.Party
    ).join(
        models.Job
    ).all()
    
    result = []
    for char in characters:
        result.append({
            "party_member_id": char.id,
            "character_name": char.character_name,
            "party_name": char.party.name,
            "job_name": char.job.name_kr,
            "job_role": char.job.role,
            "joined_at": char.joined_at
        })
    
    return result

@router.put("/{user_id}/admin-status")
async def update_admin_status(
    user_id: int,
    is_admin: bool,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자 관리자 권한 변경 - 관리자 전용
    
    - **is_admin**: true로 설정하면 관리자 권한 부여, false로 설정하면 권한 해제
    """
    # 자기 자신의 권한은 변경할 수 없음
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신의 관리자 권한은 변경할 수 없습니다"
        )
    
    # 사용자 존재 확인
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    # 권한 업데이트
    updated_user = crud.update_user(db, user_id, {"is_admin": is_admin})
    
    return {
        "message": f"사용자의 관리자 권한이 {'부여' if is_admin else '해제'}되었습니다",
        "user_id": user_id,
        "is_admin": is_admin
    }

@router.put("/{user_id}/active-status")
async def update_active_status(
    user_id: int,
    is_active: bool,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    사용자 활성 상태 변경 - 관리자 전용
    
    - **is_active**: false로 설정하면 사용자가 로그인할 수 없습니다
    """
    # 자기 자신은 비활성화할 수 없음
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신은 비활성화할 수 없습니다"
        )
    
    # 사용자 존재 확인
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    # 상태 업데이트
    updated_user = crud.update_user(db, user_id, {"is_active": is_active})
    
    return {
        "message": f"사용자가 {'활성화' if is_active else '비활성화'}되었습니다",
        "user_id": user_id,
        "is_active": is_active
    }