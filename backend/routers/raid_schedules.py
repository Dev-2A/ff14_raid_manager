from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..db.database import SessionLocal

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/raid_schedules/", response_model=schemas.RaidSchedule)
def create_raid_schedule(schedule: schemas.RaidScheduleCreate, db: Session = Depends(get_db)):
    return crud.raid_schedule.create_raid_schedule(db=db, schedule=schedule)

@router.get("/raid_schedules/{schedule_id}", response_model=schemas.RaidSchedule)
def get_raid_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.raid_schedule.get_raid_schedule(db, schedule_id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Raid schedule not found")
    return db_schedule

@router.get("/raid_schedules/by_raid_party/{raid_party_id}", response_model=List[schemas.RaidSchedule])
def get_raid_schedules_by_raid_party(raid_party_id: int, db: Session = Depends(get_db)):
    return crud.raid_schedule.get_raid_schedules_by_raid_party(db, raid_party_id=raid_party_id)

@router.delete("/raid_schedules/{schedule_id}")
def delete_raid_schedule(schedule_id: int, db: Session = Depends(get_db)):
    if not crud.raid_schedule.delete_raid_schedule(db, schedule_id=schedule_id):
        raise HTTPException(status_code=404, detail="Raid schedule not found")
    return {"message": "Raid schedule deleted successfully"}
