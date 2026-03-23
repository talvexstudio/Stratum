
import { AdminSnapshot, Persona, RecordDef } from '../types';

export function getVisibleProjects(snapshot: AdminSnapshot, currentUser: Persona): RecordDef[] {
  const projectsDb = snapshot.databases["projects"];
  const tasksDb = snapshot.databases["tasks"];
  
  if (!projectsDb) return [];
  
  // Admin sees all
  if (currentUser.roleId === "admin") {
    return projectsDb.records;
  }
  
  const visibleProjectIds = new Set<string>();
  
  // Check project ownership
  projectsDb.records.forEach(project => {
    if (project.values.ownerId === currentUser.id) {
      visibleProjectIds.add(project.id);
    }
  });
  
  // Check task involvement
  if (tasksDb) {
    tasksDb.records.forEach(task => {
      const isInvolved = task.values.assigneeId === currentUser.id || task.values.createdById === currentUser.id;
      if (isInvolved && task.values.projectId) {
        visibleProjectIds.add(task.values.projectId);
      }
    });
  }
  
  return projectsDb.records.filter(p => visibleProjectIds.has(p.id));
}
