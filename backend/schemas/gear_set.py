from pydantic import BaseModel
from typing import List
from ..models.gear_set import GearSetType
from .item import Item

class GearSetItemBase(BaseModel):
    item_id: int

class GearSetItemCreate(GearSetItemBase):
    pass

class GearSetItem(GearSetItemBase):
    id: int
    item: Item

    class Config:
        orm_mode = True

class GearSetBase(BaseModel):
    player_id: int
    set_type: GearSetType

class GearSetCreate(GearSetBase):
    items: List[GearSetItemCreate] = []

class GearSet(GearSetBase):
    id: int
    gear_set_items: List[GearSetItem] = []

    class Config:
        orm_mode = True
