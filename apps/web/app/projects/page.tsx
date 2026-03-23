'use client';

import React from 'react';
import { 
  Folder, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Users,
  BarChart3,
  Lock,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  ChevronDown,
  Clock,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUIStore, SIMULATED_USERS } from '../../src/store/uiStore';
import { useDataStore } from '../../src/store/dataStore';
import { visibleProjectsForPersona, canCreateProject, calculateRollup } from '../../src/lib/engine';
import { 
  getPortfolioSummary, 
  applyProjectFilters, 
  ProjectFilters, 
  getHealthIndicators,
  getActivePeople
} from '../../src/lib/analytics';
import Link from 'next/link';
import { MyItemsSection } from '../../src/components/MyItemsSection';
import { CreateProjectModal } from '../../src/components/CreateProjectModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProjectsPage() {
  const { 
    setBreadcrumb, 
    setCurrentProject, 
    activePersona, 
    currentUserId, 
    featureConfig,
    portfolioSearchQuery,
    setPortfolioSearchQuery
  } = useUIStore();
  const { hierarchy, setSelectedNodeId } = useDataStore();

  const [filters, setFilters] = React.useState<ProjectFilters>({
    status: 'active',
    ownership: 'all',
    health: 'all',
    showTemplates: false
  });
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrentProject('Portfolio');
    setBreadcrumb([{ id: 'all-projects', title: 'All Projects' }]);
  }, [setBreadcrumb, setCurrentProject]);

  const visibleProjects = visibleProjectsForPersona(hierarchy, activePersona, currentUserId);
  const filteredProjects = applyProjectFilters(
    visibleProjects, 
    filters, 
    currentUserId,
    portfolioSearchQuery
  );
  const summary = getPortfolioSummary(filteredProjects);
  const canCreate = canCreateProject(activePersona);

  return (
    <div className="flex flex-col h-full bg-zinc-50/30 overflow-y-auto custom-scrollbar">
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Portfolio Dashboard</h1>
            <p className="text-zinc-500 mt-1">Strategic overview and operational control of all projects.</p>
          </div>
          {canCreate ? (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Plus size={14} />
              New Project
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-100 text-zinc-400 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-zinc-200">
              <Lock size={14} />
              New Project
            </div>
          )}
        </div>

        {/* Portfolio Summary Strip */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Projects', value: summary.totalProjects, icon: Folder, color: 'text-zinc-600', show: true },
              { label: 'Active', value: summary.activeProjects, icon: Activity, color: 'text-blue-600', show: featureConfig.dashboardModules },
              { label: 'Total Spent', value: `${summary.totalSpent}h`, icon: Clock, color: 'text-zinc-900', show: featureConfig.timeTracking },
              { label: 'Overdue Items', value: summary.overdueTasks, icon: AlertCircle, color: 'text-red-600', show: featureConfig.dashboardModules },
              { label: 'Unassigned', value: summary.unassignedTasks, icon: UserCheck, color: 'text-amber-600', show: featureConfig.dashboardModules },
            ].filter(s => s.show).map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <stat.icon size={14} className={stat.color} />
                  <span className="text-lg font-bold text-zinc-900">{stat.value}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 font-medium italic px-1">
            Metrics reflect current search and filter scope.
          </p>
        </div>

        {/* Filters Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="Search projects by name, client, or ID..." 
                className="w-full bg-transparent py-2 pl-10 pr-10 text-sm focus:outline-none"
                value={portfolioSearchQuery}
                onChange={(e) => setPortfolioSearchQuery(e.target.value)}
              />
              {portfolioSearchQuery && (
                <button 
                  onClick={() => setPortfolioSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="h-8 w-px bg-zinc-200" />
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors",
                isFilterOpen ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              <Filter size={14} />
              Operational Filters
              <ChevronDown size={12} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
            </button>
          </div>

          {isFilterOpen && (
            <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'completed', 'pending', 'blocked'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilters({ ...filters, status: s as any })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        filters.status === s 
                          ? "bg-zinc-900 text-white border-zinc-900" 
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ownership</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'owned', label: 'Owned by Me' },
                    { id: 'assigned', label: 'Assigned to me' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setFilters({ ...filters, ownership: o.id as any })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        filters.ownership === o.id 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Health</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'overdue', label: 'Overdue' },
                    { id: 'unassigned', label: 'Unassigned' },
                    { id: 'ready-to-close', label: 'Ready to Close' },
                    { id: 'over-budget', label: 'Over Budget' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setFilters({ ...filters, health: h.id as any })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        filters.health === h.id 
                          ? "bg-red-600 text-white border-red-600" 
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-3 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Show Templates</span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, showTemplates: !prev.showTemplates }))}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      filters.showTemplates ? "bg-blue-600" : "bg-zinc-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform",
                      filters.showTemplates ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                  <span className="text-[10px] text-zinc-400 italic">Templates are hidden from normal views by default</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Scope Section */}
        <MyItemsSection 
          filters={filters} 
          searchQuery={portfolioSearchQuery} 
          className="mb-8" 
        />

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const rollup = calculateRollup(project);
            const health = getHealthIndicators(project);
            const isOwner = project.ownerId === currentUserId;
            const activePeople = getActivePeople(project);
            
            return (
              <div key={project.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 relative">
                      <Folder size={20} />
                      {isOwner && (
                        <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white p-0.5 rounded-full border-2 border-white shadow-sm" title="You own this project">
                          <Shield size={8} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {health.isOverBudget && (
                        <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white border border-red-700" title="Project is over budget">
                          <BarChart3 size={12} />
                        </div>
                      )}
                      {health.overdueCount > 0 && (
                        <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-600 border border-red-100" title={`${health.overdueCount} overdue items`}>
                          <AlertCircle size={12} />
                        </div>
                      )}
                      {health.unassignedCount > 0 && (
                        <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100" title={`${health.unassignedCount} unassigned items`}>
                          <UserCheck size={12} />
                        </div>
                      )}
                      {health.readyToCloseCount > 0 && (
                        <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100" title={`${health.readyToCloseCount} items ready to close`}>
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight group-hover:text-blue-600 transition-colors">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                      {project.projectType || '—'}
                    </p>
                    {project.isTemplate && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-tighter border border-amber-200">
                        Template
                      </span>
                    )}
                    <span className="text-zinc-300">•</span>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Owner: <span className={cn(isOwner ? "text-blue-600" : "text-zinc-700")}>{project.ownerId}</span>
                    </p>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    {featureConfig.dashboardModules && (
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                          <span>Overall Progress</span>
                          <span>{rollup.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-zinc-900 transition-all duration-500" 
                            style={{ width: `${rollup.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {activePeople.slice(0, 3).map((id) => {
                            const user = SIMULATED_USERS.find(u => u.id === id);
                            const initials = user ? user.name.split(' ').map(n => n[0]).join('') : id.slice(0, 2).toUpperCase();
                            return (
                              <div key={id} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 border border-white text-[8px] font-bold text-zinc-500 uppercase" title={user?.name || id}>
                                {initials}
                              </div>
                            );
                          })}
                          {activePeople.length > 3 && (
                            <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-50 border border-white text-[8px] font-bold text-zinc-400 uppercase">
                              +{activePeople.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                          {activePeople.length} {activePeople.length === 1 ? 'Active Person' : 'Active People'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-50 pt-4">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-zinc-400" />
                        <span className="text-xs text-zinc-600 font-medium">{rollup.totalTasks} Active Items</span>
                      </div>
                      {featureConfig.timeTracking && (
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-zinc-400" />
                          <span className="text-xs text-zinc-600 font-medium">{rollup.totalSpent}h Spent</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-5 py-3 bg-zinc-50 border-t flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                    project.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    project.status === 'blocked' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-zinc-100 text-zinc-600 border-zinc-200"
                  )}>
                    {project.status}
                  </span>
                  <Link 
                    href="/workspace"
                    onClick={() => setSelectedNodeId(project.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View Workspace
                    <BarChart3 size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
          
          {canCreate && filteredProjects.length === visibleProjects.length && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center p-8 hover:border-zinc-300 hover:bg-zinc-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform mb-4">
                <Plus size={24} />
              </div>
              <span className="text-sm font-bold text-zinc-500">Create New Project</span>
            </button>
          )}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <div className="p-4 rounded-full bg-zinc-50 border border-zinc-100">
                <Filter size={32} className="text-zinc-200" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900">No projects match your filters</p>
                <p className="text-xs">Try adjusting your operational slices or search query.</p>
              </div>
              <button 
                onClick={() => {
                  setFilters({ status: 'active', ownership: 'all', health: 'all' });
                  setPortfolioSearchQuery('');
                }}
                className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <CreateProjectModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      </div>
    </div>
  );
}
