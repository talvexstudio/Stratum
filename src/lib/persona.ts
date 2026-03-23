
import { Persona, AdminSnapshot, RoleId } from "../types";

const SESSION_PERSONA = "talvex-active-persona";

export const resolvePersonaId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  const as = urlParams.get('as');
  if (as) {
    sessionStorage.setItem(SESSION_PERSONA, as);
    return as;
  }
  return sessionStorage.getItem(SESSION_PERSONA);
};

export const updatePersonaId = (id: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_PERSONA, id);
  const url = new URL(window.location.href);
  url.searchParams.set('as', id);
  window.history.replaceState({}, '', url.toString());
};

export const getPersonaFromSnapshot = (id: string | null, snapshot: AdminSnapshot): Persona | null => {
  if (!id) return null;
  const peopleDb = snapshot.databases["people"];
  const record = peopleDb?.records[id];
  if (!record) return null;
  
  // Normalize roleId
  let roleId = record.values.roleId as string;
  if (roleId.toLowerCase() === 'admin') roleId = 'admin';
  else if (roleId.toLowerCase() === 'manager') roleId = 'manager';
  else if (roleId.toLowerCase() === 'contributor') roleId = 'contributor';
  else roleId = 'contributor';

  return {
    id: record.id,
    name: record.values.name,
    roleId: roleId as RoleId,
    initials: record.values.initials || record.values.name.substring(0, 2).toUpperCase()
  };
};
