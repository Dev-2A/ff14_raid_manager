import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import Layout from '../components/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { partyAPI, jobAPI, distributionAPI } from '../services/api';
import { formatDate, formatDateTime } from '../utils/format';
import { calculatePartyComposition } from '../utils/party';
import { ROLE_NAMES, ROLE_COLORS, SLOT_NAMES } from '../utils/constants';
import { 
  UserGroupIcon,
  ChevronLeftIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  HeartIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { 
  Party, 
  PartyMember, 
  Job, 
  Distribution,
  PriorityCalculation,
  Schedule,
  DistributionMethodEnum,
  RoleEnum 
} from '../types/api.types';
import toast from 'react-hot-toast';

const PartyDetailPage: React.FC = () => {
  const { partyId } = useParams<{ partyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'members' | 'distribution' | 'priority' | 'schedule'>('members');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number>(0);
  const [isMember, setIsMember] = useState<boolean>(false);
  
  // 데이터 로드
  const { data: party, loading: loadingParty, error: partyError, reload: reloadParty } = useAsync(
    () => partyAPI.getParties({ my_parties_only: false }).then(
      parties => parties.find(p => p.id === parseInt(partyId!))
    ),
    [partyId]
  );
  
  // 공대원 목록 - 에러 처리 개선
  const { data: members, loading: loadingMembers, error: membersError, reload: reloadMembers } = useAsync(
    async () => {
      if (!partyId) return [];
      try {
        const result = await partyAPI.getPartyMembers(parseInt(partyId));
        return result;
      } catch (error: any) {
        // 403 에러인 경우 빈 배열 반환 (공대원이 아닌 경우)
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    [partyId]
  );
  
  // 가입 가능한 직업 목록
  const { data: availableJobs, loading: loadingJobs } = useAsync(
    () => partyId ? partyAPI.getAvailableJobs(parseInt(partyId)) : Promise.resolve(null),
    [partyId, members]
  );
  
  // 사용자의 공대원 여부 확인
  useEffect(() => {
    if (members && user) {
      const myMember = members.find(m => m.user.id === user.id);
      setIsMember(!!myMember);
    } else {
      setIsMember(false);
    }
  }, [members, user]);
  
  // 분배 기록 - 공대원만 조회
  const { data: distributions, loading: loadingDistributions } = useAsync(
    async () => {
      if (!partyId || !isMember) return [];
      try {
        return await distributionAPI.getDistributions(parseInt(partyId));
      } catch (error: any) {
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    [partyId, isMember]
  );
  
  // 우선순위 - 공대원만 조회
  const { data: priorityData, loading: loadingPriority } = useAsync(
    async () => {
      if (!partyId || !party?.distribution_method || party.distribution_method !== DistributionMethodEnum.PRIORITY || !isMember) {
        return null;
      }
      try {
        return await distributionAPI.getPriorityCalculation(parseInt(partyId));
      } catch (error: any) {
        if (error.response?.status === 403) {
          return null;
        }
        throw error;
      }
    },
    [partyId, party?.distribution_method, isMember]
  );
  
  // 일정 - 공대원만 조회
  const { data: schedules, loading: loadingSchedules } = useAsync(
    async () => {
      if (!partyId || !isMember) return [];
      try {
        return await distributionAPI.getSchedule(parseInt(partyId));
      } catch (error: any) {
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    [partyId, isMember]
  );
  
  const loading = loadingParty || loadingMembers || loadingJobs;
  
  // 현재 사용자의 공대원 정보
  const myMember = members?.find(m => m.user.id === user?.id);
  const isLeader = party?.leader_id === user?.id;
  
  // 공대 구성
  const composition = members ? calculatePartyComposition(members) : null;
  
  // 공대 가입
  const { execute: handleJoinParty, loading: joining } = useAsyncCallback(
    async () => {
      if (!selectedJobId || !partyId) return;
      
      const characterName = prompt('캐릭터 이름을 입력하세요:');
      if (!characterName || characterName.trim().length < 2) {
        toast.error('캐릭터 이름은 2자 이상이어야 합니다.');
        return;
      }
      
      await partyAPI.joinParty(parseInt(partyId), {
        job_id: selectedJobId,
        character_name: characterName.trim()
      });
      
      setShowJoinModal(false);
      reloadMembers();
      reloadParty();
    },
    {
      successMessage: '공대에 가입했습니다!',
      onError: (error) => {
        console.error('공대 가입 실패:', error);
      }
    }
  );
  
  // 역할별 아이콘
  const roleIcons: Record<string, React.ElementType> = {
    tank: ShieldCheckIcon,
    healer: HeartIcon,
    melee_dps: BoltIcon,
    ranged_dps: BoltIcon,
    magic_dps: BoltIcon
  };
  
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" message="공대 정보를 불러오는 중..." />
      </Layout>
    );
  }
  
  if (!party) {
    return (
      <Layout>
        <ErrorMessage 
          title="공대를 찾을 수 없습니다" 
          message="요청하신 공대가 존재하지 않거나 삭제되었습니다." 
        />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <Link 
            to="/parties" 
            className="inline-flex items-center text-ff14-blue-400 hover:text-ff14-blue-300 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            공대 목록으로
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{party.name}</h1>
              <p className="text-gray-400">
                {party.raid?.name} • {party.distribution_method === DistributionMethodEnum.PRIORITY ? '우선순위' : '먹고빠지기'} 분배
              </p>
              <p className="text-sm text-gray-500 mt-1">
                생성일: {formatDate(party.created_at)}
              </p>
            </div>
            
            <div className="flex gap-2">
              {!isMember && composition && composition.tanks + composition.healers + composition.dps < 8 && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn-gold flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>공대 가입</span>
                </button>
              )}
              
              {isMember && !isLeader && (
                <button
                  className="btn-game bg-red-600 hover:bg-red-500 flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>공대 탈퇴</span>
                </button>
              )}
              
              {isLeader && (
                <button
                  className="btn-game flex items-center space-x-2"
                >
                  <CogIcon className="h-5 w-5" />
                  <span>공대 관리</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 공대 구성 요약 */}
        {composition && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card-game flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">탱커</p>
                  <p className="text-xl font-bold text-white">{composition.tanks}/2</p>
                </div>
              </div>
            </div>
            
            <div className="card-game flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <HeartIcon className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">힐러</p>
                  <p className="text-xl font-bold text-white">{composition.healers}/2</p>
                </div>
              </div>
            </div>
            
            <div className="card-game flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BoltIcon className="h-8 w-8 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">딜러</p>
                  <p className="text-xl font-bold text-white">{composition.dps}/4</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 탭 메뉴 */}
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'members'
                  ? 'border-ff14-blue-500 text-ff14-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              공대원 ({members?.length || 0})
            </button>
            
            {isMember && (
              <>
                <button
                  onClick={() => setActiveTab('distribution')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'distribution'
                      ? 'border-ff14-blue-500 text-ff14-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <TrophyIcon className="h-5 w-5 inline mr-2" />
                  분배 기록
                </button>
                
                {party.distribution_method === DistributionMethodEnum.PRIORITY && (
                  <button
                    onClick={() => setActiveTab('priority')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'priority'
                        ? 'border-ff14-blue-500 text-ff14-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <ChartBarIcon className="h-5 w-5 inline mr-2" />
                    우선순위
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'schedule'
                      ? 'border-ff14-blue-500 text-ff14-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
                  일정
                </button>
              </>
            )}
          </nav>
        </div>
        
        {/* 탭 컨텐츠 */}
        <div>
          {/* 공대원 탭 */}
          {activeTab === 'members' && (
            <div>
              {!isMember && members?.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-500 text-sm">
                    공대원만 멤버 목록을 볼 수 있습니다. 공대에 가입하여 전체 멤버를 확인하세요.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members?.map(member => {
                  return (
                    <div key={member.id} className="card-game">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${ROLE_COLORS[member.job.role]}`}>
                            <img 
                              src={`/${member.job.name_kr}.png`} 
                              alt={member.job.name_kr}
                              className="h-8 w-8"
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {member.character_name}
                              {member.user.id === party.leader_id && (
                                <span className="ml-2 text-xs text-ff14-gold-500">(공대장)</span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {member.job.name_kr} • {member.user.username}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              가입일: {formatDate(member.joined_at)}
                            </p>
                          </div>
                        </div>
                        
                        {isLeader && member.user.id !== user?.id && (
                          <button className="text-red-400 hover:text-red-300 text-sm">
                            추방
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* 빈 슬롯 표시 */}
                {composition && Array.from({ length: 8 - (composition.tanks + composition.healers + composition.dps) }).map((_, index) => (
                  <div key={`empty-${index}`} className="card-game opacity-50 border-dashed">
                    <div className="flex items-center justify-center h-20">
                      <p className="text-gray-500">빈 자리</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 분배 기록 탭 */}
          {activeTab === 'distribution' && isMember && (
            <div>
              {loadingDistributions ? (
                <LoadingSpinner message="분배 기록을 불러오는 중..." />
              ) : distributions && distributions.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {distributions.map(dist => (
                      <div key={dist.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-ff14-gold-500">
                            <TrophyIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {dist.party_member.character_name}님이 {SLOT_NAMES[dist.item.slot]} 획득
                            </p>
                            <p className="text-sm text-gray-400">
                              {dist.item.name_kr} • {dist.week_number}주차
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(dist.distributed_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  아직 분배 기록이 없습니다
                </div>
              )}
            </div>
          )}
          
          {/* 우선순위 탭 */}
          {activeTab === 'priority' && isMember && party.distribution_method === DistributionMethodEnum.PRIORITY && (
            <div>
              {loadingPriority ? (
                <LoadingSpinner message="우선순위를 계산하는 중..." />
              ) : priorityData ? (
                <div className="space-y-4">
                  <div className="bg-ff14-blue-500/10 border border-ff14-blue-700/50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-ff14-blue-400 mb-2">계산 방식</h3>
                    <p className="text-sm text-gray-300">{priorityData.calculation_method}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {priorityData.member_priorities.map((priority, index) => (
                      <div key={priority.party_member_id} className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`text-2xl font-bold ${
                              index === 0 ? 'text-ff14-gold-500' : 
                              index === 1 ? 'text-gray-300' : 
                              index === 2 ? 'text-orange-600' : 'text-gray-500'
                            }`}>
                              #{priority.priority}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {priority.character_name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {priority.job} • 필요 재화: {priority.total_currency_needed.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">
                              획득: {priority.items_received}개
                            </p>
                            <p className="text-xs text-gray-500">
                              필요: {priority.needed_items_count}개
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  우선순위 데이터가 없습니다
                </div>
              )}
            </div>
          )}
          
          {/* 일정 탭 */}
          {activeTab === 'schedule' && isMember && (
            <div>
              {loadingSchedules ? (
                <LoadingSpinner message="일정을 불러오는 중..." />
              ) : schedules && schedules.length > 0 ? (
                <div className="space-y-4">
                  {schedules.map(schedule => (
                    <div key={schedule.id} className="card-game">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <CalendarDaysIcon className="h-8 w-8 text-ff14-blue-400" />
                          <div>
                            <p className="font-medium text-white">
                              {formatDate(schedule.scheduled_date, 'MM월 DD일 (ddd)')}
                            </p>
                            <p className="text-sm text-gray-400">
                              {formatDateTime(schedule.scheduled_date).split(' ')[1]} • {schedule.notes}
                            </p>
                          </div>
                        </div>
                        {new Date(schedule.scheduled_date) > new Date() && (
                          <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">
                            예정
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  등록된 일정이 없습니다
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 공대 가입 모달 */}
        {showJoinModal && availableJobs && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">공대 가입</h3>
              
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-4">
                  가입할 직업을 선택하세요:
                </p>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableJobs.available_jobs.map(job => {
                    return (
                      <label key={job.id} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="job"
                          value={job.id}
                          checked={selectedJobId === job.id}
                          onChange={(e) => setSelectedJobId(parseInt(e.target.value))}
                          className="w-4 h-4 text-ff14-blue-600 bg-gray-700 border-gray-600"
                        />
                        <div className="ml-3 flex items-center space-x-3">
                          <div className={`p-2 rounded ${ROLE_COLORS[job.role]}`}>
                            <img 
                              src={`/${job.name_kr}.png`} 
                              alt={job.name_kr}
                              className="h-6 w-6"
                            />
                          </div>
                          <span className="text-white group-hover:text-ff14-blue-400">
                            {job.name_kr}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleJoinParty}
                  disabled={!selectedJobId || joining}
                  className="flex-1 btn-gold disabled:opacity-50"
                >
                  {joining ? '가입 중...' : '가입하기'}
                </button>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartyDetailPage;