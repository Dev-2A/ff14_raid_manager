from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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


@router.post("/gear_sets/", response_model=schemas.GearSet)
def create_gear_set(gear_set: schemas.GearSetCreate, db: Session = Depends(get_db)):
    db_gear_set = crud.gear_set.get_gear_set_by_player_and_type(db, player_id=gear_set.player_id, set_type=gear_set.set_type)
    if db_gear_set:
        raise HTTPException(status_code=400, detail="Gear set of this type already exists for this player")
    return crud.gear_set.create_gear_set(db=db, gear_set=gear_set)
