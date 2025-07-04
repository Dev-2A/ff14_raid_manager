from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import (
    get_current_active_user,
    get_current_admin_user,
    get_optional_current_user
)

router = APIRouter()

@router.get("/", response_model=List[schemas.RaidResponse])
async def get_raids(
    is_current: Optional[bool] = Query(None, description="현재 진행중인 레이드만 조회"),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 목록 조회
    
    인증 없이도 조회 가능합니다.
    - **is_current**: true면 현재 레이드만, false면 종료된 레이드만, 없으면 전체
    """
    raids = crud.get_raids(db, is_current=is_current)
    return raids

@router.post("/", response_model=schemas.RaidResponse)
async def create_raid(
    raid: schemas.RaidCreate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    새 레이드 생성 - 관리자 전용
    
    - **name**: 레이드 이름 (예: "황금의 유산 - 아르카디아")
    - **patch_number**: 패치 번호 (예: "7.0")
    """
    # 동일한 패치 번호의 레이드가 있는지 확인
    existing_raid = db.query(models.Raid).filter(
        models.Raid.patch_number == raid.patch_number
    ).first()
    
    if existing_raid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"패치 {raid.patch_number}의 레이드가 이미 존재합니다"
        )
    
    # 레이드 생성
    new_raid = crud.create_raid(db, raid)
    return new_raid

@router.get("/{raid_id}", response_model=schemas.RaidResponse)
async def get_raid(
    raid_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    특정 레이드 정보 조회
    
    인증 없이도 조회 가능합니다.
    """
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    return raid

@router.put("/{raid_id}", response_model=schemas.RaidResponse)
async def update_raid(
    raid_id: int,
    raid_update: schemas.RaidBase,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 정보 수정 - 관리자 전용
    
    - **name**: 새로운 레이드 이름
    - **patch_number**: 새로운 패치 번호
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 패치 번호 중복 확인 (변경하려는 경우)
    if raid_update.patch_number != raid.patch_number:
        existing_raid = db.query(models.Raid).filter(
            models.Raid.patch_number == raid_update.patch_number,
            models.Raid.id != raid_id
        ).first()
        
        if existing_raid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"패치 {raid_update.patch_number}의 레이드가 이미 존재합니다"
            )
    
    # 레이드 업데이트
    updated_raid = crud.update_raid(db, raid_id, raid_update.model_dump())
    return updated_raid

@router.put("/{raid_id}/status")
async def update_raid_status(
    raid_id: int,
    is_current: bool,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 진행 상태 변경 - 관리자 전용
    
    - **is_current**: true면 현재 진행중, false면 종료
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 상태 업데이트
    updated_raid = crud.update_raid(db, raid_id, {"is_current": is_current})
    
    return {
        "message": f"레이드가 {'활성화' if is_current else '종료'}되었습니다",
        "raid_id": raid_id,
        "is_current": is_current
    }

@router.get("/{raid_id}/items", response_model=List[schemas.ItemResponse])
async def get_raid_items(
    raid_id: int,
    slot: Optional[models.ItemSlotEnum] = Query(None, description="장비 부위 필터"),
    item_type: Optional[models.ItemTypeEnum] = Query(None, description="장비 종류 필터"),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드의 아이템 목록 조회
    
    인증 없이도 조회 가능합니다.
    - **slot**: 특정 부위의 아이템만 조회 (weapon, head, body 등)
    - **item_type**: 특정 종류의 아이템만 조회 (normal_raid, savage_raid 등)
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 아이템 조회
    items = crud.get_items(db, raid_id=raid_id, slot=slot, item_type=item_type)
    return items

@router.get("/{raid_id}/parties", response_model=List[schemas.PartyResponse])
async def get_raid_parties(
    raid_id: int,
    is_active: Optional[bool] = Query(None, description="활성 상태 필터"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드의 공대 목록 조회
    
    로그인이 필요합니다.
    - **is_active**: true면 활성 공대만, false면 비활성 공대만, 없으면 전체
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 공대 조회
    query = db.query(models.Party).filter(models.Party.raid_id == raid_id)
    
    if is_active is not None:
        query = query.filter(models.Party.is_active == is_active)
    
    parties = query.all()
    
    # 각 공대의 멤버 수 계산
    for party in parties:
        party.member_count = db.query(models.PartyMember).filter(
            models.PartyMember.party_id == party.id,
            models.PartyMember.is_active == True
        ).count()
    
    return parties

@router.get("/{raid_id}/statistics")
async def get_raid_statistics(
    raid_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 통계 정보 조회
    
    레이드의 전체적인 통계 정보를 제공합니다.
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 통계 계산
    total_parties = db.query(models.Party).filter(
        models.Party.raid_id == raid_id
    ).count()
    
    active_parties = db.query(models.Party).filter(
        models.Party.raid_id == raid_id,
        models.Party.is_active == True
    ).count()
    
    total_items = db.query(models.Item).filter(
        models.Item.raid_id == raid_id
    ).count()
    
    # 아이템 종류별 개수
    item_type_counts = db.query(
        models.Item.item_type,
        db.func.count(models.Item.id).label('count')
    ).filter(
        models.Item.raid_id == raid_id
    ).group_by(models.Item.item_type).all()
    
    # 슬롯별 아이템 개수
    slot_counts = db.query(
        models.Item.slot,
        db.func.count(models.Item.id).label('count')
    ).filter(
        models.Item.raid_id == raid_id
    ).group_by(models.Item.slot).all()
    
    return {
        "raid_id": raid_id,
        "raid_name": raid.name,
        "patch_number": raid.patch_number,
        "is_current": raid.is_current,
        "statistics": {
            "total_parties": total_parties,
            "active_parties": active_parties,
            "total_items": total_items,
            "item_types": {item_type: count for item_type, count in item_type_counts},
            "slots": {slot: count for slot, count in slot_counts}
        }
    }

@router.delete("/{raid_id}")
async def delete_raid(
    raid_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 삭제 - 관리자 전용
    
    ⚠️ 주의: 레이드를 삭제하면 관련된 모든 데이터가 삭제됩니다.
    - 공대
    - 아이템
    - 분배 기록
    
    실제로는 is_current를 false로 설정하는 것을 권장합니다.
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 활성 공대가 있는지 확인
    active_parties = db.query(models.Party).filter(
        models.Party.raid_id == raid_id,
        models.Party.is_active == True
    ).count()
    
    if active_parties > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"활성 공대가 {active_parties}개 있습니다. 먼저 모든 공대를 비활성화하세요"
        )
    
    # 레이드를 비활성화 (실제 삭제 대신)
    crud.update_raid(db, raid_id, {"is_current": False})
    
    return {"message": "레이드가 종료 상태로 변경되었습니다"}