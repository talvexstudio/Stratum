import { HierarchyNode, NodeType, NodeStatus, NodePriority, TimeEntry } from './hierarchy';

// Helper to generate relative dates
const today = new Date();
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const overdueDate = addDays(-14);
const healthyFutureDate = addDays(21);
const pendingFutureDate = addDays(30);
const nearFutureDate = addDays(7);
const pastDate = addDays(-30);

// Base Areas
const baseAreas: HierarchyNode[] = [
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
    children: []
  },
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
    children: []
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
    children: []
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
    children: []
  }
];

// --- BLANK SEED ---
export const blankSeed: HierarchyNode[] = JSON.parse(JSON.stringify(baseAreas));
const europeAreaBlank = blankSeed.find(a => a.id === 'area-europe')!;
europeAreaBlank.children!.push({
  id: 'p-meridian-gateway',
  type: 'project',
  title: 'Meridian Gateway',
  parentId: 'area-europe',
  status: 'pending',
  priority: 'medium',
  ownerId: 'manager-1',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-meridian-gateway',
  projectType: 'Mixed Use',
  isTemplate: false,
  children: []
});

// --- CORE SEED ---
export const coreSeed: HierarchyNode[] = JSON.parse(JSON.stringify(baseAreas));
const miamiAreaCore = coreSeed.find(a => a.id === 'area-miami')!;
const nycAreaCore = coreSeed.find(a => a.id === 'area-nyc')!;
const europeAreaCore = coreSeed.find(a => a.id === 'area-europe')!;

