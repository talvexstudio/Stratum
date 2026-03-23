'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Inbox
} from 'lucide-react';
import { HierarchyNode, NodeType } from '../lib/hierarchy';
import { useDataStore } from '../store/dataStore';
import { useUIStore, SIMULATED_USERS } from '../store/uiStore';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { visibleProjectsForPersona, getParentProject } from '../lib/engine';
import { ProjectFilters, applyProjectFilters, getTodayDate, getBudgetState } from '../lib/analytics';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MyItemsSectionProps {
  className?: string;
  filters: ProjectFilters;
  searchQuery: string;
}

export const MyItemsSection: React.FC<MyItemsSectionProps> = ({ className, filters, searchQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { hierarchy, setSelectedNodeId } = useDataStore();
  const { currentUserId, activePersona, setCurrentProject } = useUIStore();
  const router = useRouter();
  const today = getTodayDate();

  if (!currentUserId) return null;

  // 1. Get baseline visible projects for this persona
  const baselineProjects = visibleProjectsForPersona(hierarchy, activePersona, currentUserId);

  // 2. Find all items I have a relationship with (Owner or Assignee)
  const allMyItems = useMemo(() => {
    let items: { task: HierarchyNode; project: HierarchyNode | null }[] = [];
    
    const traverse = (n: HierarchyNode, project: HierarchyNode | null) => {
      // Skip template projects if filters.showTemplates is off
      if (!filters.showTemplates && project?.isTemplate) return;

      // Check if user is owner or assignee of THIS node
      const isOwner = n.ownerId === currentUserId;
      const isAssignee = n.assignee === currentUserId;

      if (isOwner || isAssignee) {
        // Include: stage, discipline, package, task
        // Exclude: area (typology), project
        const includedTypes: NodeType[] = ['stage', 'discipline', 'package', 'task'];
        if (includedTypes.includes(n.type)) {
          const q = searchQuery.toLowerCase();
          let matchesSearch = true;
          if (q) {
            const matchesTaskTitle = n.title.toLowerCase().includes(q);
            const matchesTaskId = n.id.toLowerCase().includes(q);
            const matchesStatus = n.status.toLowerCase().includes(q);
            const matchesPriority = (n.priority || '').toLowerCase().includes(q);
            const matchesTags = n.tags?.some(t => t.toLowerCase().includes(q)) || false;
            
            // Parent project fields
            const matchesProjectTitle = project?.title.toLowerCase().includes(q) || false;
            const matchesProjectId = project?.id.toLowerCase().includes(q) || false;
            
            matchesSearch = matchesTaskTitle || matchesTaskId || matchesStatus || 
                           matchesPriority || matchesTags || matchesProjectTitle || 
                           matchesProjectId;
          }

          if (matchesSearch) {
            // Apply Status filter at ITEM level
            const matchesStatus = filters.status === 'all' || n.status === filters.status;
            
            // Apply Health filter at ITEM level
            let matchesHealth = true;
            if (filters.health === 'overdue') {
              matchesHealth = !!(n.dueDate && n.dueDate < today && n.status !== 'completed');
            } else if (filters.health === 'unassigned') {
              matchesHealth = !n.assignee || n.assignee === 'Unassigned';
            } else if (filters.health === 'ready-to-close') {
              // Direct children terminal rule
              const isNotTerminal = n.status !== 'completed' && !n.isTerminal;
              const hasChildren = !!(n.children && n.children.length > 0);
              const allChildrenTerminal = hasChildren && n.children!.every(c => c.status === 'completed' || c.isTerminal);
              matchesHealth = !!(isNotTerminal && hasChildren && allChildrenTerminal);
            } else if (filters.health === 'over-budget') {
              const budget = getBudgetState(n);
              matchesHealth = budget?.status === 'over';
            }

            if (matchesStatus && matchesHealth) {
              items.push({ task: n, project });
            }
          }
        }
      }
      
      if (n.children) {
        n.children.forEach(child => traverse(child, project || (n.type === 'project' ? n : null)));
      }
    };

    baselineProjects.forEach(p => traverse(p, p));
    return items;
  }, [baselineProjects, currentUserId, searchQuery, filters.status, filters.health, filters.showTemplates]);

  // 3. Filter these items by the ownership filter
  const filteredMyItems = useMemo(() => {
    return allMyItems.filter(item => {
      const isOwner = item.task.ownerId === currentUserId;
      const isAssignee = item.task.assignee === currentUserId;

      if (filters.ownership === 'owned') return isOwner;
      if (filters.ownership === 'assigned') return isAssignee;
      return true; // 'all'
    });
  }, [allMyItems, filters.ownership, currentUserId]);

  const myItems = filteredMyItems;
  
  // 4. Operational Sorting
  // 1. Overdue first
  // 2. Due date ascending
  // 3. Title ascending
  const sortItems = (items: { task: HierarchyNode; project: HierarchyNode | null }[]) => {
    return [...items].sort((a, b) => {
      const isOverdueA = a.task.dueDate && a.task.dueDate < today && a.task.status !== 'completed';
      const isOverdueB = b.task.dueDate && b.task.dueDate < today && b.task.status !== 'completed';

      if (isOverdueA && !isOverdueB) return -1;
      if (!isOverdueA && isOverdueB) return 1;

      if (a.task.dueDate && b.task.dueDate) {
        if (a.task.dueDate !== b.task.dueDate) return a.task.dueDate.localeCompare(b.task.dueDate);
      } else if (a.task.dueDate) {
        return -1;
      } else if (b.task.dueDate) {
        return 1;
      }

      return a.task.title.localeCompare(b.task.title);
    });
  };

  const sortedMyItems = sortItems(myItems);

  const overdueItems = sortedMyItems.filter(item => {
    if (!item.task.dueDate) return false;
    return item.task.dueDate < today && item.task.status !== 'completed';
  });

  const handleItemClick = (task: HierarchyNode, project: HierarchyNode | null) => {
    if (project) {
      setCurrentProject(project.id);
    }
    setSelectedNodeId(task.id);
    router.push('/workspace');
  };

  // Group items by project for display
  const groupedItems: Record<string, { project: HierarchyNode | null; items: { task: HierarchyNode; project: HierarchyNode | null }[] }> = {};
  sortedMyItems.forEach(item => {
    const projectId = item.project?.id || 'unassigned';
    if (!groupedItems[projectId]) {
      groupedItems[projectId] = { project: item.project, items: [] };
    }
    groupedItems[projectId].items.push(item);
  });

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", className)}>
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Inbox size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              My Scope
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                {myItems.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {overdueItems.length > 0 ? (
                <span className="text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle size={12} />
                  {overdueItems.length} overdue items
                </span>
              ) : (
                "Quick view of your owned and assigned items"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-slate-100 p-4">
              {myItems.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-20" />
                  <p className="text-slate-500 text-sm italic">No items in your scope at the moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-2 pb-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="col-span-6">Item Title</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">Priority</div>
                    <div className="col-span-2 text-right">Due Date</div>
                  </div>

                  {Object.entries(groupedItems).map(([projectId, group]) => (
                    <div key={projectId} className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {group.project?.title || 'Standalone Items'}
                        </span>
                        <div className="h-px flex-1 bg-indigo-50" />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1">
                        {group.items.map(({ task }) => {
                          const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'completed';
                          
                          return (
                            <button
                              key={task.id}
                              onClick={() => handleItemClick(task, group.project)}
                              className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-50 transition-all text-left border border-transparent hover:border-slate-100"
                            >
                              {/* Title Column */}
                              <div className="col-span-1 md:col-span-6 flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  task.status === 'completed' ? "bg-emerald-500" :
                                  task.status === 'active' ? "bg-indigo-500" :
                                  "bg-slate-300"
                                )} />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                                      {task.title}
                                    </p>
                                    <span className="shrink-0 px-1 py-0.5 bg-slate-100 text-[8px] font-bold uppercase tracking-wider text-slate-500 rounded border border-slate-200">
                                      {task.type}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 uppercase tracking-tight font-bold">
                                    {task.id}
                                  </span>
                                </div>
                              </div>

                              {/* Status Column */}
                              <div className="hidden md:flex col-span-2 justify-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border w-24 text-center",
                                  task.status === 'active' ? "text-blue-600 border-blue-100 bg-blue-50/30" :
                                  task.status === 'completed' ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" :
                                  task.status === 'blocked' ? "text-red-600 border-red-100 bg-red-50/30" :
                                  "text-zinc-400 border-zinc-100 bg-zinc-50/30"
                                )}>
                                  {task.status}
                                </span>
                              </div>

                              {/* Priority Column */}
                              <div className="hidden md:flex col-span-2 justify-center">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-tight",
                                  task.priority === 'critical' ? "text-red-600" :
                                  task.priority === 'high' ? "text-amber-600" :
                                  "text-zinc-500"
                                )}>
                                  {task.priority}
                                </span>
                              </div>
                              
                              {/* Date Column */}
                              <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2 shrink-0">
                                {task.dueDate && (
                                  <div className={cn(
                                    "flex items-center gap-1.5 text-xs",
                                    isOverdue ? "text-rose-600 font-medium" : "text-slate-400"
                                  )}>
                                    <Clock size={12} />
                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                                )}
                                <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>

                              {/* Mobile metadata (only visible on small screens) */}
                              <div className="md:hidden flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase text-zinc-500">{task.status}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-[10px] font-bold uppercase text-zinc-500">{task.priority}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
