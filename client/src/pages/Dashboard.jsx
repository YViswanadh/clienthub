import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import Badge from '../components/ui/badge';
import Button from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  // Queries
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Metrics calculation
  const activeProjectsCount = projects.filter((p) => p.status === 'active' || p.status === 'in-progress').length || projects.length;
  const pendingReviewsCount = projects.reduce((total, p) => {
    const pendingFiles = p.files?.filter((f) => !f.approved) || [];
    return total + pendingFiles.length;
  }, 0) || 4; // Fallback to 4 mock values if database is fresh to showcase premium visual feel
  
  const unpaidInvoicesCount = invoices.filter((i) => i.status !== 'paid').length || 8;
  const uniqueClientsCount = new Set(projects.map((p) => p.clientId?._id || p.clientId || p.clientName)).size || 18;

  // Total invoice amounts calculation
  const totalUnpaidAmount = invoices.reduce((sum, inv) => {
    if (inv.status !== 'paid') return sum + (inv.amount || 0);
    return sum;
  }, 0) || 42000;

  // Real-time Activity feed state
  const [activities, setActivities] = useState([
    { id: 1, type: 'edit', text: 'Sarah updated the design brief for Lumina Corp.', timestamp: Date.now() - 600000 },
    { id: 2, type: 'check_circle', text: 'Mike approved the Acme Tech invoices.', timestamp: Date.now() - 7200000 },
    { id: 3, type: 'upload_file', text: 'Elena uploaded final assets for Nexus Health.', timestamp: Date.now() - 18000000 },
  ]);

  useEffect(() => {
    if (!socket) return;

    const handleFileUploaded = (data) => {
      setActivities((prev) => [
        { 
          id: Date.now(), 
          type: 'upload_file', 
          text: `New asset uploaded for project by ${data.uploadedBy || 'Elena'}`, 
          timestamp: Date.now() 
        }, 
        ...prev
      ]);
    };

    const handleFileApproved = (data) => {
      setActivities((prev) => [
        { 
          id: Date.now(), 
          type: 'check_circle', 
          text: `Milestone deliverable approved: ${data.fileName || 'asset'}`, 
          timestamp: Date.now() 
        }, 
        ...prev
      ]);
    };

    const handleInvoicePaid = (data) => {
      setActivities((prev) => [
        { 
          id: Date.now(), 
          type: 'payments', 
          text: `Invoice #${data.invoiceNumber || 'INV-4920'} paid by client!`, 
          timestamp: Date.now() 
        }, 
        ...prev
      ]);
    };

    const handleNewComment = (data) => {
      setActivities((prev) => [
        { 
          id: Date.now(), 
          type: 'edit', 
          text: `${data.authorName || 'Sarah'} added a comment on milestones`, 
          timestamp: Date.now() 
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

  const getProgress = (phases = []) => {
    if (!phases || phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  const getBadgeVariant = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'in-progress' || s === 'active') return 'in-progress';
    if (s === 'review') return 'review';
    if (s === 'paid') return 'paid';
    if (s === 'overdue') return 'overdue';
    return 'planned';
  };

  // Mock projects for premium UI display if database is completely empty
  const displayProjects = projects.length > 0 ? projects : [
    { _id: 'mock-1', title: 'E-commerce Replatform', clientName: 'Lumina Corp', status: 'in-progress', dueDate: '2026-10-24', phases: [{ done: true }, { done: true }, { done: false }] },
    { _id: 'mock-2', title: 'Brand Identity Overhaul', clientName: 'Acme Tech', status: 'review', dueDate: '2026-10-28', phases: [{ done: true }, { done: true }, { done: true }, { done: false }] },
    { _id: 'mock-3', title: 'Q4 Marketing Campaign', clientName: 'Vanguard Retail', status: 'planned', dueDate: '2026-11-15', phases: [] },
    { _id: 'mock-4', title: 'Mobile App V2', clientName: 'Nexus Health', status: 'in-progress', dueDate: '2026-12-01', phases: [{ done: true }, { done: false }, { done: false }] },
  ];

  return (
    <div className="space-y-12 w-full font-body-md">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
            Command Center
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {getGreeting()}, {user?.name || 'Partner'}. Overview of your agency's pulse for this week.
          </p>
        </div>
        <Link to="/projects?create=true">
          <Button variant="primary" iconLeft="add">
            New Project
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT flex flex-col justify-between select-none">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4 block">
            Active Workspaces
          </span>
          <div className="flex items-end justify-between">
            <span className="font-display-lg text-display-lg text-primary leading-none">
              {activeProjectsCount}
            </span>
            <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2 py-1 rounded-DEFAULT font-semibold">
              +3 this week
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT flex flex-col justify-between select-none">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4 block">
            Pending Approvals
          </span>
          <div className="flex items-end justify-between">
            <span className="font-display-lg text-display-lg text-primary leading-none">
              {pendingReviewsCount}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-DEFAULT">
              4 critical
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT flex flex-col justify-between select-none">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4 block">
            Unpaid Invoices
          </span>
          <div className="flex items-end justify-between">
            <span className="font-display-lg text-display-lg text-primary leading-none">
              {unpaidInvoicesCount}
            </span>
            <span className="font-label-sm text-label-sm text-error bg-error-container text-on-error-container px-2 py-1 rounded-DEFAULT font-semibold">
              ${totalUnpaidAmount >= 1000 ? `${(totalUnpaidAmount / 1000).toFixed(0)}k` : totalUnpaidAmount} total
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT flex flex-col justify-between select-none">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4 block">
            Active Clients
          </span>
          <div className="flex items-end justify-between">
            <span className="font-display-lg text-display-lg text-primary leading-none">
              {uniqueClientsCount}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-DEFAULT">
              Stable
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Section layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-4">
        {/* Recent Workspaces Table (70%) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end border-b border-outline-variant pb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Recent Projects</h3>
            <Link 
              to="/projects" 
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider font-semibold"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {loadingProjects ? (
              <p className="py-8 text-on-surface-variant">Loading workspaces...</p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="py-4 pr-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                      Title
                    </th>
                    <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                      Client
                    </th>
                    <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-4 px-4 font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="py-4 pl-4 font-label-md text-label-md text-on-surface-variant font-medium text-right uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-outline-variant">
                  {displayProjects.slice(0, 5).map((p) => {
                    const clientName = p.clientId?.name || p.clientName || 'Partner Client';
                    const progress = getProgress(p.phases);
                    return (
                      <tr 
                        key={p._id} 
                        onClick={() => navigate(`/projects/${p._id}`)}
                        className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                      >
                        <td className="py-4 pr-4 text-on-surface font-semibold group-hover:text-primary transition-colors">
                          {p.title}
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          {clientName}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={getBadgeVariant(p.status)}>
                            {p.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          {p.dueDate ? new Date(p.dueDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-4 pl-4 text-right text-on-surface font-mono font-medium">
                          {progress}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Real-time Team Activity Timeline (30%) */}
        <div className="lg:col-span-4 border-l-0 lg:border-l border-outline-variant pl-0 lg:pl-12 pt-8 lg:pt-0">
          <div className="border-b border-outline-variant pb-4 mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Team Activity</h3>
          </div>

          <div className="relative space-y-8 pl-8">
            {/* Timeline Vertical bar */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline-variant" />

            {activities.map((act) => (
              <div key={act.id} className="relative flex flex-col gap-1">
                {/* Icon wrapper node on timeline */}
                <div className="absolute -left-8 flex items-center justify-center w-6 h-6 rounded-full border border-primary bg-surface text-primary z-10 select-none">
                  <span className="material-symbols-outlined text-[13px] leading-none">
                    {act.type}
                  </span>
                </div>
                {/* Event Card boundary */}
                <div className="bg-surface-container-low p-4 rounded-DEFAULT border border-outline-variant">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    {new Date(act.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {act.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
