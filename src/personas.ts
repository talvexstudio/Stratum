
export interface Persona {
  id: string;
  name: string;
  roleId: 'admin' | 'manager' | 'contributor';
  initials: string;
}

export const TEMPORARY_PERSONAS: Persona[] = [
  { id: 'p1', name: 'System Admin', roleId: 'admin', initials: 'SA' },
  { id: 'p2', name: 'Project Manager', roleId: 'manager', initials: 'PM' },
  { id: 'p3', name: 'Team Contributor', roleId: 'contributor', initials: 'TC' },
];
