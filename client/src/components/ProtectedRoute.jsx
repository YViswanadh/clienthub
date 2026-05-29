import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading, isAgency, isClient } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--electric)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole === 'agency' && !isAgency) {
    return <Navigate to="/portal" replace />;
  }

  if (requireRole === 'client' && !isClient) {
    return <Navigate to="/dashboard" replace />;
  }

  // Support both layout route usage (no children, uses <Outlet>) and direct children
  return children ?? <Outlet />;
}
