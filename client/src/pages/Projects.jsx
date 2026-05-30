import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import Badge from '../components/ui/badge';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();

  // Filter and Search State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Modal Fields
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [phasesInput] = useState([
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

    const formattedPhases = phasesInput
      .filter((p) => p.trim() !== '')
      .map((name, index) => ({
        name: name.trim(),
        done: index === 0 ? true : false,
      }));

    const newProject = {
      name: projectName,
      clientName,
      dueDate,
      status: 'active',
      phases: formattedPhases,
    };

    createProjectMutation.mutate(newProject, {
      onSuccess: (data) => {
        setCreateModalOpen(false);
        setProjectName('');
        setClientName('');
        setDueDate('');
        if (data?._id || data?.id) {
          navigate(`/projects/${data._id || data.id}`);
        }
      },
    });
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

  const filteredProjects = projects.filter((project) => {
    const nameToSearch = project.name || project.title || '';
    const matchesSearch =
      nameToSearch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && (project.status?.toLowerCase() === 'active' || project.status?.toLowerCase() === 'in-progress');
    if (activeTab === 'review') return matchesSearch && (project.status?.toLowerCase() === 'in review' || project.status?.toLowerCase() === 'review');
    if (activeTab === 'done') return matchesSearch && (project.status?.toLowerCase() === 'done' || project.status?.toLowerCase() === 'completed');

    return matchesSearch;
  });

  return (
    <div className="space-y-12 w-full font-body-md">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
            Workspaces
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Track design milestones, timeline checkouts, and project deliveries.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} variant="primary" iconLeft="add">
          New Project
        </Button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Tab Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar select-none">
          {['all', 'active', 'review', 'done'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-DEFAULT transition-all cursor-pointer border
                ${activeTab === tab
                  ? 'bg-secondary-container text-on-secondary-container border-secondary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high border-transparent hover:text-primary'
                }
              `}
            >
              {tab === 'review' ? 'In Review' : tab}
            </button>
          ))}
        </div>

        {/* Search Input field */}
        <div className="w-full md:max-w-xs">
          <Input
            id="project-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            iconLeft="search"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <p className="py-8 text-on-surface-variant">Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <div className="border border-outline-variant bg-surface-container-low p-12 text-center rounded-DEFAULT">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">folder_open</span>
          <p className="font-headline-md text-headline-md text-primary mb-2">No projects found</p>
          <p className="text-sm text-on-surface-variant mb-6">Modify your filter keywords or onboard your first client project.</p>
          <Button onClick={() => setCreateModalOpen(true)} variant="secondary" iconLeft="add">
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const pct = getProgress(project.phases);
            const activePhase = project.phases?.find((p) => !p.done)?.name || 'Completed';

            return (
              <div
                key={project.id || project._id}
                className="border border-outline-variant bg-surface-container-lowest p-6 rounded-DEFAULT transition-all duration-150 hover:border-primary flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={getBadgeVariant(project.status)}>
                      {project.status || 'Active'}
                    </Badge>
                    <Link
                      to={`/projects/${project.id || project._id}`}
                      className="text-on-surface-variant hover:text-primary p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </Link>
                  </div>

                  <h3 className="font-headline-md text-headline-md text-primary mb-3">
                    <Link to={`/projects/${project.id || project._id}`} className="hover:text-secondary transition-colors">
                      {project.name || project.title}
                    </Link>
                  </h3>

                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-6">
                    Client: <span className="font-bold text-primary">{project.clientName}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Progress Line */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                      <span>Phase: {activePhase}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-outline-variant pt-4 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                    <Link
                      to={`/projects/${project.id || project._id}`}
                      className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider font-semibold"
                    >
                      Open Portal
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal Form overlay */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-6">
          <Input
            label="Project Name"
            id="proj_name"
            placeholder="e.g. Acme SaaS Redesign"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            iconLeft="drive_file_rename_outline"
          />

          <Input
            label="Client Name / Company"
            id="client_name"
            placeholder="e.g. Acme Corporation"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            iconLeft="domain"
          />

          <Input
            label="Launch / Due Date"
            id="proj_due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            iconLeft="calendar_today"
          />

          <div className="p-4 border border-outline-variant bg-surface-container-low flex items-start gap-3 rounded-DEFAULT">
            <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">info</span>
            <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
              <strong className="text-primary uppercase tracking-wider">Milestone Workflow:</strong> Project will be pre-loaded with 5 workspace phases: Discovery, Wireframes, Design, Development, and Launch.
            </p>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <Button onClick={() => setCreateModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary" iconLeft="check" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
