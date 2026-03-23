
"use client";

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Circle,
  Calendar,
  Layers,
  Home,
  LayoutGrid,
  CheckCircle,
  Inbox,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { AdminSnapshot, Persona, RecordDef, Database } from '../types';
import { getVisibleProjects } from '../lib/visibility';

interface StratumViewProps {
  snapshot: AdminSnapshot;
  activePersona: Persona;
  remember: boolean;
  toggleRemember: (val: boolean) => void;
  resetToSeed: (mode: 'seed') => void;
  isHydrated: boolean;
}

type FilterMode = 'all' | 'overdue' | 'due-soon' | 'my-scope';

interface SelectedNode {
  type: 'project' | 'stage' | 'discipline' | 'task';
  id: string;
}

export function StratumView({ 
  snapshot, 
  activePersona, 
  remember, 
  toggleRemember, 
  resetToSeed, 
  isHydrated 
}: StratumViewProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['all-projects']));
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const visibleProjects = useMemo(() => getVisibleProjects(snapshot, activePersona), [snapshot, activePersona]);
  const allTasks = snapshot.databases["tasks"]?.records || [];
  const allStages = snapshot.databases["stages"]?.records || [];
  const allDisciplines = snapshot.databases["disciplines"]?.records || [];
  const statuses = snapshot.databases["statuses"]?.records || [];
  const priorities = snapshot.databases["priorities"]?.records || [];
  const people = snapshot.databases["people"]?.records || [];

  // Auto-expand logic for filters/search
  React.useEffect(() => {
    if (filterMode === 'all' && !statusFilter && !searchQuery) return;

    const nextExpanded = new Set(expandedNodes);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 86400000);

    const matches = (item: any, type: string) => {
      // Search match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (item.values.name.toLowerCase().includes(query)) return true;
      }

      // Filter match
      if (filterMode === 'my-scope') {
        if (item.values.ownerId === activePersona.id) return true;
        if (item.values.assigneeId === activePersona.id) return true;
      } else if (filterMode === 'overdue') {
        const dueDate = item.values.dueDate ? new Date(item.values.dueDate) : null;
        if (dueDate && dueDate < today && item.values.statusId !== 's3') return true;
      } else if (filterMode === 'due-soon') {
        const dueDate = item.values.dueDate ? new Date(item.values.dueDate) : null;
        if (dueDate && dueDate >= today && dueDate <= nextWeek && item.values.statusId !== 's3') return true;
      }

      if (statusFilter && item.values.statusId === statusFilter) return true;

      return false;
    };

    // Find all matching tasks and their ancestors
    allTasks.forEach(t => {
      if (matches(t, 'task')) {
        nextExpanded.add(t.values.projectId);
        const disc = allDisciplines.find(d => d.id === t.values.disciplineId);
        if (disc) {
          nextExpanded.add(disc.values.stageId);
          nextExpanded.add(disc.id);
        }
        if (t.values.parentTaskId) {
          nextExpanded.add(t.values.parentTaskId);
        }
      }
    });

    // Find all matching disciplines and their ancestors
    allDisciplines.forEach(d => {
      if (matches(d, 'discipline')) {
        const stage = allStages.find(s => s.id === d.values.stageId);
        if (stage) {
          nextExpanded.add(stage.values.projectId);
          nextExpanded.add(stage.id);
        }
      }
    });

    // Find all matching stages and their ancestors
    allStages.forEach(s => {
      if (matches(s, 'stage')) {
        nextExpanded.add(s.values.projectId);
      }
    });

    setExpandedNodes(nextExpanded);
  }, [filterMode, statusFilter, searchQuery, allTasks, allStages, allDisciplines, activePersona.id]);

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const resolveValue = (fieldId: string, value: string, dbId: string) => {
    if (!value) return '-';
    const db = snapshot.databases[dbId];
    const field = db?.fields.find(f => f.id === fieldId);
    
    if (field?.type === 'relation' || (field?.type === 'select' && field.optionsSource === 'listDb')) {
      const targetDb = snapshot.databases[field.targetDatabaseId!];
      if (targetDb) {
        const record = targetDb.records.find(r => r.id === value);
        return record ? record.values.name || record.id : value;
      }
    }
    return value;
  };

  const getStatusColor = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    const color = status?.values.color || 'stone';
    switch (color) {
      case 'emerald': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rose': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getPriorityIcon = (priorityId: string) => {
    const priority = priorities.find(p => p.id === priorityId);
    const level = parseInt(priority?.values.level || '3');
    if (level === 1) return <AlertCircle className="w-3 h-3 text-rose-500" />;
    if (level === 2) return <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />;
    return <Circle className="w-3 h-3 text-stone-300" />;
  };

  // Filter logic
  const filteredProjects = useMemo(() => {
    let result = visibleProjects;
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 86400000);
    
    const matches = (item: any, type: string) => {
      // Search match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (item.values.name.toLowerCase().includes(query)) return true;
      }

      // Filter match
      if (filterMode === 'my-scope') {
        if (item.values.ownerId === activePersona.id) return true;
        if (item.values.assigneeId === activePersona.id) return true;
      } else if (filterMode === 'overdue') {
        const dueDate = item.values.dueDate ? new Date(item.values.dueDate) : null;
        if (dueDate && dueDate < today && item.values.statusId !== 's3') return true;
      } else if (filterMode === 'due-soon') {
        const dueDate = item.values.dueDate ? new Date(item.values.dueDate) : null;
        if (dueDate && dueDate >= today && dueDate <= nextWeek && item.values.statusId !== 's3') return true;
      }

      if (statusFilter && item.values.statusId === statusFilter) return true;

      return false;
    };

    result = result.filter(p => {
      // Direct match
      if (matches(p, 'project')) return true;

      // Match descendant stages
      const projectStages = allStages.filter(s => s.values.projectId === p.id);
      if (projectStages.some(s => matches(s, 'stage'))) return true;

      // Match descendant disciplines
      const projectDisciplines = allDisciplines.filter(d => {
        const stage = allStages.find(s => s.id === d.values.stageId);
        return stage && stage.values.projectId === p.id;
      });
      if (projectDisciplines.some(d => matches(d, 'discipline'))) return true;

      // Match descendant tasks
      const projectTasks = allTasks.filter(t => t.values.projectId === p.id);
      if (projectTasks.some(t => matches(t, 'task'))) return true;

      return false;
    });

    return result;
  }, [visibleProjects, filterMode, statusFilter, searchQuery, activePersona.id, allTasks, allStages, allDisciplines]);

  const getBreadcrumbs = () => {
    if (!selectedNode) return [{ label: 'Workspace', type: 'root' }];
    
    const crumbs = [{ label: 'Workspace', type: 'root' }];
    
    if (selectedNode.type === 'project') {
      const p = visibleProjects.find(p => p.id === selectedNode.id);
      if (p) crumbs.push({ label: p.values.name, type: 'project' });
    } else if (selectedNode.type === 'stage') {
      const s = allStages.find(s => s.id === selectedNode.id);
      if (s) {
        const p = visibleProjects.find(p => p.id === s.values.projectId);
        if (p) crumbs.push({ label: p.values.name, type: 'project' });
        crumbs.push({ label: s.values.name, type: 'stage' });
      }
    } else if (selectedNode.type === 'discipline') {
      const d = allDisciplines.find(d => d.id === selectedNode.id);
      if (d) {
        const s = allStages.find(s => s.id === d.values.stageId);
        if (s) {
          const p = visibleProjects.find(p => p.id === s.values.projectId);
          if (p) crumbs.push({ label: p.values.name, type: 'project' });
          crumbs.push({ label: s.values.name, type: 'stage' });
        }
        crumbs.push({ label: d.values.name, type: 'discipline' });
      }
    } else if (selectedNode.type === 'task') {
      const t = allTasks.find(t => t.id === selectedNode.id);
      if (t) {
        const p = visibleProjects.find(p => p.id === t.values.projectId);
        if (p) crumbs.push({ label: p.values.name, type: 'project' });
        
        const d = allDisciplines.find(d => d.id === t.values.disciplineId);
        if (d) {
          const s = allStages.find(s => s.id === d.values.stageId);
          if (s) crumbs.push({ label: s.values.name, type: 'stage' });
          crumbs.push({ label: d.values.name, type: 'discipline' });
        }

        if (t.values.parentTaskId) {
          const pt = allTasks.find(task => task.id === t.values.parentTaskId);
          if (pt) crumbs.push({ label: pt.values.name, type: 'task' });
        }
        
        crumbs.push({ label: t.values.name, type: 'task' });
      }
    }
    
    return crumbs;
  };

  const renderStatusChip = (statusId: string) => {
    const name = resolveValue('statusId', statusId, 'projects');
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(statusId)}`}>
        {name}
      </span>
    );
  };

  const renderTableRow = (node: any, depth: number, type: 'project' | 'stage' | 'discipline' | 'task') => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id && selectedNode?.type === type;
    const hasChildren = type !== 'task' || allTasks.some(t => t.values.parentTaskId === node.id);
    
    // Get values based on type
    const title = node.values.name;
    const statusId = node.values.statusId;
    const priorityId = node.values.priorityId;
    const ownerId = node.values.ownerId || node.values.assigneeId;
    const dueDate = node.values.dueDate;

    return (
      <React.Fragment key={`${type}-${node.id}`}>
        <tr 
          onClick={() => setSelectedNode({ type, id: node.id })}
          className={`group cursor-pointer border-b border-stone-100 transition-colors ${isSelected ? 'bg-stone-50' : 'hover:bg-stone-50/50'}`}
        >
          <td className="py-2 pl-4 pr-2">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.5}rem` }}>
              {hasChildren ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                  className="p-0.5 hover:bg-stone-200 rounded transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-stone-500" /> : <ChevronRight className="w-4 h-4 text-stone-500" />}
                </button>
              ) : (
                <div className="w-5" />
              )}
              <div className="flex items-center gap-2 min-w-0">
                {type === 'project' && <LayoutGrid className="w-4 h-4 text-indigo-500 shrink-0" />}
                {type === 'stage' && <Layers className="w-4 h-4 text-amber-500 shrink-0" />}
                {type === 'discipline' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {type === 'task' && <Circle className="w-4 h-4 text-stone-400 shrink-0" />}
                <span className={`text-sm truncate ${isSelected ? 'font-bold text-stone-900' : 'text-stone-700'}`}>
                  {title}
                </span>
              </div>
            </div>
          </td>
          <td className="py-2 px-2">
            {statusId ? renderStatusChip(statusId) : <span className="text-stone-300">-</span>}
          </td>
          <td className="py-2 px-2">
            {priorityId ? (
              <div className="flex items-center gap-1.5">
                {getPriorityIcon(priorityId)}
                <span className="text-xs text-stone-600">{resolveValue('priorityId', priorityId, 'projects')}</span>
              </div>
            ) : <span className="text-stone-300">-</span>}
          </td>
          <td className="py-2 px-2">
            {ownerId ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-600">
                  {resolveValue('ownerId', ownerId, 'projects').charAt(0)}
                </div>
                <span className="text-xs text-stone-600 truncate max-w-[100px]">
                  {resolveValue('ownerId', ownerId, 'projects')}
                </span>
              </div>
            ) : <span className="text-stone-300">-</span>}
          </td>
          <td className="py-2 px-2">
            {dueDate ? (
              <div className="flex items-center gap-1.5 text-stone-500">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">{dueDate}</span>
              </div>
            ) : <span className="text-stone-300">-</span>}
          </td>
        </tr>
        {isExpanded && type === 'project' && (
          allStages.filter(s => s.values.projectId === node.id).map(stage => renderTableRow(stage, depth + 1, 'stage'))
        )}
        {isExpanded && type === 'stage' && (
          allDisciplines.filter(d => d.values.stageId === node.id).map(disc => renderTableRow(disc, depth + 1, 'discipline'))
        )}
        {isExpanded && type === 'discipline' && (
          allTasks.filter(t => t.values.disciplineId === node.id && !t.values.parentTaskId).map(task => renderTableRow(task, depth + 1, 'task'))
        )}
        {isExpanded && type === 'task' && (
          allTasks.filter(t => t.values.parentTaskId === node.id).map(sub => renderTableRow(sub, depth + 1, 'task'))
        )}
      </React.Fragment>
    );
  };

  const renderDetailsPanel = () => {
    if (!selectedNode) return (
      <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center">
        <Inbox className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">Select an item to view details</p>
        <p className="text-xs mt-1">Project, Stage, Discipline or Task</p>
      </div>
    );

    const dbId = selectedNode.type === 'project' ? 'projects' : 
                 selectedNode.type === 'stage' ? 'stages' :
                 selectedNode.type === 'discipline' ? 'disciplines' : 'tasks';
    
    const db = snapshot.databases[dbId];
    const record = db?.records.find(r => r.id === selectedNode.id);
    if (!db || !record) return null;

    const detailFields = db.fields.filter(f => f.showInDetails);

    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded border border-stone-200">
              {selectedNode.type}
            </span>
            <button onClick={() => setSelectedNode(null)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-stone-900 leading-tight">
            {record.values.name}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {detailFields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {field.label}
              </label>
              <div className="text-sm text-stone-800 bg-white border border-stone-100 p-3 rounded-lg shadow-sm">
                {resolveValue(field.id, record.values[field.id], dbId)}
              </div>
            </div>
          ))}

          {selectedNode.type === 'task' && record.values.notes && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Notes
              </label>
              <div className="text-sm text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-100 italic">
                {record.values.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-stone-900">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-stone-200 flex flex-col bg-stone-50 shrink-0 overflow-hidden`}
      >
        <div className="p-4 border-b border-stone-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white font-bold">T</div>
          <span className="font-bold tracking-tight">Talvex Stratum</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <button 
            onClick={() => setFilterMode('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            <Inbox className="w-4 h-4" />
            All Items
          </button>
          <button 
            onClick={() => setFilterMode('overdue')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'overdue' ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Overdue
          </button>
          <button 
            onClick={() => setFilterMode('due-soon')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'due-soon' ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            Due Soon
          </button>
          <button 
            onClick={() => setFilterMode('my-scope')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterMode === 'my-scope' ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            <User className="w-4 h-4" />
            My Scope
          </button>

          <div className="pt-4 pb-2 px-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status Filter</span>
          </div>
          {statuses.map(status => (
            <button 
              key={status.id}
              onClick={() => setStatusFilter(statusFilter === status.id ? null : status.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status.id ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status.id).split(' ')[0]}`} />
              {status.values.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-200 bg-stone-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {activePersona.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-900 truncate">{activePersona.name}</p>
              <p className="text-[10px] text-stone-500 truncate capitalize">{activePersona.roleId}</p>
            </div>
          </div>
          <button 
            onClick={() => resetToSeed('seed')}
            className="w-full py-2 text-[10px] font-bold text-stone-500 hover:text-stone-900 border border-stone-200 rounded-lg bg-white transition-colors"
          >
            Reset Workspace
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Breadcrumbs */}
        <header className="h-14 border-b border-stone-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              {getBreadcrumbs().map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  <span className={i === getBreadcrumbs().length - 1 ? "font-medium text-stone-900" : ""}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-stone-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-stone-200 outline-none w-64"
              />
            </div>
            <button className="p-2 hover:bg-stone-100 rounded-lg text-stone-500">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Project Execution Workspace</h1>
                <p className="text-sm text-stone-500 mt-1">Manage and track project hierarchies across all stages and disciplines.</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="py-3 pl-4 pr-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-[40%]">Hierarchy / Title</th>
                      <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-[15%]">Status</th>
                      <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-[15%]">Priority</th>
                      <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-[15%]">Owner / Assignee</th>
                      <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-[15%]">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-stone-400 italic text-sm">
                          No items found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map(project => renderTableRow(project, 0, 'project'))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Details Panel */}
          <aside className={`${selectedNode ? 'w-96' : 'w-0'} transition-all duration-300 border-l border-stone-200 bg-stone-50/30 overflow-hidden shrink-0`}>
            {renderDetailsPanel()}
          </aside>
        </div>
      </main>
    </div>
  );
}
