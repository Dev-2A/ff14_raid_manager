from sqlalchemy import Column, Integer, String, Enum
from ..db.database import Base
import enum

class ItemCategory(str, enum.Enum):
    WEAPON = "무기"
    ARMOR = "방어구"
    ACCESSORY = "악세사리"

class ItemSlot(str, enum.Enum):
    WEAPON = "무기"
    HEAD = "머리"
    BODY = "상의"
    HANDS = "장갑"
    LEGS = "하의"
    FEET = "신발"
    EARRINGS = "귀걸이"
    NECKLACE = "목걸이"
    BRACELET = "팔찌"
    RING = "반지"

class ItemSource(str, enum.Enum):
    NORMAL_RAID = "일반 레이드"
    SAVAGE_RAID = "영웅 레이드"
    TOMESTONE = "석판"
    AUGMENTED_TOMESTONE = "보강 석판"
    CRAFTED = "제작"
    EXTREME_TRIAL = "극만신"

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(Enum(ItemCategory), nullable=False)
    slot = Column(Enum(ItemSlot), nullable=False)
    source = Column(Enum(ItemSource), nullable=False)
