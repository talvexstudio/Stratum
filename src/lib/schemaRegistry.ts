
import { DatabaseType, FieldDef } from "../types";

export const MANDATORY_DATABASES = [
  "roles",
  "statuses",
  "priorities",
  "people",
  "tags",
  "areas",
  "projects",
  "stages",
  "disciplines",
  "packages",
  "tasks",
  "timeEntries"
] as const;

export type MandatoryDatabaseId = typeof MANDATORY_DATABASES[number];

export interface DatabaseDefinition {
  id: MandatoryDatabaseId;
  name: string;
  type: DatabaseType;
  fields: FieldDef[];
}

export const SCHEMA_REGISTRY: Record<MandatoryDatabaseId, DatabaseDefinition> = {
  roles: {
    id: "roles",
    name: "Roles",
    type: "list",
    fields: [
      { id: "label", label: "Label", type: "text", showInList: true, showInDetails: true },
      { id: "isSystem", label: "System Role", type: "boolean", showInList: false, showInDetails: true }
    ]
  },
  statuses: {
    id: "statuses",
    name: "Statuses",
    type: "list",
    fields: [
      { id: "label", label: "Label", type: "text", showInList: true, showInDetails: true },
      { id: "color", label: "Color", type: "text", showInList: true, showInDetails: true },
      { id: "isTerminal", label: "Terminal", type: "boolean", showInList: true, showInDetails: true },
      { id: "isSystem", label: "System Status", type: "boolean", showInList: false, showInDetails: true }
    ]
  },
  priorities: {
    id: "priorities",
    name: "Priorities",
    type: "list",
    fields: [
      { id: "label", label: "Label", type: "text", showInList: true, showInDetails: true },
      { id: "level", label: "Level", type: "number", showInList: true, showInDetails: true },
      { id: "isSystem", label: "System Priority", type: "boolean", showInList: false, showInDetails: true }
    ]
  },
  people: {
    id: "people",
    name: "People",
    type: "entity",
    fields: [
      { id: "name", label: "Name", type: "text", showInList: true, showInDetails: true },
      { id: "roleId", label: "Role", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "roles" },
      { id: "email", label: "Email", type: "text", showInList: true, showInDetails: true }
    ]
  },
  tags: {
    id: "tags",
    name: "Tags",
    type: "list",
    fields: [
      { id: "label", label: "Label", type: "text", showInList: true, showInDetails: true },
      { id: "color", label: "Color", type: "text", showInList: true, showInDetails: true }
    ]
  },
  areas: {
    id: "areas",
    name: "Areas",
    type: "entity",
    fields: [
      { id: "name", label: "Name", type: "text", showInList: true, showInDetails: true },
      { id: "ownerId", label: "Owner", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "people" }
    ]
  },
  projects: {
    id: "projects",
    name: "Projects",
    type: "entity",
    fields: [
      { id: "name", label: "Name", type: "text", showInList: true, showInDetails: true },
      { id: "areaId", label: "Area", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "areas" },
      { id: "ownerId", label: "Owner", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "people" },
      { id: "statusId", label: "Status", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "statuses" },
      { id: "priorityId", label: "Priority", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "priorities" },
      { id: "startDate", label: "Start Date", type: "date", showInList: false, showInDetails: true },
      { id: "dueDate", label: "Due Date", type: "date", showInList: true, showInDetails: true }
    ]
  },
  stages: {
    id: "stages",
    name: "Stages",
    type: "entity",
    fields: [
      { id: "name", label: "Name", type: "text", showInList: true, showInDetails: true },
      { id: "projectId", label: "Project", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "projects" },
      { id: "startDate", label: "Start Date", type: "date", showInList: false, showInDetails: true },
      { id: "dueDate", label: "Due Date", type: "date", showInList: true, showInDetails: true }
    ]
  },
  disciplines: {
    id: "disciplines",
    name: "Disciplines",
    type: "entity",
    fields: [
      { id: "name", label: "Name", type: "text", showInList: true, showInDetails: true },
      { id: "stageId", label: "Stage", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "stages" },
      { id: "startDate", label: "Start Date", type: "date", showInList: false, showInDetails: true },
      { id: "dueDate", label: "Due Date", type: "date", showInList: true, showInDetails: true }
    ]
  },
  packages: {
    id: "packages",
    name: "Packages",
    type: "entity",
    fields: [
      { id: "name", label: "Name", type: "text", showInList: true, showInDetails: true },
      { id: "disciplineId", label: "Discipline", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "disciplines" },
      { id: "budgetHours", label: "Budget Hours", type: "number", showInList: true, showInDetails: true },
      { id: "startDate", label: "Start Date", type: "date", showInList: false, showInDetails: true },
      { id: "dueDate", label: "Due Date", type: "date", showInList: true, showInDetails: true }
    ]
  },
  tasks: {
    id: "tasks",
    name: "Tasks",
    type: "entity",
    fields: [
      { id: "title", label: "Title", type: "text", showInList: true, showInDetails: true },
      { id: "anchorId", label: "Anchor ID", type: "text", showInList: false, showInDetails: true },
      { id: "anchorType", label: "Anchor Type", type: "text", showInList: false, showInDetails: true },
      { id: "resolvedProjectId", label: "Project", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "projects" },
      { id: "parentTaskId", label: "Parent Task", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "tasks" },
      { id: "statusId", label: "Status", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "statuses" },
      { id: "priorityId", label: "Priority", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "priorities" },
      { id: "assigneeId", label: "Assignee", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "people" },
      { id: "creatorId", label: "Creator", type: "relation", showInList: false, showInDetails: true, targetDatabaseId: "people" },
      { id: "startDate", label: "Start Date", type: "date", showInList: false, showInDetails: true },
      { id: "dueDate", label: "Due Date", type: "date", showInList: true, showInDetails: true }
    ]
  },
  timeEntries: {
    id: "timeEntries",
    name: "Time Entries",
    type: "entity",
    fields: [
      { id: "taskId", label: "Task", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "tasks" },
      { id: "personId", label: "Person", type: "relation", showInList: true, showInDetails: true, targetDatabaseId: "people" },
      { id: "hours", label: "Hours", type: "number", showInList: true, showInDetails: true },
      { id: "date", label: "Date", type: "date", showInList: true, showInDetails: true },
      { id: "notes", label: "Notes", type: "text", showInList: false, showInDetails: true }
    ]
  }
};
