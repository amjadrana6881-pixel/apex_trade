import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ShieldCheck, LogOut } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

import Dashboard from './pages/Dashboard';
import LiveTrading from './pages/LiveTrading';
import Wallet from './pages/Wallet';
import SignalsHub from './pages/SignalsHub';
import Assets from './pages/Assets';
import ReferralTree from './pages/ReferralTree';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 font-bold">Loading ApexTrade...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to={adminOnly ? "/admin-secure-auth" : "/login"} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function RootRedirect() {
  const { token, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 font-bold">Loading ApexTrade...</span>
        </div>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
}

function PublicAuthOnly({ children }) {
  const { token, loading, user } = useAuth();
  if (loading) return null;
  if (token) {
    return <Navigate to={user?.role === 'admin' ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

function MainLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/forgot-password' || 
                     location.pathname === '/admin-secure-auth' ||
                     location.pathname === '/admin-login';

  const isAdminPanelPage = location.pathname === '/admin';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          <Route path="/login" element={<PublicAuthOnly><Login /></PublicAuthOnly>} />
          <Route path="/register" element={<PublicAuthOnly><Register /></PublicAuthOnly>} />
          <Route path="/forgot-password" element={<PublicAuthOnly><ForgotPassword /></PublicAuthOnly>} />
          <Route path="/admin-secure-auth" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>
      </div>
    );
  }

  // Pure Dedicated Super Admin View with Integrated Responsive Sidebar
  if (isAdminPanelPage) {
    return (
      <Routes>
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    );
  }

  // Trader / Player Layout
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trading" element={<ProtectedRoute><LiveTrading /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/signals" element={<ProtectedRoute><SignalsHub /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/referral-tree" element={<ProtectedRoute><ReferralTree /></ProtectedRoute>} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <MainLayout />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
