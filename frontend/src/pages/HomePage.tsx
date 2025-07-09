import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { partyAPI, userAPI, raidAPI } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { formatRelativeTime } from '../utils/format';
import { ROLE_COLORS } from '../utils/constants';
import { 
  UserGroupIcon, 
  UsersIcon, 
  TrophyIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { UserCharacter } from '../types/api.types';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  // 데이터 로드
  const { data: myParties, loading: loadingParties } = useAsync(
    () => partyAPI.getParties({ my_parties_only: true }),
    []
  );
  
  const { data: myCharacters, loading: loadingCharacters } = useAsync(
    () => user ? userAPI.getUserCharacters(user.id) : Promise.resolve([]),
    [user?.id]
  );
  
  const { data: currentRaids, loading: loadingRaids } = useAsync(
    () => raidAPI.getRaids(true),
    []
  );
  
  const loading = loadingParties || loadingCharacters || loadingRaids;
  
  // 통계 계산
  const activeParties = myParties?.filter(p => p.is_active).length || 0;
  const totalCharacters = myCharacters?.length || 0;
  const activeRaids = currentRaids?.length || 0;
  
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" message="대시보드를 불러오는 중..." />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* 환영 메시지 */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-ff14-blue-600 to-ff14-blue-700 p-8">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              환영합니다, {user?.username}님!
            </h1>
            <p className="text-ff14-blue-100">
              오늘도 즐거운 레이드 되세요 ⚔️
            </p>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-ff14-blue-500 rounded-full opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-ff14-blue-500 rounded-full opacity-20 animate-pulse-slow"></div>
        </div>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-game hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">활동중인 공대</p>
                <p className="text-3xl font-bold text-white">{activeParties}</p>
              </div>
              <UserGroupIcon className="h-12 w-12 text-ff14-blue-400 opacity-50" />
            </div>
          </div>
          
          <div className="card-game hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">등록된 캐릭터</p>
                <p className="text-3xl font-bold text-white">{totalCharacters}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-ff14-gold-400 opacity-50" />
            </div>
          </div>
          
          <div className="card-game hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">진행중인 레이드</p>
                <p className="text-3xl font-bold text-white">{activeRaids}</p>
              </div>
              <TrophyIcon className="h-12 w-12 text-green-400 opacity-50" />
            </div>
          </div>
        </div>
        
        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/parties" className="group">
            <div className="card-game p-6 hover:border-ff14-blue-500 transition-all hover:shadow-lg hover:shadow-ff14-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <SparklesIcon className="h-8 w-8 text-ff14-blue-400" />
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-ff14-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white mb-1">공대 찾기</h3>
              <p className="text-sm text-gray-400">활동중인 공대 둘러보기</p>
            </div>
          </Link>
          
          <Link to="/parties/create" className="group">
            <div className="card-game p-6 hover:border-ff14-gold-500 transition-all hover:shadow-lg hover:shadow-ff14-gold-500/20">
              <div className="flex items-center justify-between mb-2">
                <PlusIcon className="h-8 w-8 text-ff14-gold-400" />
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-ff14-gold-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white mb-1">공대 만들기</h3>
              <p className="text-sm text-gray-400">새로운 공대 생성하기</p>
            </div>
          </Link>
          
          <Link to="/profile" className="group">
            <div className="card-game p-6 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <UserIcon className="h-8 w-8 text-green-400" />
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white mb-1">내 프로필</h3>
              <p className="text-sm text-gray-400">캐릭터 및 장비 관리</p>
            </div>
          </Link>
        </div>
        
        {/* 내 캐릭터 목록 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">내 캐릭터</h2>
          {myCharacters && myCharacters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCharacters.map((char: UserCharacter) => (
                <div key={char.party_member_id} className="card-game flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${ROLE_COLORS[char.job_role]}`}>
                    <img 
                      src={`/${char.job_name}.png`} 
                      alt={char.job_name}
                      className="h-8 w-8"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{char.character_name}</h4>
                    <p className="text-sm text-gray-400">{char.job_name}</p>
                    {char.party_name && (
                      <p className="text-xs text-ff14-blue-400 mt-1">{char.party_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="등록된 캐릭터가 없습니다"
              description="공대에 가입하여 캐릭터를 등록해보세요!"
              action={{
                label: "공대 찾아보기",
                onClick: () => window.location.href = "/parties"
              }}
            />
          )}
        </div>
        
        {/* 활동중인 공대 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">내가 속한 공대</h2>
          {myParties && myParties.length > 0 ? (
            <div className="space-y-4">
              {myParties.filter(p => p.is_active).map(party => (
                <Link key={party.id} to={`/parties/${party.id}`} className="block">
                  <div className="card-game hover:border-ff14-blue-500 transition-all hover:shadow-lg hover:shadow-ff14-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <UserGroupIcon className="h-10 w-10 text-ff14-blue-400" />
                        <div>
                          <h3 className="font-semibold text-white text-lg">{party.name}</h3>
                          <p className="text-sm text-gray-400">
                            {party.raid?.name} • {party.member_count || 0}/8명
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(party.created_at)}
                          </p>
                        </div>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="가입한 공대가 없습니다"
              description="공대에 가입하여 레이드를 시작해보세요!"
              action={{
                label: "공대 찾아보기",
                onClick: () => window.location.href = "/parties"
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;