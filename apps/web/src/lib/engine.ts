import { HierarchyNode, NodeStatus, NodePriority, NodeType } from './hierarchy';
import { PersonaType, FeatureConfig } from '../store/uiStore';

/**
 * Permission Logic
 */

export const isFeatureEnabled = (config: FeatureConfig, feature: keyof FeatureConfig): boolean => {
  return !!config[feature];
};

// Helper to check if a user participates in a project tree
const userParticipatesInProject = (project: HierarchyNode, userId: string): boolean => {
  let participates = false;
  const traverse = (node: HierarchyNode) => {
    if (node.ownerId === userId || node.assignee === userId) {
      participates = true;
      return;
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  traverse(project);
  return participates;
};

export const canViewProject = (
  project: HierarchyNode,
  persona: PersonaType,
  userId: string
): boolean => {
  if (persona === 'admin' || persona === 'observer') return true;
  if (persona === 'manager' && project.ownerId === userId) return true;
  return userParticipatesInProject(project, userId);
};

export const visibleProjectsForPersona = (
  nodes: HierarchyNode[],
  persona: PersonaType,
  userId: string
): HierarchyNode[] => {
  const projects: HierarchyNode[] = [];
  
  const findProjects = (currentNodes: HierarchyNode[]) => {
    currentNodes.forEach(node => {
      if (node.type === 'project') {
        if (canViewProject(node, persona, userId)) {
          projects.push(node);
        }
      } else if (node.children) {
        findProjects(node.children);
      }
    });
  };

  findProjects(nodes);
  return projects;
};

export const canCreateProject = (persona: PersonaType): boolean => {
  return persona === 'admin' || persona === 'manager';
};

export const canEditStructure = (
  persona: PersonaType,
  node: HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  if (persona === 'observer') return false;
  if (persona === 'admin') return true;
  if (persona === 'manager') {
    // Managers can only edit structure in projects they own
    return parentProject?.ownerId === userId;
  }
  // Contributors cannot edit structure
  return false;
};

export const canEditBudget = (
  persona: PersonaType,
  node: HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  if (!featureConfig.budgeting) return false;
  if (persona === 'observer') return false;
  if (node.type !== 'package') return false;
  if (persona === 'admin') return true;
  if (persona === 'manager') {
    return parentProject?.ownerId === userId;
  }
  return false;
};

export const canEditTimeEntry = (
  persona: PersonaType,
  entryUserId: string,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  if (!featureConfig.timeTracking) return false;
  if (persona === 'observer') return false;
  if (persona === 'admin') return true;
  if (persona === 'manager') {
    return parentProject?.ownerId === userId;
  }
  if (persona === 'contributor') {
    return entryUserId === userId;
  }
  return false;
};

export const canLogTime = (
  persona: PersonaType,
  node: HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  if (!featureConfig.timeTracking) return false;
  if (persona === 'observer') return false;
  if (node.type !== 'task') return false;
  
  // Terminal status blocks new time logging
  if (node.isTerminal) return false;
  
  if (persona === 'admin') return true;
  if (persona === 'manager') {
    // Managers can log time in projects they own
    return parentProject?.ownerId === userId;
  }
  if (persona === 'contributor') {
    // Contributors can only log time on tasks assigned to them
    return node.assignee === userId;
  }
  
  return false;
};

export const canCreateAnchoredTask = (
  persona: PersonaType,
  anchorNode: HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  return canCreateChild(persona, anchorNode, 'task', userId, featureConfig, parentProject);
};

export const canEditField = (
  persona: PersonaType,
  node: HierarchyNode,
  field: keyof HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  if (node.isSystem) return false; // System records are protected from all personas
  if (field === 'tags' && !featureConfig.tags) return false;
  if (persona === 'observer') return false;

  // v1.3 Ownership Rules
  // 1. Node Owner (ownerId) is editable by Admin only
  if (field === 'ownerId') {
    return persona === 'admin';
  }

  if (persona === 'admin') return true;

  // 2. Assignee is editable by Admin (handled above) and Node Owner
  if (field === 'assignee') {
    return node.ownerId === userId;
  }

  // Manager logic
  if (persona === 'manager') {
    // Managers can edit everything in their owned projects EXCEPT ownerId (handled above)
    return parentProject?.ownerId === userId;
  }

  // Contributor logic
  if (persona === 'contributor') {
    if (node.type !== 'task') return false;

    const isAssigned = node.assignee === userId;
    const isOwner = node.ownerId === userId;

    // Contributor-created subtask: fully editable by that contributor
    if (isOwner) {
      return true;
    }

    if (isAssigned) {
      // Assigned but not owner: only status and notes
      return field === 'status' || field === 'notes';
    }

    return false;
  }

  return false;
};

export const canEditStartDate = (
  persona: PersonaType,
  node: HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  return canEditField(persona, node, 'startDate', userId, featureConfig, parentProject);
};

export const canDeleteNode = (
  persona: PersonaType,
  node: HierarchyNode,
  userId: string
): boolean => {
  if (persona === 'admin') return true;
  return node.ownerId === userId;
};

export const canMarkAsTemplate = (
  persona: PersonaType,
  node: HierarchyNode,
  userId: string
): boolean => {
  if (persona === 'admin') return true;
  return node.type === 'project' && node.ownerId === userId;
};

/**
 * Tree Icon Semantics
 */
export const getTreeTaskIconState = (node: HierarchyNode): string => {
  if (node.type !== 'task') return 'text-zinc-400';
  return node.isTerminal ? 'text-emerald-500' : 'text-zinc-400';
};

/**
 * Contributor may create a subtask only when parent task is assigned to them
 * Manager may create a subtask only in projects they own
 */
export const canCreateSubtask = (
  persona: PersonaType,
  parentNode: HierarchyNode,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  return canCreateChild(persona, parentNode, 'task', userId, featureConfig, parentProject);
};

/**
 * Rollup Logic
 */
export interface ExecutionSummary {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  progress: number;
  status: NodeStatus;
  totalSpent: number;
  totalBudget: number;
  avgHoursPerTask: number;
  mostTimeConsumingTask: { title: string; spent: number } | null;
}

export const calculateRollup = (node: HierarchyNode): ExecutionSummary => {
  let totalTasks = 0;
  let completedTasks = 0;
  let openTasks = 0;
  let totalSpent = 0;
  let totalBudget = 0;
  let maxSpent = -1;
  let mostTimeConsuming: { title: string; spent: number } | null = null;

  const traverse = (n: HierarchyNode, isRoot: boolean = false) => {
    if (n.type === 'task' && !isRoot) {
      totalTasks++;
      if (n.isTerminal) {
        completedTasks++;
      } else {
        openTasks++;
      }
      
      // Task spent is either stored or derived from entries
      const itemSpent = n.spent || (n.timeEntries?.reduce((acc, entry) => acc + entry.hours, 0) || 0);
      totalSpent += itemSpent;

      if (itemSpent > maxSpent && itemSpent > 0) {
        maxSpent = itemSpent;
        mostTimeConsuming = { title: n.title, spent: itemSpent };
      }
    } else {
      // Only sum budgets from packages to avoid double counting and ensure package is the control layer
      if (n.type === 'package' && n.budget) {
        totalBudget += n.budget;
      }

      // If it's a root task, we still want to include its own spent in the total
      if (n.type === 'task' && isRoot) {
        const itemSpent = n.spent || (n.timeEntries?.reduce((acc, entry) => acc + entry.hours, 0) || 0);
        totalSpent += itemSpent;
      }
    }

    if (n.children) {
      n.children.forEach(child => traverse(child, false));
    }
  };

  traverse(node, true);

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
    totalBudget,
    avgHoursPerTask: totalTasks > 0 ? totalSpent / totalTasks : 0,
    mostTimeConsumingTask: mostTimeConsuming
  };
};

/**
 * Structural Child Creation Helpers
 */
export const getValidChildTypes = (parentNodeType: NodeType): NodeType[] => {
  switch (parentNodeType) {
    case 'area':
      return ['project'];
    case 'project':
      return ['stage', 'task'];
    case 'stage':
      return ['discipline', 'task'];
    case 'discipline':
      return ['package', 'task'];
    case 'package':
      return ['task'];
    case 'task':
      return ['task']; // subtask
    default:
      return [];
  }
};

export const canCreateChild = (
  persona: PersonaType,
  parentNode: HierarchyNode,
  childType: NodeType,
  userId: string,
  featureConfig: FeatureConfig,
  parentProject?: HierarchyNode | null
): boolean => {
  if (persona === 'observer') return false;
  if (persona === 'admin') return true;

  const validTypes = getValidChildTypes(parentNode.type);
  if (!validTypes.includes(childType)) return false;

  // Feature flags
  if (childType === 'task' && parentNode.type === 'task' && !featureConfig.subtasks) return false;

  if (persona === 'manager') {
    // Managers can create children in projects they own
    return parentProject?.ownerId === userId;
  }

  if (persona === 'contributor') {
    // Contributors can only create tasks (subtasks) under tasks assigned to them
    if (childType === 'task' && parentNode.type === 'task') {
      return parentNode.assignee === userId;
    }
    return false;
  }

  return false;
};

/**
 * Breadcrumb & Context Helpers
 */
export interface BreadcrumbSegment {
  id: string;
  title: string;
}

export const getBreadcrumbPath = (nodes: HierarchyNode[], targetId: string): BreadcrumbSegment[] => {
  const path: BreadcrumbSegment[] = [];
  
  const findPath = (currentNodes: HierarchyNode[], currentPath: BreadcrumbSegment[]): boolean => {
    for (const node of currentNodes) {
      const newPath = [...currentPath, { id: node.id, title: node.title }];
      if (node.id === targetId) {
        path.push(...newPath);
        return true;
      }
      if (node.children && findPath(node.children, newPath)) {
        return true;
      }
    }
    return false;
  };

  findPath(nodes, []);
  return path;
};

export const getParentProject = (nodes: HierarchyNode[], targetId: string): HierarchyNode | null => {
  let project: HierarchyNode | null = null;

  const findProject = (currentNodes: HierarchyNode[], currentProject: HierarchyNode | null): boolean => {
    for (const node of currentNodes) {
      const nextProject = node.type === 'project' ? node : currentProject;
      if (node.id === targetId) {
        project = nextProject;
        return true;
      }
      if (node.children && findProject(node.children, nextProject)) {
        return true;
      }
    }
    return false;
  };

  findProject(nodes, null);
  return project;
};

/**
 * Anchor Validation
 */
export const validateTaskAnchor = (
  anchor: HierarchyNode,
  parentTask?: HierarchyNode
): { valid: boolean; error?: string } => {
  if (anchor.type === 'area') {
    return { valid: false, error: 'Tasks cannot be anchored to an Area.' };
  }
  
  // Check for cycles if parentTask is provided
  if (parentTask && parentTask.id === anchor.id) {
    return { valid: false, error: 'A task cannot be its own parent.' };
  }

  return { valid: true };
};
