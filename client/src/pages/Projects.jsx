import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';

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
      status: 'Active',
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
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  const filteredProjects = projects.filter((project) => {
    const nameToSearch = project.name || project.title || '';
    const matchesSearch =
      nameToSearch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && project.status?.toLowerCase() === 'active';
    if (activeTab === 'review') return matchesSearch && (project.status?.toLowerCase() === 'in review' || project.status?.toLowerCase() === 'review');
    if (activeTab === 'done') return matchesSearch && (project.status?.toLowerCase() === 'done' || project.status?.toLowerCase() === 'completed');

    return matchesSearch;
  });

  return (
    <div>
      <div>
        <h1>Projects</h1>
        <p>Track timeline phases and client reviews</p>
        <button onClick={() => setCreateModalOpen(true)}>[New Project]</button>
      </div>

      <div>
        <div>
          {['all', 'active', 'review', 'done'].map((tab) => (
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
          <label htmlFor="search">Search: </label>
          <input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project or client..."
          />
        </div>
      </div>

      {isLoading ? (
        <p>Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <p>No projects matched filters.</p>
      ) : (
        <ul>
          {filteredProjects.map((project) => {
            const pct = getProgress(project.phases);
            const activePhase = project.phases?.find((p) => !p.done)?.name || 'Completed';

            return (
              <li key={project.id || project._id} style={{ margin: '16px 0', listStyleType: 'none', border: '1px solid #ccc', padding: '10px' }}>
                <div>
                  <strong>{project.name || project.title}</strong> [{project.status || 'Active'}]
                </div>
                <p>Client: {project.clientName || 'N/A'}</p>
                <p>Current Phase: {activePhase} ({pct}%)</p>
                <p>Due Date: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</p>
                <div>
                  <Link to={`/projects/${project.id || project._id}`}>[Open Portal]</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {createModalOpen && (
        <div style={{ border: '1px solid black', padding: '20px', margin: '20px 0' }}>
          <h3>Create New Project</h3>
          <form onSubmit={handleCreateProject}>
            <div>
              <label>Project Name: </label>
              <input
                placeholder="e.g. Acme SaaS Redesign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Client Name / Company: </label>
              <input
                placeholder="e.g. Acme Corporation"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Launch / Due Date: </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" onClick={() => setCreateModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
