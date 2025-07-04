from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import (
    get_current_active_user,
    get_current_admin_user,
    get_party_member,
    CommonQueryParams
)

router = APIRouter()

@router.get("/", response_model=List[schemas.ItemResponse])
async def get_items(
    raid_id: Optional[int] = Query(None, description="레이드 ID로 필터"),
    slot: Optional[models.ItemSlotEnum] = Query(None, description="장비 부위로 필터"),
    item_type: Optional[models.ItemTypeEnum] = Query(None, description="장비 종류로 필터"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    아이템 목록 조회
    
    - **raid_id**: 특정 레이드의 아이템만 조회
    - **slot**: 특정 부위의 아이템만 조회 (weapon, head, body 등)
    - **item_type**: 특정 종류의 아이템만 조회 (normal_raid, savage_raid 등)
    """
    items = crud.get_items(db, raid_id=raid_id, slot=slot, item_type=item_type)
    return items

@router.post("/", response_model=schemas.ItemResponse)
async def create_item(
    item: schemas.ItemCreate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    새 아이템 생성 - 관리자 전용
    
    - **name**: 아이템 이름
    - **raid_id**: 레이드 ID
    - **item_level**: 아이템 레벨
    - **slot**: 장비 부위
    - **item_type**: 장비 종류
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=item.raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 중복 아이템 확인 (같은 레이드, 같은 슬롯, 같은 타입)
    existing_item = db.query(models.Item).filter(
        models.Item.raid_id == item.raid_id,
        models.Item.slot == item.slot,
        models.Item.item_type == item.item_type,
        models.Item.name == item.name
    ).first()
    
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="동일한 아이템이 이미 존재합니다"
        )
    
    # 아이템 생성
    new_item = crud.create_item(db, item)
    return new_item

@router.get("/{item_id}", response_model=schemas.ItemResponse)
async def get_item(
    item_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    특정 아이템 정보 조회
    """
    item = crud.get_item(db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이템을 찾을 수 없습니다"
        )
    return item

@router.put("/{item_id}", response_model=schemas.ItemResponse)
async def update_item(
    item_id: int,
    item_update: schemas.ItemBase,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    아이템 정보 수정 - 관리자 전용
    """
    # 아이템 존재 확인
    item = crud.get_item(db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이템을 찾을 수 없습니다"
        )
    
    # 아이템 업데이트
    updated_item = crud.update_item(db, item_id, item_update.model_dump())
    return updated_item

@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    아이템 삭제 - 관리자 전용
    
    ⚠️ 주의: 이미 분배되었거나 세트에 포함된 아이템은 삭제할 수 없습니다.
    """
    # 아이템이 사용중인지 확인
    distributions = db.query(models.Distribution).filter(
        models.Distribution.item_id == item_id
    ).count()
    
    if distributions > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 분배된 아이템은 삭제할 수 없습니다"
        )
    
    # 장비 세트에 포함되어 있는지 확인
    in_equipment = db.query(models.PlayerEquipment).filter(
        models.PlayerEquipment.item_id == item_id
    ).count()
    in_start_set = db.query(models.PlayerStartSet).filter(
        models.PlayerStartSet.item_id == item_id
    ).count()
    in_final_set = db.query(models.PlayerFinalSet).filter(
        models.PlayerFinalSet.item_id == item_id
    ).count()
    
    if in_equipment + in_start_set + in_final_set > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="장비 세트에 포함된 아이템은 삭제할 수 없습니다"
        )
    
    # 아이템 삭제
    success = crud.delete_item(db, item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="아이템 삭제에 실패했습니다"
        )
    
    return {"message": "아이템이 삭제되었습니다"}

# ==================== 장비 세트 관련 엔드포인트 ====================

@router.get("/party/{party_id}/member/{user_id}/equipment")
async def get_member_equipment(
    party_id: int,
    user_id: int,
    set_type: str = Query("current", description="세트 타입 (current/start/final)"),
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원의 장비 세트 조회
    
    - **set_type**: current(현재 장비), start(출발 세트), final(최종 세트)
    """
    # 공대원 확인
    member = crud.get_party_member(db, party_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대원을 찾을 수 없습니다"
        )
    
    # 장비 조회
    equipment = crud.get_player_equipment(db, member.id, set_type)
    
    # 응답 형식 정리
    equipment_data = []
    for eq in equipment:
        equipment_data.append({
            "slot": eq.slot,
            "item": schemas.ItemResponse.model_validate(eq.item)
        })
    
    # 달성률 계산
    completion = crud.calculate_set_completion(db, member.id)
    
    return {
        "party_member_id": member.id,
        "character_name": member.character_name,
        "set_type": set_type,
        "equipment": equipment_data,
        "completion_rate": completion[f"{set_type}_completion"]
    }

@router.put("/party/{party_id}/member/{user_id}/equipment")
async def update_member_equipment(
    party_id: int,
    user_id: int,
    equipment_set: schemas.EquipmentSetBase,
    set_type: str = Query("current", description="세트 타입 (current/start/final)"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원의 장비 세트 설정
    
    - 본인의 장비는 누구나 수정 가능
    - 다른 공대원의 장비는 공대장/관리자만 수정 가능
    - **set_type**: current(현재 장비), start(출발 세트), final(최종 세트)
    """
    # 권한 확인
    is_self = current_user.id == user_id
    is_manager = current_user.is_admin or crud.check_party_leader_permission(
        db, party_id, current_user.id
    )
    
    if not is_self and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 공대원의 장비를 수정할 권한이 없습니다"
        )
    
    # 공대원 확인
    member = crud.get_party_member(db, party_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대원을 찾을 수 없습니다"
        )
    
    # 아이템 유효성 검사
    for eq in equipment_set.equipment:
        item = crud.get_item(db, eq.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"아이템 ID {eq.item_id}를 찾을 수 없습니다"
            )
        if item.slot != eq.slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"아이템 {item.name}은 {eq.slot} 슬롯에 장착할 수 없습니다"
            )
    
    # 장비 세트 업데이트
    crud.set_player_equipment(db, member.id, equipment_set.equipment, set_type)
    
    return {"message": f"{set_type} 장비 세트가 업데이트되었습니다"}

