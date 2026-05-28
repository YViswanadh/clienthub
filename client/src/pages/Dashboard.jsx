import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FolderKanban,
  CheckCircle2,
  Receipt,
  Users,
  Eye,
  Edit2,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';

// High-performance CountUp Component utilizing requestAnimationFrame + easeOut
function CountUp({ end, duration = 800 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuad formula
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  // Queries
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Metrics
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const pendingReviewsCount = projects.reduce((total, p) => {
    const pendingFiles = p.files?.filter((f) => !f.approved) || [];
    return total + pendingFiles.length;
  }, 0);
  const unpaidInvoicesCount = invoices.filter((i) => i.status !== 'paid').length;
  const uniqueClientsCount = new Set(projects.map((p) => p.clientId?._id || p.clientId || p.clientName)).size || 0;

  // Real-time Activity feed state
  const [activities, setActivities] = useState([
    { id: 1, type: 'approval', text: 'Client approved Design Mockups', timestamp: Date.now() - 600000 },
    { id: 2, type: 'payment', text: 'Invoice #INV-4920 was paid by Acme Corp', timestamp: Date.now() - 7200000 },
    { id: 3, type: 'comment', text: 'Sarah added a comment on Phase 2', timestamp: Date.now() - 18000000 },
    { id: 4, type: 'invite', text: 'Created project "Brand Redesign"', timestamp: Date.now() - 86400000 },
  ]);

  // Listen to Socket events and prepend activities dynamically with slideDown triggers
  useEffect(() => {
    if (!socket) return;

    const handleFileUploaded = (data) => {
      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'comment',
          text: `New file uploaded: ${data.filename || 'asset'}`,
          timestamp: Date.now(),
          isNew: true
        },
        ...prev
      ]);
    };

    const handleFileApproved = (data) => {
      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'approval',
          text: `File approved by ${data.approvedBy || 'Client'}`,
          timestamp: Date.now(),
          isNew: true
        },
        ...prev
      ]);
    };

    const handleInvoicePaid = (data) => {
      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'payment',
          text: `Invoice #${data.invoiceNumber || 'INV'} paid!`,
          timestamp: Date.now(),
          isNew: true
        },
        ...prev
      ]);
    };

    const handleNewComment = (data) => {
      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'comment',
          text: `${data.authorName || 'Member'}: ${data.comment?.body}`,
          timestamp: Date.now(),
          isNew: true
        },
        ...prev
      ]);
    };

    socket.on('file_uploaded', handleFileUploaded);
    socket.on('file_approved', handleFileApproved);
    socket.on('invoice_paid', handleInvoicePaid);
    socket.on('new_comment', handleNewComment);

    return () => {
      socket.off('file_uploaded', handleFileUploaded);
      socket.off('file_approved', handleFileApproved);
      socket.off('invoice_paid', handleInvoicePaid);
      socket.off('new_comment', handleNewComment);
    };
  }, [socket]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name) => {
    if (!name) return 'CL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const getProgress = (phases = []) => {
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  const getProgressBarColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'var(--brand-color, var(--electric))';
      case 'review':
      case 'in review':
        return 'var(--amber)';
      case 'done':
      case 'completed':
        return 'var(--mint)';
      default:
        return 'var(--electric)';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge-active';
      case 'review':
      case 'in review':
        return 'badge-review';
      case 'done':
      case 'completed':
        return 'badge-done';
      default:
        return 'badge-active';
    }
  };

  const getActivityDotColor = (type) => {
    switch (type) {
      case 'comment':
        return 'var(--electric)';
      case 'approval':
        return 'var(--mint)';
      case 'payment':
        return 'var(--amber)';
      case 'invite':
        return 'var(--ember)';
      default:
        return 'var(--electric)';
    }
  };

  const getRelativeTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Slide-down keyframes inject */}
      <style>{`
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; transform: translateY(-10px); }
          to { max-height: 80px; opacity: 1; transform: translateY(0); }
        }
        .activity-slide-new {
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
        }
      `}</style>

      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggleCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
        />

        {/* Main Frame */}
        <main
          className={`flex-1 p-6 transition-all duration-200 page-enter`}
          style={{
            marginLeft: sidebarCollapsed ? '60px' : '220px',
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            {/* Left Column: Metrics + Projects */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Header greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-[22px] font-medium text-[#0E0E1A] m-0">
                    {getGreeting()}, {user?.name || 'Partner'}
                  </h1>
                  <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
                    Here's what's happening with your projects.
                  </p>
                </div>
                <Button
                  asChild
                  className="btn-primary shrink-0"
                >
                  <Link to="/projects?create=true" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FolderKanban className="h-4 w-4" />
                    New Project
                  </Link>
                </Button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Projects */}
                <div
                  className="card p-[16px] px-[20px] transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--electric-muted)' }}
                    >
                      <FolderKanban className="h-[20px] w-[20px]" style={{ color: 'var(--electric)' }} />
                    </div>
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </span>
                  </div>
                  <h3 className="text-[28px] font-semibold tracking-tight m-0" style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    <CountUp end={activeProjectsCount} />
                  </h3>
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Active Projects</span>
                </div>

                {/* Pending Approvals */}
                <div
                  className="card p-[16px] px-[20px] transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--amber-light)' }}
                    >
                      <Clock className="h-[20px] w-[20px]" style={{ color: 'var(--amber)' }} />
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                      <AlertCircle className="h-3 w-3" />
                      Pending
                    </span>
                  </div>
                  <h3 className="text-[28px] font-semibold tracking-tight m-0" style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    <CountUp end={pendingReviewsCount} />
                  </h3>
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Pending Approvals</span>
                </div>

                {/* Invoices */}
                <div
                  className="card p-[16px] px-[20px] transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--mint-light)' }}
                    >
                      <Receipt className="h-[20px] w-[20px]" style={{ color: 'var(--mint)' }} />
                    </div>
                    <span className="text-[10px] font-bold text-mint flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      Unpaid
                    </span>
                  </div>
                  <h3 className="text-[28px] font-semibold tracking-tight m-0" style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    <CountUp end={unpaidInvoicesCount} />
                  </h3>
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Unpaid Invoices</span>
                </div>

                {/* Clients */}
                <div
                  className="card p-[16px] px-[20px] transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--ember-light)' }}
                    >
                      <Users className="h-[20px] w-[20px]" style={{ color: 'var(--ember)' }} />
                    </div>
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                      +2 onboarding
                    </span>
                  </div>
                  <h3 className="text-[28px] font-semibold tracking-tight m-0" style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    <CountUp end={uniqueClientsCount} />
                  </h3>
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Active Clients</span>
                </div>
              </div>

              {/* Projects Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-[#0E0E1A] m-0">Recent Workspaces</h3>
                  <Link to="/projects" className="text-xs font-semibold hover:underline no-underline" style={{ color: 'var(--brand-color, var(--electric))' }}>
                    View all projects
                  </Link>
                </div>

                <div
                  className="overflow-hidden"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {loadingProjects ? (
                    <div className="flex h-40 items-center justify-center">
                      <div
                        className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: 'var(--brand-color, var(--electric))' }}
                      />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 py-12 text-center">
                      {/* SVg Folder illustration */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[#94A3B8] mb-3">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <h4 className="text-sm font-semibold text-slate-700 m-0">No active projects yet</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Create workspace and onboard your clients.</p>
                      <Button asChild className="btn-primary text-xs">
                        <Link to="/projects?create=true">Create your first project</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr
                            className="text-left border-b font-medium"
                            style={{
                              backgroundColor: 'var(--bg-base)',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              borderColor: 'var(--border-light)',
                            }}
                          >
                            <th className="p-3 px-5 tracking-wider uppercase">Project title</th>
                            <th className="p-3 px-5 tracking-wider uppercase">Client</th>
                            <th className="p-3 px-5 tracking-wider uppercase">Status</th>
                            <th className="p-3 px-5 tracking-wider uppercase">Due date</th>
                            <th className="p-3 px-5 tracking-wider uppercase w-1/4">Progress</th>
                            <th className="p-3 px-5 w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.slice(0, 5).map((p) => {
                            const pct = getProgress(p.phases);
                            return (
                              <tr
                                key={p._id || p.id}
                                className="group border-b last:border-b-0 hover:bg-[#F2F2F8]/40 transition-colors duration-120"
                                style={{ borderColor: 'var(--border-light)' }}
                              >
                                {/* Title */}
                                <td className="p-3.5 px-5">
                                  <Link
                                    to={`/projects/${p._id || p.id}`}
                                    className="text-sm font-semibold text-[#0E0E1A] hover:underline no-underline"
                                  >
                                    {p.title}
                                  </Link>
                                </td>

                                {/* Client */}
                                <td className="p-3.5 px-5">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px]"
                                      style={{ backgroundColor: 'var(--brand-color, var(--electric))' }}
                                    >
                                      {getInitials(p.clientId?.name || p.clientName)}
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                                      {p.clientId?.name || p.clientName || 'Partner Client'}
                                    </span>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="p-3.5 px-5">
                                  <span className={getStatusBadgeClass(p.status || 'active')}>
                                    {p.status || 'Active'}
                                  </span>
                                </td>

                                {/* Due Date */}
                                <td className="p-3.5 px-5 text-xs text-slate-500 font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    {formatDate(p.dueDate)}
                                  </div>
                                </td>

                                {/* Progress */}
                                <td className="p-3.5 px-5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ height: '4px' }}>
                                      <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: `${pct}%`,
                                          backgroundColor: getProgressBarColor(p.status || 'active'),
                                        }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-semibold text-[#64748B] shrink-0">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>

                                {/* Actions Fade-in */}
                                <td className="p-3.5 px-5 text-center shrink-0">
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 justify-end">
                                    <button
                                      onClick={() => navigate(`/projects/${p._id || p.id}`)}
                                      className="flex h-7 w-7 items-center justify-center hover:bg-slate-100 text-slate-600 rounded-full border-none bg-transparent cursor-pointer"
                                      title="View Workspace"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => navigate(`/projects/${p._id || p.id}?edit=true`)}
                                      className="flex h-7 w-7 items-center justify-center hover:bg-slate-100 text-slate-600 rounded-full border-none bg-transparent cursor-pointer"
                                      title="Edit details"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Activity Feed */}
            <div className="w-full lg:w-[280px] shrink-0">
              <div
                className="p-4 flex flex-col h-full"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  minHeight: '480px',
                }}
              >
                <div className="flex justify-between items-center pb-3 border-b mb-3" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-xs font-semibold text-[#0E0E1A]">Recent activity</span>
                  <Link to="/projects" className="text-[11px] font-semibold hover:underline no-underline" style={{ color: 'var(--brand-color, var(--electric))' }}>
                    View all
                  </Link>
                </div>

                {/* Timeline flow */}
                <div className="flex-1 overflow-y-auto max-h-[520px] space-y-4 pr-1">
                  {activities.map((item, idx) => {
                    const hasNext = idx < activities.length - 1;
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 items-start min-h-[40px] ${
                          item.isNew ? 'activity-slide-new' : ''
                        }`}
                      >
                        {/* Dot indicator and timeline link */}
                        <div className="relative flex flex-col items-center shrink-0 w-4 h-full mt-1">
                          <span
                            className="h-2 w-2 rounded-full z-10 shrink-0"
                            style={{ backgroundColor: getActivityDotColor(item.type) }}
                          />
                          {hasNext && (
                            <span
                              className="absolute top-2 w-[1px]"
                              style={{
                                bottom: '-24px',
                                backgroundColor: 'var(--border-light)',
                              }}
                            />
                          )}
                        </div>

                        {/* Content text */}
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs text-[#0E0E1A] font-medium leading-normal break-words m-0">
                            {item.text}
                          </p>
                          <span className="text-[10px] text-[#94A3B8] block">
                            {getRelativeTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
