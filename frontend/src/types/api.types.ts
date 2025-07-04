// Enum 타입들
export enum RoleEnum {
  TANK = 'tank',
  HEALER = 'healer',
  MELEE_DPS = 'melee_dps',
  RANGED_DPS = 'ranged_dps',
  MAGIC_DPS = 'magic_dps'
}

export enum ItemSlotEnum {
  WEAPON = 'weapon',
  HEAD = 'head',
  BODY = 'body',
  HANDS = 'hands',
  LEGS = 'legs',
  FEET = 'feet',
  EARRINGS = 'earrings',
  NECKLACE = 'necklace',
  BRACELET = 'bracelet',
  RING = 'ring'
}

export enum ItemTypeEnum {
  NORMAL_RAID = 'normal_raid',
  SAVAGE_RAID = 'savage_raid',
  TOME = 'tome',
  AUGMENTED_TOME = 'augmented_tome',
  CRAFTED = 'crafted',
  EXTREME = 'extreme'
}

export enum DistributionMethodEnum {
  PRIORITY = 'priority',
  NEED_GREED = 'need_greed'
}

// 기본 타입들
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Job {
  id: number;
  name_kr: string;
  name_en: string;
  role: RoleEnum;
  icon_name: string;
}

export interface Raid {
  id: number;
  name: string;
  patch_number: string;
  is_current: boolean;
  created_at: string;
}

export interface Party {
  id: number;
  name: string;
  raid_id: number;
  distribution_method: DistributionMethodEnum;
  leader_id: number;
  is_active: boolean;
  created_at: string;
  raid?: Raid;
  member_count?: number;
}

export interface PartyMember {
  id: number;
  party_id: number;
  user: User;
  job: Job;
  character_name: string;
  is_active: boolean;
  joined_at: string;
}

export interface Item {
  id: number;
  raid_id: number;
  name_kr: string;
  name_en: string;
  slot: ItemSlotEnum;
  item_type: ItemTypeEnum;
  item_level: number;
  icon_name?: string;
}

export interface Equipment {
  slot: ItemSlotEnum;
  item?: Item;
}

export interface EquipmentSet {
  party_member_id: number;
  character_name: string;
  set_type: 'current' | 'start' | 'final';
  equipment: Equipment[];
  completion_rate: number;
}

export interface CurrencyRequirements {
  tome_stones: number;
  raid_tokens: {
    [floor: string]: number;
  };
  upgrade_materials: {
    [material: string]: number;
  };
}

export interface MemberCurrencyRequirements {
  party_member_id: number;
  character_name: string;
  currency_requirements: {
    current_to_start: CurrencyRequirements;
    start_to_final: CurrencyRequirements;
    current_to_final: CurrencyRequirements;
  };
}

export interface Distribution {
  id: number;
  party_id: number;
  party_member: PartyMember;
  item: Item;
  week_number: number;
  distributed_at: string;
  notes?: string;
}

export interface PriorityMember {
  party_member_id: number;
  character_name: string;
  job: string;
  total_currency_needed: number;
  items_received: number;
  needed_items_count: number;
  priority: number;
}

export interface PriorityCalculation {
  party_id: number;
  party_name: string;
  calculation_method: string;
  member_priorities: PriorityMember[];
}

export interface Schedule {
  id: number;
  party_id: number;
  scheduled_date: string;
  notes?: string;
  created_at: string;
}

// API 요청/응답 타입들
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface CreatePartyRequest {
  name: string;
  raid_id: number;
  distribution_method: DistributionMethodEnum;
}

export interface JoinPartyRequest {
  job_id: number;
  character_name: string;
}

export interface UpdateEquipmentRequest {
  equipment: Array<{
    slot: ItemSlotEnum;
    item_id?: number;
  }>;
}

export interface CreateDistributionRequest {
  party_member_id: number;
  item_id: number;
  week_number: number;
  notes?: string;
}

export interface CreateScheduleRequest {
  scheduled_date: string;
  notes?: string;
}

export interface JobComposition {
  tanks: number;
  healers: number;
  dps: number;
}

export interface AvailableJobsResponse {
  available_jobs: Job[];
  current_composition: JobComposition;
}

export interface UserCharacter {
  party_member_id: number;
  character_name: string;
  party_name: string;
  job_name: string;
  job_role: RoleEnum;
  joined_at: string;
}