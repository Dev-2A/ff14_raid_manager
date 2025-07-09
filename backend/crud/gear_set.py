from sqlalchemy.orm import Session
from ..models.gear_set import GearSet, GearSetItem, GearSetType
from ..schemas.gear_set import GearSetCreate

def get_gear_set_by_player_and_type(db: Session, player_id: int, set_type: GearSetType):
    return db.query(GearSet).filter(GearSet.player_id == player_id, GearSet.set_type == set_type).first()

def create_gear_set(db: Session, gear_set: GearSetCreate):
    db_gear_set = GearSet(player_id=gear_set.player_id, set_type=gear_set.set_type)
    db.add(db_gear_set)
    db.commit()
    db.refresh(db_gear_set)

    for item_data in gear_set.items:
        db_gear_set_item = GearSetItem(gear_set_id=db_gear_set.id, item_id=item_data.item_id)
        db.add(db_gear_set_item)
    db.commit()
    db.refresh(db_gear_set)

    return db_gear_set
