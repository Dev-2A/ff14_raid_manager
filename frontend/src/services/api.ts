import axios, { AxiosInstance } from 'axios';
import {
  User,
  Job,
  Raid,
  Party,
  PartyMember,
  Item,
  EquipmentSet,
  MemberCurrencyRequirements,
  Distribution,
  PriorityCalculation,
  Schedule,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  CreatePartyRequest,
  JoinPartyRequest,
  UpdateEquipmentRequest,
  CreateDistributionRequest,
  CreateScheduleRequest,
  AvailableJobsResponse,
  UserCharacter,
  ItemSlotEnum,
  ItemTypeEnum
} from '../types/api.types';

// API 기본 URL 설정 (환경변수 또는 기본값 사용)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 모든 요청에 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 시 로그인 페이지로 이동
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰 만료 시 로그인 페이지로 이동
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 엔드포인트 함수들

// 인증 관련
export const authAPI = {
  // 회원가입
  register: async (data: RegisterRequest) => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },
  
  // 로그인 - FormData 형식으로 전송
  login: async ({ username, password }: LoginRequest) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  // 내 정보 조회
  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  
  // 비밀번호 변경
  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

// 사용자 관련
export const userAPI = {
  // 사용자 목록 (관리자용)
  getUsers: async (skip: number = 0, limit: number = 20) => {
    const response = await api.get<User[]>(`/users/?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  // 특정 사용자 조회
  getUser: async (userId: number) => {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },
  
  // 사용자가 속한 공대 목록
  getUserParties: async (userId: number, isActive: boolean = true) => {
    const response = await api.get<Party[]>(`/users/${userId}/parties?is_active=${isActive}`);
    return response.data;
  },
  
  // 사용자의 캐릭터 목록
  getUserCharacters: async (userId: number) => {
    const response = await api.get<UserCharacter[]>(`/users/${userId}/characters`);
    return response.data;
  },
};

// 직업 관련
export const jobAPI = {
  // 직업 목록
  getJobs: async (role?: string) => {
    const url = role ? `/jobs/?role=${role}` : '/jobs/';
    const response = await api.get<Job[]>(url);
    return response.data;
  },
  
  // 직업 통계
  getJobStatistics: async () => {
    const response = await api.get('/jobs/statistics/composition');
    return response.data;
  },
};

// 레이드 관련
export const raidAPI = {
  // 레이드 목록
  getRaids: async (isCurrent?: boolean) => {
    const url = isCurrent !== undefined ? `/raids/?is_current=${isCurrent}` : '/raids/';
    const response = await api.get<Raid[]>(url);
    return response.data;
  },
  
  // 레이드 생성 (관리자용)
  createRaid: async (data: { name: string; patch_number: string }) => {
    const response = await api.post<Raid>('/raids/', data);
    return response.data;
  },
  
  // 레이드 아이템 목록
  getRaidItems: async (
    raidId: number, 
    params?: { slot?: ItemSlotEnum; item_type?: ItemTypeEnum }
  ) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await api.get<Item[]>(
      `/raids/${raidId}/items${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },
};

// 공대 관련
export const partyAPI = {
  // 공대 목록
  getParties: async (params?: { my_parties_only?: boolean; is_active?: boolean }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await api.get<Party[]>(`/parties/${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  // 공대 생성
  createParty: async (data: CreatePartyRequest) => {
    const response = await api.post<Party>('/parties/', data);
    return response.data;
  },
  
  // 공대원 추가 (본인 가입)
  joinParty: async (partyId: number, data: JoinPartyRequest) => {
    const response = await api.post<PartyMember>(`/parties/${partyId}/members`, data);
    return response.data;
  },
  
  // 공대원 목록
  getPartyMembers: async (partyId: number) => {
    const response = await api.get<PartyMember[]>(`/parties/${partyId}/members`);
    return response.data;
  },
  
  // 가입 가능한 직업 확인
  getAvailableJobs: async (partyId: number) => {
    const response = await api.get<AvailableJobsResponse>(`/parties/${partyId}/jobs`);
    return response.data;
  },
};

// 아이템 관련
export const itemAPI = {
  // 아이템 목록
  getItems: async (params?: { 
    raid_id?: number; 
    slot?: ItemSlotEnum; 
    item_type?: ItemTypeEnum 
  }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await api.get<Item[]>(`/items/${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  // 아이템 일괄 생성 (관리자용)
  batchCreateItems: async (raidId: number) => {
    const response = await api.post(`/items/batch-create?raid_id=${raidId}`);
    return response.data;
  },
  
  // 공대원 장비 조회
  getMemberEquipment: async (
    partyId: number, 
    userId: number, 
    setType: 'current' | 'start' | 'final' = 'current'
  ) => {
    const response = await api.get<EquipmentSet>(
      `/items/party/${partyId}/member/${userId}/equipment?set_type=${setType}`
    );
    return response.data;
  },
  
  // 장비 세트 설정
  updateMemberEquipment: async (
    partyId: number, 
    userId: number, 
    setType: 'current' | 'start' | 'final',
    data: UpdateEquipmentRequest
  ) => {
    const response = await api.put<EquipmentSet>(
      `/items/party/${partyId}/member/${userId}/equipment?set_type=${setType}`, 
      data
    );
    return response.data;
  },
  
  // 재화 요구량 계산
  getCurrencyRequirements: async (partyId: number, userId: number) => {
    const response = await api.get<MemberCurrencyRequirements>(
      `/items/party/${partyId}/member/${userId}/currency-requirements`
    );
    return response.data;
  },
};

// 분배 관련
export const distributionAPI = {
  // 분배 기록 조회
  getDistributions: async (
    partyId: number, 
    params?: { week_number?: number; party_member_id?: number }
  ) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const response = await api.get<Distribution[]>(
      `/distribution/party/${partyId}${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },
  
  // 분배 기록 생성
  createDistribution: async (partyId: number, data: CreateDistributionRequest) => {
    const response = await api.post<Distribution>(`/distribution/party/${partyId}`, data);
    return response.data;
  },
  
  // 분배 통계
  getDistributionStatistics: async (partyId: number) => {
    const response = await api.get(`/distribution/party/${partyId}/statistics`);
    return response.data;
  },
  
  // 우선순위 계산
  getPriorityCalculation: async (partyId: number) => {
    const response = await api.get<PriorityCalculation>(
      `/distribution/party/${partyId}/priority-calculation`
    );
    return response.data;
  },
  
  // 레이드 일정 조회
  getSchedule: async (partyId: number) => {
    const response = await api.get<Schedule[]>(`/distribution/party/${partyId}/schedule`);
    return response.data;
  },
  
  // 레이드 일정 생성
  createSchedule: async (partyId: number, data: CreateScheduleRequest) => {
    const response = await api.post<Schedule>(`/distribution/party/${partyId}/schedule`, data);
    return response.data;
  },
};

export default api;