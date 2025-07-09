import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 동적으로 navigation 배열 생성 - 수정된 부분
  const navigation = [
    { name: '홈', href: '/', icon: HomeIcon },
    { name: '공대', href: '/parties', icon: UserGroupIcon },
    { name: '프로필', href: '/profile', icon: UserIcon },
    ...(user?.is_admin ? [{ name: '관리자', href: '/admin', icon: Cog6ToothIcon }] : [])
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-ff14-dark-200 to-gray-900">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ff14-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ff14-gold-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* 네비게이션 바 */}
      <nav className="relative bg-ff14-dark-300/80 backdrop-blur-md border-b border-ff14-blue-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <SparklesIcon className="h-8 w-8 text-ff14-gold-500 group-hover:animate-pulse" />
                <span className="font-game text-xl bg-gradient-to-r from-ff14-blue-400 to-ff14-gold-500 bg-clip-text text-transparent">
                  FF14 RAID
                </span>
              </Link>
            </div>

            {/* 데스크톱 메뉴 */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                      flex items-center space-x-2 group
                      ${
                        isActive(item.href)
                          ? 'bg-ff14-blue-600 text-white shadow-game'
                          : 'text-gray-300 hover:bg-ff14-blue-700/50 hover:text-white'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 사용자 정보 및 로그아웃 */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm">
                <p className="text-gray-400">접속중인 모험가</p>
                <p className="text-ff14-gold-500 font-semibold">{user?.username}</p>
                {user?.is_admin && (
                  <p className="text-xs text-purple-400 mt-0.5">관리자</p>
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-red-600/20 transition-all duration-200"
                title="로그아웃"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-ff14-blue-700/50"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-ff14-dark-300/95 backdrop-blur-md border-t border-ff14-blue-700/50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    block px-3 py-2 rounded-md text-base font-medium transition-all duration-200
                    flex items-center space-x-2
                    ${
                      isActive(item.href)
                        ? 'bg-ff14-blue-600 text-white shadow-game'
                        : 'text-gray-300 hover:bg-ff14-blue-700/50 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <div className="border-t border-ff14-blue-700/50 pt-3 mt-3">
                <div className="flex items-center justify-between px-3">
                  <div>
                    <p className="text-xs text-gray-400">접속중인 모험가</p>
                    <p className="text-ff14-gold-500 font-semibold">{user?.username}</p>
                    {user?.is_admin && (
                      <p className="text-xs text-purple-400 mt-0.5">관리자</p>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-red-400 hover:bg-red-600/20"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="relative mt-auto border-t border-ff14-blue-700/30 bg-ff14-dark-300/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>© 2024 FF14 레이드 관리 시스템</p>
            <p className="mt-1">Final Fantasy XIV © SQUARE ENIX</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;