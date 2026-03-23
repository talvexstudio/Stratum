
import { AdminSnapshot, Database, FieldDef, RecordDef } from '../types';
import { SCHEMA_REGISTRY } from './schemaRegistry';

export function makeSeedSnapshot(todayIso: string): AdminSnapshot {
  const now = new Date(todayIso);
  const today = todayIso.split('T')[0];
  
  const createDatabase = (id: string, name: string, type: "entity" | "list", fields: FieldDef[], records: RecordDef[] = []): Database => ({
    id, name, type, fields, records
  });

  const roles: Database = createDatabase("roles", "Roles", "list", SCHEMA_REGISTRY.roles.fields, [
    { id: "admin", values: { label: "Administrator", isSystem: true } },
    { id: "manager", values: { label: "Project Manager", isSystem: true } },
    { id: "contributor", values: { label: "Team Contributor", isSystem: true } },
    { id: "observer", values: { label: "Observer", isSystem: true } }
  ]);

  const people: Database = createDatabase("people", "People", "entity", SCHEMA_REGISTRY.people.fields, [
    { id: "p1", values: { name: "System Admin", roleId: "admin", email: "admin@stratum.com" } },
    { id: "p2", values: { name: "Project Manager", roleId: "manager", email: "pm@stratum.com" } },
    { id: "p3", values: { name: "Team Contributor", roleId: "contributor", email: "dev@stratum.com" } }
  ]);

  const statuses: Database = createDatabase("statuses", "Statuses", "list", SCHEMA_REGISTRY.statuses.fields, [
    { id: "s1", values: { label: "Active", color: "emerald", isTerminal: false, isSystem: true } },
    { id: "s2", values: { label: "On Hold", color: "amber", isTerminal: false, isSystem: true } },
    { id: "s3", values: { label: "Completed", color: "blue", isTerminal: true, isSystem: true } },
    { id: "s4", values: { label: "Overdue", color: "rose", isTerminal: false, isSystem: true } }
  ]);

  const priorities: Database = createDatabase("priorities", "Priorities", "list", SCHEMA_REGISTRY.priorities.fields, [
    { id: "p-high", values: { label: "High", level: 1, isSystem: true } },
    { id: "p-med", values: { label: "Medium", level: 2, isSystem: true } },
    { id: "p-low", values: { label: "Low", level: 3, isSystem: true } }
  ]);

  const tags: Database = createDatabase("tags", "Tags", "list", SCHEMA_REGISTRY.tags.fields, [
    { id: "tag-urgent", values: { label: "Urgent", color: "rose" } },
    { id: "tag-internal", values: { label: "Internal", color: "slate" } }
  ]);

  const areas: Database = createDatabase("areas", "Areas", "entity", SCHEMA_REGISTRY.areas.fields, [
    { id: "a1", values: { name: "Corporate Strategy", ownerId: "p1" } },
    { id: "a2", values: { name: "Product Development", ownerId: "p1" } }
  ]);

  const projects: Database = createDatabase("projects", "Projects", "entity", SCHEMA_REGISTRY.projects.fields, [
    { id: "pr1", values: { 
      name: "Talvex Stratum Launch", 
      areaId: "a1", 
      ownerId: "p1", 
      statusId: "s1", 
      priorityId: "p-high",
      startDate: today,
      dueDate: "2026-12-31"
    } },
    { id: "pr2", values: { 
      name: "Mobile App Redesign", 
      areaId: "a2", 
      ownerId: "p2",
      statusId: "s2",
      priorityId: "p-med",
      startDate: today,
      dueDate: "2026-06-30"
    } }
  ]);

  const stages: Database = createDatabase("stages", "Stages", "entity", SCHEMA_REGISTRY.stages.fields, [
    { id: "st1", values: { name: "Planning", projectId: "pr1", startDate: today, dueDate: "2026-04-01" } },
    { id: "st2", values: { name: "Execution", projectId: "pr1", startDate: "2026-04-01", dueDate: "2026-10-01" } },
    { id: "st3", values: { name: "Discovery", projectId: "pr2", startDate: today, dueDate: "2026-03-01" } }
  ]);

  const disciplines: Database = createDatabase("disciplines", "Disciplines", "entity", SCHEMA_REGISTRY.disciplines.fields, [
    { id: "d1", values: { name: "Product Design", stageId: "st1", startDate: today, dueDate: "2026-03-15" } },
    { id: "d2", values: { name: "Engineering", stageId: "st2", startDate: "2026-04-01", dueDate: "2026-09-01" } },
    { id: "d3", values: { name: "UX Research", stageId: "st3", startDate: today, dueDate: "2026-02-15" } }
  ]);

  const packages: Database = createDatabase("packages", "Packages", "entity", SCHEMA_REGISTRY.packages.fields, [
    { id: "pk1", values: { name: "UI Components", disciplineId: "d1", budgetHours: 200, startDate: today, dueDate: "2026-03-10" } },
    { id: "pk2", values: { name: "Backend API", disciplineId: "d2", budgetHours: 500, startDate: "2026-04-01", dueDate: "2026-08-01" } }
  ]);

  const tasks: Database = createDatabase("tasks", "Tasks", "entity", SCHEMA_REGISTRY.tasks.fields, [
    { id: "t1", values: { title: "Initialize Store Skeleton", anchorId: "pr1", anchorType: "project", resolvedProjectId: "pr1", statusId: "s1", priorityId: "p-high", dueDate: today, assigneeId: "p1", creatorId: "p1" } },
    { id: "t2", values: { title: "Draft API Specs", anchorId: "st1", anchorType: "stage", resolvedProjectId: "pr1", statusId: "s1", priorityId: "p-med", dueDate: new Date(now.getTime() + 86400000).toISOString().split('T')[0], assigneeId: "p2", creatorId: "p1" } },
    { id: "t3", values: { title: "User Interviews", anchorId: "d3", anchorType: "discipline", resolvedProjectId: "pr2", statusId: "s4", priorityId: "p-high", dueDate: new Date(now.getTime() - 86400000).toISOString().split('T')[0], assigneeId: "p3", creatorId: "p2" } },
    { id: "t4", values: { title: "Architecture Review", anchorId: "pk2", anchorType: "package", resolvedProjectId: "pr1", statusId: "s1", priorityId: "p-high", dueDate: today, assigneeId: "p3", creatorId: "p2" } },
    { id: "t5", values: { title: "Define RecordDef type", anchorId: "t1", anchorType: "task", resolvedProjectId: "pr1", parentTaskId: "t1", statusId: "s3", priorityId: "p-med", dueDate: today, assigneeId: "p1", creatorId: "p1" } }
  ]);

  const timeEntries: Database = createDatabase("timeEntries", "Time Entries", "entity", SCHEMA_REGISTRY.timeEntries.fields, [
    { id: "te1", values: { taskId: "t1", personId: "p1", hours: 4, date: today, notes: "Initial setup" } },
    { id: "te2", values: { taskId: "t5", personId: "p1", hours: 2, date: today, notes: "Type definitions" } }
  ]);

  return {
    schemaVersion: 5,
    metadata: {
      level1: "Area",
      level2: "Project",
      level3: "Stage",
      level4: "Discipline",
      level5: "Package",
      level6: "Task"
    },
    databases: {
      roles, people, statuses, priorities, tags, areas, projects, stages, disciplines, packages, tasks, timeEntries
    }
  };
}
