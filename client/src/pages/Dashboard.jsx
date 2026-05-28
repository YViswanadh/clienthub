import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FolderKanban,
  CheckCircle2,
  Receipt,
  Users,
  MoreVertical,
  Eye,
  Trash2,
  Edit2,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Queries
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Derived Metrics
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  
  // Calculate files pending review across all projects
  const pendingReviewsCount = projects.reduce((total, p) => {
    const pendingFiles = p.files?.filter((f) => f.status === 'pending') || [];
    return total + pendingFiles.length;
  }, 0);

  const unpaidInvoicesCount = invoices.filter((i) => i.status === 'unpaid').length;
  
  // Unique client names/IDs
  const uniqueClientsCount = new Set(projects.map((p) => p.client?.id || p.client?._id || p.clientName)).size || 0;

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  // Calculate Progress Percent
  const getProgress = (phases = []) => {
    if (phases.length === 0) return 0;
    const doneCount = phases.filter((p) => p.done).length;
    return Math.round((doneCount / phases.length) * 100);
  };

  // Status Badge styling helper
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-[#DCFCE7] text-[#15803D] border-none hover:bg-[#DCFCE7]">Active</Badge>;
      case 'in review':
      case 'review':
        return <Badge className="bg-[#DBEAFE] text-[#1D4ED8] border-none hover:bg-[#DBEAFE]">In Review</Badge>;
      case 'done':
      case 'completed':
        return <Badge className="bg-[#F3F4F6] text-[#4B5563] border-none hover:bg-[#F3F4F6]">Done</Badge>;
      default:
        return <Badge className="bg-[#FEF3C7] text-[#D97706] border-none hover:bg-[#FEF3C7]">{status}</Badge>;
    }
  };

  // Mock Activity Feed (always fully styled and ready)
  const activities = [
    { id: 1, type: 'file', dotColor: 'bg-blue-500', text: 'Client approved Design Mockups', time: '10m ago' },
    { id: 2, type: 'invoice', dotColor: 'bg-green-500', text: 'Invoice #INV-4920 was paid by Acme Corp', time: '2h ago' },
    { id: 3, type: 'comment', dotColor: 'bg-purple-500', text: 'Sarah added a comment on Phase 2', time: '5h ago' },
    { id: 4, type: 'project', dotColor: 'bg-orange-500', text: 'Created project "Brand Redesign"', time: 'Yesterday' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {/* Sidebar Component */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggleCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
        />

        {/* Main Workspace Frame */}
        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'md:pl-22' : 'md:pl-66'
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Page Title Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-sans m-0">Dashboard</h1>
                <p className="text-xs text-[#6B7280]">
                  Real-time pipeline metrics and projects status
                </p>
              </div>
              <Button
                asChild
                className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs"
              >
                <Link to="/projects?create=true">
                  <FolderKanban className="mr-1.5 h-4 w-4" />
                  New Project
                </Link>
              </Button>
            </div>

            {/* Metric Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Card 1: Active Projects */}
              <Card className="border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Active Projects</p>
                    <h3 className="text-3xl font-extrabold text-[#111111] font-sans">{activeProjectsCount}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-[#16803D] font-bold">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+12% vs last month</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Pending Reviews */}
              <Card className="border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Pending Approvals</p>
                    <h3 className="text-3xl font-extrabold text-[#111111] font-sans">{pendingReviewsCount}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Requires review</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Unpaid Invoices */}
              <Card className="border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Unpaid Invoices</p>
                    <h3 className="text-3xl font-extrabold text-[#111111] font-sans">{unpaidInvoicesCount}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-[#D97706] font-bold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Action required</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <Receipt className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Total Clients */}
              <Card className="border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Active Clients</p>
                    <h3 className="text-3xl font-extrabold text-[#111111] font-sans">{uniqueClientsCount}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-[#16803D] font-bold">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+2 new onboarding</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
              
            </div>

            {/* Split Grid: Projects Table + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Projects Table */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#111111] font-sans">Recent Projects</h3>
                  <Button variant="ghost" asChild className="text-xs text-primary font-bold hover:bg-primary-light">
                    <Link to="/projects">View all projects</Link>
                  </Button>
                </div>

                <Card className="border border-gray-100 bg-white rounded-xl shadow-sm overflow-hidden">
                  {loadingProjects ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <FolderKanban className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-[#111111]">No projects found</p>
                      <p className="text-xs text-[#6B7280] mb-4">Get started by creating your first agency project.</p>
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/95 text-white">
                        <Link to="/projects?create=true">New Project</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50/70 border-b border-gray-100">
                        <TableRow>
                          <TableHead className="font-bold text-xs text-[#6B7280] p-4">Project</TableHead>
                          <TableHead className="font-bold text-xs text-[#6B7280] p-4">Client</TableHead>
                          <TableHead className="font-bold text-xs text-[#6B7280] p-4">Status</TableHead>
                          <TableHead className="font-bold text-xs text-[#6B7280] p-4">Due Date</TableHead>
                          <TableHead className="font-bold text-xs text-[#6B7280] p-4 w-1/4">Progress</TableHead>
                          <TableHead className="p-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.slice(0, 5).map((project) => {
                          const pct = getProgress(project.phases);
                          return (
                            <TableRow key={project.id || project._id} className="hover:bg-gray-50/50 border-b border-gray-100">
                              <TableCell className="p-4 font-semibold text-sm text-[#111111]">
                                <Link to={`/projects/${project.id || project._id}`} className="hover:text-primary transition-colors">
                                  {project.name}
                                </Link>
                              </TableCell>
                              <TableCell className="p-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7 border border-[#EEEDFE]">
                                    <AvatarFallback className="bg-primary-light text-primary text-[10px] font-bold">
                                      {project.clientName ? project.clientName.substring(0, 2).toUpperCase() : 'CL'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-[#6B7280] font-medium truncate max-w-[120px]">
                                    {project.clientName || 'Acme Client'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="p-4">
                                {getStatusBadge(project.status || 'Active')}
                              </TableCell>
                              <TableCell className="p-4 text-xs text-[#6B7280] font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  {formatDate(project.dueDate)}
                                </span>
                              </TableCell>
                              <TableCell className="p-4">
                                <div className="space-y-1.5">
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] font-bold text-[#6B7280]">
                                    {pct}% Complete
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="p-4 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B7280] hover:text-[#111111] rounded-full">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="p-1 w-32">
                                    <DropdownMenuItem onClick={() => navigate(`/projects/${project.id || project._id}`)} className="flex items-center gap-1.5 text-xs py-2 cursor-pointer">
                                      <Eye className="h-3.5 w-3.5" />
                                      View Portal
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/projects/${project.id || project._id}?edit=true`)} className="flex items-center gap-1.5 text-xs py-2 cursor-pointer">
                                      <Edit2 className="h-3.5 w-3.5" />
                                      Edit Project
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </div>

              {/* Right Column: Activity Feed */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#111111] font-sans">Recent Activity</h3>
                
                <Card className="border border-gray-100 bg-white rounded-xl shadow-sm p-4 h-[310px] overflow-y-auto">
                  <div className="relative border-l border-gray-100 pl-4 ml-2.5 space-y-6 py-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="relative">
                        {/* Feed Bullet dot */}
                        <span className={`absolute -left-[22.5px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ${activity.dotColor} ring-4 ring-white shadow-sm`} />
                        
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#111111] leading-tight">
                            {activity.text}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
                            <Clock className="h-3 w-3" />
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
