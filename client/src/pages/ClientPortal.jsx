import React, { useState, useEffect } from 'react';
import { useProjects, useApproveFile } from '../hooks/useProjects';
import { useInvoices, useCheckoutInvoice } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import PhaseTimeline from '../components/PhaseTimeline';
import CommentThread from '../components/CommentThread';

export default function ClientPortal() {
  const { user } = useAuth();
  
  // Queries
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Active Project (first one returned in client scope)
  const project = projects[0];

  // Active Unpaid Invoice for the banner
  const unpaidInvoice = invoices.find((inv) => inv.status?.toLowerCase() !== 'paid');

  // Mutations
  const checkoutMutation = useCheckoutInvoice();
  const approveFileMutation = useApproveFile(project?.id || project?._id);

  // Changes Request state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const getProgress = (phases = []) => {
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  const handleApprove = (fileId) => {
    approveFileMutation.mutate({ fileId, approved: true });
  };

  const handleRequestChangesClick = (fileId) => {
    setSelectedFileId(fileId);
    setFeedback('');
    setRejectModalOpen(true);
  };

  const handleRequestChangesSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    // Call approveFileMutation to mark as changes requested
    approveFileMutation.mutate(
      { fileId: selectedFileId, approved: false, feedback },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
        },
      }
    );
  };

  if (loadingProjects || loadingInvoices) {
    return <p>Loading client workspace details...</p>;
  }

  const pct = project ? getProgress(project.phases) : 0;

  return (
    <div>
      {/* Top Banner (Payment Due) */}
      {unpaidInvoice && (
        <div style={{ border: '1px solid orange', padding: '10px', margin: '10px 0' }}>
          <strong>Payment Due:</strong> ${unpaidInvoice.total?.toFixed(2)} by {new Date(unpaidInvoice.dueDate).toLocaleDateString()}{' '}
          <button
            onClick={() => checkoutMutation.mutate(unpaidInvoice.id || unpaidInvoice._id)}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? 'Redirecting...' : '[Pay Now]'}
          </button>
        </div>
      )}

      <div>
        {!project ? (
          <div>
            <h2>No Active Projects</h2>
            <p>There are no active workspace timelines shared with your account yet.</p>
          </div>
        ) : (
          <div>
            {/* Project Hero */}
            <div>
              <h1>{project.title}</h1>
              <p>Dynamic Agency Delivery Workspace</p>
              <p><strong>Overall Progress:</strong> {pct}%</p>
              <PhaseTimeline phases={project.phases} />
            </div>

            <hr />

            {/* Split Deliverables & Chat */}
            <div>
              {/* Deliverables */}
              <div>
                <h3>Deliverables ({project.files?.length || 0})</h3>

                {!project.files || project.files.length === 0 ? (
                  <p>No files shared yet for review.</p>
                ) : (
                  <ul>
                    {project.files.map((file) => {
                      const isImg = file.filename?.match(/\.(jpeg|jpg|gif|png)/i) || file.cloudinaryUrl?.match(/\.(jpeg|jpg|gif|png)/i);
                      return (
                        <li key={file._id || file.id} style={{ margin: '16px 0', border: '1px solid #ccc', padding: '10px', listStyleType: 'none' }}>
                          <strong>{file.filename}</strong> [{file.approved ? 'Approved' : 'Awaiting review'}]
                          
                          {isImg && (
                            <img
                              src={file.cloudinaryUrl}
                              alt={file.filename}
                              style={{ maxWidth: 100, display: 'block', margin: '8px 0' }}
                            />
                          )}

                          <div style={{ marginTop: '8px' }}>
                            <a href={file.cloudinaryUrl} target="_blank" rel="noreferrer">[Download]</a>
                            {' '}
                            {file.approved ? (
                              <span style={{ color: 'green' }}>Approved</span>
                            ) : (
                              <>
                                <button onClick={() => handleRequestChangesClick(file._id || file.id)}>[Changes]</button>
                                <button onClick={() => handleApprove(file._id || file.id)}>[Approve]</button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <hr />

              {/* Discussions */}
              <div>
                <h3>Discussion</h3>
                <CommentThread
                  projectId={project._id || project.id}
                  initialComments={project.comments || []}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Changes Request Feedback Modal */}
      {rejectModalOpen && (
        <div style={{ border: '1px solid red', padding: '20px', margin: '20px 0' }}>
          <h3>Request adjustments</h3>
          <p>Describe the adjustments or feedback needed for this deliverable</p>

          <form onSubmit={handleRequestChangesSubmit}>
            <div>
              <label htmlFor="feedback_inp">Adjustment notes: </label>
              <textarea
                id="feedback_inp"
                required
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Please modify the primary color..."
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button type="submit">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
