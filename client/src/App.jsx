import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import BrandWrapper from './components/BrandWrapper';
import { AgencyLayout, ClientLayout } from './components/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ClientPortal from './pages/ClientPortal';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Clients from './pages/Clients';

function RootRedirect() {
  const { user, loading, isAgency, isClient } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--electric)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isAgency) return <Navigate to="/dashboard" replace />;
  if (isClient) return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrandWrapper>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* ── Agency routes wrapped in AgencyLayout ── */}
        <Route
          element={
            <ProtectedRoute requireRole="agency">
              <AgencyLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/clients" element={<Clients />} />
        </Route>

        {/* ── Client routes wrapped in ClientLayout ── */}
        <Route
          element={
            <ProtectedRoute requireRole="client">
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/portal" element={<ClientPortal />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrandWrapper>
  );
}

export default App;
