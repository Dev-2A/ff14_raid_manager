from sqlalchemy.orm import Session
from ..models.player import Player
from ..schemas.player import PlayerCreate

def get_player_by_nickname_and_raid_party(db: Session, nickname: str, raid_party_id: int):
    return db.query(Player).filter(Player.character_nickname == nickname, Player.raid_party_id == raid_party_id).first()

def create_player(db: Session, player: PlayerCreate):
    db_player = Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player
