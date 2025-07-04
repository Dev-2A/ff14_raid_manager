import { PartyMember, JobComposition, RoleEnum } from '../types/api.types';

// 공대 구성 계산
export const calculatePartyComposition = (members: PartyMember[]): JobComposition => {
  const composition = {
    tanks: 0,
    healers: 0,
    dps: 0,
  };

  members.forEach(member => {
    if (!member.is_active) return;
    
    switch (member.job.role) {
      case RoleEnum.TANK:
        composition.tanks++;
        break;
      case RoleEnum.HEALER:
        composition.healers++;
        break;
      case RoleEnum.MELEE_DPS:
      case RoleEnum.RANGED_DPS:
      case RoleEnum.MAGIC_DPS:
        composition.dps++;
        break;
    }
  });

  return composition;
};

// 공대 구성이 유효한지 확인
export const isValidPartyComposition = (composition: JobComposition): boolean => {
  return (
    composition.tanks === 2 &&
    composition.healers === 2 &&
    composition.dps === 4
  );
};

// 공대 구성 상태 텍스트
export const getCompositionStatus = (composition: JobComposition): string => {
  const total = composition.tanks + composition.healers + composition.dps;
  
  if (total === 0) return '공대원 없음';
  if (total === 8 && isValidPartyComposition(composition)) return '완전한 구성';
  
  const needed = [];
  if (composition.tanks < 2) needed.push(`탱커 ${2 - composition.tanks}명`);
  if (composition.healers < 2) needed.push(`힐러 ${2 - composition.healers}명`);
  if (composition.dps < 4) needed.push(`딜러 ${4 - composition.dps}명`);
  
  return `필요: ${needed.join(', ')}`;
};