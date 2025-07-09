from pydantic import BaseModel
from .user import User
from .job import Job

class PlayerBase(BaseModel):
    user_id: int
    job_id: int
    raid_party_id: int
    character_nickname: str

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int
    user: User
    job: Job

    class Config:
        orm_mode = True
