import React, { useState } from 'react';
import { useProjects, useApproveFile } from '../hooks/useProjects';
import { useInvoices, useCheckoutInvoice } from '../hooks/useInvoices';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PhaseTimeline from '../components/PhaseTimeline';
import CommentThread from '../components/CommentThread';
import {
  ShieldAlert,
  Files,
  MessageSquare,
  Check,
  X,
  Download,
  AlertTriangle,
  FolderKanban,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export default function ClientPortal() {
  const { user } = useAuth();
  
  // Queries
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Active Project (first one returned in client scope)
  const project = projects[0];

  // Active Unpaid Invoice for the banner
  const unpaidInvoice = invoices.find((inv) => inv.status?.toLowerCase() === 'unpaid');

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
    approveFileMutation.mutate({ fileId, status: 'approved' });
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
      { fileId: selectedFileId, status: 'changes_requested' },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
        },
      }
    );
  };

  const getFileBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-[#DCFCE7] text-[#15803D] border-none hover:bg-[#DCFCE7]">Approved</Badge>;
      case 'changes_requested':
        return <Badge className="bg-[#FEF3C7] text-[#D97706] border-none hover:bg-[#FEF3C7]">Changes Requested</Badge>;
      default:
        return <Badge className="bg-[#F3F4F6] text-[#4B5563] border-none hover:bg-[#F3F4F6]">Pending Review</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  if (loadingProjects || loadingInvoices) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F8F8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-12">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Unpaid Invoice Amber Alert Banner */}
        {unpaidInvoice && (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl shadow-sm text-sm text-[#92400E] animate-fadeIn">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-[#D97706] shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold">Outstanding Invoice Due</p>
                <p className="text-xs text-[#B45309]">
                  Invoice {unpaidInvoice.invoiceNumber} for{' '}
                  <span className="font-semibold">${unpaidInvoice.amount?.toLocaleString()}</span> is due on{' '}
                  {formatDate(unpaidInvoice.dueDate)}.
                </p>
              </div>
            </div>

            <Button
              onClick={() => checkoutMutation.mutate(unpaidInvoice.id || unpaidInvoice._id)}
              disabled={checkoutMutation.isPending}
              className="bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-bold shrink-0 shadow-sm"
            >
              {checkoutMutation.isPending ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  Pay Now
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </div>
        )}

        {!project ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <FolderKanban className="h-12 w-12 text-gray-200 mb-2" />
            <h2 className="text-lg font-bold text-[#111111]">No Active Projects</h2>
            <p className="text-xs text-[#6B7280]">There are no active workspace timelines shared with your account yet.</p>
          </div>
        ) : (
          /* Client Portal Content */
          <div className="space-y-6">
            
            {/* Project Overview Card */}
            <Card className="border border-gray-100 bg-white rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="p-5 pb-2 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold text-[#111111]">{project.name}</CardTitle>
                  <Badge className="bg-[#DCFCE7] text-[#15803D] hover:bg-[#DCFCE7] border-none">
                    Project Pipeline Active
                  </Badge>
                </div>
                <CardDescription className="text-xs text-[#6B7280]">
                  Overall completion rate: <span className="font-semibold text-primary">{getProgress(project.phases)}%</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="border border-gray-100 rounded-xl p-5 bg-[#F8F8F8]/40">
                  <PhaseTimeline phases={project.phases} compact={false} />
                </div>
              </CardContent>
            </Card>

            {/* Split View Columns: Assets & Discussions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Shared Assets to Approve */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-[#111111]">
                  <Files className="h-4.5 w-4.5 text-primary" />
                  <span>Deliverables Review Hub</span>
                </div>

                {!project.files || project.files.length === 0 ? (
                  <Card className="border border-gray-100 bg-white rounded-xl p-6 text-center text-xs text-[#6B7280]">
                    No files shared yet for review.
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {project.files.map((file, fIdx) => (
                      <Card
                        key={file.id || file._id || fIdx}
                        className="border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-[#6B7280] font-semibold">
                              Uploaded: {formatDate(file.uploadedAt || file.date)}
                            </span>
                            {getFileBadge(file.status)}
                          </div>
                          <CardTitle className="text-sm font-bold text-[#111111] truncate mt-1">
                            {file.name}
                          </CardTitle>
                        </CardHeader>

                        {/* Thumbnail View (If Image) */}
                        <CardContent className="p-4 pt-0">
                          {file.url?.match(/\.(jpeg|jpg|gif|png)/i) || file.url?.startsWith('blob:') ? (
                            <div className="h-32 w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-20 w-full rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-[#6B7280] text-xs font-semibold gap-1.5">
                              <Files className="h-5 w-5" />
                              <span>Document deliverables</span>
                            </div>
                          )}
                        </CardContent>

                        {/* Actions Footer */}
                        <CardFooter className="p-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between gap-2">
                          <Button variant="ghost" size="sm" asChild className="text-[#6B7280] hover:text-[#111111] text-xs gap-1">
                            <a href={file.url} target="_blank" rel="noreferrer">
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                          </Button>

                          {file.status === 'pending' && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleRequestChangesClick(file.id || file._id || fIdx)}
                                className="bg-white border border-[#FEE2E2] hover:bg-[#FEF2F2] text-[#EF4444] rounded-lg text-xs py-1 px-3"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Changes
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(file.id || file._id || fIdx)}
                                className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs py-1 px-3"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Discussions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-[#111111]">
                  <MessageSquare className="h-4.5 w-4.5 text-primary" />
                  <span>Real-time Chat Portal</span>
                </div>

                <CommentThread
                  projectId={project.id || project._id}
                  initialComments={project.comments || []}
                />
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Changes Request Feedback Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#111111]">Request File Changes</DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Describe the adjustments or feedback needed for this deliverable
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestChangesSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label htmlFor="feedback_inp" className="text-xs font-semibold text-[#6B7280]">Adjustments Feedback</label>
              <textarea
                id="feedback_inp"
                required
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Please modify the primary fonts to Inter and increase the hero padding..."
                className="w-full p-3 rounded-lg border border-gray-200 focus:border-primary text-sm font-sans focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg text-xs px-6"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
