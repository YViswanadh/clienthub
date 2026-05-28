import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  MoreVertical,
  Eye,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filter and Search State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Modal Fields
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [phasesInput, setPhasesInput] = useState([
    'Discovery',
    'Wireframes',
    'Design',
    'Development',
    'Launch & Feedback'
  ]);

  // Handle opening modal from query parameter (?create=true)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setCreateModalOpen(true);
    }
  }, [location]);

  // Queries & Mutations
  const { data: projects = [], isLoading } = useProjects();
  const createProjectMutation = useCreateProject();

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectName || !clientName || !dueDate) {
      alert('Please fill in all fields.');
      return;
    }

    // Format initial phases array
    const formattedPhases = phasesInput
      .filter((p) => p.trim() !== '')
      .map((name, index) => ({
        name: name.trim(),
        done: index === 0 ? true : false, // mark first done by default or all false
      }));

    const newProject = {
      name: projectName,
      clientName,
      dueDate,
      status: 'Active',
      phases: formattedPhases,
    };

    createProjectMutation.mutate(newProject, {
      onSuccess: (data) => {
        setCreateModalOpen(false);
        // Clear inputs
        setProjectName('');
        setClientName('');
        setDueDate('');
        // Redirect to detail page
        if (data?._id || data?.id) {
          navigate(`/projects/${data._id || data.id}`);
        }
      },
    });
  };

  const getProgress = (phases = []) => {
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  // Filter projects by Search Query & Tab
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && project.status?.toLowerCase() === 'active';
    if (activeTab === 'review') return matchesSearch && (project.status?.toLowerCase() === 'in review' || project.status?.toLowerCase() === 'review');
    if (activeTab === 'done') return matchesSearch && (project.status?.toLowerCase() === 'done' || project.status?.toLowerCase() === 'completed');

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-[#DCFCE7] text-[#15803D]';
      case 'in review':
      case 'review':
        return 'bg-[#DBEAFE] text-[#1D4ED8]';
      case 'done':
      case 'completed':
        return 'bg-[#F3F4F6] text-[#4B5563]';
      default:
        return 'bg-[#FEF3C7] text-[#D97706]';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

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
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-sans m-0">Projects</h1>
                <p className="text-xs text-[#6B7280]">
                  Track timeline phases and client reviews
                </p>
              </div>

              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Project
              </Button>
            </div>

            {/* Filter controls / Tabs row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              {/* Tab Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['all', 'active', 'review', 'done'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-primary-light text-primary'
                        : 'text-[#6B7280] hover:text-[#111111]'
                    }`}
                  >
                    {tab === 'review' ? 'In Review' : tab}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project or client..."
                  className="pl-10 rounded-lg text-sm focus-visible:ring-primary border-gray-200"
                />
              </div>
            </div>

            {/* Projects Content Grid */}
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <FolderKanban className="h-12 w-12 text-gray-200 mb-2" />
                <p className="text-sm font-bold text-[#111111]">No projects matched filters</p>
                <p className="text-xs text-[#6B7280]">Try searching for another keyword or check active status tabs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {filteredProjects.map((project) => {
                  const pct = getProgress(project.phases);
                  const activePhase = project.phases?.find((p) => !p.done)?.name || 'Completed';

                  return (
                    <Card
                      key={project.id || project._id}
                      className="border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <CardHeader className="p-5 pb-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(project.status)}`}>
                            {project.status || 'Active'}
                          </span>
                          
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[#6B7280] hover:text-[#111111] rounded-full">
                            <Link to={`/projects/${project.id || project._id}`}>
                              <Eye className="h-4.5 w-4.5" />
                            </Link>
                          </Button>
                        </div>
                        <CardTitle className="text-base font-bold text-[#111111] hover:text-primary mt-2">
                          <Link to={`/projects/${project.id || project._id}`}>
                            {project.name}
                          </Link>
                        </CardTitle>
                        <p className="text-xs text-[#6B7280] font-medium leading-none">
                          Client: <span className="font-semibold text-[#111111]">{project.clientName}</span>
                        </p>
                      </CardHeader>

                      <CardContent className="p-5 pt-0 space-y-4">
                        {/* Progress Section */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280]">
                            <span>Current Phase: {activePhase}</span>
                            <span className="text-primary font-extrabold">{pct}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="p-5 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-[#6B7280] font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          Due: {formatDate(project.dueDate)}
                        </span>
                        
                        <Link to={`/projects/${project.id || project._id}`} className="text-primary font-bold hover:underline flex items-center gap-0.5">
                          Open Portal
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Dialog Create Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogContent className="sm:max-w-lg p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-[#111111] flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Create New Project
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6B7280]">
                    Scaffold a new project workflow and client deliverables timeline
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateProject} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="proj_name" className="text-xs font-semibold text-[#6B7280]">Project Name</Label>
                    <Input
                      id="proj_name"
                      placeholder="e.g. Acme SaaS Redesign"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                      className="rounded-lg text-sm focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="client_name" className="text-xs font-semibold text-[#6B7280]">Client Name / Company</Label>
                    <Input
                      id="client_name"
                      placeholder="e.g. Acme Corporation"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      className="rounded-lg text-sm focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proj_due" className="text-xs font-semibold text-[#6B7280]">Launch / Due Date</Label>
                    <Input
                      id="proj_due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="rounded-lg text-sm focus-visible:ring-primary"
                    />
                  </div>

                  {/* Standard Timeline Reminder */}
                  <div className="flex items-start gap-2 bg-primary-light/50 border border-[#EEEDFE] rounded-lg p-3 text-xs text-[#6B7280] leading-relaxed">
                    <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-primary">Timeline Pipeline:</span> Will be initialized with 5 core phases: Discovery, Wireframes, Design, Development, Launch. You can toggle/complete them dynamically inside the project's dashboard.
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCreateModalOpen(false)}
                      className="rounded-lg text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProjectMutation.isPending}
                      className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs px-6"
                    >
                      {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
  );
}