@router.get("/party/{party_id}/member/{user_id}/currency-requirements")
async def get_currency_requirements(
    party_id: int,
    user_id: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대원의 재화 요구량 계산
    
    현재 장비에서 출발 세트, 최종 세트까지 필요한 재화를 계산합니다.
    """
    # 공대원 확인
    member = crud.get_party_member(db, party_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대원을 찾을 수 없습니다"
        )
    
    # 각 세트 조회
    current_set = crud.get_player_equipment(db, member.id, "current")
    start_set = crud.get_player_equipment(db, member.id, "start")
    final_set = crud.get_player_equipment(db, member.id, "final")
    
    # 재화 계산 함수
    def calculate_currency(target_set: List, current_items: List) -> Dict:
        """세트 달성을 위한 재화 계산"""
        currency = {
            "tome_stones": 0,
            "raid_tokens": {"1층": 0, "2층": 0, "3층": 0, "4층": 0},
            "upgrade_materials": {"경화약": 0, "강화섬유": 0, "강화약": 0}
        }
        
        # 현재 보유 아이템 ID 목록
        current_item_ids = [item.item_id for item in current_items]
        
        for target_item in target_set:
            # 이미 보유한 아이템은 계산에서 제외
            if target_item.item_id in current_item_ids:
                continue
            
            item = target_item.item
            
            # 석판 아이템
            if item.item_type == models.ItemTypeEnum.TOME:
                if item.slot in [models.ItemSlotEnum.EARRINGS, models.ItemSlotEnum.NECKLACE,
                               models.ItemSlotEnum.BRACELET, models.ItemSlotEnum.RING]:
                    currency["tome_stones"] += 375
                elif item.slot in [models.ItemSlotEnum.HEAD, models.ItemSlotEnum.HANDS,
                                  models.ItemSlotEnum.FEET]:
                    currency["tome_stones"] += 495
                elif item.slot in [models.ItemSlotEnum.BODY, models.ItemSlotEnum.LEGS]:
                    currency["tome_stones"] += 825
                elif item.slot == models.ItemSlotEnum.WEAPON:
                    currency["tome_stones"] += 500
            
            # 영웅 레이드 아이템 (낱장)
            elif item.item_type == models.ItemTypeEnum.SAVAGE_RAID:
                if item.slot in [models.ItemSlotEnum.EARRINGS, models.ItemSlotEnum.NECKLACE,
                               models.ItemSlotEnum.BRACELET, models.ItemSlotEnum.RING]:
                    currency["raid_tokens"]["1층"] += 3
                elif item.slot in [models.ItemSlotEnum.HEAD, models.ItemSlotEnum.HANDS,
                                  models.ItemSlotEnum.FEET]:
                    currency["raid_tokens"]["2층"] += 4
                elif item.slot in [models.ItemSlotEnum.BODY, models.ItemSlotEnum.LEGS]:
                    currency["raid_tokens"]["3층"] += 6
                elif item.slot == models.ItemSlotEnum.WEAPON:
                    currency["raid_tokens"]["4층"] += 8
            
            # 보강 재료
            elif item.item_type == models.ItemTypeEnum.AUGMENTED_TOME:
                # 석판 비용 + 보강 재료
                # 석판 비용은 위와 동일하게 추가
                if item.slot in [models.ItemSlotEnum.EARRINGS, models.ItemSlotEnum.NECKLACE,
                               models.ItemSlotEnum.BRACELET, models.ItemSlotEnum.RING]:
                    currency["tome_stones"] += 375
                    currency["upgrade_materials"]["경화약"] += 1
                elif item.slot in [models.ItemSlotEnum.HEAD, models.ItemSlotEnum.HANDS,
                                  models.ItemSlotEnum.FEET]:
                    currency["tome_stones"] += 495
                    currency["upgrade_materials"]["강화섬유"] += 1
                elif item.slot in [models.ItemSlotEnum.BODY, models.ItemSlotEnum.LEGS]:
                    currency["tome_stones"] += 825
                    currency["upgrade_materials"]["강화섬유"] += 1
                elif item.slot == models.ItemSlotEnum.WEAPON:
                    currency["tome_stones"] += 500
                    currency["upgrade_materials"]["강화약"] += 1
        
        return currency
    
    # 각 경로별 재화 계산
    current_to_start = calculate_currency(start_set, current_set)
    start_to_final = calculate_currency(final_set, start_set)
    current_to_final = calculate_currency(final_set, current_set)
    
    return {
        "party_member_id": member.id,
        "character_name": member.character_name,
        "currency_requirements": {
            "current_to_start": current_to_start,
            "start_to_final": start_to_final,
            "current_to_final": current_to_final
        }
    }

@router.post("/batch-create")
async def batch_create_items(
    raid_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드의 기본 아이템 일괄 생성 - 관리자 전용
    
    지정된 레이드의 모든 기본 아이템을 자동으로 생성합니다.
    """
    # 레이드 존재 확인
    raid = crud.get_raid(db, raid_id=raid_id)
    if not raid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="레이드를 찾을 수 없습니다"
        )
    
    # 이미 아이템이 있는지 확인
    existing_items = crud.get_items(db, raid_id=raid_id)
    if existing_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 아이템이 존재합니다"
        )
    
    # 아이템 레벨 설정 (패치에 따라 다름)
    base_item_level = 710 if raid.patch_number == "7.0" else 690
    
    # 모든 슬롯과 타입 조합으로 아이템 생성
    slots = list(models.ItemSlotEnum)
    types_by_level = {
        models.ItemTypeEnum.NORMAL_RAID: base_item_level,
        models.ItemTypeEnum.SAVAGE_RAID: base_item_level + 20,
        models.ItemTypeEnum.TOME: base_item_level + 10,
        models.ItemTypeEnum.AUGMENTED_TOME: base_item_level + 20,
        models.ItemTypeEnum.CRAFTED: base_item_level,
        models.ItemTypeEnum.EXTREME: base_item_level + 15  # 무기만
    }
    
    created_items = []
    
    for slot in slots:
        for item_type, item_level in types_by_level.items():
            # 극만신은 무기와 악세서리만
            if item_type == models.ItemTypeEnum.EXTREME:
                if slot not in [models.ItemSlotEnum.WEAPON, models.ItemSlotEnum.EARRINGS,
                              models.ItemSlotEnum.NECKLACE, models.ItemSlotEnum.BRACELET,
                              models.ItemSlotEnum.RING]:
                    continue
            
            item_name = f"{raid.name} {item_type.value} {slot.value}"
            
            item_data = schemas.ItemCreate(
                name=item_name,
                raid_id=raid_id,
                item_level=item_level,
                slot=slot,
                item_type=item_type
            )
            
            new_item = crud.create_item(db, item_data)
            created_items.append(new_item)
    
    return {
        "message": f"{len(created_items)}개의 아이템이 생성되었습니다",
        "raid_id": raid_id,
        "item_count": len(created_items)
    }