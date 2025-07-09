from fastapi import APIRouter, Depends
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


@router.post("/loot_records/", response_model=schemas.LootRecord)
def create_loot_record(loot_record: schemas.LootRecordCreate, db: Session = Depends(get_db)):
    return crud.loot_record.create_loot_record(db=db, loot_record=loot_record)

@router.get("/loot_records/eat_and_go_eligibility/{player_id}/{item_id}/{raid_party_id}", response_model=bool)
def check_eat_and_go_eligibility(
    player_id: int,
    item_id: int,
    raid_party_id: int,
    db: Session = Depends(get_db)
):
    return crud.loot_record.is_eligible_for_eat_and_go(db, player_id, item_id, raid_party_id)
