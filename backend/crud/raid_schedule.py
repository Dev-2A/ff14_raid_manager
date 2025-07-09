from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.raid_schedule import RaidSchedule
from ..schemas.raid_schedule import RaidScheduleCreate

def create_raid_schedule(db: Session, schedule: RaidScheduleCreate):
    db_schedule = RaidSchedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def get_raid_schedule(db: Session, schedule_id: int) -> Optional[RaidSchedule]:
    return db.query(RaidSchedule).filter(RaidSchedule.id == schedule_id).first()

def get_raid_schedules_by_raid_party(db: Session, raid_party_id: int) -> List[RaidSchedule]:
    return db.query(RaidSchedule).filter(RaidSchedule.raid_party_id == raid_party_id).all()

def delete_raid_schedule(db: Session, schedule_id: int):
    db_schedule = db.query(RaidSchedule).filter(RaidSchedule.id == schedule_id).first()
    if db_schedule:
        db.delete(db_schedule)
        db.commit()
        return True
    return False