// 1. Miami Beach Hotel & Spa
miamiAreaCore.children!.push({
  id: 'p-miami-hotel',
  type: 'project',
  title: 'Miami Beach Hotel & Spa',
  parentId: 'area-miami',
  status: 'active',
  priority: 'medium',
  ownerId: 'manager-1',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-miami-hotel',
  projectType: 'Hospitality',
  children: [
    {
      id: 's-miami-sd',
      type: 'stage',
      title: 'Schematic Design',
      parentId: 'p-miami-hotel',
      status: 'active',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-miami-hotel',
      children: [
        {
          id: 'd-miami-arch',
          type: 'discipline',
          title: 'Architecture',
          parentId: 's-miami-sd',
          status: 'active',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'p-miami-hotel',
          children: [
            {
              id: 'pk-miami-core',
              type: 'package',
              title: 'Core & Shell',
              parentId: 'd-miami-arch',
              status: 'active',
              priority: 'medium',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'p-miami-hotel',
              children: [
                {
                  id: 't-miami-1',
                  type: 'task',
                  title: 'Draft Ground Floor Plan',
                  parentId: 'pk-miami-core',
                  status: 'active',
                  priority: 'medium',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'p-miami-hotel',
                  assignee: 'contributor-2',
                  dueDate: healthyFutureDate
                },
                {
                  id: 't-miami-2',
                  type: 'task',
                  title: 'Review Zoning Set',
                  parentId: 'pk-miami-core',
                  status: 'pending',
                  priority: 'high',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'p-miami-hotel',
                  assignee: 'manager-1',
                  dueDate: overdueDate
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// 2. Brooklyn Navy Yard Retrofit
nycAreaCore.children!.push({
  id: 'p-brooklyn-navy',
  type: 'project',
  title: 'Brooklyn Navy Yard Retrofit',
  parentId: 'area-nyc',
  status: 'blocked',
  priority: 'high',
  ownerId: 'manager-2',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-brooklyn-navy',
  projectType: 'Industrial',
  children: [
    {
      id: 's-brooklyn-cd',
      type: 'stage',
      title: 'Construction Documents',
      parentId: 'p-brooklyn-navy',
      status: 'blocked',
      priority: 'high',
      ownerId: 'manager-2',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-brooklyn-navy',
      children: [
        {
          id: 'd-brooklyn-mep',
          type: 'discipline',
          title: 'MEP Engineering',
          parentId: 's-brooklyn-cd',
          status: 'blocked',
          priority: 'high',
          ownerId: 'manager-2',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'p-brooklyn-navy',
          children: [
            {
              id: 'pk-brooklyn-hvac',
              type: 'package',
              title: 'HVAC Systems',
              parentId: 'd-brooklyn-mep',
              status: 'blocked',
              priority: 'high',
              ownerId: 'manager-2',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'p-brooklyn-navy',
              children: [
                {
                  id: 't-brooklyn-1',
                  type: 'task',
                  title: 'Ductwork Routing Clash Detection',
                  parentId: 'pk-brooklyn-hvac',
                  status: 'blocked',
                  priority: 'high',
                  ownerId: 'manager-2',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'p-brooklyn-navy',
                  assignee: 'contributor-1',
                  dueDate: overdueDate
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// 3. London Metro Extension
europeAreaCore.children!.push({
  id: 'p-london-metro',
  type: 'project',
  title: 'London Metro Extension',
  parentId: 'area-europe',
  status: 'active',
  priority: 'medium',
  ownerId: 'manager-2',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-london-metro',
  projectType: 'Infrastructure',
  children: [
    {
      id: 's-london-concept',
      type: 'stage',
      title: 'Concept Design',
      parentId: 'p-london-metro',
      status: 'active',
      priority: 'medium',
      ownerId: 'manager-2',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-london-metro',
      children: [
        {
          id: 'd-london-civil',
          type: 'discipline',
          title: 'Civil Engineering',
          parentId: 's-london-concept',
          status: 'active',
          priority: 'medium',
          ownerId: 'manager-2',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'p-london-metro',
          children: [
            {
              id: 'pk-london-tunnel',
              type: 'package',
              title: 'Tunnel Alignment',
              parentId: 'd-london-civil',
              status: 'active',
              priority: 'medium',
              ownerId: 'manager-2',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'p-london-metro',
              children: [
                {
                  id: 't-london-1',
                  type: 'task',
                  title: 'Initial Route Study',
                  parentId: 'pk-london-tunnel',
                  status: 'active',
                  priority: 'medium',
                  ownerId: 'manager-2',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'p-london-metro',
                  assignee: 'contributor-1',
                  dueDate: healthyFutureDate
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// 5. Template - Midrise Hospitality
miamiAreaCore.children!.push({
  id: 'tmpl-midrise-hospitality',
  type: 'project',
  title: 'Template — Midrise Hospitality',
  parentId: 'area-miami',
  status: 'pending',
  priority: 'medium',
  ownerId: 'manager-1',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'tmpl-midrise-hospitality',
  projectType: 'Hospitality',
  isTemplate: true,
  children: [
    {
      id: 'tmpl-s-1',
      type: 'stage',
      title: 'Mobilization',
      parentId: 'tmpl-midrise-hospitality',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-midrise-hospitality',
      children: [
        {
          id: 'tmpl-d-1',
          type: 'discipline',
          title: 'Architecture',
          parentId: 'tmpl-s-1',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-midrise-hospitality',
          children: [
            {
              id: 'tmpl-pkg-1',
              type: 'package',
              title: 'Guestroom Planning',
              parentId: 'tmpl-d-1',
              status: 'pending',
              priority: 'medium',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'tmpl-midrise-hospitality',
              children: [
                {
                  id: 'tmpl-t-1',
                  type: 'task',
                  title: 'Room Matrix Setup',
                  parentId: 'tmpl-pkg-1',
                  status: 'pending',
                  priority: 'medium',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'tmpl-midrise-hospitality'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'tmpl-s-2',
      type: 'stage',
      title: 'Delivery',
      parentId: 'tmpl-midrise-hospitality',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-midrise-hospitality',
      children: [
        {
          id: 'tmpl-d-2',
          type: 'discipline',
          title: 'Interiors',
          parentId: 'tmpl-s-2',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-midrise-hospitality',
          children: [
            {
              id: 'tmpl-pkg-2',
              type: 'package',
              title: 'Standard Room Coordination',
              parentId: 'tmpl-d-2',
              status: 'pending',
              priority: 'medium',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'tmpl-midrise-hospitality',
              children: [
                {
                  id: 'tmpl-t-2',
                  type: 'task',
                  title: 'Finish Review',
                  parentId: 'tmpl-pkg-2',
                  status: 'pending',
                  priority: 'medium',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'tmpl-midrise-hospitality'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// --- ADVANCED SEED ---
export const advancedSeed: HierarchyNode[] = JSON.parse(JSON.stringify(coreSeed));
const nycAreaAdv = advancedSeed.find(a => a.id === 'area-nyc')!;
const menaAreaAdv = advancedSeed.find(a => a.id === 'area-mena')!;
const europeAreaAdv = advancedSeed.find(a => a.id === 'area-europe')!;
const miamiAreaAdv = advancedSeed.find(a => a.id === 'area-miami')!;

// 1. Hudson Yards Tower B (Flagship stressed project)
nycAreaAdv.children!.push({
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
  projectType: 'Commercial',
  budget: 50000,
  spent: 60000, // Over budget
  children: [
    {
      id: 't-hudson-1',
      type: 'task',
      title: 'Project-Level Strategy Review',
      parentId: 'p-hudson-yards',
      status: 'completed',
      priority: 'high',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-hudson-yards',
      assignee: 'contributor-1',
      spent: 120,
      isTerminal: true
    },
    {
      id: 't-hudson-2',
      type: 'task',
      title: 'Overdue Safety Inspection',
      parentId: 'p-hudson-yards',
      status: 'active',
      priority: 'high',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-hudson-yards',
      assignee: 'contributor-1',
      dueDate: overdueDate
    },
    {
      id: 't-hudson-3',
      type: 'task',
      title: 'Hotel Logistics Sync',
      parentId: 'p-hudson-yards',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-hudson-yards',
      dueDate: nearFutureDate
    },
    {
      id: 's-hudson-1',
      type: 'stage',
      title: 'Schematic Design',
      parentId: 'p-hudson-yards',
      status: 'active',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-hudson-yards',
      children: [
        {
          id: 't-hudson-4',
          type: 'task',
          title: 'Stage-Level Quality Audit',
          parentId: 's-hudson-1',
          status: 'completed',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'p-hudson-yards',
          assignee: 'contributor-1',
          isTerminal: true
        }
      ]
    },
    {
      id: 's-hudson-2',
      type: 'stage',
      title: 'Foundation & Piling',
      parentId: 'p-hudson-yards',
      status: 'active',
      priority: 'high',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-hudson-yards',
      children: [
        {
          id: 'd-hudson-1',
          type: 'discipline',
          title: 'Structural Engineering',
          parentId: 's-hudson-2',
          status: 'active',
          priority: 'high',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'p-hudson-yards',
          children: [
            {
              id: 'pkg-hudson-1',
              type: 'package',
              title: 'Piling & Shoring',
              parentId: 'd-hudson-1',
              status: 'active',
              priority: 'high',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'p-hudson-yards',
              budget: 10000,
              spent: 12000, // Over budget
              children: [
                {
                  id: 't-hudson-5',
                  type: 'task',
                  title: 'Foundation Load Test',
                  parentId: 'pkg-hudson-1',
                  status: 'active',
                  priority: 'high',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'p-hudson-yards',
                  assignee: 'contributor-2',
                  spent: 10000,
                  children: [
                    {
                      id: 'sub-hudson-1',
                      type: 'task',
                      title: 'Sensor Calibration',
                      parentId: 't-hudson-5',
                      status: 'completed',
                      priority: 'medium',
                      ownerId: 'manager-1',
                      creatorId: 'admin-1',
                      createdAt: '2026-01-02T00:00:00Z',
                      resolvedProjectId: 'p-hudson-yards',
                      assignee: 'contributor-2',
                      isTerminal: true
                    }
                  ]
                },
                {
                  id: 't-hudson-6',
                  type: 'task',
                  title: 'Excavation Support',
                  parentId: 'pkg-hudson-1',
                  status: 'active',
                  priority: 'medium',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'p-hudson-yards',
                  assignee: 'contributor-1'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// 2. Riyadh Mobility Hub
menaAreaAdv.children!.push({
  id: 'p-riyadh-mobility',
  type: 'project',
  title: 'Riyadh Mobility Hub',
  parentId: 'area-mena',
  status: 'active',
  priority: 'high',
  ownerId: 'manager-1',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-riyadh-mobility',
  projectType: 'Infrastructure',
  children: [
    {
      id: 't-riyadh-1',
      type: 'task',
      title: 'Envelope Coordination Review',
      parentId: 'p-riyadh-mobility',
      status: 'active',
      priority: 'high',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-riyadh-mobility',
      assignee: 'contributor-1',
      dueDate: healthyFutureDate
    },
    {
      id: 't-riyadh-2',
      type: 'task',
      title: 'Retail Back-of-House Fitout',
      parentId: 'p-riyadh-mobility',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-riyadh-mobility',
      dueDate: healthyFutureDate
    }
  ]
});

// 6. Colombo Integrated Resort Expansion
menaAreaAdv.children!.push({
  id: 'p-colombo-resort',
  type: 'project',
  title: 'Colombo Integrated Resort Expansion',
  parentId: 'area-mena',
  status: 'pending',
  priority: 'medium',
  ownerId: 'manager-2',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-colombo-resort',
  projectType: 'Resort',
  children: [
    {
      id: 't-colombo-1',
      type: 'task',
      title: 'Environmental Impact Study',
      parentId: 'p-colombo-resort',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-2',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-colombo-resort',
      dueDate: healthyFutureDate
    }
  ]
});

// 7. Porto Innovation Campus
europeAreaAdv.children!.push({
  id: 'p-porto-innovation',
  type: 'project',
  title: 'Porto Innovation Campus',
  parentId: 'area-europe',
  status: 'active',
  priority: 'medium',
  ownerId: 'manager-2',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'p-porto-innovation',
  projectType: 'Mixed Use',
  children: [
    {
      id: 't-porto-1',
      type: 'task',
      title: 'MEP Interface Review',
      parentId: 'p-porto-innovation',
      status: 'active',
      priority: 'medium',
      ownerId: 'manager-2',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'p-porto-innovation',
      assignee: 'contributor-1',
      dueDate: healthyFutureDate,
      spent: 10
    }
  ]
});

// 8. Template — Hospitality Tower
miamiAreaAdv.children!.push({
  id: 'tmpl-hospitality-tower',
  type: 'project',
  title: 'Template — Hospitality Tower',
  parentId: 'area-miami',
  status: 'pending',
  priority: 'medium',
  ownerId: 'manager-1',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'tmpl-hospitality-tower',
  projectType: 'Hospitality',
  isTemplate: true,
  children: [
    {
      id: 'tmpl-ht-s-1',
      type: 'stage',
      title: 'Concept',
      parentId: 'tmpl-hospitality-tower',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-hospitality-tower',
      children: [
        {
          id: 'tmpl-ht-d-1',
          type: 'discipline',
          title: 'Architecture',
          parentId: 'tmpl-ht-s-1',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-hospitality-tower',
          children: [
            {
              id: 'tmpl-ht-t-1',
              type: 'task',
              title: 'Area Program Check',
              parentId: 'tmpl-ht-d-1',
              status: 'pending',
              priority: 'medium',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'tmpl-hospitality-tower'
            }
          ]
        }
      ]
    },
    {
      id: 'tmpl-ht-s-2',
      type: 'stage',
      title: 'Delivery',
      parentId: 'tmpl-hospitality-tower',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-hospitality-tower',
      children: [
        {
          id: 'tmpl-ht-d-2',
          type: 'discipline',
          title: 'Interiors',
          parentId: 'tmpl-ht-s-2',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-hospitality-tower',
          children: [
            {
              id: 'tmpl-ht-pkg-1',
              type: 'package',
              title: 'Typical Floor Coordination',
              parentId: 'tmpl-ht-d-2',
              status: 'pending',
              priority: 'medium',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'tmpl-hospitality-tower',
              children: [
                {
                  id: 'tmpl-ht-t-2',
                  type: 'task',
                  title: 'Finish Review',
                  parentId: 'tmpl-ht-pkg-1',
                  status: 'pending',
                  priority: 'medium',
                  ownerId: 'manager-1',
                  creatorId: 'admin-1',
                  createdAt: '2026-01-02T00:00:00Z',
                  resolvedProjectId: 'tmpl-hospitality-tower'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
});

// 9. Template — Civic Campus
europeAreaAdv.children!.push({
  id: 'tmpl-civic-campus',
  type: 'project',
  title: 'Template — Civic Campus',
  parentId: 'area-europe',
  status: 'pending',
  priority: 'medium',
  ownerId: 'manager-2',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'tmpl-civic-campus',
  projectType: 'Public',
  isTemplate: true,
  children: [
    {
      id: 'tmpl-cc-s-1',
      type: 'stage',
      title: 'Strategy',
      parentId: 'tmpl-civic-campus',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-2',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-civic-campus',
      children: [
        {
          id: 'tmpl-cc-t-1',
          type: 'task',
          title: 'Stakeholder Alignment',
          parentId: 'tmpl-cc-s-1',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-2',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-civic-campus'
        }
      ]
    },
    {
      id: 'tmpl-cc-s-2',
      type: 'stage',
      title: 'Design',
      parentId: 'tmpl-civic-campus',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-2',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-civic-campus',
      children: [
        {
          id: 'tmpl-cc-d-1',
          type: 'discipline',
          title: 'Fire Strategy',
          parentId: 'tmpl-cc-s-2',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-2',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-civic-campus',
          children: [
            {
              id: 'tmpl-cc-t-2',
              type: 'task',
              title: 'Fire Strategy Update',
              parentId: 'tmpl-cc-d-1',
              status: 'pending',
              priority: 'medium',
              ownerId: 'manager-2',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'tmpl-civic-campus'
            }
          ]
        }
      ]
    }
  ]
});

// 10. Template — Infrastructure Corridor
menaAreaAdv.children!.push({
  id: 'tmpl-infra-corridor',
  type: 'project',
  title: 'Template — Infrastructure Corridor',
  parentId: 'area-mena',
  status: 'pending',
  priority: 'medium',
  ownerId: 'manager-1',
  creatorId: 'admin-1',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedProjectId: 'tmpl-infra-corridor',
  projectType: 'Infrastructure',
  isTemplate: true,
  children: [
    {
      id: 'tmpl-ic-s-1',
      type: 'stage',
      title: 'Mobilization',
      parentId: 'tmpl-infra-corridor',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-infra-corridor',
      children: [
        {
          id: 'tmpl-ic-t-1',
          type: 'task',
          title: 'Corridor Scope Freeze',
          parentId: 'tmpl-ic-s-1',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-infra-corridor'
        }
      ]
    },
    {
      id: 'tmpl-ic-s-2',
      type: 'stage',
      title: 'Delivery',
      parentId: 'tmpl-infra-corridor',
      status: 'pending',
      priority: 'medium',
      ownerId: 'manager-1',
      creatorId: 'admin-1',
      createdAt: '2026-01-02T00:00:00Z',
      resolvedProjectId: 'tmpl-infra-corridor',
      children: [
        {
          id: 'tmpl-ic-d-1',
          type: 'discipline',
          title: 'Systems Coordination',
          parentId: 'tmpl-ic-s-2',
          status: 'pending',
          priority: 'medium',
          ownerId: 'manager-1',
          creatorId: 'admin-1',
          createdAt: '2026-01-02T00:00:00Z',
          resolvedProjectId: 'tmpl-infra-corridor',
          children: [
            {
              id: 'tmpl-ic-t-2',
              type: 'task',
              title: 'Interface Review',
              parentId: 'tmpl-ic-d-1',
              status: 'pending',
              priority: 'medium',
              ownerId: 'manager-1',
              creatorId: 'admin-1',
              createdAt: '2026-01-02T00:00:00Z',
              resolvedProjectId: 'tmpl-infra-corridor'
            }
          ]
        }
      ]
    }
  ]
});
