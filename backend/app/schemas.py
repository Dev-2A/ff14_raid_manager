from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .models import RoleEnum, ItemSlotEnum, ItemTypeEnum, DistributionMethodEnum

#SECTION - 기본 응답 스키마
class ResponseBase(BaseModel):
    """API 응답 기본 구조"""
    success: bool
    message: str
    data: Optional[dict] = None

#SECTION - 사용자 관련 스키마
class UserBase(BaseModel):
    """사용자 기본 정보"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    """회원가입 요청"""
    password: str = Field(..., min_length=6, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('비밀번호는 최소 6자 이상이어야 합니다')
        return v

class UserLogin(BaseModel):
    """로그인 요청"""
    username: str
    password: str

class UserResponse(UserBase):
    """사용자 응답"""
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    """JWT 토큰 응답"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """토큰 데이터"""
    username: Optional[str] = None

#SECTION - 직업 관련 스키마
class JobBase(BaseModel):
    """직업 기본 정보"""
    name_kr: str
    name_en: str
    role: RoleEnum
    icon_name: Optional[str] = None

class JobCreate(JobBase):
    """직업 생성"""
    pass

class JobResponse(JobBase):
    """직업 응답"""
    id: int
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 레이드 관련 스키마
class RaidBase(BaseModel):
    """레이드 기본 정보"""
    name: str
    patch_number: str

class RaidCreate(RaidBase):
    """레이드 생성"""
    pass

class RaidResponse(RaidBase):
    """레이드 응답"""
    id: int
    is_current: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 공대 관련 스키마
class PartyBase(BaseModel):
    """공대 기본 정보"""
    name: str
    raid_id: int
    distribution_method: DistributionMethodEnum

class PartyCreate(PartyBase):
    """공대 생성"""
    pass

class PartyUpdate(BaseModel):
    """공대 수정"""
    name: Optional[str] = None
    distribution_method: Optional[DistributionMethodEnum] = None
    is_active: Optional[bool] = None

class PartyResponse(PartyBase):
    """공대 응답"""
    id: int
    leader_id: int
    is_active: bool
    created_at: datetime
    raid: Optional[RaidResponse] = None
    member_count: Optional[int] = 0
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 공대원 관련 스키마
class PartyMemberBase(BaseModel):
    """공대원 기본 정보"""
    party_id: int
    user_id: int
    job_id: int
    character_name: str = Field(..., min_length=1, max_length=50)

class PartyMemberCreate(BaseModel):
    """공대원 추가"""
    job_id: int
    character_name: str = Field(..., min_length=1, max_length=50)

class PartyMemberResponse(BaseModel):
    """공대원 응답"""
    id: int
    party_id: int
    user: UserResponse
    job: JobResponse
    character_name: str
    is_active: bool
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 아이템 관련 스키마
class ItemBase(BaseModel):
    """아이템 기본 정보"""
    name: str
    item_level: int
    slot: ItemSlotEnum
    item_type: ItemTypeEnum

class ItemCreate(ItemBase):
    """아이템 생성"""
    raid_id: int

class ItemResponse(ItemBase):
    """아이템 응답"""
    id: int
    raid_id: int
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 장비 세트 관련 스키마
class EquipmentSlot(BaseModel):
    """장비 슬롯 정보"""
    slot: ItemSlotEnum
    item_id: int

class EquipmentSetBase(BaseModel):
    """장비 세트 기본"""
    equipment: List[EquipmentSlot]

class StartSetCreate(EquipmentSetBase):
    """출발 세트 생성/수정"""
    pass

class FinalSetCreate(EquipmentSetBase):
    """최종 세트 생성/수정"""
    pass

class EquipmentResponse(BaseModel):
    """장비 응답"""
    slot: ItemSlotEnum
    item: ItemResponse
    
    model_config = ConfigDict(from_attributes=True)

class EquipmentSetResponse(BaseModel):
    """장비 세트 응답"""
    party_member_id: int
    equipment: List[EquipmentResponse]
    completion_rate: float # 달성률
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 분배 관련 스키마
class DistributionBase(BaseModel):
    """분배 기본 정보"""
    party_member_id: int
    item_id: int
    week_number: int
    notes: Optional[str] = None

class DistributionCreate(DistributionBase):
    """분배 기록 생성"""
    pass

class DistributionResponse(DistributionBase):
    """분배 응답"""
    id: int
    party_id: int
    distributed_at: datetime
    party_member: PartyMemberResponse
    item: ItemResponse
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 레이드 일정 관련 스키마
class RaidScheduleBase(BaseModel):
    """레이드 일정 기본"""
    scheduled_date: datetime
    notes: Optional[str] = None

class RaidScheduleCreate(RaidScheduleBase):
    """일정 생성"""
    pass

class RaidScheduleUpdate(BaseModel):
    """일정 수정"""
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None

class RaidScheduleResponse(RaidScheduleBase):
    """일정 응답"""
    id: int
    party_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

#SECTION - 통계 관련 스키마
class ItemDistributionStats(BaseModel):
    """아이템 분배 통계"""
    slot: ItemSlotEnum
    total_distributed: int
    members_received: List[dict] # [{user_id, username, count}]

class MemberStats(BaseModel):
    """공대원 통계"""
    party_member_id: int
    username: str
    character_name: str
    job_name: str
    items_received: int
    start_set_completion: float
    final_set_completion: float
    currency_needed: dict # {currency_type: amount}

class PartyStats(BaseModel):
    """공대 통계"""
    party_id: int
    party_name: str
    total_items_distributed: int
    average_completion_rate: float
    member_stats: List[MemberStats]

#SECTION - 재화 계산 관련 스키마
class CurrencyRequirement(BaseModel):
    """재화 요구량"""
    tome_stones: int # 석판 개수
    raid_tokens: dict # {층: 낱장 개수}
    upgrade_materials: dict # {재료명: 개수}

class SetComparison(BaseModel):
    """세트 비교"""
    party_member_id: int
    current_to_start: CurrencyRequirement
    start_to_final: CurrencyRequirement
    current_to_final: CurrencyRequirement

#SECTION - 공대 가입 가능 직업 관련 스키마
class JobComposition(BaseModel):
    """공대 구성 현황"""
    tanks: int
    healers: int
    dps: int

class AvailableJobsResponse(BaseModel):
    """가입 가능한 직업 목록 응답"""
    available_jobs: List[JobResponse]
    current_composition: JobComposition