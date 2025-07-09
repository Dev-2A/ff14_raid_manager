from sqlalchemy.orm import Session
from ..models.raid_party import RaidParty
from ..schemas.raid_party import RaidPartyCreate

def get_raid_party_by_name(db: Session, name: str):
    return db.query(RaidParty).filter(RaidParty.name == name).first()

def create_raid_party(db: Session, raid_party: RaidPartyCreate):
    db_raid_party = RaidParty(name=raid_party.name)
    db.add(db_raid_party)
    db.commit()
    db.refresh(db_raid_party)
    return db_raid_party
