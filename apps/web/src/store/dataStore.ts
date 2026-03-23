import { create } from 'zustand';
import { HierarchyNode, NodeType, NodeStatus, NodePriority, TimeEntry } from '../lib/hierarchy';
import { blankSeed, coreSeed, advancedSeed } from '../lib/seeds';

// Seed selection constant
const ACTIVE_SEED = coreSeed;

interface DataState {
  hierarchy: HierarchyNode[];
  selectedNodeId: string | null;
  currentSeedType: 'blank' | 'core' | 'advanced';
  setSelectedNodeId: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<HierarchyNode>) => void;
  toggleTemplate: (id: string) => void;
  addNode: (parentId: string, node: Omit<HierarchyNode, 'id' | 'createdAt' | 'creatorId' | 'resolvedProjectId'>, templateId?: string) => string;
  deleteNode: (id: string) => void;
  addTimeEntry: (taskId: string, entry: Omit<TimeEntry, 'id' | 'createdAt' | 'creatorId'>) => void;
  updateTimeEntry: (taskId: string, entryId: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (taskId: string, entryId: string) => void;
  resetDemoData: () => void;
  setSeedData: (seedType: 'blank' | 'core' | 'advanced') => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  hierarchy: JSON.parse(JSON.stringify(ACTIVE_SEED)),
  selectedNodeId: null,
  currentSeedType: 'core',
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  resetDemoData: () => {
    const { currentSeedType } = get();
    let seed;
    switch (currentSeedType) {
      case 'blank': seed = blankSeed; break;
      case 'advanced': seed = advancedSeed; break;
      case 'core':
      default: seed = coreSeed; break;
    }
    set({ 
      hierarchy: JSON.parse(JSON.stringify(seed)), 
      selectedNodeId: null 
    });
  },

  setSeedData: (seedType) => {
    let seed;
    switch (seedType) {
      case 'blank': seed = blankSeed; break;
      case 'advanced': seed = advancedSeed; break;
      case 'core':
      default: seed = coreSeed; break;
    }
    set({
      hierarchy: JSON.parse(JSON.stringify(seed)),
      selectedNodeId: null,
      currentSeedType: seedType
    });
  },

  updateNode: (id, updates) => set((state) => {
    const updateRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          // Protection for system records
          if (node.isSystem) {
            console.warn(`Attempted to update system node ${id}. Mutation ignored.`);
            return node;
          }

          const updatedNode = { ...node, ...updates };

          // Recalculate resolvedProjectId if parentId changes
          if (updates.parentId && updates.parentId !== node.parentId) {
            const parentNode = findNodeById(state.hierarchy, updates.parentId);
            updatedNode.resolvedProjectId = parentNode?.type === 'project' ? parentNode.id : parentNode?.resolvedProjectId || '';
          }

          return updatedNode;
        }
        if (node.children) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };
    return { hierarchy: updateRecursive(state.hierarchy) };
  }),
  
  toggleTemplate: (id) => set((state) => {
    const updateRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(node => {
        if (node.id === id && node.type === 'project') {
          return { ...node, isTemplate: !node.isTemplate };
        }
        if (node.children) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };
    return { hierarchy: updateRecursive(state.hierarchy) };
  }),

  addNode: (parentId, newNodeData, templateId) => {
    let newId = '';
    set((state) => {
      const parentNode = findNodeById(state.hierarchy, parentId);
      newId = `node-${Math.random().toString(36).substr(2, 9)}`;
      
      const resolvedProjectId = newNodeData.type === 'project' 
        ? newId 
        : (parentNode?.type === 'project' ? parentNode.id : parentNode?.resolvedProjectId || '');

      const newNode: HierarchyNode = {
        ...(newNodeData as any),
        id: newId,
        parentId,
        resolvedProjectId,
        createdAt: new Date().toISOString(),
        creatorId: 'current-user',
        children: []
      };

      // If templateId is provided, clone the template structure
      if (templateId && newNodeData.type === 'project') {
        const templateNode = findNodeById(state.hierarchy, templateId);
        if (templateNode && templateNode.children) {
          newNode.children = cloneHierarchy(templateNode.children, newId, newId, newNode.ownerId);
        }
      }

      const addRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newNode]
            };
          }
          if (node.children) {
            return { ...node, children: addRecursive(node.children) };
          }
          return node;
        });
      };
      return { hierarchy: addRecursive(state.hierarchy) };
    });
    return newId;
  },

  deleteNode: (id) => set((state) => {
    const nodeToDelete = findNodeById(state.hierarchy, id);
    if (nodeToDelete?.isSystem) {
      console.warn(`Attempted to delete system node ${id}. Deletion ignored.`);
      return state;
    }

    const deleteRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => ({
          ...node,
          children: node.children ? deleteRecursive(node.children) : undefined
        }));
    };
    return { hierarchy: deleteRecursive(state.hierarchy) };
  }),

  addTimeEntry: (taskId, entryData) => set((state) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: `time-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      creatorId: 'current-user'
    };

    const addRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(node => {
        if (node.id === taskId) {
          const timeEntries = [...(node.timeEntries || []), newEntry];
          const spent = timeEntries.reduce((acc, e) => acc + e.hours, 0);
          return {
            ...node,
            timeEntries,
            spent
          };
        }
        if (node.children) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });
    };
    return { hierarchy: addRecursive(state.hierarchy) };
  }),

  updateTimeEntry: (taskId, entryId, updates) => set((state) => {
    const updateRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(node => {
        if (node.id === taskId) {
          const timeEntries = (node.timeEntries || []).map(e => 
            e.id === entryId ? { ...e, ...updates } : e
          );
          const spent = timeEntries.reduce((acc, e) => acc + e.hours, 0);
          return { ...node, timeEntries, spent };
        }
        if (node.children) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };
    return { hierarchy: updateRecursive(state.hierarchy) };
  }),

  deleteTimeEntry: (taskId, entryId) => set((state) => {
    const deleteRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(node => {
        if (node.id === taskId) {
          const timeEntries = (node.timeEntries || []).filter(e => e.id !== entryId);
          const spent = timeEntries.reduce((acc, e) => acc + e.hours, 0);
          return { ...node, timeEntries, spent };
        }
        if (node.children) {
          return { ...node, children: deleteRecursive(node.children) };
        }
        return node;
      });
    };
    return { hierarchy: deleteRecursive(state.hierarchy) };
  }),
}));

// Helper to find a node by ID
export const findNodeById = (nodes: HierarchyNode[], id: string): HierarchyNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper to clone hierarchy for templates
const cloneHierarchy = (
  nodes: HierarchyNode[], 
  newParentId: string, 
  newProjectId: string,
  newOwnerId: string
): HierarchyNode[] => {
  return nodes.map(node => {
    const newId = `node-${Math.random().toString(36).substr(2, 9)}`;
    
    const clonedNode: HierarchyNode = {
      id: newId,
      type: node.type,
      title: node.title,
      parentId: newParentId,
      resolvedProjectId: newProjectId,
      status: 'pending', // Reset status
      priority: node.priority,
      assignee: 'Unassigned', // Reset assignee
      ownerId: newOwnerId, // Default to new project owner
      creatorId: 'current-user',
      createdAt: new Date().toISOString(),
      // Explicitly exclude operational data
      startDate: undefined,
      dueDate: undefined,
      tags: [],
      notes: undefined,
      spent: 0,
      budget: undefined, // Reset budget
      timeEntries: [],
      progress: 0,
      isTerminal: false,
      children: node.children ? cloneHierarchy(node.children, newId, newProjectId, newOwnerId) : []
    };

    return clonedNode;
  });
};
