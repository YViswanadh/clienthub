import React, { useState, useEffect } from 'react';
import { useProjects, useApproveFile } from '../hooks/useProjects';
import { useInvoices, useCheckoutInvoice } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PhaseTimeline from '../components/PhaseTimeline';
import CommentThread from '../components/CommentThread';
import {
  AlertCircle,
  Download,
  FolderKanban,
  FileText,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

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

  // Circular progress SVG animation tracking
  const [progressOffset, setProgressOffset] = useState(188.5);

  const getProgress = (phases = []) => {
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  useEffect(() => {
    if (project) {
      const pct = getProgress(project.phases);
      const targetOffset = 188.5 * (1 - pct / 100);
      const timer = setTimeout(() => {
        setProgressOffset(targetOffset);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [project]);

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

    // Call approveFileMutation to mark as changes requested (or reject/unapprove)
    approveFileMutation.mutate(
      { fileId: selectedFileId, approved: false, feedback },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
        },
      }
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loadingProjects || loadingInvoices) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F8F8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--brand-color, var(--electric))' }}></div>
      </div>
    );
  }

  const pct = project ? getProgress(project.phases) : 0;

  return (
    <div className="min-h-screen bg-[#F7F7FB] pb-12">
      <Navbar />

      {/* Top Banner (Payment Due) */}
      {unpaidInvoice && (
        <div
          className="w-full flex items-center justify-between px-6 py-3 text-xs"
          style={{
            background: 'linear-gradient(135deg, #FEF3DC 0%, #FDE8B4 100%)',
            borderBottom: '1px solid rgba(240, 160, 48, 0.3)',
            color: '#92400E',
            fontSize: '13px',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-[#F0A030] shrink-0" />
            <span>
              Payment due — <strong>${unpaidInvoice.total?.toFixed(2)}</strong> by{' '}
              {formatDate(unpaidInvoice.dueDate)}
            </span>
          </div>
          <button
            onClick={() => checkoutMutation.mutate(unpaidInvoice.id || unpaidInvoice._id)}
            disabled={checkoutMutation.isPending}
            className="btn-accent text-[11px] font-semibold py-1 px-3"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {checkoutMutation.isPending ? 'Redirecting...' : 'Pay now →'}
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {!project ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <FolderKanban className="h-12 w-12 text-gray-200 mb-2" />
            <h2 className="text-lg font-bold text-[#111111] m-0">No Active Projects</h2>
            <p className="text-xs text-[#6B7280] mt-1 m-0">There are no active workspace timelines shared with your account yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Hero Card */}
            <Card
              className="card overflow-hidden"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-[#0E0E1A] tracking-tight m-0">{project.title}</h1>
                  <p className="text-sm text-slate-500 mt-1 m-0">Dynamic Agency Delivery Workspace</p>
                  <span className="badge-active mt-2.5 inline-block">
                    Project Pipeline Active
                  </span>
                </div>

                {/* Circular Progress Ring SVG */}
                <div className="relative h-[72px] w-[72px] shrink-0">
                  <svg className="h-full w-full -rotate-90">
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="transparent"
                      stroke="var(--border-light)"
                      strokeWidth="5"
                    />
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      fill="transparent"
                      stroke="var(--brand-color, var(--electric))"
                      strokeWidth="5"
                      strokeDasharray="188.5"
                      strokeDashoffset={progressOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[18px] font-semibold text-[#0E0E1A]" style={{ letterSpacing: '-0.02em' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Phase Timeline Component */}
              <div className="border-t pt-6" style={{ borderColor: 'var(--border-light)' }}>
                <PhaseTimeline phases={project.phases} compact={false} />
              </div>
            </Card>

            {/* Split Deliverables Grid & Discussion Column */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deliverables Column */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#0E0E1A] m-0">Deliverables</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {project.files?.length || 0}
                  </span>
                </div>

                {!project.files || project.files.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#94A3C8] bg-white border rounded-xl" style={{ borderColor: 'var(--border-light)' }}>
                    No files shared yet for review.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {project.files.map((file) => {
                      const isImg = file.filename?.match(/\.(jpeg|jpg|gif|png)/i) || file.cloudinaryUrl?.match(/\.(jpeg|jpg|gif|png)/i);
                      return (
                        <div
                          key={file._id || file.id}
                          className="group bg-white border overflow-hidden flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5"
                          style={{
                            borderColor: 'var(--border-light)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-xs)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                          }}
                        >
                          {/* File Preview */}
                          <div className="relative h-[100px] w-full shrink-0 border-b overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
                            {isImg ? (
                              <img
                                src={file.cloudinaryUrl}
                                alt={file.filename}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                                <FileText className="h-8 w-8 text-slate-400" />
                              </div>
                            )}

                            {/* Status Chip */}
                            <div className="absolute top-2 right-2">
                              <span className={file.approved ? 'badge-active' : 'badge-review'}>
                                {file.approved ? 'Approved' : 'Awaiting review'}
                              </span>
                            </div>
                          </div>

                          {/* Body details */}
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-[#0E0E1A] truncate max-w-full m-0" title={file.filename}>
                                {file.filename}
                              </p>
                              <span className="text-[10px] text-[#94A3B8] block">
                                {formatFileSize(file.size)}
                              </span>
                            </div>

                            {/* Bottom row actions */}
                            <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                              <a
                                href={file.cloudinaryUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-7 w-7 items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer no-underline"
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </a>

                              {file.approved ? (
                                <div className="flex items-center gap-1 text-xs font-semibold text-[#047857]">
                                  <Check className="h-4 w-4" style={{ strokeWidth: 3 }} />
                                  <span>Approved</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleRequestChangesClick(file._id || file.id)}
                                    className="btn-ghost text-[10px] font-semibold py-1 px-2.5"
                                  >
                                    Changes
                                  </button>
                                  <button
                                    onClick={() => handleApprove(file._id || file.id)}
                                    className="text-[10px] font-semibold py-1 px-2.5 rounded-md border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                                    style={{
                                      backgroundColor: 'var(--mint-light)',
                                      color: '#047857',
                                    }}
                                  >
                                    Approve
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Discussions Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#0E0E1A] m-0">Discussion</h3>
                </div>

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
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md p-6" style={{ borderRadius: 'var(--radius-lg)' }}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0E0E1A] m-0">Request adjustments</DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280] mt-1">
              Describe the adjustments or feedback needed for this deliverable
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestChangesSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label htmlFor="feedback_inp" className="text-xs font-semibold text-slate-500">Adjustment notes</label>
              <textarea
                id="feedback_inp"
                required
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Please modify the primary color to Inter and increase the hero padding..."
                className="w-full p-3 rounded-lg border outline-none text-xs font-sans focus:border-slate-500"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <DialogFooter className="pt-4 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs font-semibold py-2 px-5 rounded-md border-none cursor-pointer hover:opacity-90 transition-all text-white"
                style={{
                  backgroundColor: 'var(--ember)',
                }}
              >
                Submit Request
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
