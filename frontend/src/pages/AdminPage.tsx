import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { userAPI, raidAPI, partyAPI, jobAPI, itemAPI } from '../services/api';
import { User, Raid, Party, Item, ItemSlotEnum, ItemTypeEnum } from '../types/api.types';

import { formatDate, formatRelativeTime } from '../utils/format';
import {
  ChartBarIcon,
  UsersIcon,
  TrophyIcon,
  UserGroupIcon,
  PlusIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// 타입 정의
interface CreateRaidRequest {
  name: string;
  patch_number: string;
}

// 탭 타입
type TabType = 'dashboard' | 'users' | 'raids' | 'parties' | 'items';

interface TabProps {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const tabs: TabProps[] = [
  { id: 'dashboard', label: '대시보드', icon: ChartBarIcon },
  { id: 'users', label: '사용자 관리', icon: UsersIcon },
  { id: 'raids', label: '레이드 관리', icon: TrophyIcon },
  { id: 'parties', label: '공대 관리', icon: UserGroupIcon },
  { id: 'items', label: '아이템 관리', icon: CubeIcon },
];

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // 관리자 권한 체크
  if (!user?.is_admin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-400">접근 권한이 없습니다</h1>
          <p className="text-gray-400 mt-2">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </Layout>
    );
  }

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'users':
        return <UsersTab />;
      case 'raids':
        return <RaidsTab />;
      case 'parties':
        return <PartiesTab />;
      case 'items':
        return <ItemsTab />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="title-game text-4xl mb-2">관리자 패널</h1>
        <p className="text-gray-400">시스템 전체를 관리하고 모니터링합니다</p>
      </div>

      {/* 관리자 배지 */}
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/50">
          <SparklesIcon className="h-5 w-5 text-purple-400" />
          <span className="text-purple-400 font-semibold">시스템 관리자</span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-ff14-dark-100 mb-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="animate-in">
        {renderTabContent()}
      </div>
    </Layout>
  );
};

