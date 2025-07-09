from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base

class PlayerItemPriority(Base):
    __tablename__ = "player_item_priorities"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    raid_party_id = Column(Integer, ForeignKey("raid_parties.id"))
    priority_order = Column(Integer, nullable=False) # e.g., 1 for highest priority

    player = relationship("Player")
    item = relationship("Item")
    raid_party = relationship("RaidParty")
