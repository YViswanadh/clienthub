import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import BrandWrapper from './components/BrandWrapper';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ClientPortal from './pages/ClientPortal';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';

function RootRedirect() {
  const { user, loading, isAgency, isClient } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F8F8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAgency) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isClient) {
    return <Navigate to="/portal" replace />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrandWrapper>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        
        {/* Agency Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="agency">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute requireRole="agency">
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute requireRole="agency">
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute requireRole="agency">
              <Invoices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireRole="agency">
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Client Routes */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute requireRole="client">
              <ClientPortal />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrandWrapper>
  );
}

export default App;
