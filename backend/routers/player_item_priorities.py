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


@router.post("/player_item_priorities/", response_model=schemas.PlayerItemPriority)
def create_player_item_priority(priority: schemas.PlayerItemPriorityCreate, db: Session = Depends(get_db)):
    db_priority = crud.player_item_priority.get_player_item_priority(
        db, 
        player_id=priority.player_id, 
        item_id=priority.item_id, 
        raid_party_id=priority.raid_party_id
    )
    if db_priority:
        raise HTTPException(status_code=400, detail="Priority for this player, item, and raid party already exists")
    return crud.player_item_priority.create_player_item_priority(db=db, priority=priority)
