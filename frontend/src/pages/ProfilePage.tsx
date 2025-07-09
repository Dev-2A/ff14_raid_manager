// frontend/src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import Layout from '../components/Layout';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { userAPI, authAPI, itemAPI } from '../services/api';
import { UserCharacter, EquipmentSet, MemberCurrencyRequirements, ChangePasswordRequest, CurrencyRequirements } from '../types/api.types';
import { 
  UserIcon, 
  KeyIcon, 
  CubeIcon,
  SparklesIcon,
  CalculatorIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { formatDate, formatRelativeTime } from '../utils/format';

// 탭 타입
type TabType = 'info' | 'characters' | 'equipment' | 'currency';

interface TabProps {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const tabs: TabProps[] = [
  { id: 'info', label: '내 정보', icon: UserIcon },
  { id: 'characters', label: '내 캐릭터', icon: CubeIcon },
  { id: 'equipment', label: '장비 관리', icon: SparklesIcon },
  { id: 'currency', label: '재화 계산', icon: CalculatorIcon },
];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [selectedCharacter, setSelectedCharacter] = useState<UserCharacter | null>(null);
  const [selectedSetType, setSelectedSetType] = useState<'current' | 'start' | 'final'>('current');

  // 사용자 캐릭터 목록 조회
  const { 
    data: characters, 
    loading: charactersLoading, 
    error: charactersError, 
    reload: reloadCharacters 
  } = useAsync(
    () => userAPI.getUserCharacters(user!.id),
    [user?.id]
  );

  // 선택된 캐릭터의 장비 세트 조회
  const { 
    data: equipmentSet, 
    loading: equipmentLoading, 
    error: equipmentError,
    reload: reloadEquipment
  } = useAsync(
    async () => {
      if (!selectedCharacter) return null;
      return itemAPI.getMemberEquipment(
        selectedCharacter.party_member_id, 
        user!.id, 
        selectedSetType
      );
    },
    [selectedCharacter?.party_member_id, selectedSetType]
  );

  // 선택된 캐릭터의 재화 요구량 조회
  const { 
    data: currencyRequirements, 
    loading: currencyLoading, 
    error: currencyError 
  } = useAsync(
    async () => {
      if (!selectedCharacter) return null;
      return itemAPI.getCurrencyRequirements(
        selectedCharacter.party_member_id, 
        user!.id
      );
    },
    [selectedCharacter?.party_member_id]
  );

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <UserInfoTab />;
      case 'characters':
        return (
          <CharactersTab 
            characters={characters}
            loading={charactersLoading}
            error={charactersError}
            onReload={reloadCharacters}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
          />
        );
      case 'equipment':
        return (
          <EquipmentTab 
            selectedCharacter={selectedCharacter}
            equipmentSet={equipmentSet}
            loading={equipmentLoading}
            error={equipmentError}
            selectedSetType={selectedSetType}
            onSetTypeChange={setSelectedSetType}
            onReload={reloadEquipment}
          />
        );
      case 'currency':
        return (
          <CurrencyTab 
            selectedCharacter={selectedCharacter}
            currencyRequirements={currencyRequirements}
            loading={currencyLoading}
            error={currencyError}
          />
        );
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <Layout>
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="title-game text-4xl mb-2">내 프로필</h1>
        <p className="text-gray-400">계정 정보와 캐릭터를 관리하세요</p>
      </div>

      {/* 사용자 정보 카드 */}
      <div className="card-game mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-ff14-gold-500/20 rounded-full p-4">
            <UserIcon className="h-12 w-12 text-ff14-gold-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-ff14-gold-500">{user.username}</h2>
            <p className="text-gray-400">{user.email}</p>
            <p className="text-sm text-gray-500">
              가입일: {formatDate(user.created_at)} ({formatRelativeTime(user.created_at)})
            </p>
          </div>
          {user.is_admin && (
            <div className="bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/50">
              <span className="text-purple-400 font-semibold">관리자</span>
            </div>
          )}
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
                    ? 'border-ff14-gold-500 text-ff14-gold-500'
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

// 내 정보 탭 컴포넌트
const UserInfoTab: React.FC = () => {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { execute: changePassword, loading } = useAsyncCallback(
    async () => {
      if (passwordForm.new_password !== confirmPassword) {
        throw new Error('새 비밀번호가 일치하지 않습니다.');
      }
      
      await authAPI.changePassword(passwordForm);
      setShowChangePassword(false);
      setPasswordForm({ current_password: '', new_password: '' });
      setConfirmPassword('');
    },
    {
      successMessage: '비밀번호가 변경되었습니다.',
      errorMessage: '비밀번호 변경에 실패했습니다.'
    }
  );

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <div className="card-game">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <KeyIcon className="h-6 w-6 mr-2 text-ff14-blue-400" />
          계정 정보
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">사용자명</label>
            <p className="text-lg">{user.username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">이메일</label>
            <p className="text-lg">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">계정 상태</label>
            <p className="text-lg">
              {user.is_active ? (
                <span className="text-green-400">활성</span>
              ) : (
                <span className="text-red-400">비활성</span>
              )}
            </p>
          </div>

          {!showChangePassword ? (
            <button
              onClick={() => setShowChangePassword(true)}
              className="btn-game mt-6"
            >
              비밀번호 변경
            </button>
          ) : (
            <div className="mt-6 space-y-4 p-4 bg-ff14-dark-200 rounded-lg border border-ff14-dark-100">
              <h4 className="text-lg font-semibold mb-4">비밀번호 변경</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      current_password: e.target.value
                    })}
                    className="input-game pr-10"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value
                    })}
                    className="input-game pr-10"
                    placeholder="새 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-game pr-10"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => changePassword()}
                  disabled={loading || !passwordForm.current_password || !passwordForm.new_password || !confirmPassword}
                  className="btn-game"
                >
                  {loading ? '변경 중...' : '변경하기'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({ current_password: '', new_password: '' });
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 내 캐릭터 탭 컴포넌트
interface CharactersTabProps {
  characters: UserCharacter[] | null;
  loading: boolean;
  error: Error | null;
  onReload: () => void;
  selectedCharacter: UserCharacter | null;
  onSelectCharacter: (character: UserCharacter) => void;
}

const CharactersTab: React.FC<CharactersTabProps> = ({
  characters,
  loading,
  error,
  onReload,
  selectedCharacter,
  onSelectCharacter
}) => {
  if (loading) {
    return <LoadingSpinner size="lg" message="캐릭터 목록을 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={onReload} />;
  }

  if (!characters || characters.length === 0) {
    return (
      <EmptyState
        icon={CubeIcon}
        title="등록된 캐릭터가 없습니다"
        description="공대에 가입하여 캐릭터를 생성하세요"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {characters.map((character) => (
        <div
          key={character.party_member_id}
          onClick={() => onSelectCharacter(character)}
          className={`
            card-game cursor-pointer transition-all duration-200
            ${selectedCharacter?.party_member_id === character.party_member_id
              ? 'ring-2 ring-ff14-gold-500 bg-ff14-gold-500/10'
              : 'hover:bg-ff14-dark-200'
            }
          `}
        >
          <div className="flex items-start space-x-4">
            <img
              src={`/${character.job_name}.png`}
              alt={character.job_name}
              className="h-16 w-16 rounded-lg bg-ff14-dark-200 p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-ff14-gold-400">
                {character.character_name}
              </h3>
              <p className="text-sm text-gray-400">{character.job_name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {character.party_name}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                가입일: {formatRelativeTime(character.joined_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 장비 관리 탭 컴포넌트
interface EquipmentTabProps {
  selectedCharacter: UserCharacter | null;
  equipmentSet: EquipmentSet | null;
  loading: boolean;
  error: Error | null;
  selectedSetType: 'current' | 'start' | 'final';
  onSetTypeChange: (type: 'current' | 'start' | 'final') => void;
  onReload: () => void;
}

const EquipmentTab: React.FC<EquipmentTabProps> = ({
  selectedCharacter,
  equipmentSet,
  loading,
  error,
  selectedSetType,
  onSetTypeChange,
  onReload
}) => {
  if (!selectedCharacter) {
    return (
      <EmptyState
        icon={SparklesIcon}
        title="캐릭터를 선택하세요"
        description="장비를 관리할 캐릭터를 먼저 선택해주세요"
      />
    );
  }

  const setTypeLabels = {
    current: '현재 장비',
    start: '출발 세트',
    final: '최종 세트'
  };

  return (
    <div>
      {/* 캐릭터 정보 */}
      <div className="card-game mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={`/${selectedCharacter.job_name}.png`}
              alt={selectedCharacter.job_name}
              className="h-12 w-12 rounded-lg bg-ff14-dark-200 p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h3 className="text-lg font-semibold">{selectedCharacter.character_name}</h3>
              <p className="text-sm text-gray-400">
                {selectedCharacter.job_name} • {selectedCharacter.party_name}
              </p>
            </div>
          </div>

          {/* 세트 타입 선택 */}
          <div className="flex space-x-2">
            {(['current', 'start', 'final'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onSetTypeChange(type)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${selectedSetType === type
                    ? 'bg-ff14-gold-500 text-black'
                    : 'bg-ff14-dark-200 text-gray-300 hover:bg-ff14-dark-100'
                  }
                `}
              >
                {setTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 장비 세트 */}
      {loading ? (
        <LoadingSpinner size="lg" message="장비 정보를 불러오는 중..." />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={onReload} />
      ) : equipmentSet ? (
        <div>
          {/* 달성률 표시 */}
          <div className="card-game mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-ff14-blue-400" />
                달성률
              </h4>
              <span className="text-2xl font-bold text-ff14-gold-500">
                {equipmentSet.completion_rate}%
              </span>
            </div>
            <div className="w-full bg-ff14-dark-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ff14-blue-500 to-ff14-gold-500 transition-all duration-500"
                style={{ width: `${equipmentSet.completion_rate}%` }}
              />
            </div>
          </div>

          {/* 장비 목록 */}
          <div className="card-game">
            <h4 className="text-lg font-semibold mb-4">장비 목록</h4>
            <div className="text-gray-400 text-center py-8">
              장비 편집 기능은 준비 중입니다
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={SparklesIcon}
          title="장비 정보가 없습니다"
          description="장비 세트를 설정해주세요"
        />
      )}
    </div>
  );
};

export default ProfilePage;

// 재화 계산 탭 컴포넌트
interface CurrencyTabProps {
  selectedCharacter: UserCharacter | null;
  currencyRequirements: MemberCurrencyRequirements | null;
  loading: boolean;
  error: Error | null;
}

const CurrencyTab: React.FC<CurrencyTabProps> = ({
  selectedCharacter,
  currencyRequirements,
  loading,
  error
}) => {
  if (!selectedCharacter) {
    return (
      <EmptyState
        icon={CalculatorIcon}
        title="캐릭터를 선택하세요"
        description="재화를 계산할 캐릭터를 먼저 선택해주세요"
      />
    );
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="재화 정보를 계산하는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  if (!currencyRequirements) {
    return (
      <EmptyState
        icon={CalculatorIcon}
        title="재화 정보가 없습니다"
        description="장비 세트를 먼저 설정해주세요"
      />
    );
  }

  const renderCurrencyCard = (
    title: string,
    requirements: CurrencyRequirements,
    colorClass: string
  ) => (
    <div className="card-game">
      <h4 className={`text-lg font-semibold mb-4 ${colorClass}`}>{title}</h4>
      
      <div className="space-y-4">
        {/* 석판 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">석판</span>
          <span className="text-xl font-bold">{requirements.tome_stones}</span>
        </div>

        {/* 레이드 토큰 */}
        {Object.keys(requirements.raid_tokens).length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">레이드 토큰</p>
            <div className="space-y-2 pl-4">
              {Object.entries(requirements.raid_tokens).map(([floor, count]) => (
                <div key={floor} className="flex items-center justify-between">
                  <span className="text-gray-400">{floor}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보강 재료 */}
        {Object.keys(requirements.upgrade_materials).length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">보강 재료</p>
            <div className="space-y-2 pl-4">
              {Object.entries(requirements.upgrade_materials).map(([material, count]) => (
                <div key={material} className="flex items-center justify-between">
                  <span className="text-gray-400">{material}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* 캐릭터 정보 */}
      <div className="card-game mb-6">
        <div className="flex items-center space-x-3">
          <img
            src={`/${selectedCharacter.job_name}.png`}
            alt={selectedCharacter.job_name}
            className="h-12 w-12 rounded-lg bg-ff14-dark-200 p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <h3 className="text-lg font-semibold">{selectedCharacter.character_name}</h3>
            <p className="text-sm text-gray-400">
              {selectedCharacter.job_name} • {selectedCharacter.party_name}
            </p>
          </div>
        </div>
      </div>

      {/* 재화 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCurrencyCard(
          '출발 → 최종 세트',
          currencyRequirements.currency_requirements.start_to_final,
          'text-green-400'
        )}
        {renderCurrencyCard(
          '현재 → 최종 세트',
          currencyRequirements.currency_requirements.current_to_final,
          'text-ff14-gold-400'
        )}
      </div>
    </div>
  );
};