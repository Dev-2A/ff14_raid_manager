import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// 페이지 컴포넌트들 (아직 만들지 않았으므로 임시로 주석처리)
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import HomePage from './pages/HomePage';
// import PartiesPage from './pages/PartiesPage';
// import PartyDetailPage from './pages/PartyDetailPage';
// import ProfilePage from './pages/ProfilePage';
// import AdminPage from './pages/AdminPage';

// 임시 페이지 컴포넌트들
const LoginPage = () => <div className="text-white">로그인 페이지</div>;
const RegisterPage = () => <div className="text-white">회원가입 페이지</div>;
const HomePage = () => <div className="text-white">홈 페이지</div>;
const PartiesPage = () => <div className="text-white">공대 목록 페이지</div>;
const PartyDetailPage = () => <div className="text-white">공대 상세 페이지</div>;
const ProfilePage = () => <div className="text-white">프로필 페이지</div>;
const AdminPage = () => <div className="text-white">관리자 페이지</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900">
          {/* Toast 알림 설정 */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #0066cc',
                borderRadius: '10px',
              },
            }}
          />
          
          {/* 라우트 설정 */}
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 보호된 라우트 */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parties"
              element={
                <ProtectedRoute>
                  <PartiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parties/:partyId"
              element={
                <ProtectedRoute>
                  <PartyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            
            {/* 관리자 전용 라우트 */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            
            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;