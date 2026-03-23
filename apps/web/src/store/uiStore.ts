import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { BreadcrumbSegment } from '../lib/engine';

export type PersonaType = 'admin' | 'manager' | 'contributor' | 'observer';

export interface FeatureConfig {
  timeTracking: boolean;
  budgeting: boolean;
  dashboardModules: boolean;
  tags: boolean;
  subtasks: boolean;
}

export interface SimulatedUser {
  id: string;
  name: string;
  role: PersonaType;
}

export const SIMULATED_USERS: SimulatedUser[] = [
  { id: 'admin-1', name: 'Admin One', role: 'admin' },
  { id: 'manager-1', name: 'Manager One', role: 'manager' },
  { id: 'manager-2', name: 'Manager Two', role: 'manager' },
  { id: 'contributor-1', name: 'Contributor One', role: 'contributor' },
  { id: 'contributor-2', name: 'Contributor Two', role: 'contributor' },
  { id: 'observer-1', name: 'Observer One', role: 'observer' },
];

interface UIState {
  sidebarCollapsed: boolean;
  activePersona: PersonaType;
  currentUserId: string;
  currentUserName: string;
  currentProject: string | null;
  breadcrumb: BreadcrumbSegment[];
  featureConfig: FeatureConfig;
  hasEnteredDemo: boolean;
  activeUtilityPanel: 'about' | 'help' | null;
  portfolioSearchQuery: string;
  workspaceSearchQuery: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSimulatedUser: (userId: string) => void;
  setCurrentProject: (project: string | null) => void;
  setBreadcrumb: (path: BreadcrumbSegment[]) => void;
  toggleSidebar: () => void;
  setFeatureConfig: (config: Partial<FeatureConfig>) => void;
  setHasEnteredDemo: (entered: boolean) => void;
  setActiveUtilityPanel: (panel: 'about' | 'help' | null) => void;
  setPortfolioSearchQuery: (query: string) => void;
  setWorkspaceSearchQuery: (query: string) => void;
  resetUIState: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activePersona: 'admin',
      currentUserId: 'admin-1',
      currentUserName: 'Admin One',
      currentProject: 'Hudson Yards Tower B',
      breadcrumb: [
        { id: 'area-nyc', title: 'Project' },
        { id: 's-design', title: 'Schematic Design' },
        { id: 'd-structural', title: 'Architecture' }
      ],
      featureConfig: {
        timeTracking: false,
        budgeting: false,
        dashboardModules: true,
        tags: false,
        subtasks: false,
      },
      hasEnteredDemo: false,
      activeUtilityPanel: null,
      portfolioSearchQuery: '',
      workspaceSearchQuery: '',
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSimulatedUser: (userId) => {
        const user = SIMULATED_USERS.find(u => u.id === userId);
        if (user) {
          set({ 
            activePersona: user.role,
            currentUserId: user.id,
            currentUserName: user.name,
            hasEnteredDemo: true
          });
        }
      },
      setCurrentProject: (project) => set({ currentProject: project }),
      setBreadcrumb: (path) => set({ breadcrumb: path }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setFeatureConfig: (config) => set((state) => ({ 
        featureConfig: { ...state.featureConfig, ...config } 
      })),
      setHasEnteredDemo: (entered) => set({ hasEnteredDemo: entered }),
      setActiveUtilityPanel: (panel) => set({ activeUtilityPanel: panel }),
      setPortfolioSearchQuery: (query) => set({ portfolioSearchQuery: query }),
      setWorkspaceSearchQuery: (query) => set({ workspaceSearchQuery: query }),
      resetUIState: () => set({
        sidebarCollapsed: false,
        activePersona: 'admin',
        currentUserId: 'admin-1',
        currentUserName: 'Admin One',
        currentProject: 'Hudson Yards Tower B',
        breadcrumb: [
          { id: 'area-nyc', title: 'Project' },
          { id: 's-design', title: 'Schematic Design' },
          { id: 'd-structural', title: 'Architecture' }
        ],
        featureConfig: {
          timeTracking: false,
          budgeting: false,
          dashboardModules: true,
          tags: false,
          subtasks: false,
        },
        hasEnteredDemo: true,
        activeUtilityPanel: null,
        portfolioSearchQuery: '',
        workspaceSearchQuery: '',
      }),
    }),
    {
      name: 'stratum-ui-storage',
    }
  )
);
