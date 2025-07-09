import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import { 
  UserIcon, 
  LockClosedIcon, 
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 로그인 처리
  const { execute: handleLogin, loading } = useAsyncCallback(
    async () => {
      // 유효성 검사
      const newErrors: Record<string, string> = {};
      
      if (!formData.username.trim()) {
        newErrors.username = '사용자명을 입력해주세요';
      }
      if (!formData.password) {
        newErrors.password = '비밀번호를 입력해주세요';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      await login(formData);
    },
    {
      onError: (error) => {
        console.error('로그인 실패:', error);
      }
    }
  );

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // 입력 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-ff14-dark-200 to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ff14-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ff14-gold-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* 로그인 카드 */}
      <div className="relative w-full max-w-md">
        <div className="card-game backdrop-blur-md bg-opacity-90">
          {/* 로고 및 제목 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <SparklesIcon className="h-16 w-16 text-ff14-gold-500 animate-float" />
                <div className="absolute inset-0 h-16 w-16 bg-ff14-gold-500/50 blur-xl animate-pulse"></div>
              </div>
            </div>
            <h1 className="title-game text-3xl mb-2">FF14 RAID MANAGER</h1>
            <p className="text-gray-400">모험가님, 환영합니다!</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 사용자명 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                사용자명
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input-game pl-10 ${errors.username ? 'border-red-500' : ''}`}
                  placeholder="사용자명을 입력하세요"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-game pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-game flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>로그인</span>
                </>
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ff14-blue-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">또는</span>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <p className="text-gray-400">
              아직 계정이 없으신가요?{' '}
              <Link 
                to="/register" 
                className="text-ff14-blue-400 hover:text-ff14-blue-300 font-medium transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>

          {/* 테스트 계정 안내 */}
          <div className="mt-6 p-4 bg-ff14-blue-500/10 rounded-lg border border-ff14-blue-700/50">
            <p className="text-sm text-ff14-blue-400 font-medium mb-1">테스트 계정</p>
            <p className="text-xs text-gray-400">
              관리자: admin / admin123
            </p>
          </div>
        </div>

        {/* 하단 장식 */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs text-gray-600">
            © 2024 FF14 레이드 관리 시스템
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;