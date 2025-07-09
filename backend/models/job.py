from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from ..db.database import Base
import enum

class JobRole(str, enum.Enum):
    TANK = "탱커"
    HEALER = "힐러"
    MELEE_DPS = "근거리 딜러"
    RANGED_DPS = "원거리 딜러"
    CASTER_DPS = "마법 딜러"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(JobRole), nullable=False)

    players = relationship("Player", back_populates="job")
