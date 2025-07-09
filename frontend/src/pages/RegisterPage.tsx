import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import { authAPI } from '../services/api';
import { isValidEmail, getPasswordStrength } from '../utils/validation';
import { 
  UserIcon, 
  LockClosedIcon,
  EnvelopeIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 회원가입 처리
  const { execute: handleRegister, loading } = useAsyncCallback(
    async () => {
      // 유효성 검사
      const newErrors: Record<string, string> = {};
      
      if (!formData.username.trim()) {
        newErrors.username = '사용자명을 입력해주세요';
      } else if (formData.username.length < 3) {
        newErrors.username = '사용자명은 3자 이상이어야 합니다';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = '이메일을 입력해주세요';
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다';
      }
      
      if (!formData.password) {
        newErrors.password = '비밀번호를 입력해주세요';
      } else if (formData.password.length < 6) {
        newErrors.password = '비밀번호는 6자 이상이어야 합니다';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      // 회원가입 API 호출
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      toast.success('회원가입이 완료되었습니다! 로그인해주세요.', {
        icon: '🎉',
        duration: 4000,
      });
      
      navigate('/login');
    },
    {
      onError: (error: any) => {
        const message = error.response?.data?.detail || '회원가입에 실패했습니다.';
        console.error('회원가입 실패:', message);
      }
    }
  );

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // 입력 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 필드가 터치된 것으로 표시
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
    
    // 실시간 유효성 검사
    validateField(name, value);
  };

  // 필드별 유효성 검사
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = '사용자명을 입력해주세요';
        } else if (value.length < 3) {
          newErrors.username = '사용자명은 3자 이상이어야 합니다';
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          newErrors.email = '이메일을 입력해주세요';
        } else if (!isValidEmail(value)) {
          newErrors.email = '올바른 이메일 형식이 아닙니다';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = '비밀번호를 입력해주세요';
        } else if (value.length < 6) {
          newErrors.password = '비밀번호는 6자 이상이어야 합니다';
        } else {
          delete newErrors.password;
        }
        
        // 비밀번호 확인도 다시 검사
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true
    });
    handleRegister();
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-ff14-dark-200 to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ff14-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ff14-gold-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* 회원가입 카드 */}
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
            <h1 className="title-game text-3xl mb-2">모험가 등록</h1>
            <p className="text-gray-400">새로운 모험을 시작하세요!</p>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className={`input-game pl-10 ${touched.username && errors.username ? 'border-red-500' : ''}`}
                  placeholder="사용자명 (3자 이상)"
                  autoComplete="username"
                  autoFocus
                />
                {touched.username && !errors.username && formData.username && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {touched.username && errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* 이메일 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-game pl-10 ${touched.email && errors.email ? 'border-red-500' : ''}`}
                  placeholder="example@email.com"
                  autoComplete="email"
                />
                {touched.email && !errors.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
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
                  className={`input-game pl-10 pr-10 ${touched.password && errors.password ? 'border-red-500' : ''}`}
                  placeholder="6자 이상"
                  autoComplete="new-password"
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
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
              
              {/* 비밀번호 강도 표시 */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs ${passwordStrength.color}`}>
                      {passwordStrength.message}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-game pl-10 pr-10 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  )}
                </button>
                {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ff14-dark-500"></div>
                  <span>등록 중...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>모험가 등록</span>
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

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link 
                to="/login" 
                className="text-ff14-blue-400 hover:text-ff14-blue-300 font-medium transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;