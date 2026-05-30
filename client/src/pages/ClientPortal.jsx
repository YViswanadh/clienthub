import React, { useState } from 'react';
import { useProjects, useApproveFile } from '../hooks/useProjects';
import { useInvoices, useCheckoutInvoice } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import PhaseTimeline from '../components/PhaseTimeline';
import CommentThread from '../components/CommentThread';
import Button from '../components/ui/button';
import Badge from '../components/ui/badge';
import Modal from '../components/ui/modal';

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
    if (!phases || phases.length === 0) return 0;
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
    return (
      <div className="py-12 text-center text-on-surface-variant font-body-lg">
        Loading client workspace details...
      </div>
    );
  }

  const pct = project ? getProgress(project.phases) : 0;

  // Mock project files for premium UI if none are loaded yet
  const displayFiles = project?.files || [
    { _id: 'file-1', filename: 'Layout Strategy & Mockups.png', approved: true, cloudinaryUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80' },
    { _id: 'file-2', filename: 'Agency Deliverable Scope V2.pdf', approved: false, cloudinaryUrl: '#' }
  ];

  return (
    <div className="space-y-12 w-full font-body-md">
      {/* Top Banner (Payment Due) - Glassmorphism style */}
      {unpaidInvoice && (
        <div className="p-6 border border-error-container bg-error-container/30 text-on-error-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-DEFAULT">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            <div>
              <p className="font-semibold text-base">Payment Transaction Due</p>
              <p className="text-sm mt-0.5 opacity-90">
                Amount of **${unpaidInvoice.amount || unpaidInvoice.total?.toFixed(2)}** is due by {new Date(unpaidInvoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => checkoutMutation.mutate(unpaidInvoice.id || unpaidInvoice._id)}
            disabled={checkoutMutation.isPending}
            className="w-full sm:w-auto"
          >
            {checkoutMutation.isPending ? 'Redirecting...' : 'Pay Invoice'}
          </Button>
        </div>
      )}

      {!project ? (
        <div className="border border-outline-variant bg-surface-container-lowest p-12 text-center max-w-2xl mx-auto rounded-DEFAULT">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">folder_open</span>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">No Active Workspaces</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            There are currently no active project workspaces or delivery timelines shared with your account.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Project Hero Header */}
          <section className="pb-8 border-b border-outline-variant">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2 select-none">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Workspace</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{project.clientName || 'Partner'}</span>
                </div>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
                  {project.title}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  Dynamic Agency Delivery Portal. Track project milestones, download finalize assets, and comment with members.
                </p>
              </div>
              <div className="flex items-center gap-3 select-none">
                <Badge variant="in-progress">Active</Badge>
                <div className="font-mono font-medium text-on-surface text-base bg-surface-container-high px-3 py-1.5 rounded-DEFAULT border border-outline-variant">
                  {pct}% Progress
                </div>
              </div>
            </div>
            
            {/* Phase Timeline Render */}
            <div className="pt-4">
              <PhaseTimeline phases={project.phases} />
            </div>
          </section>

          {/* Split Deliverables & Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Deliverables Panel (70%) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="border-b border-outline-variant pb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Shared Assets & Deliverables ({displayFiles.length})
                </h3>
              </div>

              {displayFiles.length === 0 ? (
                <p className="py-8 text-on-surface-variant">No files shared yet for review.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {displayFiles.map((file) => {
                    const isImg = file.filename?.match(/\.(jpeg|jpg|gif|png)/i) || file.cloudinaryUrl?.match(/\.(jpeg|jpg|gif|png)/i);
                    const isApproved = file.approved;
                    
                    return (
                      <div 
                        key={file._id || file.id} 
                        className="border border-outline-variant bg-surface-container-lowest rounded-DEFAULT flex flex-col justify-between overflow-hidden"
                      >
                        {/* Image Preview or placeholder file header */}
                        {isImg ? (
                          <div className="h-44 bg-surface-variant overflow-hidden border-b border-outline-variant relative">
                            <img
                              src={file.cloudinaryUrl}
                              alt={file.filename}
                              className="w-full h-full object-cover"
                            />
                            {isApproved && (
                              <div className="absolute top-3 right-3 bg-secondary text-on-secondary px-2.5 py-1 rounded-DEFAULT font-label-sm text-label-sm uppercase font-semibold border border-secondary tracking-wider">
                                Approved
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-44 bg-surface-container flex flex-col items-center justify-center border-b border-outline-variant relative select-none">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">description</span>
                            {isApproved && (
                              <div className="absolute top-3 right-3 bg-secondary text-on-secondary px-2.5 py-1 rounded-DEFAULT font-label-sm text-label-sm uppercase font-semibold border border-secondary tracking-wider">
                                Approved
                              </div>
                            )}
                          </div>
                        )}

                        {/* File Details & actions */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <p className="font-semibold text-primary truncate" title={file.filename}>
                              {file.filename}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 uppercase tracking-wider font-semibold">
                              {isApproved ? 'Ready for production' : 'Awaiting client sign-off'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <a 
                              href={file.cloudinaryUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex-1"
                            >
                              <Button variant="secondary" iconLeft="download" className="w-full">
                                Download
                              </Button>
                            </a>
                            {!isApproved && (
                              <>
                                <Button 
                                  variant="secondary" 
                                  iconLeft="cancel" 
                                  onClick={() => handleRequestChangesClick(file._id || file.id)}
                                >
                                  Notes
                                </Button>
                                <Button 
                                  variant="primary" 
                                  iconLeft="check_circle" 
                                  onClick={() => handleApprove(file._id || file.id)}
                                >
                                  Approve
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discussions / Comments panel (30%) */}
            <div className="lg:col-span-4 border-l-0 lg:border-l border-outline-variant pl-0 lg:pl-12 pt-8 lg:pt-0">
              <div className="border-b border-outline-variant pb-4 mb-6">
                <h3 className="font-headline-md text-headline-md text-on-surface">Discussion</h3>
              </div>
              <CommentThread
                projectId={project._id || project.id}
                initialComments={project.comments || []}
              />
            </div>
          </div>
        </div>
      )}

      {/* Changes Request Notes Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Request Deliverable Adjustments"
      >
        <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
          Provide adjustments or feedback needed for this asset. Members will be notified and an alert will be flagged on this item.
        </p>

        <form onSubmit={handleRequestChangesSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="feedback_inp">
              Adjustment Notes
            </label>
            <textarea
              id="feedback_inp"
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Please modify the primary typography spacing..."
              className="w-full p-4 bg-surface-bright border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-0 focus:outline-none transition-colors duration-150 rounded-DEFAULT"
            />
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Notes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
