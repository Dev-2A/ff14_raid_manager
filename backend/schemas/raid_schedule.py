from pydantic import BaseModel
from datetime import date
from typing import Optional

from .raid_party import RaidParty

class RaidScheduleBase(BaseModel):
    raid_party_id: int
    start_date: date
    end_date: Optional[date] = None
    description: str
    is_active: bool = True

class RaidScheduleCreate(RaidScheduleBase):
    pass

class RaidSchedule(RaidScheduleBase):
    id: int
    raid_party: RaidParty

    class Config:
        orm_mode = True