// 대시보드 탭
const DashboardTab: React.FC = () => {
  // 통계 데이터 로드
  const { data: users, loading: loadingUsers } = useAsync(
    () => userAPI.getUsers(0, 1000),
    []
  );

  const { data: parties, loading: loadingParties } = useAsync(
    () => partyAPI.getParties(),
    []
  );

  const { data: raids, loading: loadingRaids } = useAsync(
    () => raidAPI.getRaids(),
    []
  );

  // 임시로 jobStats 제거 (백엔드 구현 필요)
  const jobStats = null;
  const loadingJobs = false;

  const loading = loadingUsers || loadingParties || loadingRaids || loadingJobs;

  if (loading) {
    return <LoadingSpinner size="lg" message="통계를 불러오는 중..." />;
  }

  // 통계 계산
  const activeUsers = users?.filter(u => u.is_active).length || 0;
  const adminUsers = users?.filter(u => u.is_admin).length || 0;
  const activeParties = parties?.filter(p => p.is_active).length || 0;
  const currentRaids = raids?.filter(r => r.is_current).length || 0;

  return (
    <div className="space-y-8">
      {/* 시스템 통계 */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">시스템 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-game">
            <div className="flex items-center justify-between mb-2">
              <UsersIcon className="h-8 w-8 text-blue-400" />
              <span className="text-xs text-gray-500">전체 사용자</span>
            </div>
            <p className="text-3xl font-bold text-white">{users?.length || 0}</p>
            <p className="text-sm text-gray-400 mt-1">
              활성: {activeUsers} / 관리자: {adminUsers}
            </p>
          </div>

          <div className="card-game">
            <div className="flex items-center justify-between mb-2">
              <UserGroupIcon className="h-8 w-8 text-green-400" />
              <span className="text-xs text-gray-500">전체 공대</span>
            </div>
            <p className="text-3xl font-bold text-white">{parties?.length || 0}</p>
            <p className="text-sm text-gray-400 mt-1">
              활성: {activeParties}
            </p>
          </div>

          <div className="card-game">
            <div className="flex items-center justify-between mb-2">
              <TrophyIcon className="h-8 w-8 text-purple-400" />
              <span className="text-xs text-gray-500">레이드</span>
            </div>
            <p className="text-3xl font-bold text-white">{raids?.length || 0}</p>
            <p className="text-sm text-gray-400 mt-1">
              현재 진행중: {currentRaids}
            </p>
          </div>

          <div className="card-game">
            <div className="flex items-center justify-between mb-2">
              <CubeIcon className="h-8 w-8 text-ff14-gold-400" />
              <span className="text-xs text-gray-500">캐릭터 수</span>
            </div>
            <p className="text-3xl font-bold text-white">-</p>
            <p className="text-sm text-gray-400 mt-1">
              통계 준비중
            </p>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">최근 가입 사용자</h2>
        <div className="card-game">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ff14-dark-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">사용자명</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">이메일</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">가입일</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">상태</th>
                </tr>
              </thead>
              <tbody>
                {users?.slice(0, 5).map(user => (
                  <tr key={user.id} className="border-b border-ff14-dark-100 hover:bg-ff14-dark-200">
                    <td className="py-3 px-4">
                      <span className="font-medium">{user.username}</span>
                      {user.is_admin && (
                        <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          관리자
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400">{user.email}</td>
                    <td className="py-3 px-4 text-gray-400">{formatRelativeTime(user.created_at)}</td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="flex items-center text-green-400">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          활성
                        </span>
                      ) : (
                        <span className="flex items-center text-red-400">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          비활성
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// 사용자 관리 탭
const UsersTab: React.FC = () => {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: users, loading, error, reload } = useAsync(
    () => userAPI.getUsers(page * limit, limit),
    [page]
  );

  if (loading) {
    return <LoadingSpinner size="lg" message="사용자 목록을 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={reload} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">전체 사용자</h2>
        <button
          onClick={reload}
          className="flex items-center space-x-2 px-4 py-2 bg-ff14-dark-200 rounded-lg hover:bg-ff14-dark-100 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>새로고침</span>
        </button>
      </div>

      <div className="card-game">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ff14-dark-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">사용자명</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">이메일</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">권한</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">상태</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(user => (
                <tr key={user.id} className="border-b border-ff14-dark-100 hover:bg-ff14-dark-200">
                  <td className="py-3 px-4 text-gray-400">#{user.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium">{user.username}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{user.email}</td>
                  <td className="py-3 px-4">
                    {user.is_admin ? (
                      <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">
                        관리자
                      </span>
                    ) : (
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                        일반
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.is_active ? (
                      <span className="flex items-center text-green-400">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        활성
                      </span>
                    ) : (
                      <span className="flex items-center text-red-400">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-ff14-dark-100">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-ff14-dark-200 rounded-lg hover:bg-ff14-dark-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="text-gray-400">페이지 {page + 1}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!users || users.length < limit}
            className="px-4 py-2 bg-ff14-dark-200 rounded-lg hover:bg-ff14-dark-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

// 레이드 관리 탭
const RaidsTab: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRaidRequest>({
    name: '',
    patch_number: ''
  });

  const { data: raids, loading, error, reload } = useAsync(
    () => raidAPI.getRaids(),
    []
  );

  const { execute: createRaid, loading: creating } = useAsyncCallback(
    async () => {
      await raidAPI.createRaid(createForm);
      setShowCreateForm(false);
      setCreateForm({ name: '', patch_number: '' });
      reload();
    },
    {
      successMessage: '레이드가 생성되었습니다.',
      errorMessage: '레이드 생성에 실패했습니다.'
    }
  );

  const { execute: batchCreateItems, loading: creatingItems } = useAsyncCallback(
    async (raidId: number) => {
      await itemAPI.batchCreateItems(raidId);
      toast.success('아이템이 일괄 생성되었습니다.');
    },
    {
      errorMessage: '아이템 생성에 실패했습니다.'
    }
  );

  if (loading) {
    return <LoadingSpinner size="lg" message="레이드 목록을 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={reload} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">레이드 관리</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-gold flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>새 레이드 추가</span>
        </button>
      </div>

      {/* 레이드 생성 폼 */}
      {showCreateForm && (
        <div className="card-game mb-6 bg-ff14-gold-500/10 border-ff14-gold-500/50">
          <h3 className="text-lg font-semibold mb-4">새 레이드 생성</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                레이드 이름
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="input-game"
                placeholder="예: 아스포델로스"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                패치 번호
              </label>
              <input
                type="text"
                value={createForm.patch_number}
                onChange={(e) => setCreateForm({ ...createForm, patch_number: e.target.value })}
                className="input-game"
                placeholder="예: 6.0"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => createRaid()}
                disabled={creating || !createForm.name || !createForm.patch_number}
                className="btn-gold"
              >
                {creating ? '생성 중...' : '생성'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ name: '', patch_number: '' });
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 레이드 목록 */}
      <div className="space-y-4">
        {raids?.map(raid => (
          <div key={raid.id} className="card-game">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{raid.name}</h3>
                <p className="text-sm text-gray-400">
                  패치 {raid.patch_number} • 생성일: {formatDate(raid.created_at)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {raid.is_current && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm">
                    현재 진행중
                  </span>
                )}
                <button
                  onClick={() => batchCreateItems(raid.id)}
                  disabled={creatingItems}
                  className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                >
                  아이템 일괄 생성
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {raids?.length === 0 && (
        <EmptyState
          icon={TrophyIcon}
          title="등록된 레이드가 없습니다"
          description="새 레이드를 추가해주세요"
        />
      )}
    </div>
  );
};

// 공대 관리 탭
const PartiesTab: React.FC = () => {
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);

  const { data: parties, loading, error, reload } = useAsync(
    () => partyAPI.getParties({ is_active: filterActive }),
    [filterActive]
  );

  if (loading) {
    return <LoadingSpinner size="lg" message="공대 목록을 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={reload} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">전체 공대</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value;
              setFilterActive(
                value === 'all' ? undefined : value === 'active'
              );
            }}
            className="input-game"
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <button
            onClick={reload}
            className="flex items-center space-x-2 px-4 py-2 bg-ff14-dark-200 rounded-lg hover:bg-ff14-dark-100 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parties?.map(party => (
          <div key={party.id} className="card-game">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{party.name}</h3>
              {party.is_active ? (
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                  활성
                </span>
              ) : (
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">
                  비활성
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-400">
                레이드: <span className="text-white">{party.raid?.name || 'N/A'}</span>
              </p>
              <p className="text-gray-400">
                분배 방식: <span className="text-white">
                  {party.distribution_method === 'priority' ? '우선순위' : '먹고빠지기'}
                </span>
              </p>
              <p className="text-gray-400">
                멤버: <span className="text-white">{party.member_count || 0}/8명</span>
              </p>
              <p className="text-gray-400">
                생성일: <span className="text-white">{formatRelativeTime(party.created_at)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {parties?.length === 0 && (
        <EmptyState
          icon={UserGroupIcon}
          title="공대가 없습니다"
          description={filterActive ? "활성화된 공대가 없습니다" : "비활성화된 공대가 없습니다"}
        />
      )}
    </div>
  );
};

// 아이템 관리 탭
const ItemsTab: React.FC = () => {
  const [selectedRaid, setSelectedRaid] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 레이드 목록 조회
  const { data: raids } = useAsync(() => raidAPI.getRaids(), []);
  
  // 아이템 목록 조회
  const { 
    data: items, 
    loading, 
    error, 
    reload 
  } = useAsync(
    async () => {
      if (!selectedRaid) return [];
      const params: any = { raid_id: selectedRaid };
      if (selectedSlot) params.slot = selectedSlot;
      if (selectedType) params.item_type = selectedType;
      return itemAPI.getItems(params);
    },
    [selectedRaid, selectedSlot, selectedType]
  );

  // 아이템 슬롯 옵션
  const slotOptions = [
    { value: '', label: '전체 부위' },
    { value: 'weapon', label: '무기' },
    { value: 'head', label: '머리' },
    { value: 'body', label: '상의' },
    { value: 'hands', label: '장갑' },
    { value: 'legs', label: '하의' },
    { value: 'feet', label: '신발' },
    { value: 'earrings', label: '귀걸이' },
    { value: 'necklace', label: '목걸이' },
    { value: 'bracelet', label: '팔찌' },
    { value: 'ring', label: '반지' },
  ];

  // 아이템 타입 옵션
  const typeOptions = [
    { value: '', label: '전체 종류' },
    { value: 'normal_raid', label: '일반 레이드' },
    { value: 'savage_raid', label: '영웅 레이드' },
    { value: 'tome', label: '석판' },
    { value: 'augmented_tome', label: '보강 석판' },
    { value: 'crafted', label: '제작' },
    { value: 'extreme', label: '극만신' },
  ];

  // 아이템 타입별 색상
  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'normal_raid': return 'text-blue-400';
      case 'savage_raid': return 'text-purple-400';
      case 'tome': return 'text-green-400';
      case 'augmented_tome': return 'text-ff14-gold-400';
      case 'crafted': return 'text-gray-400';
      case 'extreme': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">아이템 관리</h2>
        
        {/* 필터 */}
        <div className="card-game mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                레이드 선택
              </label>
              <select
                value={selectedRaid || ''}
                onChange={(e) => setSelectedRaid(e.target.value ? Number(e.target.value) : null)}
                className="input-game"
              >
                <option value="">레이드를 선택하세요</option>
                {raids?.map(raid => (
                  <option key={raid.id} value={raid.id}>
                    {raid.name} (패치 {raid.patch_number})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                부위
              </label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="input-game"
                disabled={!selectedRaid}
              >
                {slotOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                종류
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-game"
                disabled={!selectedRaid}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 아이템 목록 */}
      {selectedRaid ? (
        loading ? (
          <LoadingSpinner size="lg" message="아이템을 불러오는 중..." />
        ) : error ? (
          <ErrorMessage message={error.message} onRetry={reload} />
        ) : items && items.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">
                총 {items.length}개의 아이템
              </p>
              <button
                onClick={reload}
                className="flex items-center space-x-2 px-4 py-2 bg-ff14-dark-200 text-white rounded-lg hover:bg-ff14-dark-100 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>새로고침</span>
              </button>
            </div>
            
            <div className="card-game">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ff14-dark-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">이름 (한국어)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">이름 (영어)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">부위</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">종류</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">아이템 레벨</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-ff14-dark-100 hover:bg-ff14-dark-200">
                        <td className="py-3 px-4 text-gray-400">#{item.id}</td>
                        <td className="py-3 px-4">{item.name_kr}</td>
                        <td className="py-3 px-4 text-gray-400">{item.name_en}</td>
                        <td className="py-3 px-4">
                          {slotOptions.find(opt => opt.value === item.slot)?.label}
                        </td>
                        <td className="py-3 px-4">
                          <span className={getItemTypeColor(item.item_type)}>
                            {typeOptions.find(opt => opt.value === item.item_type)?.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">{item.item_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CubeIcon}
            title="아이템이 없습니다"
            description="선택한 조건에 맞는 아이템이 없습니다"
          />
        )
      ) : (
        <EmptyState
          icon={CubeIcon}
          title="레이드를 선택하세요"
          description="아이템을 조회할 레이드를 먼저 선택해주세요"
        />
      )}
    </div>
  );
};

export default AdminPage;