
"use client";

import { AdminSnapshot, FieldDef, RecordDef } from '../types';
import { makeSeedSnapshot } from '../lib/seed';
import { repairSystemState } from '../lib/repair';

const KEYS = {
  REMEMBER: "talvex.admin.remember",
  SNAPSHOT: "talvex.admin.snapshot"
};

class AdminStore {
  private snapshot: AdminSnapshot | null = null;
  private remember: boolean = false;
  private isHydrated: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {}

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public hydrate(todayIso: string) {
    if (typeof window === "undefined") return;
    if (this.isHydrated) return;

    try {
      const storedRemember = localStorage.getItem(KEYS.REMEMBER);
      this.remember = storedRemember === "true";

      const storedSnapshot = localStorage.getItem(KEYS.SNAPSHOT);
      if (storedSnapshot) {
        const parsed = JSON.parse(storedSnapshot);
        // Force reset if metadata is missing or schema version is outdated
        if (!parsed.metadata || parsed.schemaVersion < 5) {
          console.log("Outdated schema or missing metadata, resetting to seed");
          this.snapshot = makeSeedSnapshot(todayIso);
        } else {
          this.snapshot = repairSystemState(parsed, todayIso);
        }
      } else {
        this.snapshot = makeSeedSnapshot(todayIso);
      }
    } catch (error) {
      console.error("Hydration failed, resetting to seed", error);
      this.snapshot = makeSeedSnapshot(todayIso);
    }

    this.isHydrated = true;
    this.persist();
    this.notify();
  }

  public getSnapshot(): AdminSnapshot | null {
    return this.snapshot;
  }

  public setSnapshot(snapshot: AdminSnapshot) {
    this.snapshot = snapshot;
    this.persist();
    this.notify();
  }

  public getRemember(): boolean {
    return this.remember;
  }

  public setRemember(on: boolean) {
    this.remember = on;
    this.persist();
    this.notify();
  }

  public resetToSeed(todayIso: string) {
    this.snapshot = makeSeedSnapshot(todayIso);
    this.persist();
    this.notify();
  }

  public updateMetadata(key: string, value: string) {
    if (!this.snapshot) return;
    this.snapshot.metadata[key] = value;
    this.persist();
    this.notify();
  }

  public addField(dbId: string, field: FieldDef) {
    if (!this.snapshot) return;
    const db = this.snapshot.databases[dbId];
    if (!db) return;
    db.fields.push(field);
    this.persist();
    this.notify();
  }

  public updateField(dbId: string, fieldId: string, updates: Partial<FieldDef>) {
    if (!this.snapshot) return;
    const db = this.snapshot.databases[dbId];
    if (!db) return;
    db.fields = db.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    this.persist();
    this.notify();
  }

  public deleteField(dbId: string, fieldId: string) {
    if (!this.snapshot) return;
    const db = this.snapshot.databases[dbId];
    if (!db) return;
    db.fields = db.fields.filter(f => f.id !== fieldId);
    this.persist();
    this.notify();
  }

  public addRecord(dbId: string, record: RecordDef) {
    if (!this.snapshot) return;
    const db = this.snapshot.databases[dbId];
    if (!db) return;
    db.records.push(record);
    this.persist();
    this.notify();
  }

  public updateRecord(dbId: string, recordId: string, values: Record<string, any>) {
    if (!this.snapshot) return;
    const db = this.snapshot.databases[dbId];
    if (!db) return;

    // Protection for system records
    const record = db.records.find(r => r.id === recordId);
    if (record?.values.isSystem) {
      console.warn(`Attempted to update system record ${recordId} in ${dbId}. Mutation ignored.`);
      return;
    }

    db.records = db.records.map(r => r.id === recordId ? { ...r, values: { ...r.values, ...values } } : r);
    this.persist();
    this.notify();
  }

  public deleteRecord(dbId: string, recordId: string) {
    if (!this.snapshot) return;
    const db = this.snapshot.databases[dbId];
    if (!db) return;

    // Protection for system records
    const record = db.records.find(r => r.id === recordId);
    if (record?.values.isSystem) {
      console.warn(`Attempted to delete system record ${recordId} in ${dbId}. Deletion ignored.`);
      return;
    }

    db.records = db.records.filter(r => r.id !== recordId);
    this.persist();
    this.notify();
  }

  public checkDependencies(dbId: string, recordId: string): { dbId: string; recordId: string; fieldId: string }[] {
    if (!this.snapshot) return [];
    const dependencies: { dbId: string; recordId: string; fieldId: string }[] = [];

    Object.values(this.snapshot.databases).forEach(db => {
      db.fields.forEach(field => {
        if (field.type === 'relation' && field.targetDatabaseId === dbId) {
          db.records.forEach(record => {
            if (record.values[field.id] === recordId) {
              dependencies.push({ dbId: db.id, recordId: record.id, fieldId: field.id });
            }
          });
        }
      });
    });

    return dependencies;
  }

  public getIsHydrated(): boolean {
    return this.isHydrated;
  }

  private persist() {
    if (typeof window === "undefined") return;

    localStorage.setItem(KEYS.REMEMBER, String(this.remember));
    if (this.snapshot) {
      localStorage.setItem(KEYS.SNAPSHOT, JSON.stringify(this.snapshot));
    }
  }
}

// Export a singleton instance
export const adminStore = new AdminStore();
