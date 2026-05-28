import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading, isAgency, isClient } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F8F8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforce role guards if requireRole is specified
  if (requireRole === 'agency' && !isAgency) {
    return <Navigate to="/portal" replace />;
  }

  if (requireRole === 'client' && !isClient) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
