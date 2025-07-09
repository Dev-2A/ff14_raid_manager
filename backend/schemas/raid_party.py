from pydantic import BaseModel
from typing import List
from .player import Player

class RaidPartyBase(BaseModel):
    name: str

class RaidPartyCreate(RaidPartyBase):
    pass

class RaidParty(RaidPartyBase):
    id: int
    players: List[Player] = []

    class Config:
        orm_mode = True
