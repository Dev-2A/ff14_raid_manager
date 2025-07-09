from sqlalchemy import Column, Integer, ForeignKey, String, Date, Boolean
from sqlalchemy.orm import relationship
from ..db.database import Base

class RaidSchedule(Base):
    __tablename__ = "raid_schedules"

    id = Column(Integer, primary_key=True, index=True)
    raid_party_id = Column(Integer, ForeignKey("raid_parties.id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True) # Optional, for farming period
    description = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    raid_party = relationship("RaidParty")
