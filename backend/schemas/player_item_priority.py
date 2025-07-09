from pydantic import BaseModel
from .player import Player
from .item import Item
from .raid_party import RaidParty

class PlayerItemPriorityBase(BaseModel):
    player_id: int
    item_id: int
    raid_party_id: int
    priority_order: int

class PlayerItemPriorityCreate(PlayerItemPriorityBase):
    pass

class PlayerItemPriority(PlayerItemPriorityBase):
    id: int
    player: Player
    item: Item
    raid_party: RaidParty

    class Config:
        orm_mode = True
