
import { AdminSnapshot, RecordDef } from "../types";

export interface TaskContext {
  projectId: string | null;
  structuralParentId: string | null;
  structuralParentType: "project" | "stage" | "discipline" | "package" | "task" | null;
}

export function resolveTaskContext(task: RecordDef, snapshot: AdminSnapshot): TaskContext {
  const { projectId, stageId, disciplineId, packageId, parentTaskId } = task.values;

  // 1. Direct Project Anchor
  if (projectId) {
    return { projectId, structuralParentId: projectId, structuralParentType: "project" };
  }

  // 2. Stage Anchor
  if (stageId) {
    const stage = snapshot.databases["stages"]?.records.find(r => r.id === stageId);
    return {
      projectId: stage?.values.projectId || null,
      structuralParentId: stageId,
      structuralParentType: "stage"
    };
  }

  // 3. Discipline Anchor
  if (disciplineId) {
    const discipline = snapshot.databases["disciplines"]?.records.find(r => r.id === disciplineId);
    const stage = snapshot.databases["stages"]?.records.find(r => r.id === discipline?.values.stageId);
    return {
      projectId: stage?.values.projectId || null,
      structuralParentId: disciplineId,
      structuralParentType: "discipline"
    };
  }

  // 4. Package Anchor
  if (packageId) {
    const pkg = snapshot.databases["packages"]?.records.find(r => r.id === packageId);
    const discipline = snapshot.databases["disciplines"]?.records.find(r => r.id === pkg?.values.disciplineId);
    const stage = snapshot.databases["stages"]?.records.find(r => r.id === discipline?.values.stageId);
    return {
      projectId: stage?.values.projectId || null,
      structuralParentId: packageId,
      structuralParentType: "package"
    };
  }

  // 5. Parent Task Anchor (Recursive)
  if (parentTaskId) {
    const parentTask = snapshot.databases["tasks"]?.records.find(r => r.id === parentTaskId);
    if (parentTask) {
      // Avoid infinite loops by checking if parentTask is not the same as task
      if (parentTask.id === task.id) return { projectId: null, structuralParentId: null, structuralParentType: null };
      
      const parentContext = resolveTaskContext(parentTask, snapshot);
      return {
        projectId: parentContext.projectId,
        structuralParentId: parentTaskId,
        structuralParentType: "task"
      };
    }
  }

  return { projectId: null, structuralParentId: null, structuralParentType: null };
}

export function validateTaskAnchor(task: RecordDef): boolean {
  const anchors = [
    task.values.projectId,
    task.values.stageId,
    task.values.disciplineId,
    task.values.packageId,
    task.values.parentTaskId
  ].filter(Boolean);

  return anchors.length === 1;
}

export function resolveAnchorPath(task: RecordDef, snapshot: AdminSnapshot): string {
  const { projectId, stageId, disciplineId, packageId, parentTaskId } = task.values;

  if (projectId) return `Project(${projectId})`;
  
  if (stageId) {
    const stage = snapshot.databases["stages"]?.records.find(r => r.id === stageId);
    return `Project(${stage?.values.projectId || '?'}) > Stage(${stageId})`;
  }

  if (disciplineId) {
    const discipline = snapshot.databases["disciplines"]?.records.find(r => r.id === disciplineId);
    const stage = snapshot.databases["stages"]?.records.find(r => r.id === discipline?.values.stageId);
    return `Project(${stage?.values.projectId || '?'}) > Stage(${discipline?.values.stageId || '?'}) > Discipline(${disciplineId})`;
  }

  if (packageId) {
    const pkg = snapshot.databases["packages"]?.records.find(r => r.id === packageId);
    const discipline = snapshot.databases["disciplines"]?.records.find(r => r.id === pkg?.values.disciplineId);
    const stage = snapshot.databases["stages"]?.records.find(r => r.id === discipline?.values.stageId);
    return `Project(${stage?.values.projectId || '?'}) > Stage(${discipline?.values.stageId || '?'}) > Discipline(${pkg?.values.disciplineId || '?'}) > Package(${packageId})`;
  }

  if (parentTaskId) {
    const parentTask = snapshot.databases["tasks"]?.records.find(r => r.id === parentTaskId);
    if (parentTask) {
      if (parentTask.id === task.id) return `Task(${parentTaskId}) > [LOOP]`;
      return `${resolveAnchorPath(parentTask, snapshot)} > Task(${parentTaskId})`;
    }
    return `Task(${parentTaskId}) [BROKEN]`;
  }

  return "No Anchor";
}

export function hasCircularDependency(taskId: string, parentTaskId: string, snapshot: AdminSnapshot): boolean {
  let currentParentId = parentTaskId;
  const visited = new Set<string>([taskId]);

  while (currentParentId) {
    if (visited.has(currentParentId)) return true;
    visited.add(currentParentId);
    const parentTask = snapshot.databases["tasks"]?.records.find(r => r.id === currentParentId);
    currentParentId = parentTask?.values.parentTaskId || "";
  }

  return false;
}
