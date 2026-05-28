import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject, useUpdateProject } from '../hooks/useProjects';
import { useInvoices, useCreateInvoice } from '../hooks/useInvoices';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PhaseTimeline from '../components/PhaseTimeline';
import FileUploader from '../components/FileUploader';
import CommentThread from '../components/CommentThread';
import {
  ArrowLeft,
  Files,
  MessageSquare,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Download,
  Check,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Tabs: 'files' | 'discussion' | 'invoices'
  const [activeTab, setActiveTab] = useState('files');

  // Queries
  const { data: project, isLoading, error } = useProject(id);
  const { data: invoices = [] } = useInvoices();
  const updateProjectMutation = useUpdateProject();
  const createInvoiceMutation = useCreateInvoice();

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F8F8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F8F8F8] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-[#EF4444] mb-3" />
        <h2 className="text-xl font-bold text-[#111111]">Project Not Found</h2>
        <p className="text-sm text-[#6B7280] mb-4">We couldn't retrieve the requested project detail.</p>
        <Button asChild className="bg-primary text-white">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const progressPct = getProgress(project.phases);

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onToggleCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
        />

        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'md:pl-22' : 'md:pl-66'
          }`}
        >
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header controls & Back buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/projects')}
                  className="rounded-lg h-9 w-9 border-gray-200 hover:bg-gray-50 text-[#6B7280]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#111111] font-sans m-0">{project.name}</h1>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-primary-light text-primary px-2 py-0.5 rounded">
                      {project.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] font-medium leading-none">
                    Client portal: <span className="font-semibold text-primary">{project.clientName}</span>
                  </p>
                </div>
              </div>

              {/* Status toggles */}
              <div className="flex items-center gap-2">
                {['Active', 'Review', 'Done'].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={project.status?.toLowerCase() === st.toLowerCase() ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(st)}
                    className={`rounded-lg text-[10px] uppercase font-bold tracking-wider ${
                      project.status?.toLowerCase() === st.toLowerCase()
                        ? 'bg-primary text-white hover:bg-primary/95'
                        : 'border-gray-200 text-[#6B7280] hover:bg-gray-50'
                    }`}
                  >
                    {st === 'Review' ? 'In Review' : st}
                  </Button>
                ))}
              </div>
            </div>

            {/* Timeline Stepper Panel */}
            <Card className="border border-gray-100 bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#111111]">Interactive Pipeline Timeline</CardTitle>
                <CardDescription className="text-xs text-[#6B7280]">
                  Click on any step node below to instantly toggle its completion state
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="border border-[#EEEDFE] bg-[#F8F8F8]/50 rounded-xl p-6 flex flex-col items-center">
                  
                  {/* Dynamic Phase Stepper */}
                  <div className="w-full flex items-center justify-between py-6">
                    <div className="w-full flex items-center">
                      {project.phases?.map((phase, idx) => {
                        const isDone = phase.done;
                        const activeIndex = project.phases.findIndex((p) => !p.done);
                        const isActive = idx === activeIndex;

                        const hasNext = idx < project.phases.length - 1;
                        const nextIsDone = hasNext && project.phases[idx + 1].done;
                        const lineIsPurple = isDone && (nextIsDone || idx === activeIndex - 1);

                        return (
                          <React.Fragment key={idx}>
                            {/* Node */}
                            <div
                              onClick={() => handleTogglePhase(idx)}
                              className="flex flex-col items-center relative z-10 cursor-pointer group"
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                  isDone
                                    ? 'bg-primary border-primary text-white shadow-sm group-hover:scale-105'
                                    : isActive
                                    ? 'bg-primary border-primary text-white shadow-sm ring-4 ring-primary-light group-hover:scale-105'
                                    : 'bg-white border-gray-300 text-gray-400 group-hover:border-primary/50'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="h-4.5 w-4.5 stroke-[3]" />
                                ) : isActive ? (
                                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                ) : (
                                  <span className="text-xs font-semibold">{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`absolute top-10 whitespace-nowrap text-xs font-medium transition-all duration-300 ${
                                  isDone
                                    ? 'text-primary font-semibold'
                                    : isActive
                                    ? 'text-primary font-bold'
                                    : 'text-[#6B7280]'
                                }`}
                              >
                                {phase.name}
                              </span>
                            </div>

                            {/* Connector line */}
                            {hasNext && (
                              <div className="flex-1 h-0.5 relative mx-2">
                                <div
                                  className={`absolute inset-0 transition-all duration-500 ${
                                    lineIsPurple ? 'bg-primary' : 'bg-gray-200'
                                  }`}
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-primary mt-12 bg-primary-light px-3 py-1 rounded-full uppercase tracking-wider">
                    Timeline overall progress is at {progressPct}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Split View Tabs: Files, Comments, Invoices */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Vertical Tab Navigation */}
              <div className="space-y-1.5">
                {[
                  { id: 'files', name: 'Deliverables & Files', icon: Files },
                  { id: 'discussion', name: 'Project ChatRoom', icon: MessageSquare },
                  { id: 'invoices', name: 'Project Invoices', icon: Receipt },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-colors border ${
                        activeTab === tab.id
                          ? 'bg-white border-[#EEEDFE] text-primary shadow-sm'
                          : 'border-transparent text-[#6B7280] hover:bg-white hover:text-[#111111]'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'text-primary' : 'text-[#6B7280]'}`} />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              {/* Tab Display Panel */}
              <div className="md:col-span-3">
                {activeTab === 'files' && (
                  <div className="space-y-4">
                    {/* Upload File Panel */}
                    <Card className="border border-gray-100 bg-white rounded-xl shadow-sm p-5 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#111111]">Upload Deliverables</h3>
                        <p className="text-xs text-[#6B7280]">Share image mockups, layouts, documents or brand assets with client</p>
                      </div>
                      <FileUploader
                        projectId={id}
                        onUploadSuccess={handleFileUploadSuccess}
                      />
                    </Card>

                    {/* Shared Files List */}
                    <Card className="border border-gray-100 bg-white rounded-xl shadow-sm p-5">
                      <h3 className="text-sm font-bold text-[#111111] mb-3">Project Assets Repository</h3>
                      
                      {!project.files || project.files.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[#6B7280]">
                          No files uploaded yet for this project.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {project.files.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between border border-gray-50 rounded-xl p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-[#111111] truncate max-w-sm">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-[#6B7280]">
                                  Shared: {formatDate(file.uploadedAt || file.date)}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                {getFileBadge(file.status)}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-[#6B7280] hover:text-[#111111] rounded-full"
                                  asChild
                                >
                                  <a href={file.url} target="_blank" rel="noreferrer" title="Download">
                                    <Download className="h-4.5 w-4.5" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {activeTab === 'discussion' && (
                  <CommentThread
                    projectId={id}
                    initialComments={project.comments || []}
                  />
                )}

                {activeTab === 'invoices' && (
                  <Card className="border border-gray-100 bg-white rounded-xl shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-[#111111]">Billing Ledger</h3>
                        <p className="text-xs text-[#6B7280]">Invoices created for {project.clientName}</p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs"
                      >
                        <Link to="/invoices">
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          New Invoice
                        </Link>
                      </Button>
                    </div>

                    {projectInvoices.length === 0 ? (
                      <div className="text-center py-8 text-xs text-[#6B7280]">
                        No invoices generated for this project.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projectInvoices.map((inv) => (
                          <div
                            key={inv.id || inv._id}
                            className="flex items-center justify-between border border-gray-100 rounded-xl p-4 bg-white hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-[#111111]">
                                {inv.invoiceNumber}
                              </p>
                              <p className="text-[10px] text-[#6B7280]">
                                Due Date: {formatDate(inv.dueDate)}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-extrabold text-[#111111]">
                                ${inv.amount?.toLocaleString()}
                              </span>
                              <Badge
                                className={`border-none hover:opacity-90 uppercase text-[9px] font-bold ${
                                  inv.status?.toLowerCase() === 'paid'
                                    ? 'bg-[#DCFCE7] text-[#15803D]'
                                    : 'bg-[#FEF3C7] text-[#D97706]'
                                }`}
                              >
                                {inv.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
