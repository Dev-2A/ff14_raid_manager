import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import Layout from '../components/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { partyAPI, userAPI } from '../services/api';
import { formatDate, formatRelativeTime } from '../utils/format';
import { calculatePartyComposition, getCompositionStatus } from '../utils/party';
import { ROLE_NAMES, ROLE_COLORS } from '../utils/constants';
import { 
  UserGroupIcon,
  PlusCircleIcon,
  UsersIcon,
  ShieldCheckIcon,
  HeartIcon,
  BoltIcon,
  ClockIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Party, PartyMember, DistributionMethodEnum } from '../types/api.types';

const PartiesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 필터 상태
  const [filter, setFilter] = useState<'all' | 'mine' | 'joinable'>('all');
  const [showInactiveParties, setShowInactiveParties] = useState(false);
  
  // 내가 속한 공대 ID 목록
  const [myPartyIds, setMyPartyIds] = useState<number[]>([]);
  
  // 공대 목록 로드
  const { data: parties, loading, reload } = useAsync(
    () => partyAPI.getParties({ is_active: !showInactiveParties }),
    [showInactiveParties]
  );
  
  // 내 공대 목록 로드
  useEffect(() => {
    if (user) {
      userAPI.getUserParties(user.id, true)
        .then(myParties => {
          setMyPartyIds(myParties.map(p => p.id));
        })
        .catch(console.error);
    }
  }, [user]);
  
  // 공대원 목록 로드 (각 공대별)
  const [partyMembers, setPartyMembers] = useState<Record<number, PartyMember[]>>({});
  
  useEffect(() => {
    if (parties) {
      parties.forEach(party => {
        partyAPI.getPartyMembers(party.id)
          .then(members => {
            setPartyMembers(prev => ({ ...prev, [party.id]: members }));
          })
          .catch(console.error);
      });
    }
  }, [parties]);
  
  // 필터링된 공대 목록
  const filteredParties = parties?.filter(party => {
    switch (filter) {
      case 'mine':
        return myPartyIds.includes(party.id);
      case 'joinable':
        const members = partyMembers[party.id] || [];
        const composition = calculatePartyComposition(members);
        const totalMembers = composition.tanks + composition.healers + composition.dps;
        return totalMembers < 8 && !myPartyIds.includes(party.id);
      default:
        return true;
    }
  }) || [];
  
  // 분배 방식 표시
  const getDistributionMethodText = (method: DistributionMethodEnum) => {
    return method === DistributionMethodEnum.PRIORITY ? '우선순위' : '먹고빠지기';
  };
  
  // 역할별 아이콘
  const roleIcons = {
    tank: ShieldCheckIcon,
    healer: HeartIcon,
    dps: BoltIcon
  };
  
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" message="공대 목록을 불러오는 중..." />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">공대 목록</h1>
            <p className="text-gray-400">활동중인 공대를 찾아 가입해보세요</p>
          </div>
          <Link to="/parties/create" className="btn-gold flex items-center space-x-2">
            <PlusCircleIcon className="h-5 w-5" />
            <span>새 공대 만들기</span>
          </Link>
        </div>
        
        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-ff14-dark-200 rounded-lg border border-ff14-blue-700/30">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300 font-medium">필터:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-ff14-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              전체 공대 ({parties?.length || 0})
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'mine'
                  ? 'bg-ff14-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              내 공대 ({myPartyIds.length})
            </button>
            <button
              onClick={() => setFilter('joinable')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'joinable'
                  ? 'bg-ff14-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              가입 가능
            </button>
          </div>
          
          <div className="ml-auto">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactiveParties}
                onChange={(e) => setShowInactiveParties(e.target.checked)}
                className="w-4 h-4 text-ff14-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-ff14-blue-500"
              />
              <span className="text-gray-300 text-sm">비활성 공대 포함</span>
            </label>
          </div>
        </div>
        
        {/* 공대 목록 */}
        {filteredParties.length === 0 ? (
          <EmptyState
            icon={UserGroupIcon}
            title={
              filter === 'mine' 
                ? "가입한 공대가 없습니다" 
                : filter === 'joinable'
                ? "가입 가능한 공대가 없습니다"
                : "활동중인 공대가 없습니다"
            }
            description={
              filter === 'mine'
                ? "공대에 가입하거나 새로운 공대를 만들어보세요"
                : "새로운 공대를 만들어보세요"
            }
            action={
              filter !== 'all' ? {
                label: "전체 공대 보기",
                onClick: () => setFilter('all')
              } : {
                label: "새 공대 만들기",
                onClick: () => navigate('/parties/create')
              }
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredParties.map(party => {
              const members = partyMembers[party.id] || [];
              const composition = calculatePartyComposition(members);
              const totalMembers = composition.tanks + composition.healers + composition.dps;
              const isFull = totalMembers >= 8;
              const isMyParty = myPartyIds.includes(party.id);
              const compositionStatus = getCompositionStatus(composition);
              
              return (
                <div
                  key={party.id}
                  className={`card-game hover:border-ff14-blue-400 transition-all duration-300 ${
                    !party.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* 공대 헤더 */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white">
                          {party.name}
                        </h3>
                        {isMyParty && (
                          <span className="px-2 py-1 bg-ff14-blue-600/20 text-ff14-blue-400 text-xs rounded-full font-medium">
                            내 공대
                          </span>
                        )}
                        {!party.is_active && (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {party.raid?.name} • {getDistributionMethodText(party.distribution_method)}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      isFull ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {isFull ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                      <span className="font-semibold">{totalMembers}/8</span>
                    </div>
                  </div>
                  
                  {/* 공대 구성 */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2">
                      <ShieldCheckIcon className={`h-5 w-5 ${composition.tanks >= 2 ? 'text-blue-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${composition.tanks >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                        탱커 {composition.tanks}/2
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2">
                      <HeartIcon className={`h-5 w-5 ${composition.healers >= 2 ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${composition.healers >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                        힐러 {composition.healers}/2
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2">
                      <BoltIcon className={`h-5 w-5 ${composition.dps >= 4 ? 'text-red-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${composition.dps >= 4 ? 'text-red-400' : 'text-gray-500'}`}>
                        딜러 {composition.dps}/4
                      </span>
                    </div>
                  </div>
                  
                  {/* 멤버 프리뷰 - 직업 이미지 사용 */}
                  {members.length > 0 && (
                    <div className="mb-4">
                      <div className="flex -space-x-2">
                        {members.slice(0, 6).map((member, idx) => (
                          <div 
                            key={idx}
                            className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center overflow-hidden hover:z-10 hover:scale-110 transition-transform"
                            title={`${member.character_name} (${member.job.name_kr})`}
                          >
                            <img 
                              src={`/${member.job.name_kr}.png`} 
                              alt={member.job.name_kr}
                              className="w-7 h-7"
                            />
                          </div>
                        ))}
                        {members.length > 6 && (
                          <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-medium">+{members.length - 6}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 상태 메시지 */}
                  <p className="text-sm text-gray-400 mb-4">
                    {compositionStatus}
                  </p>
                  
                  {/* 하단 정보 */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>{formatRelativeTime(party.created_at)}</span>
                    </div>
                    <Link
                      to={`/parties/${party.id}`}
                      className="btn-game text-sm"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartiesPage;