import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import Layout from '../components/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { partyAPI, raidAPI } from '../services/api';
import { 
  UserGroupIcon,
  ChevronLeftIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Raid, DistributionMethodEnum, CreatePartyRequest } from '../types/api.types';

const CreatePartyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 현재 레이드 목록 로드
  const { data: raids, loading: loadingRaids } = useAsync(
    () => raidAPI.getRaids(true),
    []
  );
  
  // 폼 데이터
  const [formData, setFormData] = useState<CreatePartyRequest>({
    name: '',
    raid_id: 0,
    distribution_method: DistributionMethodEnum.PRIORITY
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 공대 생성 처리
  const { execute: handleCreate, loading: creating } = useAsyncCallback(
    async () => {
      // 유효성 검사
      const newErrors: Record<string, string> = {};
      
      if (!formData.name.trim()) {
        newErrors.name = '공대 이름을 입력해주세요';
      } else if (formData.name.length < 2 || formData.name.length > 30) {
        newErrors.name = '공대 이름은 2-30자여야 합니다';
      }
      
      if (!formData.raid_id) {
        newErrors.raid_id = '레이드를 선택해주세요';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      // 공대 생성
      const party = await partyAPI.createParty(formData);
      
      // 생성된 공대로 이동
      navigate(`/parties/${party.id}`);
    },
    {
      successMessage: '공대가 생성되었습니다!',
      onError: (error: any) => {
        console.error('공대 생성 실패:', error);
      }
    }
  );
  
  // 입력 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'raid_id' ? parseInt(value) : value 
    }));
    
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };
  
  if (loadingRaids) {
    return (
      <Layout>
        <LoadingSpinner size="lg" message="레이드 정보를 불러오는 중..." />
      </Layout>
    );
  }
  
  if (!raids || raids.length === 0) {
    return (
      <Layout>
        <ErrorMessage 
          title="레이드 정보 없음" 
          message="현재 진행중인 레이드가 없습니다. 관리자에게 문의하세요." 
        />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            to="/parties" 
            className="inline-flex items-center text-ff14-blue-400 hover:text-ff14-blue-300 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            공대 목록으로
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-2">새 공대 만들기</h1>
          <p className="text-gray-400">
            8인 공대를 생성하고 파티원을 모집해보세요
          </p>
        </div>
        
        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-game">
            {/* 공대 이름 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                공대 이름 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-game ${errors.name ? 'border-red-500' : ''}`}
                placeholder="예: 주말 영웅 공대"
                maxLength={30}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                2-30자 이내로 입력해주세요
              </p>
            </div>
            
            {/* 레이드 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                레이드 선택 <span className="text-red-400">*</span>
              </label>
              <select
                name="raid_id"
                value={formData.raid_id}
                onChange={handleChange}
                className={`input-game ${errors.raid_id ? 'border-red-500' : ''}`}
              >
                <option value="">레이드를 선택하세요</option>
                {raids.map(raid => (
                  <option key={raid.id} value={raid.id}>
                    {raid.name} (패치 {raid.patch_number})
                  </option>
                ))}
              </select>
              {errors.raid_id && (
                <p className="mt-1 text-sm text-red-500">{errors.raid_id}</p>
              )}
            </div>
            
            {/* 분배 방식 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                분배 방식 <span className="text-red-400">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="radio"
                    name="distribution_method"
                    value={DistributionMethodEnum.PRIORITY}
                    checked={formData.distribution_method === DistributionMethodEnum.PRIORITY}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-ff14-blue-600 bg-gray-700 border-gray-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-white group-hover:text-ff14-blue-400 transition-colors">
                      우선순위 분배
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      최종 세트 달성에 필요한 재화량을 기준으로 우선순위를 정합니다.
                      주차별 최소 1개 아이템을 보장하며, 효율적인 파밍이 가능합니다.
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="radio"
                    name="distribution_method"
                    value={DistributionMethodEnum.NEED_GREED}
                    checked={formData.distribution_method === DistributionMethodEnum.NEED_GREED}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-ff14-blue-600 bg-gray-700 border-gray-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-white group-hover:text-ff14-blue-400 transition-colors">
                      먹고 빠지기 분배
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      인게임 방식 그대로 진행합니다. 같은 부위를 모든 공대원이 
                      1번씩 획득할 때까지 재획득할 수 없습니다.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* 안내 메시지 */}
          <div className="bg-ff14-blue-500/10 border border-ff14-blue-700/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-ff14-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium mb-1">공대 생성 후</p>
                <ul className="space-y-1 text-gray-400">
                  <li>• 공대장으로 자동 지정됩니다</li>
                  <li>• 직업을 선택하여 공대에 참여해야 합니다</li>
                  <li>• 탱커 2명, 힐러 2명, 딜러 4명을 모집할 수 있습니다</li>
                  <li>• 분배 방식은 생성 후 변경할 수 없습니다</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 btn-gold flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ff14-dark-500"></div>
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>공대 생성</span>
                </>
              )}
            </button>
            
            <Link
              to="/parties"
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreatePartyPage;