import { HierarchyNode, NodeStatus, NodeType } from './hierarchy';
import { calculateRollup, ExecutionSummary } from './engine';
import { SIMULATED_USERS } from '../store/uiStore';

export interface PortfolioSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  overdueTasks: number;
  unassignedTasks: number;
  completedTasks: number;
  totalSpent: number;
}

export interface HealthIndicators {
  overdueCount: number;
  unassignedCount: number;
  readyToCloseCount: number;
  nextToCloseCount: number;
  isOverBudget: boolean;
}

export interface TeamMemberLoad {
  assignee: string;
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
}

export interface ExecutionMetrics {
  totalSpent: number;
  avgHoursPerOpenTask: number;
  tasksWithNoTime: number;
  mostTimeConsumingTask: { title: string; spent: number } | null;
}

export interface BudgetState {
  budget: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: 'under' | 'near' | 'over' | 'none';
  isExplicit: boolean;
  isNoBudget: boolean;
}

export const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Portfolio-level analytics
 */
export const getPortfolioSummary = (projects: HierarchyNode[]): PortfolioSummary => {
  let overdueTasks = 0;
  let unassignedTasks = 0;
  let completedTasks = 0;
  let totalSpent = 0;
  const today = getTodayDate();

  const traverseItems = (node: HierarchyNode) => {
    if (node.type === 'task') {
      const itemSpent = node.spent || (node.timeEntries?.reduce((acc, entry) => acc + entry.hours, 0) || 0);
      totalSpent += itemSpent;

      if (node.status === 'completed') {
        completedTasks++;
      } else {
        // Overdue check
        if (node.dueDate && node.dueDate < today) {
          overdueTasks++;
        }
        // Unassigned check
        if (!node.assignee || node.assignee === 'Unassigned') {
          unassignedTasks++;
        }
      }
    }
    if (node.children) {
      node.children.forEach(traverseItems);
    }
  };

  projects.forEach(p => {
    if (p.isTemplate) return; // Exclude templates from KPI totals
    traverseItems(p);
  });

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    pendingProjects: projects.filter(p => p.status === 'pending').length,
    overdueTasks,
    unassignedTasks,
    completedTasks,
    totalSpent
  };
};

/**
 * Project-specific health indicators
 */
export const getHealthIndicators = (node: HierarchyNode): HealthIndicators => {
  let overdueCount = 0;
  let unassignedCount = 0;
  let readyToCloseCount = 0;
  let nextToCloseCount = 0;
  const today = getTodayDate();

  const upcomingThreshold = new Date(today);
  upcomingThreshold.setDate(upcomingThreshold.getDate() + 7);
  const upcomingStr = upcomingThreshold.toISOString().split('T')[0];

  const traverse = (n: HierarchyNode) => {
    // Ready to close check (Direct children terminal rule)
    // A node is Ready to close only when: it has direct children and all of its direct children are in a terminal/completed status
    if (n.status !== 'completed' && !n.isTerminal && n.children && n.children.length > 0) {
      const allDirectChildrenDone = n.children.every(c => c.status === 'completed' || c.isTerminal);
      if (allDirectChildrenDone) {
        readyToCloseCount++;
      }
    }

    if (n.type === 'task') {
      if (n.status !== 'completed') {
        // Overdue
        if (n.dueDate && n.dueDate < today) {
          overdueCount++;
        }
        // Unassigned
        if (!n.assignee || n.assignee === 'Unassigned') {
          unassignedCount++;
        }
        // Next to close (due within 7 days)
        if (n.dueDate && n.dueDate >= today && n.dueDate <= upcomingStr) {
          nextToCloseCount++;
        }
      }
    }

    if (n.children) {
      n.children.forEach(traverse);
    }
  };

  // Start traversal from children to exclude the root node itself
  if (node.children) {
    node.children.forEach(traverse);
  }

  const budgetState = getBudgetState(node);

    return {
    overdueCount,
    unassignedCount,
    readyToCloseCount,
    nextToCloseCount,
    isOverBudget: budgetState?.status === 'over'
  };
};

/**
 * Health indicators from a flat list of items
 */
export const getFilteredHealthIndicators = (items: HierarchyNode[]): HealthIndicators => {
  let overdueCount = 0;
  let unassignedCount = 0;
  let readyToCloseCount = 0;
  let nextToCloseCount = 0;
  const today = getTodayDate();

  const upcomingThreshold = new Date(today);
  upcomingThreshold.setDate(upcomingThreshold.getDate() + 7);
  const upcomingStr = upcomingThreshold.toISOString().split('T')[0];

  items.forEach(n => {
    if (n.status !== 'completed' && !n.isTerminal) {
      // Overdue
      if (n.dueDate && n.dueDate < today) {
        overdueCount++;
      }
      // Unassigned
      if (!n.assignee || n.assignee === 'Unassigned') {
        unassignedCount++;
      }
      // Next to close
      if (n.dueDate && n.dueDate >= today && n.dueDate <= upcomingStr) {
        nextToCloseCount++;
      }
      // Ready to close (for structural nodes in the list)
      if (n.children && n.children.length > 0) {
        const allDirectChildrenDone = n.children.every(c => c.status === 'completed' || c.isTerminal);
        if (allDirectChildrenDone) {
          readyToCloseCount++;
        }
      }
    }
  });

  return {
    overdueCount,
    unassignedCount,
    readyToCloseCount,
    nextToCloseCount,
    isOverBudget: false // Budget is tricky without full context
  };
};

/**
 * Active people in a project
 * Logic:
 * - Distinct people currently involved in non-completed / non-terminal work.
 * - Includes: node owner, assignee, creatorId (if attached to non-completed work).
 * - Project Owner is included if the project itself is not completed.
 */
export const getActivePeople = (node: HierarchyNode): string[] => {
  const people = new Set<string>();

  const traverse = (n: HierarchyNode) => {
    const isCompleted = n.status === 'completed' || n.isTerminal;
    
    if (!isCompleted) {
      if (n.ownerId) people.add(n.ownerId);
      if (n.assignee && n.assignee !== 'Unassigned') people.add(n.assignee);
      if (n.creatorId) people.add(n.creatorId);
    }

    if (n.children) {
      n.children.forEach(traverse);
    }
  };

  traverse(node);

  return Array.from(people);
};

/**
 * Team load analysis
 */
export const getTeamLoad = (node: HierarchyNode): TeamMemberLoad[] => {
  const loadMap: Record<string, { open: number; completed: number; total: number }> = {};

  const traverse = (n: HierarchyNode) => {
    if (n.type === 'task' && n.assignee && n.assignee !== 'Unassigned') {
      if (!loadMap[n.assignee]) {
        loadMap[n.assignee] = { open: 0, completed: 0, total: 0 };
      }
      loadMap[n.assignee].total++;
      if (n.status === 'completed') {
        loadMap[n.assignee].completed++;
      } else {
        loadMap[n.assignee].open++;
      }
    }
    if (n.children) {
      n.children.forEach(traverse);
    }
  };

  traverse(node);

  return Object.entries(loadMap).map(([assignee, stats]) => ({
    assignee,
    openTasks: stats.open,
    completedTasks: stats.completed,
    totalTasks: stats.total
  })).sort((a, b) => b.openTasks - a.openTasks);
};

/**
 * Project Filtering
 */
export interface ProjectFilters {
  status: 'all' | NodeStatus;
  ownership: 'all' | 'owned' | 'assigned';
  health: 'all' | 'overdue' | 'unassigned' | 'ready-to-close' | 'over-budget';
  showTemplates?: boolean;
}

export const applyProjectFilters = (
  projects: HierarchyNode[], 
  filters: ProjectFilters, 
  userId: string,
  searchQuery: string = ''
): HierarchyNode[] => {
  const filtered = projects.filter(p => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = p.title.toLowerCase().includes(q);
      const matchesId = p.id.toLowerCase().includes(q);
      
      // Resolve owner name for search
      const owner = SIMULATED_USERS.find(u => u.id === p.ownerId);
      const matchesOwner = owner ? owner.name.toLowerCase().includes(q) : p.ownerId.toLowerCase().includes(q);
      
      const matchesTags = p.tags?.some(t => t.toLowerCase().includes(q));
      const matchesType = p.projectType?.toLowerCase().includes(q);
      
      if (!matchesName && !matchesId && !matchesOwner && !matchesTags && !matchesType) return false;
    }

    // Status filter
    if (filters.status !== 'all' && p.status !== filters.status) return false;

    // Template filter
    if (!filters.showTemplates && p.isTemplate) return false;

    // Ownership filter
    if (filters.ownership === 'owned') {
      if (p.ownerId !== userId) return false;
    } else if (filters.ownership === 'assigned') {
      // Rule: Project assignee = current user OR user has assignment on an in-scope child item
      const isProjectAssignee = p.assignee === userId;
      
      let hasChildAssignment = false;
      const checkChildren = (node: HierarchyNode) => {
        if (hasChildAssignment) return;
        if (node.type === 'task' && node.assignee === userId) {
          hasChildAssignment = true;
          return;
        }
        node.children?.forEach(checkChildren);
      };
      
      if (!isProjectAssignee) {
        p.children?.forEach(checkChildren);
      }
      
      if (!isProjectAssignee && !hasChildAssignment) return false;
    }

    // Health filter
    if (filters.health !== 'all') {
      const health = getHealthIndicators(p);
      if (filters.health === 'overdue' && health.overdueCount === 0) return false;
      if (filters.health === 'unassigned' && health.unassignedCount === 0) return false;
      if (filters.health === 'ready-to-close' && health.readyToCloseCount === 0) return false;
      if (filters.health === 'over-budget' && !health.isOverBudget) return false;
    }

    return true;
  });

  return sortPortfolioProjects(filtered);
};

/**
 * Sort Portfolio Projects by priority order:
 * 1. overdue
 * 2. over-budget
 * 3. unassigned
 * 4. active
 * 5. pending
 * 6. blocked
 * 7. completed
 * 8. nearest due date (tie-break)
 * 9. title A–Z (tie-break)
 */
export const sortPortfolioProjects = (projects: HierarchyNode[]): HierarchyNode[] => {
  const getRank = (p: HierarchyNode) => {
    const health = getHealthIndicators(p);
    if (health.overdueCount > 0) return 1;
    if (health.isOverBudget) return 2;
    if (health.unassignedCount > 0) return 3;
    
    const statusPriority: Record<NodeStatus, number> = {
      'active': 4,
      'pending': 5,
      'blocked': 6,
      'completed': 7
    };
    return statusPriority[p.status] || 8;
  };

  return [...projects].sort((a, b) => {
    const rankA = getRank(a);
    const rankB = getRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Tie-break 1: Nearest due date
    if (a.dueDate || b.dueDate) {
      if (!a.dueDate) return 1; // b comes first if it has a date
      if (!b.dueDate) return -1; // a comes first if it has a date
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
    }

    // Tie-break 2: Title A-Z
    return a.title.localeCompare(b.title);
  });
};

/**
 * Workspace Filtering
 */
export interface WorkspaceFilters {
  status: 'all' | NodeStatus;
  slice: 'all' | 'my-scope' | 'overdue' | 'unassigned';
}

export const applyWorkspaceFilters = (
  nodes: HierarchyNode[], 
  filters: WorkspaceFilters, 
  userId: string,
  searchQuery: string = ''
): HierarchyNode[] => {
  return nodes.filter(n => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = n.title.toLowerCase().includes(q);
      const matchesId = n.id.toLowerCase().includes(q);
      
      // Resolve assignee name for search
      const assignee = SIMULATED_USERS.find(u => u.id === n.assignee);
      const matchesAssignee = assignee ? assignee.name.toLowerCase().includes(q) : (n.assignee?.toLowerCase().includes(q) || false);
      
      if (!matchesTitle && !matchesId && !matchesAssignee) return false;
    }

    const includedInScope: NodeType[] = ['stage', 'discipline', 'package', 'task'];
    const isScopeType = includedInScope.includes(n.type);

    // Status filter
    if (filters.status !== 'all' && n.status !== filters.status) return false;

    // Slice filter
    if (filters.slice === 'my-scope') {
      if (!isScopeType) return false;
      // My Scope = Owned OR Assigned
      const isOwned = n.ownerId === userId;
      const isAssigned = n.assignee === userId;
      if (!isOwned && !isAssigned) return false;
    }

    if (n.type !== 'task') return true; // For other slices, we usually only filter tasks
    const today = getTodayDate();
    if (filters.slice === 'overdue' && !(n.status !== 'completed' && n.dueDate && n.dueDate < today)) return false;
    if (filters.slice === 'unassigned' && !(n.status !== 'completed' && (!n.assignee || n.assignee === 'Unassigned'))) return false;

    return true;
  });
};

/**
 * Tree Filtering Utilities
 */
export interface NodeFilterState {
  matchCount: number;
  totalCount: number;
  isVisible: boolean;
  isDimmed: boolean;
  shouldExpand: boolean;
}

export const getTreeFilterState = (
  node: HierarchyNode,
  filters: WorkspaceFilters,
  userId: string,
  searchQuery: string = '',
  isParentMatch: boolean = false
): Record<string, NodeFilterState> => {
  const state: Record<string, NodeFilterState> = {};

  const process = (n: HierarchyNode, parentMatched: boolean): NodeFilterState => {
    let matchCount = 0;
    let totalCount = 0;

    const isThisNodeDirectMatch = (n.type === 'task' && applyWorkspaceFilters([n], filters, userId, searchQuery).length > 0) || 
                         (n.type !== 'task' && !!searchQuery && (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase())));

    if (n.type === 'task') {
      totalCount = 1;
      if (isThisNodeDirectMatch) matchCount = 1;
    } else {
      if (isThisNodeDirectMatch) {
        matchCount = 1;
      }
    }

    const childStates = (n.children || []).map(child => process(child, parentMatched || isThisNodeDirectMatch));
    childStates.forEach(cs => {
      matchCount += cs.matchCount;
      totalCount += cs.totalCount;
    });

    const isSearchActive = !!searchQuery || filters.status !== 'all' || filters.slice !== 'all';
    
    // A node is dimmed if:
    // 1. Search is active
    // 2. It is not a match
    // 3. It has no matching descendants
    // 4. Its parent was not a match (to keep children of matches visible)
    const isDimmed = isSearchActive && matchCount === 0 && !parentMatched && !isThisNodeDirectMatch;
    
    // We expand if there are matches below
    const shouldExpand = matchCount > 0 && isSearchActive;

    const nodeState = {
      matchCount,
      totalCount,
      isVisible: true,
      isDimmed,
      shouldExpand
    };

    state[n.id] = nodeState;
    return nodeState;
  };

  process(node, isParentMatch);
  return state;
};

