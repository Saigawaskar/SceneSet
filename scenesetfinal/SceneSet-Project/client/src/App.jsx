import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreatePlan from './pages/CreatePlan.jsx';
import PlanDetail from './pages/PlanDetail.jsx';
import JoinPlan from './pages/JoinPlan.jsx';
import NotFound from './pages/NotFound.jsx';

function LoadingScreen() {
  return <div className="app-loading"><span className="brand-mark"><span>✳</span></span><strong>Getting your scenes ready…</strong><div className="loading-bar"><i /></div></div>;
}

function PublicHome() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <Navigate to={user ? '/app' : '/login'} replace />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  return <AppShell><Outlet /></AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/plans/new" element={<CreatePlan />} />
        <Route path="/plans/:id" element={<PlanDetail />} />
      </Route>
      <Route path="/join/:code" element={<JoinPlan />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
