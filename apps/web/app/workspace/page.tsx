'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Map,
  Folder, 
  Activity,
  Shield,
  Box,
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Lock,
  X,
  ArrowLeft,
  ArrowUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HierarchyNode, NodeType, NodeStatus, NodePriority } from '../../src/lib/hierarchy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUIStore } from '../../src/store/uiStore';
import { useDataStore, findNodeById } from '../../src/store/dataStore';
import { 
  calculateRollup, 
  canEditField, 
  getBreadcrumbPath, 
  getParentProject,
  canViewProject,
  canCreateChild,
  getValidChildTypes,
  getTreeTaskIconState
} from '../../src/lib/engine';
import { 
  applyWorkspaceFilters, 
  WorkspaceFilters, 
  getHealthIndicators,
  getFilteredHealthIndicators,
  calculateFilteredMetrics,
  getTreeFilterState,
  NodeFilterState
} from '../../src/lib/analytics';
import { DetailsPanel } from '../../src/components/DetailsPanel';
import { AddNodeModal } from '../../src/components/AddNodeModal';
import { DeleteNodeModal } from '../../src/components/DeleteNodeModal';
import { AlertCircle, UserCheck, CheckCircle2, BarChart3 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NodeIcon = ({ type, className }: { type: NodeType; className?: string }) => {
  switch (type) {
    case 'area': return <Map className={cn("text-zinc-400", className)} size={16} />;
    case 'project': return <Folder className={cn("text-blue-500", className)} size={16} />;
    case 'stage': return <Activity className={cn("text-purple-500", className)} size={16} />;
    case 'discipline': return <Shield className={cn("text-emerald-500", className)} size={16} />;
    case 'package': return <Box className={cn("text-amber-500", className)} size={16} />;
    case 'task': return <CheckSquare className={cn("text-zinc-400", className)} size={16} />;
    default: return null;
  }
};

const TreeItem = ({ 
  node, 
  depth = 0, 
  onSelect, 
  selectedId,
  persona,
  userId,
  filterScope,
  treeFilterState,
  breadcrumbIds,
  activeProjectId,
  isSearchActive
}: { 
  node: HierarchyNode; 
  depth?: number; 
  onSelect: (id: string) => void;
  selectedId?: string | null;
  persona: any;
  userId: string;
  filterScope: 'local' | 'project-wide';
  treeFilterState?: Record<string, NodeFilterState>;
  breadcrumbIds: string[];
  activeProjectId: string | null;
  isSearchActive: boolean;
}) => {
  const nodeState = treeFilterState?.[node.id];
  const isInPath = useMemo(() => breadcrumbIds.includes(node.id), [breadcrumbIds, node.id]);
  const [expanded, setExpanded] = useState(() => isInPath || !!nodeState?.shouldExpand);

  // Auto-expand branches with matches or when they become part of the path
  useEffect(() => {
    if (nodeState?.shouldExpand || isInPath) {
      setExpanded(true);
    }
  }, [nodeState?.shouldExpand, isInPath]);

  // Re-baseline when project changes or search is toggled
  useEffect(() => {
    if (!isSearchActive) {
      setExpanded(isInPath);
    }
  }, [activeProjectId, isSearchActive]);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const rollup = calculateRollup(node);

  const isDimmed = nodeState?.isDimmed;

  return (
    <div className={cn("flex flex-col", isDimmed && "opacity-40 grayscale-[0.5]")}>
      <div 
        className={cn(
          "group flex items-center py-2.5 px-3 cursor-pointer border-b border-zinc-50 transition-colors",
          isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div 
            className="w-4 h-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </div>
          <NodeIcon type={node.type} className={getTreeTaskIconState(node)} />
          <span className={cn(
            "text-[13px] truncate leading-tight",
            node.type === 'area' ? "font-bold text-zinc-400 uppercase tracking-widest text-[10px]" :
            node.type === 'project' ? "font-bold text-zinc-900" : "text-zinc-700 font-medium"
          )}>
            {node.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-2">
          {filterScope === 'project-wide' && nodeState && nodeState.matchCount > 0 && (
            <span className="text-[9px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center whitespace-nowrap">
              {nodeState.matchCount} {nodeState.totalCount > 1 && <span className="text-[7px] opacity-60 ml-0.5">/ {nodeState.totalCount}</span>}
            </span>
          )}
          {node.type !== 'task' && node.type !== 'area' && (
            <div className="w-8 h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-400" style={{ width: `${rollup.progress}%` }} />
            </div>
          )}
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div className="flex flex-col">
          {node.children!.map(child => (
            <TreeItem 
              key={child.id} 
              node={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              selectedId={selectedId}
              persona={persona}
              userId={userId}
              filterScope={filterScope}
              treeFilterState={treeFilterState}
              breadcrumbIds={breadcrumbIds}
              activeProjectId={activeProjectId}
              isSearchActive={isSearchActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function WorkspacePage() {
  const router = useRouter();
  const { hierarchy, selectedNodeId, setSelectedNodeId, deleteNode } = useDataStore();
  const { 
    activePersona, 
    currentUserId, 
    setBreadcrumb, 
    setCurrentProject, 
    featureConfig,
    workspaceSearchQuery,
    setWorkspaceSearchQuery,
    breadcrumb
  } = useUIStore();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);
  const [workspaceFilters, setWorkspaceFilters] = useState<WorkspaceFilters>({
    status: 'all',
    slice: 'all'
  });
  const [filterScope, setFilterScope] = useState<'local' | 'project-wide'>('local');
  const [navHistory, setNavHistory] = useState<{ nodeId: string | null; scope: 'local' | 'project-wide' }[]>([]);

  const handleNavigate = (nodeId: string | null, scope: 'local' | 'project-wide' = 'local', isBack: boolean = false) => {
    if (!isBack && (nodeId !== selectedNodeId || scope !== filterScope)) {
      setNavHistory(prev => [...prev, { nodeId: selectedNodeId, scope: filterScope }]);
    }
    setSelectedNodeId(nodeId);
    setFilterScope(scope);
  };

  const handleBack = () => {
    if (navHistory.length === 0) return;
    const last = navHistory[navHistory.length - 1];
    setNavHistory(prev => prev.slice(0, -1));
    handleNavigate(last.nodeId, last.scope, true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedNode) return;
    
    const nodeIdToDelete = selectedNode.id;
    const parentId = selectedNode.parentId;
    const isProjectRoot = selectedNode.type === 'project';

    // Execute delete
    deleteNode(nodeIdToDelete);
    setIsDeleteModalOpen(false);

    // Navigation logic
    if (isProjectRoot) {
      router.push('/projects');
    } else if (parentId) {
      handleNavigate(parentId, 'local');
    } else {
      setSelectedNodeId(null);
    }
  };

  const selectedNode = selectedNodeId ? findNodeById(hierarchy, selectedNodeId) : null;
  const parentProject = selectedNodeId ? getParentProject(hierarchy, selectedNodeId) : null;

  // Effective node for rendering context (Local vs Project)
  const effectiveNode = filterScope === 'project-wide' 
    ? (parentProject || selectedNode) 
    : selectedNode;

  // Calculate tree filter state for the entire hierarchy if search is active
  const treeFilterState = !!workspaceSearchQuery || filterScope === 'project-wide'
    ? (() => {
        const fullState: Record<string, NodeFilterState> = {};
        hierarchy.forEach(node => {
          const nodeState = getTreeFilterState(node, workspaceFilters, currentUserId, workspaceSearchQuery);
          Object.assign(fullState, nodeState);
        });
        return fullState;
      })()
    : undefined;

  const isSearchActive = !!workspaceSearchQuery;
  const breadcrumbIds = useMemo(() => breadcrumb.map(n => n.id), [breadcrumb]);
  const activeProjectId = parentProject?.id || (selectedNode?.type === 'project' ? selectedNode.id : null);

  // A node is in context if:
  // 1. We are in Project scope (always show the project root)
  // 2. OR there is no active search query (filters alone shouldn't blank the page)
  // 3. OR the effective node is not dimmed in the current search context
  const isSelectionInContext = !!effectiveNode && (
    filterScope === 'project-wide' || 
    !isSearchActive || 
    (!treeFilterState || !treeFilterState[effectiveNode.id]?.isDimmed)
  );

  // Filter hierarchy based on visibility
  const visibleHierarchy = hierarchy.filter(node => {
    if (node.type === 'area') {
      // Areas are visible if any project inside them is visible
      return node.children?.some(project => canViewProject(project, activePersona, currentUserId));
    }
    if (node.type === 'project') {
      return canViewProject(node, activePersona, currentUserId);
    }
    return true;
  }).map(node => {
    if (node.type === 'area') {
      return {
        ...node,
        children: node.children?.filter(project => canViewProject(project, activePersona, currentUserId))
      };
    }
    return node;
  });

  // Update breadcrumb and project in store whenever selection changes
  useEffect(() => {
    if (selectedNode) {
      const project = getParentProject(hierarchy, selectedNode.id);
      
      // Check if project is still visible to current persona
      if (project && !canViewProject(project, activePersona, currentUserId)) {
        setSelectedNodeId(null);
        return;
      }

      setCurrentProject(project?.title || 'No Project');
      const path = getBreadcrumbPath(hierarchy, selectedNode.id);
      setBreadcrumb(path);
    } else {
      setCurrentProject(null);
      setBreadcrumb([]);
    }
  }, [selectedNodeId, hierarchy, setBreadcrumb, setCurrentProject, activePersona, currentUserId, setSelectedNodeId]);

  // Collect items based on filter scope and search
  const getScopeItems = (node: HierarchyNode): HierarchyNode[] => {
    let items: HierarchyNode[] = [];
    const traverse = (n: HierarchyNode) => {
      const includedTypes: NodeType[] = ['stage', 'discipline', 'package', 'task'];
      if (includedTypes.includes(n.type)) items.push(n);
      if (n.children) n.children.forEach(traverse);
    };
    // Start traversal from children to exclude the root node itself
    if (node.children) {
      node.children.forEach(traverse);
    }
    return items;
  };

  const itemsToFilter = effectiveNode 
    ? (filterScope === 'project-wide'
        ? getScopeItems(effectiveNode)
        : (effectiveNode.children?.filter(c => ['stage', 'discipline', 'package', 'task'].includes(c.type)) || []))
    : [];

  const filteredItems = applyWorkspaceFilters(
    itemsToFilter, 
    workspaceFilters, 
    currentUserId,
    '' // Search is for navigation (tree), not for filtering the main pane content
  );

  const headerMetrics = useMemo(() => {
    return calculateFilteredMetrics(filteredItems);
  }, [filteredItems]);

  const headerHealth = useMemo(() => {
    return getFilteredHealthIndicators(filteredItems);
  }, [filteredItems]);

  const structuralChildren = effectiveNode?.children?.filter(c => c.type !== 'task') || [];
  const rollup = effectiveNode ? calculateRollup(effectiveNode) : null;

  const isTaskView = effectiveNode?.type === 'task';

  // Action Gating
  const validChildTypes = effectiveNode ? getValidChildTypes(effectiveNode.type) : [];
  const canAdd = effectiveNode ? validChildTypes.some(t => 
    canCreateChild(activePersona, effectiveNode, t, currentUserId, featureConfig, parentProject)
  ) : false;

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left Sidebar: Hierarchy Tree */}
      <div className="w-[300px] flex flex-col border-r bg-zinc-50/30 overflow-hidden shrink-0">
        <div className="p-3 border-b bg-white">
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Stratum Hierarchy</div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Find node..." 
              className="w-full rounded border border-zinc-200 bg-white py-1.5 pl-8 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              value={workspaceSearchQuery}
              onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
            />
            {workspaceSearchQuery && (
              <button 
                onClick={() => setWorkspaceSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {visibleHierarchy.map(node => (
            <TreeItem 
              key={node.id} 
              node={node} 
              onSelect={(id) => handleNavigate(id, 'local')}
              selectedId={selectedNodeId}
              persona={activePersona}
              userId={currentUserId}
              filterScope={filterScope}
              treeFilterState={treeFilterState}
              breadcrumbIds={breadcrumbIds}
              activeProjectId={activeProjectId}
              isSearchActive={isSearchActive}
            />
          ))}
        </div>
      </div>

      {/* Main Content: Table/Execution View */}
      <div className="flex-1 flex flex-col bg-zinc-50/10 overflow-hidden">
        {effectiveNode && isSelectionInContext ? (
          <>
            <div className="p-6 border-b bg-white">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={handleBack}
                  disabled={navHistory.length === 0}
                  className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Back"
                >
                  <ArrowLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (effectiveNode.parentId) {
                      handleNavigate(effectiveNode.parentId, 'local');
                    }
                  }}
                  disabled={!effectiveNode.parentId}
                  className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Up to parent"
                >
                  <ArrowUp size={16} />
                </button>
                <div className="h-4 w-px bg-zinc-200 mx-1" />
                <div className="flex items-center gap-1 overflow-hidden">
                  {breadcrumb.map((segment, idx) => (
                    <React.Fragment key={segment.id}>
                      {idx > 0 && <ChevronRight size={12} className="text-zinc-300 shrink-0" />}
                      <button 
                        onClick={() => handleNavigate(segment.id, 'local')}
                        className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 truncate transition-colors"
                      >
                        {segment.title}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <NodeIcon type={effectiveNode.type} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{effectiveNode.type}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{effectiveNode.title}</h2>
                </div>
                  <div className="flex items-center gap-4">
                    {headerHealth && (
                      <div className="flex items-center gap-2">
                        {effectiveNode && getHealthIndicators(effectiveNode).isOverBudget && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded border border-red-700">
                            <BarChart3 size={10} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Over Budget</span>
                          </div>
                        )}
                        {headerHealth.overdueCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded border border-red-100">
                            <AlertCircle size={10} />
                            <span className="text-[10px] font-bold">{headerHealth.overdueCount} Overdue</span>
                          </div>
                        )}
                        {headerHealth.unassignedCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded border border-amber-100">
                            <UserCheck size={10} />
                            <span className="text-[10px] font-bold">{headerHealth.unassignedCount} Unassigned</span>
                          </div>
                        )}
                        {headerHealth.readyToCloseCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">
                            <CheckCircle2 size={10} />
                            <span className="text-[10px] font-bold">{headerHealth.readyToCloseCount} Ready</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                        effectiveNode.status === 'active' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        effectiveNode.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        effectiveNode.status === 'blocked' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-zinc-50 text-zinc-600 border-zinc-200"
                      )}>
                        {effectiveNode.status}
                      </span>
                    </div>
                  </div>
              </div>
              
              {headerMetrics && featureConfig.dashboardModules && (
                <div className="mt-6 flex items-center gap-8">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                      <span>{isTaskView ? 'Sub-item Progress' : 'Overall Progress'}</span>
                      <span>{headerMetrics.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-900 transition-all duration-500" 
                        style={{ width: `${headerMetrics.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{isTaskView ? 'Sub-items' : 'Items'}</div>
                      <div className="text-lg font-bold text-zinc-900 leading-tight">{headerMetrics.totalTasks}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Open</div>
                      <div className="text-lg font-bold text-zinc-900 leading-tight">{headerMetrics.openTasks}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Done</div>
                      <div className="text-lg font-bold text-zinc-900 leading-tight text-emerald-600">{headerMetrics.completedTasks}</div>
                    </div>
                    
                    {featureConfig.timeTracking && (
                      <>
                        <div className="w-px h-8 bg-zinc-100 mx-2" />
                        
                        <div className="text-center">
                          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Spent</div>
                          <div className="text-lg font-bold text-zinc-900 leading-tight">{headerMetrics.totalSpent}h</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Avg/Item</div>
                          <div className="text-lg font-bold text-zinc-900 leading-tight">{headerMetrics.avgHoursPerTask.toFixed(1)}h</div>
                        </div>
                        {headerMetrics.mostTimeConsumingTask && (
                          <div className="text-left pl-4 border-l border-zinc-100 max-w-[140px]">
                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Most Effort</div>
                            <div className="text-[10px] font-bold text-zinc-900 truncate leading-tight" title={headerMetrics.mostTimeConsumingTask.title}>
                              {headerMetrics.mostTimeConsumingTask.title}
                            </div>
                            <div className="text-[9px] text-zinc-500">{headerMetrics.mostTimeConsumingTask.spent}h</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-10">
                {/* Structural Children Section (Only for structural nodes) */}
                {((!isTaskView && structuralChildren.length > 0) || (effectiveNode.type !== 'area' && canAdd)) && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-zinc-400" /> Sub-Hierarchy
                      </h3>
                      {effectiveNode.type !== 'area' && (
                        canAdd ? (
                          <button 
                            onClick={() => setIsAddTaskOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                          >
                            <Plus size={12} />
                            Add Item/Child
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 cursor-not-allowed">
                            <Lock size={12} />
                            Add Item/Child
                          </div>
                        )
                      )}
                    </div>
                    {!isTaskView && structuralChildren.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {structuralChildren.map(child => {
                        const childRollup = calculateRollup(child);
                        return (
                          <div 
                            key={child.id} 
                            onClick={() => handleNavigate(child.id, 'local')}
                            className="group p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <NodeIcon type={child.type} />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{child.type}</span>
                              </div>
                              <span className={cn(
                                "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border",
                                child.status === 'active' ? "text-blue-600 border-blue-100 bg-blue-50/30" :
                                child.status === 'completed' ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" :
                                "text-zinc-400 border-zinc-100 bg-zinc-50/30"
                              )}>
                                {child.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 mb-4 group-hover:text-blue-600 transition-colors">{child.title}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                                <span>Progress</span>
                                <span>{childRollup.progress}%</span>
                              </div>
                              <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-400" style={{ width: `${childRollup.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

                {/* Items / Sub-items Section */}
                <section>
                  <div className="flex items-center gap-6 mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-zinc-400" /> {isTaskView ? 'Sub-Items' : 'Execution Items'}
                    </h3>
                    
                    {/* Operational Filters */}
                      <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                        {/* Scope Toggle */}
                        <div className="flex items-center bg-zinc-200/50 rounded p-0.5 mr-1">
                          <button
                            onClick={() => handleNavigate(selectedNodeId, 'local')}
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all",
                              filterScope === 'local' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                            )}
                          >
                            Local
                          </button>
                          <button
                            onClick={() => handleNavigate(selectedNodeId, 'project-wide')}
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all",
                              filterScope === 'project-wide' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                            )}
                          >
                            Project
                          </button>
                        </div>

                        <div className="w-px h-3 bg-zinc-300 mx-1" />

                        {['all', 'active', 'pending', 'completed'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setWorkspaceFilters({ ...workspaceFilters, status: s as any })}
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
                              workspaceFilters.status === s 
                                ? "bg-white text-zinc-900 shadow-sm" 
                                : "text-zinc-500 hover:text-zinc-700"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                        <div className="w-px h-3 bg-zinc-300 mx-1" />
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'my-scope', label: 'My Scope' },
                          { id: 'overdue', label: 'Overdue' },
                          { id: 'unassigned', label: 'Unassigned' },
                        ].map((slice) => (
                          <button
                            key={slice.id}
                            onClick={() => setWorkspaceFilters({ ...workspaceFilters, slice: slice.id as any })}
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
                              workspaceFilters.slice === slice.id 
                                ? "bg-zinc-900 text-white shadow-sm" 
                                : "text-zinc-500 hover:text-zinc-700"
                            )}
                          >
                            {slice.label}
                          </button>
                        ))}
                      </div>
                  </div>
                  <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-200">
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Title</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Priority</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Responsible</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredItems.map(item => (
                          <React.Fragment key={item.id}>
                            <tr 
                              className={cn(
                                "hover:bg-zinc-50/50 group cursor-pointer transition-colors",
                                selectedNodeId === item.id && "bg-zinc-50"
                              )}
                              onClick={() => handleNavigate(item.id, 'local')}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <NodeIcon type={item.type} className={getTreeTaskIconState(item)} />
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-sm font-semibold text-zinc-700",
                                      item.status === 'completed' && "line-through text-zinc-400"
                                    )}>{item.title}</span>
                                    <span className="text-[8px] font-bold uppercase text-zinc-400 tracking-wider">
                                      {item.type}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border",
                                  item.status === 'active' ? "text-blue-600 border-blue-100 bg-blue-50/30" :
                                  item.status === 'completed' ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" :
                                  item.status === 'blocked' ? "text-red-600 border-red-100 bg-red-50/30" :
                                  "text-zinc-400 border-zinc-100 bg-zinc-50/30"
                                )}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-tight",
                                  item.priority === 'critical' ? "text-red-600" :
                                  item.priority === 'high' ? "text-amber-600" :
                                  "text-zinc-500"
                                )}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[8px] font-bold text-zinc-500 uppercase">
                                    {item.type === 'task' 
                                      ? (item.assignee?.substring(0, 2) || 'UN')
                                      : (item.ownerId?.substring(0, 2) || 'UN')}
                                  </div>
                                  <span className="text-xs text-zinc-600 font-medium">
                                    {item.type === 'task' 
                                      ? (item.assignee || 'Unassigned')
                                      : (item.ownerId || 'Unassigned')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                  <Calendar size={12} />
                                  <span className="text-xs font-medium">{item.dueDate || '--'}</span>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                        {filteredItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-zinc-400 italic text-xs">
                              No items match your current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : isSearchActive ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4 p-8">
            <div className="p-4 rounded-full bg-zinc-50 border border-zinc-100">
              <Search size={32} className="text-zinc-200" />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-sm font-bold text-zinc-900">Selection outside search context</p>
              <p className="text-xs mt-1">The currently selected node has no matches for "{workspaceSearchQuery}". Select a highlighted node from the tree to view its results.</p>
            </div>
            <button 
              onClick={() => setWorkspaceSearchQuery('')}
              className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
            <div className="p-4 rounded-full bg-zinc-50 border border-zinc-100">
              <Search size={32} className="text-zinc-200" />
            </div>
            <p className="text-sm font-medium">Select a node from the hierarchy to view details</p>
          </div>
        )}
      </div>

      {/* Right Sidebar: Details Panel */}
      {effectiveNode && isSelectionInContext && (
        <DetailsPanel 
          node={effectiveNode} 
          isCollapsed={isDetailsCollapsed}
          onToggle={() => setIsDetailsCollapsed(!isDetailsCollapsed)}
          onDelete={() => setIsDeleteModalOpen(true)}
        />
      )}

      {/* Modals */}
      {effectiveNode && isSelectionInContext && (
        <AddNodeModal 
          isOpen={isAddTaskOpen} 
          onClose={() => setIsAddTaskOpen(false)} 
          anchorNode={effectiveNode} 
        />
      )}

      {selectedNode && (
        <DeleteNodeModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          node={selectedNode}
        />
      )}
    </div>
  );
}
