import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject, useUpdateProject } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import PhaseTimeline from '../components/PhaseTimeline';
import FileUploader from '../components/FileUploader';
import CommentThread from '../components/CommentThread';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Tabs: 'files' | 'discussion' | 'invoices'
  const [activeTab, setActiveTab] = useState('files');

  // Queries
  const { data: project, isLoading, error } = useProject(id);
  const { data: invoices = [] } = useInvoices();
  const updateProjectMutation = useUpdateProject();

  // Filter invoices for this specific project
  const projectInvoices = invoices.filter(
    (inv) => inv.projectId === id || inv.project === id || inv.project?._id === id || inv.project?.id === id
  );

  const handleTogglePhase = (phaseIndex) => {
    if (!project) return;

    // Map and toggle the clicked phase done state
    const updatedPhases = project.phases.map((phase, idx) => {
      if (idx === phaseIndex) {
        return { ...phase, done: !phase.done };
      }
      return phase;
    });

    updateProjectMutation.mutate({
      id,
      data: { phases: updatedPhases }
    });
  };

  const handleStatusChange = (newStatus) => {
    updateProjectMutation.mutate({
      id,
      data: { status: newStatus }
    });
  };

  const handleFileUploadSuccess = (fileData) => {
    if (!project) return;

    // Append file to project's files array
    const updatedFiles = [
      ...(project.files || []),
      {
        name: fileData.name,
        url: fileData.url,
        status: 'pending',
        uploadedAt: new Date().toISOString()
      }
    ];

    updateProjectMutation.mutate({
      id,
      data: { files: updatedFiles }
    });
  };

  const getProgress = (phases = []) => {
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  if (isLoading) {
    return <p>Loading project details...</p>;
  }

  if (error || !project) {
    return (
      <div>
        <h2>Project Not Found</h2>
        <p>We couldn't retrieve the requested project detail.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  const progressPct = getProgress(project.phases);

  return (
    <div>
      <div>
        <button onClick={() => navigate('/projects')}>[Back to Projects]</button>
        <h1>{project.name}</h1>
        <p>Status: <strong>{project.status || 'Active'}</strong></p>
        <p>Client company: <strong>{project.clientName}</strong></p>
      </div>

      <div>
        <h3>Toggle Project Status</h3>
        {['Active', 'Review', 'Done'].map((st) => (
          <button
            key={st}
            onClick={() => handleStatusChange(st)}
            style={{ fontWeight: project.status?.toLowerCase() === st.toLowerCase() ? 'bold' : 'normal' }}
          >
            {st === 'Review' ? 'In Review' : st}
          </button>
        ))}
      </div>

      <hr />

      <div>
        <h2>Project Timeline Pipeline</h2>
        <PhaseTimeline phases={project.phases} />
        <div>
          {project.phases?.map((phase, idx) => (
            <button key={idx} onClick={() => handleTogglePhase(idx)}>
              [Toggle Phase: {phase.name}]
            </button>
          ))}
        </div>
        <p>Overall progress is at {progressPct}%</p>
      </div>

      <hr />

      <div>
        <div>
          {['files', 'discussion', 'invoices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ fontWeight: activeTab === tab ? 'bold' : 'normal' }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'files' && (
            <div>
              <h3>Upload Deliverables</h3>
              <FileUploader
                projectId={id}
                onUploadSuccess={handleFileUploadSuccess}
              />

              <h3>Shared Files</h3>
              {!project.files || project.files.length === 0 ? (
                <p>No files uploaded yet.</p>
              ) : (
                <ul>
                  {project.files.map((file, fIdx) => (
                    <li key={fIdx}>
                      <strong>{file.name}</strong> ({file.status}) -{' '}
                      <a href={file.url} target="_blank" rel="noreferrer">[View / Download]</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <CommentThread projectId={id} />
          )}

          {activeTab === 'invoices' && (
            <div>
              <h3>Billing Ledger</h3>
              <Link to="/invoices">[Compose New Invoice]</Link>
              {projectInvoices.length === 0 ? (
                <p>No invoices generated for this project.</p>
              ) : (
                <ul>
                  {projectInvoices.map((inv) => (
                    <li key={inv.id || inv._id}>
                      <strong>{inv.invoiceNumber}</strong>: ${inv.amount} ({inv.status}) - Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
