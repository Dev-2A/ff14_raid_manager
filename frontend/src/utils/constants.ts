import { ItemTypeEnum, RoleEnum, ItemSlotEnum } from '../types/api.types';

// 아이템 타입별 한글명
export const ITEM_TYPE_NAMES: Record<ItemTypeEnum, string> = {
  [ItemTypeEnum.NORMAL_RAID]: '일반 레이드',
  [ItemTypeEnum.SAVAGE_RAID]: '영웅 레이드',
  [ItemTypeEnum.TOME]: '석판',
  [ItemTypeEnum.AUGMENTED_TOME]: '보강 석판',
  [ItemTypeEnum.CRAFTED]: '제작',
  [ItemTypeEnum.EXTREME]: '극만신',
};

// 아이템 타입별 색상 클래스
export const ITEM_TYPE_COLORS: Record<ItemTypeEnum, string> = {
  [ItemTypeEnum.NORMAL_RAID]: 'item-normal',
  [ItemTypeEnum.SAVAGE_RAID]: 'item-savage',
  [ItemTypeEnum.TOME]: 'item-tome',
  [ItemTypeEnum.AUGMENTED_TOME]: 'item-augmented',
  [ItemTypeEnum.CRAFTED]: 'item-crafted',
  [ItemTypeEnum.EXTREME]: 'item-extreme',
};

// 직업 역할별 한글명
export const ROLE_NAMES: Record<RoleEnum, string> = {
  [RoleEnum.TANK]: '탱커',
  [RoleEnum.HEALER]: '힐러',
  [RoleEnum.MELEE_DPS]: '근거리 딜러',
  [RoleEnum.RANGED_DPS]: '원거리 딜러',
  [RoleEnum.MAGIC_DPS]: '마법 딜러',
};

// 직업 역할별 색상 클래스
export const ROLE_COLORS: Record<RoleEnum, string> = {
  [RoleEnum.TANK]: 'role-tank',
  [RoleEnum.HEALER]: 'role-healer',
  [RoleEnum.MELEE_DPS]: 'role-dps',
  [RoleEnum.RANGED_DPS]: 'role-dps',
  [RoleEnum.MAGIC_DPS]: 'role-dps',
};

// 장비 부위별 한글명
export const SLOT_NAMES: Record<ItemSlotEnum, string> = {
  [ItemSlotEnum.WEAPON]: '무기',
  [ItemSlotEnum.HEAD]: '머리',
  [ItemSlotEnum.BODY]: '상의',
  [ItemSlotEnum.HANDS]: '장갑',
  [ItemSlotEnum.LEGS]: '하의',
  [ItemSlotEnum.FEET]: '신발',
  [ItemSlotEnum.EARRINGS]: '귀걸이',
  [ItemSlotEnum.NECKLACE]: '목걸이',
  [ItemSlotEnum.BRACELET]: '팔찌',
  [ItemSlotEnum.RING]: '반지',
};

// 석판 비용
export const TOME_COSTS: Record<ItemSlotEnum, number> = {
  [ItemSlotEnum.WEAPON]: 500,
  [ItemSlotEnum.HEAD]: 495,
  [ItemSlotEnum.BODY]: 825,
  [ItemSlotEnum.HANDS]: 495,
  [ItemSlotEnum.LEGS]: 825,
  [ItemSlotEnum.FEET]: 495,
  [ItemSlotEnum.EARRINGS]: 375,
  [ItemSlotEnum.NECKLACE]: 375,
  [ItemSlotEnum.BRACELET]: 375,
  [ItemSlotEnum.RING]: 375,
};