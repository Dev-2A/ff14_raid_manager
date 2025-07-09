from sqlalchemy.orm import Session
from ..models.player_item_priority import PlayerItemPriority
from ..schemas.player_item_priority import PlayerItemPriorityCreate

def get_player_item_priority(db: Session, player_id: int, item_id: int, raid_party_id: int):
    return db.query(PlayerItemPriority).filter(
        PlayerItemPriority.player_id == player_id,
        PlayerItemPriority.item_id == item_id,
        PlayerItemPriority.raid_party_id == raid_party_id
    ).first()

def create_player_item_priority(db: Session, priority: PlayerItemPriorityCreate):
    db_priority = PlayerItemPriority(**priority.dict())
    db.add(db_priority)
    db.commit()
    db.refresh(db_priority)
    return db_priority
