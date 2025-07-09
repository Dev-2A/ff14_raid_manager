from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from ..db.database import Base
import enum

class GearSetType(str, enum.Enum):
    STARTING = "출발 세트"
    BIS = "최종 세트"

class GearSet(Base):
    __tablename__ = "gear_sets"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    set_type = Column(Enum(GearSetType), nullable=False)

    player = relationship("Player", back_populates="gear_sets")
    gear_set_items = relationship("GearSetItem", back_populates="gear_set")

class GearSetItem(Base):
    __tablename__ = "gear_set_items"

    id = Column(Integer, primary_key=True, index=True)
    gear_set_id = Column(Integer, ForeignKey("gear_sets.id"))
    item_id = Column(Integer, ForeignKey("items.id"))

    gear_set = relationship("GearSet", back_populates="gear_set_items")
    item = relationship("Item")
