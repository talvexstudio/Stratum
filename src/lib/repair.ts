
import { AdminSnapshot, RecordDef } from '../types';
import { makeSeedSnapshot } from './seed';

const REQUIRED_DATABASES = ["people", "roles", "statuses", "priorities", "areas", "projects", "stages", "disciplines", "tasks"];
const REQUIRED_ROLES = ["admin", "manager", "contributor"];

export function repairSystemState(snapshot: AdminSnapshot, todayIso: string): AdminSnapshot {
  try {
    const seed = makeSeedSnapshot(todayIso);
    
    // Force reset if schema version is old
    if (!snapshot.schemaVersion || snapshot.schemaVersion < seed.schemaVersion) {
      console.log(`Schema version mismatch (found ${snapshot.schemaVersion}, need ${seed.schemaVersion}). Resetting to seed.`);
      return seed;
    }

    const repaired = { ...snapshot };

    // Ensure databases exist and records are arrays
    for (const dbId of REQUIRED_DATABASES) {
      if (!repaired.databases[dbId]) {
        repaired.databases[dbId] = seed.databases[dbId];
      } else {
        const rawRecords = repaired.databases[dbId].records;
        let recordsArray: RecordDef[] = [];
        
        if (Array.isArray(rawRecords)) {
          recordsArray = rawRecords;
        } else {
          // Migration from object map if it exists
          recordsArray = Object.values(rawRecords);
        }
        
        // Deduplicate by ID
        const seen = new Set<string>();
        repaired.databases[dbId].records = recordsArray.filter(r => {
          if (r && r.id && !seen.has(r.id)) {
            seen.add(r.id);
            return true;
          }
          return false;
        });
      }
    }

    // Ensure roles exist
    const rolesDb = repaired.databases["roles"];
    for (const roleId of REQUIRED_ROLES) {
      if (!rolesDb.records.find(r => r.id === roleId)) {
        const seedRole = seed.databases["roles"].records.find(r => r.id === roleId);
        if (seedRole) rolesDb.records.push(seedRole);
      }
    }

    // Ensure at least one admin exists in people
    const peopleDb = repaired.databases["people"];
    const hasAdmin = peopleDb.records.some(r => r.values["roleId"] === "admin");
    if (!hasAdmin) {
      const seedAdmin = seed.databases["people"].records.find(r => r.values["roleId"] === "admin");
      if (seedAdmin) peopleDb.records.push(seedAdmin);
    }

    return repaired;
  } catch (error) {
    console.error("Repair failed, resetting to seed", error);
    return makeSeedSnapshot(todayIso);
  }
}
