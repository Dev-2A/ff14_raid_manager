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


@router.post("/raid_parties/", response_model=schemas.RaidParty)
def create_raid_party(raid_party: schemas.RaidPartyCreate, db: Session = Depends(get_db)):
    db_raid_party = crud.raid_party.get_raid_party_by_name(db, name=raid_party.name)
    if db_raid_party:
        raise HTTPException(status_code=400, detail="Raid party already registered")
    return crud.raid_party.create_raid_party(db=db, raid_party=raid_party)
