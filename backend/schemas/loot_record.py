from pydantic import BaseModel
from datetime import datetime
from ..models.loot_record import DistributionMethod
from .player import Player
from .item import Item
from .raid_party import RaidParty

class LootRecordBase(BaseModel):
    player_id: int
    item_id: int
    raid_party_id: int
    distribution_method: DistributionMethod

class LootRecordCreate(LootRecordBase):
    pass

class LootRecord(LootRecordBase):
    id: int
    distribution_date: datetime
    player: Player
    item: Item
    raid_party: RaidParty

    class Config:
        orm_mode = True
