import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { User, LoginRequest } from '../types/api.types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 인증 상태 확인
  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (error) {
      console.error('인증 확인 실패:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 로그인
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('accessToken', response.access_token);
      
      // 사용자 정보 가져오기
      const userData = await authAPI.getMe();
      setUser(userData);
      
      toast.success(`환영합니다, ${userData.username}님!`, {
        icon: '⚔️',
        style: {
          borderRadius: '10px',
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #0066cc',
        },
      });
      
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.detail || '로그인에 실패했습니다.';
      toast.error(message, {
        style: {
          borderRadius: '10px',
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #ff4444',
        },
      });
      throw error;
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    
    toast.success('로그아웃되었습니다.', {
      icon: '👋',
      style: {
        borderRadius: '10px',
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid #0066cc',
      },
    });
    
    navigate('/login');
  };

  // 컴포넌트 마운트 시 인증 확인
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};