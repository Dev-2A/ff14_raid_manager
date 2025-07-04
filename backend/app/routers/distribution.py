from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta
from collections import defaultdict

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import (
    get_current_active_user,
    get_party_member,
    get_party_manager,
    CommonQueryParams
)

router = APIRouter()

@router.get("/party/{party_id}", response_model=List[schemas.DistributionResponse])
async def get_party_distributions(
    party_id: int,
    week_number: Optional[int] = Query(None, description="특정 주차 필터"),
    party_member_id: Optional[int] = Query(None, description="특정 공대원 필터"),
    commons: CommonQueryParams = Depends(),
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대의 분배 기록 조회
    
    - **week_number**: 특정 주차의 분배만 조회
    - **party_member_id**: 특정 공대원의 분배만 조회
    - **skip**: 건너뛸 항목 수
    - **limit**: 가져올 항목 수
    """
    distributions = crud.get_distributions(
        db, 
        party_id=party_id,
        week_number=week_number,
        party_member_id=party_member_id
    )
    
    # 페이지네이션 적용
    start = commons.skip
    end = commons.skip + commons.limit
    
    return distributions[start:end]

@router.post("/party/{party_id}")
async def create_distribution(
    party_id: int,
    distribution: schemas.DistributionCreate,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    분배 기록 생성
    
    공대장 또는 관리자만 생성 가능합니다.
    - **party_member_id**: 아이템을 받을 공대원 ID
    - **item_id**: 분배할 아이템 ID
    - **week_number**: 주차
    - **notes**: 메모 (선택)
    """
    # 공대 존재 확인
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    # 공대원 확인
    member = db.query(models.PartyMember).filter(
        models.PartyMember.id == distribution.party_member_id,
        models.PartyMember.party_id == party_id,
        models.PartyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대원을 찾을 수 없습니다"
        )
    
    # 아이템 확인
    item = crud.get_item(db, distribution.item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이템을 찾을 수 없습니다"
        )
    
    # 분배 방식에 따른 검증
    if party.distribution_method == models.DistributionMethodEnum.PRIORITY:
        # 우선순위 분배: 같은 부위를 이미 받았는지 확인
        existing_distribution = db.query(models.Distribution).join(
            models.Item
        ).filter(
            models.Distribution.party_id == party_id,
            models.Distribution.party_member_id == distribution.party_member_id,
            models.Item.slot == item.slot,
            models.Distribution.week_number == distribution.week_number
        ).first()
        
        if existing_distribution:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"해당 공대원은 이번 주차에 이미 {item.slot.value} 부위를 받았습니다"
            )
    
    elif party.distribution_method == models.DistributionMethodEnum.NEED_GREED:
        # 먹고 빠지기: 같은 부위를 모든 공대원이 받을 때까지 재획득 불가
        all_members = crud.get_party_members(db, party_id)
        
        # 해당 부위를 받은 공대원 목록
        received_members = db.query(models.Distribution.party_member_id).join(
            models.Item
        ).filter(
            models.Distribution.party_id == party_id,
            models.Item.slot == item.slot
        ).distinct().all()
        
        received_member_ids = [m[0] for m in received_members]
        
        # 이미 받았는지 확인
        if distribution.party_member_id in received_member_ids:
            # 모든 멤버가 받았는지 확인
            if len(received_member_ids) < len(all_members):
                not_received = len(all_members) - len(received_member_ids)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"아직 {not_received}명이 해당 부위를 받지 않았습니다"
                )
    
    # 분배 생성
    new_distribution = crud.create_distribution(db, party_id, distribution)
    
    # 현재 장비에 자동 반영 (선택적)
    crud.set_player_equipment(
        db,
        distribution.party_member_id,
        [schemas.EquipmentSlot(slot=item.slot, item_id=item.id)],
        "current"
    )
    
    return {
        "message": "분배가 완료되었습니다",
        "distribution_id": new_distribution.id
    }

