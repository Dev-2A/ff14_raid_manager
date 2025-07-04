from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict
from datetime import datetime
from . import models, schemas

#SECTION - 사용자 관련 CRUD

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """사용자 ID로 조회"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """사용자 목록 조회"""
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_update: dict) -> Optional[models.User]:
    """사용자 정보 수정"""
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in user_update.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    """사용자 삭제 (비활성화)"""
    db_user = get_user(db, user_id)
    if db_user:
        db_user.is_active = False
        db.commit()
        return True
    return False

#SECTION - 직업 관련 CRUD

def create_job(db: Session, job: schemas.JobCreate) -> models.Job:
    """직업 생성"""
    db_job = models.Job(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_job(db: Session, job_id: int) -> Optional[models.Job]:
    """직업 ID로 조회"""
    return db.query(models.Job).filter(models.Job.id == job_id).first()

def get_jobs(db: Session) -> List[models.Job]:
    """모든 직업 조회"""
    return db.query(models.Job).all()

def  get_jobs_by_role(db: Session, role: models.RoleEnum) -> List[models.Job]:
    """역할별 직업 조회"""
    return db.query(models.Job).filter(models.Job.role == role).all()

#SECTION - 레이드 관련 CRUD

def create_raid(db: Session, raid: schemas.RaidCreate) -> models.Raid:
    """레이드 생성"""
    db_raid = models.Raid(**raid.model_dump())
    db.add(db_raid)
    db.commit()
    db.refresh(db_raid)
    return db_raid

def get_raid(db: Session, raid_id: int) -> Optional[models.Raid]:
    """레이드 ID로 조회"""
    return db.query(models.Raid).filter(models.Raid.id == raid_id).first()

def get_raids(db: Session, is_current: Optional[bool] = None) -> List[models.Raid]:
    """레이드 목록 조회"""
    query = db.query(models.Raid)
    if is_current is not None:
        query = query.filter(models.Raid.is_current == is_current)
    return query.order_by(models.Raid.patch_number.desc()).all()

def update_raid(db: Session, raid_id: int, raid_update: dict) -> Optional[models.Raid]:
    """레이드 정보 수정"""
    db_raid = get_raid(db, raid_id)
    if db_raid:
        for key, value in raid_update.items():
            setattr(db_raid, key, value)
        db.commit()
        db.refresh(db_raid)
    return db_raid

#SECTION - 공대 관련 CRUD

def create_party(db: Session, party: schemas.PartyCreate, leader_id: int) -> models.Party:
    """공대 생성"""
    db_party = models.Party(
        **party.model_dump(),
        leader_id=leader_id
    )
    db.add(db_party)
    db.commit()
    db.refresh(db_party)
    return db_party

def get_party(db: Session, party_id: int) -> Optional[models.Party]:
    """공대 ID로 조회 (관계 데이터 포함)"""
    return db.query(models.Party).options(
        joinedload(models.Party.raid),
        joinedload(models.Party.leader),
        joinedload(models.Party.members)
    ).filter(models.Party.id == party_id).first()

def get_parties(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    is_active: Optional[bool] = None
) -> List[models.Party]:
    """공대 목록 조회"""
    query = db.query(models.Party).options(
        joinedload(models.Party.raid),
        joinedload(models.Party.leader)
    )
    
    # 특정 사용자가 속한 공대만 필터링
    if user_id:
        query = query.join(models.PartyMember).filter(
            models.PartyMember.user_id == user_id,
            models.PartyMember.is_active == True
        )
    
    if is_active is not None:
        query = query.filter(models.party.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

def update_party(db: Session, party_id: int, party_update: schemas.PartyUpdate) -> Optional[models.Party]:
    """공대 정보 수정"""
    db_party = get_party(db, party_id)
    if db_party:
        update_data = party_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_party, key, value)
        db.commit()
        db.refresh(db_party)
    return db_party

def delete_party(db: Session, party_id: int) -> bool:
    """공대 삭제 (비활성화)"""
    db_party = get_party(db, party_id)
    if db_party:
        db_party.is_active = False
        # 모든 멤버도 비활성화
        db.query(models.PartyMember).filter(
            models.PartyMember.party_id == party_id
        ).update({"is_active": False})
        db.commit()
        return True
    return False

#SECTION - 공대원 관련 CRUD

def add_party_member(
    db: Session,
    party_id: int,
    user_id: int,
    member_data: schemas.PartyMemberCreate
) -> models.PartyMember:
    """공대원 추가"""
    # 이미 멤버인지 확인
    existing = db.query(models.PartyMember).filter(
        models.PartyMember.party_id == party_id,
        models.PartyMember.user_id == user_id
    ).first()
    
    if existing:
        # 이미 있으면 활성화만
        existing.is_active = True
        existing.job_id = member_data.job_id
        existing.character_name = member_data.character_name
        db.commit()
        db.refresh(existing)
        return existing
    
    # 새로 추가
    db_member = models.PartyMember(
        party_id=party_id,
        user_id=user_id,
        job_id=member_data.job_id,
        character_name=member_data.character_name
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def get_party_member(db: Session, party_id: int, user_id: int) -> Optional[models.PartyMember]:
    """특정 공대원 조회"""
    return db.query(models.PartyMember).options(
        joinedload(models.PartyMember.user),
        joinedload(models.PartyMember.job)
    ).filter(
        models.PartyMember.party_id == party_id,
        models.PartyMember.user_id == user_id,
        models.PartyMember.is_active == True
    ).first()

def get_party_members(db: Session, party_id: int) -> List[models.PartyMember]:
    """공대의 모든 멤버 조회"""
    return db.query(models.PartyMember).options(
        joinedload(models.PartyMember.user),
        joinedload(models.PartyMember.job)
    ).filter(
        models.PartyMember.party_id == party_id,
        models.PartyMember.is_active == True
    ).all()

def update_party_member(
    db: Session,
    party_id: int,
    user_id: int,
    update_data: dict
) -> Optional[models.PartyMember]:
    """공대원 정보 수정"""
    db_member = get_party_member(db, party_id, user_id)
    if db_member:
        for key, value in update_data.items():
            setattr(db_member, key, value)
        db.commit()
        db.refresh(db_member)
    return db_member

def remove_party_member(db: Session, party_id: int, user_id: int) -> bool:
    """공대원 제거 (비활성화)"""
    db_member = get_party_member(db, party_id, user_id)
    if db_member:
        db_member.is_active = False
        db.commit()
        return True
    return False

#SECTION - 아이템 관련 CRUD

def create_item(db: Session, item: schemas.ItemCreate) -> models.Item:
    """아이템 생성"""
    db_item = models.Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_item(db: Session, item_id: int) -> Optional[models.Item]:
    """아이템 ID로 조회"""
    return db.query(models.Item).filter(models.Item.id == item_id).first()

def get_items(
    db: Session,
    raid_id: Optional[int] = None,
    slot: Optional[models.ItemSlotEnum] = None,
    item_type: Optional[models.ItemTypeEnum] = None
) -> List[models.Item]:
    """아이템 목록 조회"""
    query = db.query(models.Item)
    
    if raid_id:
        query = query.filter(models.Item.raid_id == raid_id)
    if slot:
        query = query.filter(models.Item.slot == slot)
    if item_type:
        query = query.filter(models.Item.item_type == item_type)
    
    return query.all()

def update_item(db: Session, item_id: int, item_update: int) -> Optional[models.Item]:
    """아이템 정보 수정"""
    db_item = get_item(db, item_id)
    if db_item:
        for key, value in item_update.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int) -> bool:
    """아이템 삭제"""
    db_item = get_item(db, item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False

#SECTION - 장비 세트 관련 CRUD

def set_player_equipment(
    db: Session,
    party_member_id: int,
    equipment_list: List[schemas.EquipmentSlot],
    set_type: str = "current" # "current", "start", "final"
) -> List:
    """플레이어 장비 세트 설정"""
    # 세트 타입에 따른 모델 선택
    if set_type == "start":
        model = models.PlayerStartSet
    elif set_type == "final":
        model = models.PlayerFinalSet
    else:
        model = models.PlayerEquipment
    
    # 기존 세트 삭제
    db.query(model).filter(
        model.party_member_id == party_member_id
    ).delete()
    
    # 새 세트 추가
    equipment_records = []
    for eq in equipment_list:
        record = model(
            party_member_id=party_member_id,
            slot=eq.slot,
            item_id=eq.item_id
        )
        db.add(record)
        equipment_records.append(record)
    
    db.commit()
    return equipment_records

def get_player_equipment(
    db: Session,
    party_member_id: int,
    set_type: str = "currenet"
) -> List:
    """플레이어 장비 세트 조회"""
    if set_type == "start":
        model = models.PlayerStartSet
    elif set_type == "final":
        model = models.PlayerFinalSet
    else:
        model = models.PlayerEquipment
    
    return db.query(model).options(
        joinedload(model.item)
    ).filter(
        model.party_member_id == party_member_id
    ).all()

def calculate_set_completion(
    db: Session,
    party_member_id: int
) -> Dict[str, float]:
    """세트 달성률 계산"""
    current = len(get_player_equipment(db, party_member_id, "current"))
    start = len(get_player_equipment(db, party_member_id, "start"))
    final = len(get_player_equipment(db, party_member_id, "final"))
    
    # 최대 슬롯 수 (11개: 무기 + 방어구 5개 + 악세서리 5개)
    max_slots = 11
    
    return {
        "current_completion": (current / max_slots) * 100 if max_slots > 0 else 0,
        "start_completion": (start / max_slots) * 100 if max_slots > 0 else 0,
        "final_completion": (final / max_slots) * 100 if max_slots > 0 else 0
    }

#SECTION - 분배 관련 CRUD

def create_distribution(
    db: Session,
    party_id: int,
    distribution: schemas.DistributionCreate
) -> models.Distribution:
    """분배 기록 생성"""
    db_distribution = models.Distribution(
        party_id=party_id,
        **distribution.model_dump()
    )
    db.add(db_distribution)
    db.commit()
    db.refresh(db_distribution)
    return db_distribution

def get_distributions(
    db: Session,
    party_id: int,
    week_number: Optional[int] = None,
    party_member_id: Optional[int] = None
) -> List[models.Distribution]:
    """분배 기록 조회"""
    query = db.query(models.Distribution).options(
        joinedload(models.Distribution.party_member).joinedload(models.PartyMember.user),
        joinedload(models.Distribution.party_member).joinedload(models.PartyMember.job),
        joinedload(models.Distribution.item)
    ).filter(models.Distribution.party_id == party_id)
    
    if week_number is not None:
        query = query.filter(models.Distribution.week_number == week_number)
    if party_member_id is not None:
        query = query.filter(models.Distribution.party_member_id == party_member_id)
    
    return query.order_by(models.Distribution.distributed_at.desc()).all()

def get_distribution_stats(db: Session, party_id: int) -> Dict:
    """분배 통계 조회"""
    # 부위별 분배 현황
    slot_stats = db.query(
        models.Item.slot,
        func.count(models.Distribution.id).label('count')
    ).join(
        models.Distribution
    ).filter(
        models.Distribution.party_id == party_id
    ).group_by(models.Item.slot).all()
    
    # 멤버별 획득 현황
    member_stats = db.query(
        models.PartyMember.id,
        models.User.username,
        models.PartyMember.character_name,
        func.count(models.Distribution.id).label('items_received')
    ).join(
        models.Distribution
    ).join(
        models.User
    ).filter(
        models.Distribution.party_id == party_id
    ).group_by(
        models.PartyMember.id,
        models.User.username,
        models.PartyMember.character_name
    ).all()
    
    return {
        "slot_distribution": slot_stats,
        "member_distribution": member_stats
    }

#SECTION - 레이드 일정 관련 CRUD

def create_raid_schedule(
    db: Session,
    party_id: int,
    schedule: schemas.RaidScheduleCreate
) -> models.RaidSchedule:
    """레이드 일정 생성"""
    db_schedule = models.RaidSchedule(
        party_id=party_id,
        **schedule.model_dump()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def get_raid_schedules(
    db: Session,
    party_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[models.RaidSchedule]:
    """레이드 일정 조회"""
    query = db.query(models.RaidSchedule).filter(
        models.RaidSchedule.party_id == party_id
    )
    
    if start_date:
        query = query.filter(models.RaidSchedule.scheduled_date >= start_date)
    if end_date:
        query = query.filter(models.RaidSchedule.scheduled_date <= end_date)
    
    return query.order_by(models.RaidSchedule.scheduled_date).all()

def update_raid_schedule(
    db: Session,
    schedule_id: int,
    schedule_update: schemas.RaidScheduleUpdate
) -> Optional[models.RaidSchedule]:
    """레이드 일정 수정"""
    db_schedule = db.query(models.RaidSchedule).filter(
        models.RaidSchedule.id == schedule_id
    ).first()
    
    if db_schedule:
        update_data = schedule_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_schedule, key, value)
        db.commit()
        db.refresh(db_schedule)
    return db_schedule

def delete_raid_schedule(db: Session, schedule_id: int) -> bool:
    """레이드 일정 삭제"""
    db_schedule = db.query(models.RaidSchedule).filter(
        models.RaidSchedule.id == schedule_id
    ).first()
    
    if db_schedule:
        db.delete(db_schedule)
        db.commit()
        return True
    return False