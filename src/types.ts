
export type DatabaseType = "entity" | "list";
export type FieldType = "text" | "number" | "boolean" | "date" | "select" | "person" | "relation" | "status" | "priority";

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  showInList: boolean;
  showInDetails: boolean;
  optionsSource?: "inline" | "listDb";
  options?: string[];
  targetDatabaseId?: string;
}

export interface RecordDef {
  id: string;
  values: Record<string, any>;
}

export interface Database {
  id: string;
  name: string;
  type: DatabaseType;
  fields: FieldDef[];
  records: RecordDef[];
}

export interface AdminSnapshot {
  schemaVersion: number;
  metadata: {
    level1: string; // Area
    level2: string; // Project
    level3: string; // Stage
    level4: string; // Discipline
    level5: string; // Package
    level6: string; // Task
  };
  databases: Record<string, Database>;
}

export type RoleId = "admin" | "manager" | "contributor" | "observer";

export interface Persona {
  id: string;
  name: string;
  roleId: RoleId;
  initials: string;
}

/**
 * HARDENED DOMAIN TYPES (v1.2 Contract)
 */

export interface BaseDomainEntity {
  id: string;
  createdAt: string;
  creatorId: string;
}

export interface Role extends BaseDomainEntity {
  label: string;
  isSystem: boolean;
}

export interface Status extends BaseDomainEntity {
  label: string;
  color: string;
  isTerminal: boolean;
  isSystem: boolean;
}

export interface Priority extends BaseDomainEntity {
  label: string;
  level: number;
  isSystem: boolean;
}

export interface Person extends BaseDomainEntity {
  name: string;
  roleId: string;
  email?: string;
}

export interface Tag extends BaseDomainEntity {
  label: string;
  color?: string;
}

export interface StructuralNode extends BaseDomainEntity {
  name: string;
  parentId?: string;
  ownerId: string;
  startDate?: string;
  dueDate?: string;
  notes?: string;
  budgetHours?: number; // Authored at Package, rolled up elsewhere
  spentHours?: number;  // Rolled up
  remainingHours?: number; // Rolled up
}

export interface Area extends StructuralNode {}
export interface Project extends StructuralNode {
  areaId: string;
  statusId: string;
  priorityId: string;
}
export interface Stage extends StructuralNode {
  projectId: string;
}
export interface Discipline extends StructuralNode {
  stageId: string;
}
export interface Package extends StructuralNode {
  disciplineId: string;
}

export interface Task extends BaseDomainEntity {
  title: string;
  anchorId: string;
  anchorType: 'project' | 'stage' | 'discipline' | 'package' | 'task';
  resolvedProjectId: string;
  parentTaskId?: string;
  statusId: string;
  priorityId: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  notes?: string;
  tags?: string[];
  spentHours?: number; // Derived from time entries
}

export interface TimeEntry extends BaseDomainEntity {
  taskId: string;
  personId: string;
  hours: number;
  date: string;
  notes?: string;
}
