from pydantic import BaseModel
from ..models.job import JobRole

class JobBase(BaseModel):
    name: str
    role: JobRole

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int

    class Config:
        orm_mode = True
