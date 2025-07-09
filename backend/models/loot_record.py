from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from ..db.database import Base
import enum
import datetime

class DistributionMethod(str, enum.Enum):
    PRIORITY = "우선 순위 분배"
    EAT_AND_GO = "먹고 빠지기 분배"

class LootRecord(Base):
    __tablename__ = "loot_records"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    raid_party_id = Column(Integer, ForeignKey("raid_parties.id"))
    distribution_date = Column(DateTime, default=datetime.datetime.utcnow)
    distribution_method = Column(Enum(DistributionMethod), nullable=False)

    player = relationship("Player")
    item = relationship("Item")
    raid_party = relationship("RaidParty")
