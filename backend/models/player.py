from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from ..db.database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    raid_party_id = Column(Integer, ForeignKey("raid_parties.id"))
    character_nickname = Column(String, index=True, nullable=False)

    user = relationship("User", back_populates="players")
    job = relationship("Job", back_populates="players")
    raid_party = relationship("RaidParty", back_populates="players")
    gear_sets = relationship("GearSet", back_populates="player")
