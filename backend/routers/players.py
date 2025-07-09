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


@router.post("/players/", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    db_player = crud.player.get_player_by_nickname_and_raid_party(db, nickname=player.character_nickname, raid_party_id=player.raid_party_id)
    if db_player:
        raise HTTPException(status_code=400, detail="Character nickname already exists in this raid party")
    return crud.player.create_player(db=db, player=player)