/**
 * Execution Metrics from a flat list of items
 */
export const calculateFilteredMetrics = (items: HierarchyNode[]): ExecutionSummary => {
  let totalTasks = items.length;
  let completedTasks = 0;
  let openTasks = 0;
  let totalSpent = 0;
  let maxSpent = -1;
  let mostTimeConsuming: { title: string; spent: number } | null = null;

  items.forEach(n => {
    if (n.isTerminal || n.status === 'completed') {
      completedTasks++;
    } else {
      openTasks++;
    }
    
    // For spent, we still only really care about tasks or nodes that have spent time
    const itemSpent = n.spent || (n.timeEntries?.reduce((acc, entry) => acc + entry.hours, 0) || 0);
    totalSpent += itemSpent;

    if (itemSpent > maxSpent && itemSpent > 0) {
      maxSpent = itemSpent;
      mostTimeConsuming = { title: n.title, spent: itemSpent };
    }
  });

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  let status: NodeStatus = 'pending';
  if (progress === 100 && totalTasks > 0) {
    status = 'completed';
  } else if (progress > 0) {
    status = 'active';
  }

  return {
    totalTasks,
    completedTasks,
    openTasks,
    progress,
    status,
    totalSpent,
    totalBudget: 0, 
    avgHoursPerTask: totalTasks > 0 ? totalSpent / totalTasks : 0,
    mostTimeConsumingTask: mostTimeConsuming
  };
};

/**
 * Execution Metrics
 */
export const getExecutionMetrics = (node: HierarchyNode): ExecutionMetrics => {
  let totalSpent = 0;
  let openTasks = 0;
  let tasksWithNoTime = 0;
  let maxSpent = -1;
  let mostTimeConsuming: { title: string; spent: number } | null = null;

  const traverse = (n: HierarchyNode) => {
    if (n.type === 'task') {
      const itemSpent = n.spent || (n.timeEntries?.reduce((acc, entry) => acc + entry.hours, 0) || 0);
      totalSpent += itemSpent;
      
      if (n.status !== 'completed') {
        openTasks++;
      }

      if (itemSpent === 0) {
        tasksWithNoTime++;
      }

      if (itemSpent > maxSpent) {
        maxSpent = itemSpent;
        mostTimeConsuming = { title: n.title, spent: itemSpent };
      }
    }
    if (n.children) {
      n.children.forEach(traverse);
    }
  };

  traverse(node);

  return {
    totalSpent,
    avgHoursPerOpenTask: openTasks > 0 ? totalSpent / openTasks : 0,
    tasksWithNoTime,
    mostTimeConsumingTask: mostTimeConsuming
  };
};

/**
 * Budget State (for structural nodes)
 * Logic:
 * - Package is the control layer (explicit budget)
 * - Higher levels show rolled-up budget from descendant packages
 * - Utilization thresholds: <= 80% (under), > 80% (near), > 100% (over)
 */
export const getBudgetState = (node: HierarchyNode): BudgetState | null => {
  if (node.type === 'task') return null;

  const rollup = calculateRollup(node);
  
  // A budget is explicit if it's set directly on a package
  const isExplicit = node.type === 'package';
  
  // For packages, we use their own budget. For others, we use the rolled-up sum.
  const budget = isExplicit ? (node.budget || 0) : rollup.totalBudget;
  const spent = rollup.totalSpent;
  
  const isNoBudget = budget <= 0;
  
  if (isNoBudget) {
    return {
      budget: 0,
      spent,
      remaining: 0,
      utilization: 0,
      status: 'none',
      isExplicit,
      isNoBudget: true
    };
  }

  const remaining = budget - spent;
  const utilization = (spent / budget) * 100;

  let status: 'under' | 'near' | 'over' = 'under';
  if (utilization > 100) {
    status = 'over';
  } else if (utilization > 80) {
    status = 'near';
  }

  return {
    budget,
    spent,
    remaining,
    utilization,
    status,
    isExplicit,
    isNoBudget: false
  };
};
