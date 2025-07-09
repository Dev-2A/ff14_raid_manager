from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..db.database import Base

class RaidParty(Base):
    __tablename__ = "raid_parties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)

    players = relationship("Player", back_populates="raid_party")
