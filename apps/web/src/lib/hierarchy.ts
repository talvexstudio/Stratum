export type NodeType = 'area' | 'project' | 'stage' | 'discipline' | 'package' | 'task';
export type NodeStatus = 'pending' | 'active' | 'completed' | 'blocked';
export type NodePriority = 'low' | 'medium' | 'high' | 'critical';

export interface TimeEntry {
  id: string;
  hours: number;
  date: string;
  notes: string;
  userId: string;
  userName: string;
  createdAt: string;
  creatorId: string;
}

export interface HierarchyNode {
  id: string;
  type: NodeType;
  title: string;
  parentId?: string;
  children?: HierarchyNode[];
  status: NodeStatus;
  priority: NodePriority;
  assignee?: string;
  ownerId: string; // For structural nodes: project owner, area owner, etc.
  creatorId: string; // The user who created the record
  createdAt: string;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  notes?: string;
  progress?: number; 
  anchorId?: string; 
  anchorType?: 'project' | 'stage' | 'discipline' | 'package' | 'task';
  resolvedProjectId: string; // MANDATORY: The project this node belongs to
  spent?: number; 
  budget?: number; 
  projectType?: string; // Project metadata field
  isTemplate?: boolean; // Whether this project is a template
  timeEntries?: TimeEntry[]; 
  isTerminal?: boolean; // Derived from status
  isSystem?: boolean; // Protection flag
}

export const PROJECT_TYPES = [
  'Commercial',
  'Hospitality',
  'Industrial',
  'Infrastructure',
  'Science',
  'Public',
  'Landscape',
  'Resort',
  'Residential',
  'Mixed Use'
];