@router.get("/party/{party_id}/statistics")
async def get_distribution_statistics(
    party_id: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    공대 분배 통계 조회
    
    부위별, 공대원별 분배 현황을 조회합니다.
    """
    # 공대 존재 확인
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    # 분배 통계 조회
    stats = crud.get_distribution_stats(db, party_id)
    
    # 부위별 통계 정리
    slot_distribution = {}
    for slot, count in stats["slot_distribution"]:
        slot_distribution[slot.value] = count
    
    # 멤버별 통계 정리
    member_distribution = []
    for member_id, username, character_name, items_received in stats["member_distribution"]:
        # 멤버의 세트 달성률 계산
        completion = crud.calculate_set_completion(db, member_id)
        
        member_distribution.append({
            "party_member_id": member_id,
            "username": username,
            "character_name": character_name,
            "items_received": items_received,
            "completion_rates": completion
        })
    
    return {
        "party_id": party_id,
        "party_name": party.name,
        "distribution_method": party.distribution_method.value,
        "slot_distribution": slot_distribution,
        "member_distribution": member_distribution
    }

@router.get("/party/{party_id}/week/{week_number}")
async def get_week_distributions(
    party_id: int,
    week_number: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    특정 주차의 분배 상세 정보
    
    해당 주차에 누가 무엇을 받았는지 상세하게 조회합니다.
    """
    distributions = crud.get_distributions(db, party_id, week_number=week_number)
    
    # 층별로 그룹화
    distributions_by_floor = defaultdict(list)
    
    for dist in distributions:
        # 아이템 타입에 따라 층 결정
        item = dist.item
        floor = "기타"
        
        if item.item_type == models.ItemTypeEnum.SAVAGE_RAID:
            if item.slot in [models.ItemSlotEnum.EARRINGS, models.ItemSlotEnum.NECKLACE,
                           models.ItemSlotEnum.BRACELET, models.ItemSlotEnum.RING]:
                floor = "1층"
            elif item.slot in [models.ItemSlotEnum.HEAD, models.ItemSlotEnum.HANDS,
                             models.ItemSlotEnum.FEET]:
                floor = "2층"
            elif item.slot in [models.ItemSlotEnum.BODY, models.ItemSlotEnum.LEGS]:
                floor = "3층"
            elif item.slot == models.ItemSlotEnum.WEAPON:
                floor = "4층"
        
        distributions_by_floor[floor].append({
            "distribution_id": dist.id,
            "character_name": dist.party_member.character_name,
            "item_name": item.name,
            "item_slot": item.slot.value,
            "item_type": item.item_type.value,
            "distributed_at": dist.distributed_at
        })
    
    return {
        "party_id": party_id,
        "week_number": week_number,
        "total_items": len(distributions),
        "distributions_by_floor": dict(distributions_by_floor)
    }

@router.get("/party/{party_id}/priority-calculation")
async def calculate_priority(
    party_id: int,
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    우선순위 분배를 위한 계산
    
    각 공대원의 최종 세트 달성에 필요한 재화량을 기준으로 우선순위를 계산합니다.
    (우선순위 분배 방식 공대만 사용)
    """
    # 공대 확인
    party = crud.get_party(db, party_id=party_id)
    if not party:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공대를 찾을 수 없습니다"
        )
    
    if party.distribution_method != models.DistributionMethodEnum.PRIORITY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="우선순위 분배 방식의 공대만 사용 가능합니다"
        )
    
    # 모든 공대원의 재화 요구량 계산
    members = crud.get_party_members(db, party_id)
    member_priorities = []
    
    for member in members:
        # 현재 -> 최종 세트 재화 계산
        current_set = crud.get_player_equipment(db, member.id, "current")
        final_set = crud.get_player_equipment(db, member.id, "final")
        
        # 필요한 아이템 계산
        needed_items = []
        current_item_slots = {eq.slot: eq.item_id for eq in current_set}
        
        for final_eq in final_set:
            if current_item_slots.get(final_eq.slot) != final_eq.item_id:
                needed_items.append(final_eq.item)
        
        # 재화 총합 계산
        total_currency_value = 0
        for item in needed_items:
            if item.item_type == models.ItemTypeEnum.TOME:
                # 석판 가치 (1석판 = 1점)
                if item.slot in [models.ItemSlotEnum.EARRINGS, models.ItemSlotEnum.NECKLACE,
                               models.ItemSlotEnum.BRACELET, models.ItemSlotEnum.RING]:
                    total_currency_value += 375
                elif item.slot in [models.ItemSlotEnum.HEAD, models.ItemSlotEnum.HANDS,
                                  models.ItemSlotEnum.FEET]:
                    total_currency_value += 495
                elif item.slot in [models.ItemSlotEnum.BODY, models.ItemSlotEnum.LEGS]:
                    total_currency_value += 825
                elif item.slot == models.ItemSlotEnum.WEAPON:
                    total_currency_value += 500
            
            elif item.item_type == models.ItemTypeEnum.SAVAGE_RAID:
                # 낱장 가치 (1낱장 = 50점으로 환산)
                if item.slot in [models.ItemSlotEnum.EARRINGS, models.ItemSlotEnum.NECKLACE,
                               models.ItemSlotEnum.BRACELET, models.ItemSlotEnum.RING]:
                    total_currency_value += 3 * 50
                elif item.slot in [models.ItemSlotEnum.HEAD, models.ItemSlotEnum.HANDS,
                                  models.ItemSlotEnum.FEET]:
                    total_currency_value += 4 * 50
                elif item.slot in [models.ItemSlotEnum.BODY, models.ItemSlotEnum.LEGS]:
                    total_currency_value += 6 * 50
                elif item.slot == models.ItemSlotEnum.WEAPON:
                    total_currency_value += 8 * 50
        
        # 이미 받은 아이템 수
        distributions = crud.get_distributions(db, party_id, party_member_id=member.id)
        
        member_priorities.append({
            "party_member_id": member.id,
            "character_name": member.character_name,
            "job": member.job.name_kr,
            "total_currency_needed": total_currency_value,
            "items_received": len(distributions),
            "needed_items_count": len(needed_items)
        })
    
    # 재화량 기준으로 정렬 (높은 순)
    member_priorities.sort(key=lambda x: x["total_currency_needed"], reverse=True)
    
    # 우선순위 부여
    for i, member in enumerate(member_priorities):
        member["priority"] = i + 1
    
    return {
        "party_id": party_id,
        "party_name": party.name,
        "calculation_method": "최종 세트 달성에 필요한 총 재화량",
        "member_priorities": member_priorities
    }

@router.delete("/party/{party_id}/distribution/{distribution_id}")
async def delete_distribution(
    party_id: int,
    distribution_id: int,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    분배 기록 삭제
    
    공대장 또는 관리자만 삭제 가능합니다.
    """
    # 분배 기록 확인
    distribution = db.query(models.Distribution).filter(
        models.Distribution.id == distribution_id,
        models.Distribution.party_id == party_id
    ).first()
    
    if not distribution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="분배 기록을 찾을 수 없습니다"
        )
    
    # 삭제
    db.delete(distribution)
    db.commit()
    
    return {"message": "분배 기록이 삭제되었습니다"}

@router.get("/party/{party_id}/schedule")
async def get_raid_schedules(
    party_id: int,
    start_date: Optional[datetime] = Query(None, description="시작 날짜"),
    end_date: Optional[datetime] = Query(None, description="종료 날짜"),
    current_user: models.User = Depends(get_party_member),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 일정 조회
    
    - **start_date**: 조회 시작 날짜
    - **end_date**: 조회 종료 날짜
    """
    schedules = crud.get_raid_schedules(db, party_id, start_date, end_date)
    
    return {
        "party_id": party_id,
        "schedules": [
            {
                "id": schedule.id,
                "scheduled_date": schedule.scheduled_date,
                "notes": schedule.notes,
                "created_at": schedule.created_at
            }
            for schedule in schedules
        ]
    }

@router.post("/party/{party_id}/schedule")
async def create_raid_schedule(
    party_id: int,
    schedule: schemas.RaidScheduleCreate,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 일정 생성
    
    공대장 또는 관리자만 생성 가능합니다.
    """
    new_schedule = crud.create_raid_schedule(db, party_id, schedule)
    
    return {
        "message": "일정이 생성되었습니다",
        "schedule_id": new_schedule.id
    }

@router.put("/party/{party_id}/schedule/{schedule_id}")
async def update_raid_schedule(
    party_id: int,
    schedule_id: int,
    schedule_update: schemas.RaidScheduleUpdate,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 일정 수정
    
    공대장 또는 관리자만 수정 가능합니다.
    """
    # 일정 존재 확인
    schedule = db.query(models.RaidSchedule).filter(
        models.RaidSchedule.id == schedule_id,
        models.RaidSchedule.party_id == party_id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다"
        )
    
    updated_schedule = crud.update_raid_schedule(db, schedule_id, schedule_update)
    
    return {"message": "일정이 수정되었습니다"}

@router.delete("/party/{party_id}/schedule/{schedule_id}")
async def delete_raid_schedule(
    party_id: int,
    schedule_id: int,
    current_user: models.User = Depends(get_party_manager),
    db: Session = Depends(get_db)
) -> Any:
    """
    레이드 일정 삭제
    
    공대장 또는 관리자만 삭제 가능합니다.
    """
    # 일정 존재 확인
    schedule = db.query(models.RaidSchedule).filter(
        models.RaidSchedule.id == schedule_id,
        models.RaidSchedule.party_id == party_id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다"
        )
    
    success = crud.delete_raid_schedule(db, schedule_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="일정 삭제에 실패했습니다"
        )
    
    return {"message": "일정이 삭제되었습니다"}