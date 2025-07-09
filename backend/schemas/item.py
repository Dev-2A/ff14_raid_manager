from pydantic import BaseModel
from ..models.item import ItemCategory, ItemSlot, ItemSource

class ItemBase(BaseModel):
    name: str
    category: ItemCategory
    slot: ItemSlot
    source: ItemSource

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True
