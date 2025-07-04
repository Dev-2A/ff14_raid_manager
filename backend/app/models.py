from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

#SECTION - Enum 정의
class RoleEnum(str, enum.Enum):
    """직업 역할 구분"""
    TANK = "tank"  # 탱커
    HEALER = "healer"  # 힐러
    MELEE_DPS = "melee_dps"  # 근거리 딜러
    RANGED_DPS = "ranged_dps"  # 원거리 딜러
    MAGIC_DPS = "magic_dps"  # 마법 딜러

class ItemSlotEnum(str, enum.Enum):
    """장비 부위"""
    WEAPON = "weapon"  # 무기
    HEAD = "head"  # 머리
    BODY = "body"  # 상의
    HANDS = "hands"  # 장갑
    LEGS = "legs"  # 하의
    FEET = "feet"  # 신발
    EARRINGS = "earrings"  # 귀걸이
    NECKLACE = "necklace"  # 목걸이
    BRACELET = "bracelet"  # 팔찌
    RING = "ring"  # 반지

class ItemTypeEnum(str, enum.Enum):
    """장비 종류"""
    NORMAL_RAID = "normal_raid"  # 일반 레이드
    SAVAGE_RAID = "savage_raid"  # 영웅 레이드
    TOME = "tome"  # 석판
    AUGMENTED_TOME = "augmented_tome"  # 보강 석판
    CRAFTED = "crafted"  # 제작
    EXTREME = "extreme"  # 극만신

class DistributionMethodEnum(str, enum.Enum):
    """분배 방식"""
    PRIORITY = "priority"  # 우선 순위 분배
    NEED_GREED = "need_greed"  # 먹고 빠지기 분배

#SECTION - 데이터베이스 모델
class User(Base):
    """사용자 테이블"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    party_members = relationship("PartyMember", back_populates="user")
    managed_parties = relationship("Party", back_populates="leader")

class Job(Base):
    """직업 테이블"""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    name_kr = Column(String(50), nullable=False)  # 한국어 직업명
    name_en = Column(String(50), nullable=False)  # 영어 직업명
    role = Column(Enum(RoleEnum), nullable=False)  # 역할
    icon_name = Column(String(100))  # 아이콘 파일명
    
    # 관계
    party_members = relationship("PartyMember", back_populates="job")

class Raid(Base):
    """레이드 테이블"""
    __tablename__ = "raids"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    patch_number = Column(String(10), nullable=False)  # 패치 번호 (예: 7.0)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    parties = relationship("Party", back_populates="raid")
    items = relationship("Item", back_populates="raid")

class Party(Base):
    """공대 테이블"""
    __tablename__ = "parties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    raid_id = Column(Integer, ForeignKey("raids.id"), nullable=False)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    distribution_method = Column(Enum(DistributionMethodEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    raid = relationship("Raid", back_populates="parties")
    leader = relationship("User", back_populates="managed_parties")
    members = relationship("PartyMember", back_populates="party")
    schedules = relationship("RaidSchedule", back_populates="party")
    distributions = relationship("Distribution", back_populates="party")

class PartyMember(Base):
    """공대원 테이블"""
    __tablename__ = "party_members"

    id = Column(Integer, primary_key=True, index=True)
    party_id = Column(Integer, ForeignKey("parties.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    character_name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    party = relationship("Party", back_populates="members")
    user = relationship("User", back_populates="party_members")
    job = relationship("Job", back_populates="party_members")
    current_equipment = relationship("PlayerEquipment", back_populates="party_member")
    start_set = relationship("PlayerStartSet", back_populates="party_member")
    final_set = relationship("PlayerFinalSet", back_populates="party_member")
    distributions = relationship("Distribution", back_populates="party_member")

class Item(Base):
    """아이템 테이블"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    raid_id = Column(Integer, ForeignKey("raids.id"), nullable=False)
    item_level = Column(Integer, nullable=False)
    slot = Column(Enum(ItemSlotEnum), nullable=False)
    item_type = Column(Enum(ItemTypeEnum), nullable=False)
    
    # 관계
    raid = relationship("Raid", back_populates="items")

class PlayerEquipment(Base):
    """플레이어 현재 장비"""
    __tablename__ = "player_equipment"

    id = Column(Integer, primary_key=True, index=True)
    party_member_id = Column(Integer, ForeignKey("party_members.id"), nullable=False)
    slot = Column(Enum(ItemSlotEnum), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    equipped_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    party_member = relationship("PartyMember", back_populates="current_equipment")
    item = relationship("Item")

class PlayerStartSet(Base):
    """플레이어 출발 세트"""
    __tablename__ = "player_start_sets"

    id = Column(Integer, primary_key=True, index=True)
    party_member_id = Column(Integer, ForeignKey("party_members.id"), nullable=False)
    slot = Column(Enum(ItemSlotEnum), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    
    # 관계
    party_member = relationship("PartyMember", back_populates="start_set")
    item = relationship("Item")

class PlayerFinalSet(Base):
    """플레이어 최종 세트"""
    __tablename__ = "player_final_sets"

    id = Column(Integer, primary_key=True, index=True)
    party_member_id = Column(Integer, ForeignKey("party_members.id"), nullable=False)
    slot = Column(Enum(ItemSlotEnum), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    
    # 관계
    party_member = relationship("PartyMember", back_populates="final_set")
    item = relationship("Item")

class Distribution(Base):
    """분배 기록"""
    __tablename__ = "distributions"

    id = Column(Integer, primary_key=True, index=True)
    party_id = Column(Integer, ForeignKey("parties.id"), nullable=False)
    party_member_id = Column(Integer, ForeignKey("party_members.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    week_number = Column(Integer, nullable=False)  # 주차
    distributed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # 관계
    party = relationship("Party", back_populates="distributions")
    party_member = relationship("PartyMember", back_populates="distributions")
    item = relationship("Item")

class RaidSchedule(Base):
    """레이드 일정"""
    __tablename__ = "raid_schedules"

    id = Column(Integer, primary_key=True, index=True)
    party_id = Column(Integer, ForeignKey("parties.id"), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    party = relationship("Party", back_populates="schedules")