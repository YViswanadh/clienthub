import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

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

  useEffect(() => {
    if (!socket) return;

    const handleFileUploaded = (data) => {
      setActivities((prev) => [{ id: Date.now(), type: 'comment', text: `New file uploaded: ${data.filename || 'asset'}`, timestamp: Date.now() }, ...prev]);
    };

    const handleFileApproved = (data) => {
      setActivities((prev) => [{ id: Date.now(), type: 'approval', text: `File approved by ${data.approvedBy || 'Client'}`, timestamp: Date.now() }, ...prev]);
    };

    const handleInvoicePaid = (data) => {
      setActivities((prev) => [{ id: Date.now(), type: 'payment', text: `Invoice #${data.invoiceNumber || 'INV'} paid!`, timestamp: Date.now() }, ...prev]);
    };

    const handleNewComment = (data) => {
      setActivities((prev) => [{ id: Date.now(), type: 'comment', text: `${data.authorName || 'Member'}: ${data.comment?.body}`, timestamp: Date.now() }, ...prev]);
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
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  return (
    <div>
      <div>
        <h1>{getGreeting()}, {user?.name || 'Partner'}</h1>
        <p>Here's what's happening with your projects.</p>
        <Link to="/projects?create=true">[New Project]</Link>
      </div>

      <section>
        <h2>Metrics Summary</h2>
        <ul>
          <li><strong>Active Projects:</strong> {activeProjectsCount}</li>
          <li><strong>Pending Approvals:</strong> {pendingReviewsCount}</li>
          <li><strong>Unpaid Invoices:</strong> {unpaidInvoicesCount}</li>
          <li><strong>Active Clients:</strong> {uniqueClientsCount}</li>
        </ul>
      </section>

      <section>
        <div>
          <h2>Recent Workspaces</h2>
          <Link to="/projects">View all projects</Link>
        </div>

        {loadingProjects ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No active projects yet. <Link to="/projects?create=true">Create one now</Link></p>
        ) : (
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Client</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((p) => (
                <tr key={p._id || p.id}>
                  <td>
                    <Link to={`/projects/${p._id || p.id}`}>{p.title}</Link>
                  </td>
                  <td>{p.clientId?.name || p.clientName || 'Partner Client'}</td>
                  <td>{p.status || 'Active'}</td>
                  <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{getProgress(p.phases)}%</td>
                  <td>
                    <button onClick={() => navigate(`/projects/${p._id || p.id}`)}>[View]</button>
                    <button onClick={() => navigate(`/projects/${p._id || p.id}?edit=true`)}>[Edit]</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Recent Activity</h2>
        <ul>
          {activities.map((item) => (
            <li key={item.id}>
              {item.text} - <small>{new Date(item.timestamp).toLocaleTimeString()}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