export const mockHierarchy: HierarchyNode[] = [
  {
    id: 'area-nyc',
    type: 'area',
    title: 'New York Metro',
    status: 'active',
    priority: 'medium',
    ownerId: 'admin-1',
    creatorId: 'admin-1',
    createdAt: '2026-01-01T00:00:00Z',
    resolvedProjectId: '',
    children: [
      {
        id: 'p-hudson-yards',
        type: 'project',
        title: 'Hudson Yards Tower B',
        parentId: 'area-nyc',
        status: 'active',
        priority: 'high',
        ownerId: 'manager-1',
        creatorId: 'admin-1',
        createdAt: '2026-01-02T00:00:00Z',
        resolvedProjectId: 'p-hudson-yards',
        assignee: 'manager-1',
        dueDate: '2026-12-31',
        projectType: 'Commercial',
        tags: ['High-Rise', 'Tower'],
        progress: 45,
        budget: 2000,
        children: [
          {
            id: 'task-p-1',
            type: 'task',
            title: 'Project-Level Strategy Review',
            parentId: 'p-hudson-yards',
            anchorId: 'p-hudson-yards',
            anchorType: 'project',
            status: 'completed',
            isTerminal: true,
            priority: 'high',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-01T00:00:00Z',
            resolvedProjectId: 'p-hudson-yards',
            assignee: 'contributor-1',
            dueDate: '2026-03-05',
            tags: ['Strategy'],
            spent: 12,
            timeEntries: [
              { id: 't1', hours: 8, date: '2026-03-01', notes: 'Initial strategy draft', userId: 'contributor-1', userName: 'Contributor', createdAt: '2026-03-01T09:00:00Z', creatorId: 'contributor-1' },
              { id: 't2', hours: 4, date: '2026-03-04', notes: 'Final review and signoff', userId: 'contributor-1', userName: 'Contributor', createdAt: '2026-03-04T14:00:00Z', creatorId: 'contributor-1' }
            ]
          },
          {
            id: 'task-p-overdue',
            type: 'task',
            title: 'Overdue Safety Inspection',
            parentId: 'p-hudson-yards',
            anchorId: 'p-hudson-yards',
            anchorType: 'project',
            status: 'active',
            priority: 'critical',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-15T00:00:00Z',
            resolvedProjectId: 'p-hudson-yards',
            assignee: 'contributor-1',
            dueDate: '2026-03-01',
            tags: ['Safety']
          },
          {
            id: 'task-p-unassigned',
            type: 'task',
            title: 'Hotel Logistics Sync',
            parentId: 'p-hudson-yards',
            anchorId: 'p-hudson-yards',
            anchorType: 'project',
            status: 'pending',
            priority: 'medium',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-20T00:00:00Z',
            resolvedProjectId: 'p-hudson-yards',
            assignee: 'Unassigned',
            dueDate: '2026-03-20'
          },
          {
            id: 's-design',
            type: 'stage',
            title: 'Schematic Design',
            parentId: 'p-hudson-yards',
            status: 'completed',
            isTerminal: true,
            priority: 'medium',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-01-10T00:00:00Z',
            resolvedProjectId: 'p-hudson-yards',
            progress: 100,
            children: [
              {
                id: 'task-s-1',
                type: 'task',
                title: 'Stage-Level Quality Audit',
                parentId: 's-design',
                anchorId: 's-design',
                anchorType: 'stage',
                status: 'completed',
                isTerminal: true,
                priority: 'medium',
                ownerId: 'manager-1',
                creatorId: 'manager-1',
                createdAt: '2026-03-15T00:00:00Z',
                resolvedProjectId: 'p-hudson-yards',
                assignee: 'contributor-1',
                dueDate: '2026-04-01'
              }
            ]
          },
          {
            id: 's-foundation',
            type: 'stage',
            title: 'Foundation & Piling',
            parentId: 'p-hudson-yards',
            status: 'active',
            priority: 'high',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-01-15T00:00:00Z',
            resolvedProjectId: 'p-hudson-yards',
            children: [
              {
                id: 'd-structural',
                type: 'discipline',
                title: 'Structural Engineering',
                parentId: 's-foundation',
                status: 'active',
                priority: 'high',
                ownerId: 'manager-1',
                creatorId: 'manager-1',
                createdAt: '2026-01-20T00:00:00Z',
                resolvedProjectId: 'p-hudson-yards',
                children: [
                  {
                    id: 'pkg-piling',
                    type: 'package',
                    title: 'Piling & Shoring',
                    parentId: 'd-structural',
                    status: 'active',
                    priority: 'high',
                    ownerId: 'manager-1',
                    creatorId: 'manager-1',
                    createdAt: '2026-01-25T00:00:00Z',
                    resolvedProjectId: 'p-hudson-yards',
                    budget: 400,
                    children: [
                      {
                        id: 'task-s-ready',
                        type: 'task',
                        title: 'Foundation Load Test',
                        parentId: 'pkg-piling',
                        anchorId: 'pkg-piling',
                        anchorType: 'package',
                        status: 'active',
                        priority: 'high',
                        ownerId: 'manager-1',
                        creatorId: 'manager-1',
                        createdAt: '2026-02-25T00:00:00Z',
                        resolvedProjectId: 'p-hudson-yards',
                        assignee: 'contributor-2',
                        dueDate: '2026-03-12',
                        spent: 350,
                        timeEntries: [
                          { id: 't3', hours: 150, date: '2026-03-05', notes: 'Site prep', userId: 'contributor-2', userName: 'Contributor', createdAt: '2026-03-05T10:00:00Z', creatorId: 'contributor-2' },
                          { id: 't4', hours: 200, date: '2026-03-10', notes: 'Load testing phase 1', userId: 'contributor-2', userName: 'Contributor', createdAt: '2026-03-10T11:00:00Z', creatorId: 'contributor-2' }
                        ],
                        children: [
                          {
                            id: 'subtask-ready-1',
                            type: 'task',
                            title: 'Sensor Calibration',
                            parentId: 'task-s-ready',
                            status: 'completed',
                            isTerminal: true,
                            priority: 'medium',
                            ownerId: 'contributor-2',
                            creatorId: 'contributor-2',
                            createdAt: '2026-03-07T00:00:00Z',
                            resolvedProjectId: 'p-hudson-yards',
                            assignee: 'contributor-2',
                            spent: 40,
                            timeEntries: [
                              { id: 't5', hours: 40, date: '2026-03-08', notes: 'Full calibration', userId: 'contributor-2', userName: 'Contributor', createdAt: '2026-03-08T09:00:00Z', creatorId: 'contributor-2' }
                            ]
                          }
                        ]
                      },
                      {
                        id: 'task-over-budget',
                        type: 'task',
                        title: 'Excavation Support',
                        parentId: 'pkg-piling',
                        anchorId: 'pkg-piling',
                        anchorType: 'package',
                        status: 'active',
                        priority: 'medium',
                        ownerId: 'manager-1',
                        creatorId: 'manager-1',
                        createdAt: '2026-03-01T00:00:00Z',
                        resolvedProjectId: 'p-hudson-yards',
                        assignee: 'contributor-1',
                        dueDate: '2026-03-25',
                        spent: 120,
                        timeEntries: [
                          { id: 't6', hours: 120, date: '2026-03-11', notes: 'Emergency shoring', userId: 'contributor-1', userName: 'Contributor', createdAt: '2026-03-11T16:00:00Z', creatorId: 'contributor-1' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'p-brooklyn',
        type: 'project',
        title: 'Brooklyn Navy Yard Retrofit',
        parentId: 'area-nyc',
        status: 'active',
        priority: 'medium',
        ownerId: 'manager-2',
        creatorId: 'admin-1',
        createdAt: '2026-01-05T00:00:00Z',
        resolvedProjectId: 'p-brooklyn',
        progress: 82,
        budget: 1500,
        projectType: 'Industrial',
        tags: ['Retrofit'],
        children: [
          {
            id: 'task-b-1',
            type: 'task',
            title: 'Retrofit Feasibility Study',
            parentId: 'p-brooklyn',
            anchorId: 'p-brooklyn',
            anchorType: 'project',
            status: 'active',
            priority: 'medium',
            ownerId: 'manager-2',
            creatorId: 'manager-2',
            createdAt: '2026-02-01T00:00:00Z',
            resolvedProjectId: 'p-brooklyn',
            assignee: 'manager-1',
            dueDate: '2026-05-20'
          },
          {
            id: 'task-b-overdue',
            type: 'task',
            title: 'Basement Waterproofing Audit',
            parentId: 'p-brooklyn',
            anchorId: 'p-brooklyn',
            anchorType: 'project',
            status: 'active',
            priority: 'high',
            ownerId: 'manager-2',
            creatorId: 'manager-2',
            createdAt: '2026-02-10T00:00:00Z',
            resolvedProjectId: 'p-brooklyn',
            assignee: 'contributor-1',
            dueDate: '2026-03-05',
            tags: ['Audit']
          }
        ]
      }
    ]
  },
  {
    id: 'area-miami',
    type: 'area',
    title: 'Miami / South Florida',
    status: 'active',
    priority: 'medium',
    ownerId: 'admin-1',
    creatorId: 'admin-1',
    createdAt: '2026-01-01T00:00:00Z',
    resolvedProjectId: '',
    children: [
      {
        id: 'p-miami-hotel',
        type: 'project',
        title: 'Miami Beach Hotel & Spa',
        parentId: 'area-miami',
        status: 'active',
        priority: 'medium',
        ownerId: 'manager-1',
        creatorId: 'admin-1',
        createdAt: '2026-01-10T00:00:00Z',
        resolvedProjectId: 'p-miami-hotel',
        progress: 12,
        budget: 5000,
        projectType: 'Hospitality',
        tags: ['Beach'],
        children: [
          {
            id: 'task-m-1',
            type: 'task',
            title: 'Site Survey Validation',
            parentId: 'p-miami-hotel',
            anchorId: 'p-miami-hotel',
            anchorType: 'project',
            status: 'active',
            priority: 'medium',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-10T00:00:00Z',
            resolvedProjectId: 'p-miami-hotel',
            assignee: 'contributor-2',
            dueDate: '2026-04-10',
            tags: ['Survey']
          },
          {
            id: 'task-m-unassigned',
            type: 'task',
            title: 'Permit Submission Package',
            parentId: 'p-miami-hotel',
            anchorId: 'p-miami-hotel',
            anchorType: 'project',
            status: 'pending',
            priority: 'high',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-03-01T00:00:00Z',
            resolvedProjectId: 'p-miami-hotel',
            assignee: 'Unassigned',
            dueDate: '2026-03-15'
          }
        ]
      }
    ]
  },
  {
    id: 'area-europe',
    type: 'area',
    title: 'Europe Operations',
    status: 'active',
    priority: 'medium',
    ownerId: 'admin-1',
    creatorId: 'admin-1',
    createdAt: '2026-01-01T00:00:00Z',
    resolvedProjectId: '',
    children: [
      {
        id: 'p-lisbon',
        type: 'project',
        title: 'Lisbon Waterfront Convention Center',
        parentId: 'area-europe',
        status: 'pending',
        priority: 'medium',
        ownerId: 'manager-2',
        creatorId: 'admin-1',
        createdAt: '2026-01-15T00:00:00Z',
        resolvedProjectId: 'p-lisbon',
        progress: 0,
        budget: 3500,
        projectType: 'Public',
        tags: ['Convention'],
        children: [
          {
            id: 'task-l-1',
            type: 'task',
            title: 'Fire Strategy Update',
            parentId: 'p-lisbon',
            anchorId: 'p-lisbon',
            anchorType: 'project',
            status: 'pending',
            priority: 'critical',
            ownerId: 'manager-2',
            creatorId: 'manager-2',
            createdAt: '2026-03-01T00:00:00Z',
            resolvedProjectId: 'p-lisbon',
            assignee: 'manager-1',
            dueDate: '2026-03-20',
            tags: ['Strategy']
          }
        ]
      },
      {
        id: 'p-porto',
        type: 'project',
        title: 'Porto Innovation Campus',
        parentId: 'area-europe',
        status: 'blocked',
        priority: 'high',
        ownerId: 'manager-1',
        creatorId: 'admin-1',
        createdAt: '2026-01-20T00:00:00Z',
        resolvedProjectId: 'p-porto',
        progress: 25,
        budget: 4200,
        projectType: 'Education',
        tags: ['Campus'],
        children: [
          {
            id: 'task-po-1',
            type: 'task',
            title: 'MEP Interface Review',
            parentId: 'p-porto',
            anchorId: 'p-porto',
            anchorType: 'project',
            status: 'blocked',
            priority: 'high',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-15T00:00:00Z',
            resolvedProjectId: 'p-porto',
            assignee: 'contributor-1',
            dueDate: '2026-03-10',
            notes: 'Awaiting revised structural drawings'
          }
        ]
      },
      {
        id: 'p-matosinhos',
        type: 'project',
        title: 'Matosinhos Civic Services Upgrade',
        parentId: 'area-europe',
        status: 'completed',
        priority: 'low',
        ownerId: 'manager-1',
        creatorId: 'admin-1',
        createdAt: '2026-01-01T00:00:00Z',
        resolvedProjectId: 'p-matosinhos',
        progress: 100,
        budget: 800,
        projectType: 'Civic',
        tags: ['Upgrade'],
        children: [
          {
            id: 'task-ma-1',
            type: 'task',
            title: 'Signage Integration Check',
            parentId: 'p-matosinhos',
            anchorId: 'p-matosinhos',
            anchorType: 'project',
            status: 'completed',
            isTerminal: true,
            priority: 'low',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-01T00:00:00Z',
            resolvedProjectId: 'p-matosinhos',
            assignee: 'contributor-2',
            dueDate: '2026-02-15'
          }
        ]
      }
    ]
  },
  {
    id: 'area-mena',
    type: 'area',
    title: 'Middle East & North Africa',
    status: 'active',
    priority: 'medium',
    ownerId: 'admin-1',
    creatorId: 'admin-1',
    createdAt: '2026-01-01T00:00:00Z',
    resolvedProjectId: '',
    children: [
      {
        id: 'p-abudhabi',
        type: 'project',
        title: 'Abu Dhabi Marina Residences',
        parentId: 'area-mena',
        status: 'completed',
        priority: 'medium',
        ownerId: 'manager-2',
        creatorId: 'admin-1',
        createdAt: '2026-01-05T00:00:00Z',
        resolvedProjectId: 'p-abudhabi',
        progress: 100,
        budget: 6500,
        projectType: 'Residential',
        tags: ['Luxury'],
        children: [
          {
            id: 'task-ad-1',
            type: 'task',
            title: 'Vertical Transport Coordination',
            parentId: 'p-abudhabi',
            anchorId: 'p-abudhabi',
            anchorType: 'project',
            status: 'completed',
            isTerminal: true,
            priority: 'medium',
            ownerId: 'manager-2',
            creatorId: 'manager-2',
            createdAt: '2026-02-15T00:00:00Z',
            resolvedProjectId: 'p-abudhabi',
            assignee: 'manager-1',
            dueDate: '2026-03-01'
          }
        ]
      },
      {
        id: 'p-riyadh',
        type: 'project',
        title: 'Riyadh Mobility Hub',
        parentId: 'area-mena',
        status: 'active',
        priority: 'critical',
        ownerId: 'manager-1',
        creatorId: 'admin-1',
        createdAt: '2026-01-25T00:00:00Z',
        resolvedProjectId: 'p-riyadh',
        progress: 30,
        budget: 8000,
        projectType: 'Infrastructure',
        tags: ['Transport'],
        children: [
          {
            id: 'task-ri-1',
            type: 'task',
            title: 'Envelope Coordination Review',
            parentId: 'p-riyadh',
            anchorId: 'p-riyadh',
            anchorType: 'project',
            status: 'active',
            priority: 'high',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-02-20T00:00:00Z',
            resolvedProjectId: 'p-riyadh',
            assignee: 'contributor-1',
            dueDate: '2026-03-15'
          },
          {
            id: 'task-ri-over-budget',
            type: 'task',
            title: 'Retail Back-of-House Fitout',
            parentId: 'p-riyadh',
            anchorId: 'p-riyadh',
            anchorType: 'project',
            status: 'active',
            priority: 'medium',
            ownerId: 'manager-1',
            creatorId: 'manager-1',
            createdAt: '2026-03-01T00:00:00Z',
            resolvedProjectId: 'p-riyadh',
            assignee: 'contributor-2',
            dueDate: '2026-04-01',
            spent: 150,
            timeEntries: [
              { id: 't-ri-1', hours: 150, date: '2026-03-10', notes: 'Design coordination', userId: 'contributor-2', userName: 'Contributor', createdAt: '2026-03-10T09:00:00Z', creatorId: 'contributor-2' }
            ]
          }
        ]
      },
      {
        id: 'p-barcelona',
        type: 'project',
        title: 'Barcelona Life Sciences Park',
        parentId: 'area-mena', // Wait, Barcelona is in Europe, but I'll stick to the user's mix or adjust
        status: 'active',
        priority: 'medium',
        ownerId: 'manager-2',
        creatorId: 'admin-1',
        createdAt: '2026-02-01T00:00:00Z',
        resolvedProjectId: 'p-barcelona',
        progress: 15,
        projectType: 'Science',
        tags: ['Lab'],
        children: [
          {
            id: 'task-ba-1',
            type: 'task',
            title: 'Lab Equipment Calibration',
            parentId: 'p-barcelona',
            anchorId: 'p-barcelona',
            anchorType: 'project',
            status: 'active',
            priority: 'high',
            ownerId: 'manager-2',
            creatorId: 'manager-2',
            createdAt: '2026-03-01T00:00:00Z',
            resolvedProjectId: 'p-barcelona',
            assignee: 'manager-1',
            dueDate: '2026-03-25',
            tags: ['Calibration']
          }
        ]
      },
      {
        id: 'p-colombo',
        type: 'project',
        title: 'Colombo Integrated Resort Expansion',
        parentId: 'area-mena', // Using MENA area for this mix
        status: 'pending',
        priority: 'medium',
        ownerId: 'manager-2',
        creatorId: 'admin-1',
        createdAt: '2026-02-10T00:00:00Z',
        resolvedProjectId: 'p-colombo',
        progress: 5,
        budget: 12000,
        projectType: 'Resort',
        tags: ['Expansion'],
        children: [
          {
            id: 'task-co-1',
            type: 'task',
            title: 'Environmental Impact Study',
            parentId: 'p-colombo',
            anchorId: 'p-colombo',
            anchorType: 'project',
            status: 'pending',
            priority: 'medium',
            ownerId: 'manager-2',
            creatorId: 'manager-2',
            createdAt: '2026-03-05T00:00:00Z',
            resolvedProjectId: 'p-colombo',
            assignee: 'manager-1',
            dueDate: '2026-04-15'
          }
        ]
      }
    ]
  }
];
