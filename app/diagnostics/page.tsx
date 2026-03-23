
'use client';

import React, { useEffect, useState } from 'react';
import { adminStore } from '../../src/store/adminStore';
import { SCHEMA_REGISTRY, MANDATORY_DATABASES } from '../../src/lib/schemaRegistry';
import { resolveTaskContext, validateTaskAnchor, hasCircularDependency, resolveAnchorPath } from '../../src/lib/taskResolver';
import { AdminSnapshot, RecordDef } from '../../src/types';

export default function DiagnosticsPage() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);

  useEffect(() => {
    adminStore.hydrate(new Date().toISOString());
    setSnapshot(adminStore.getSnapshot());
  }, []);

  if (!snapshot) return <div className="p-8">Hydrating snapshot...</div>;

  const taskDb = snapshot.databases['tasks'];
  const taskRecords = taskDb?.records || [];

  // 1. Metadata Labels
  const metadata = snapshot.metadata;

  // 2. Database Registry
  const registryProof = MANDATORY_DATABASES.map(dbId => {
    const def = SCHEMA_REGISTRY[dbId];
    const primaryField = def.fields[0];
    return {
      id: dbId,
      type: def.type,
      primaryFieldId: primaryField.id,
      recordCount: snapshot.databases[dbId]?.records.length || 0
    };
  });

  // 3. Task Resolver Matrix
  const resolverMatrix = taskRecords.map(task => {
    const context = resolveTaskContext(task, snapshot);
    const anchorField = ['projectId', 'stageId', 'disciplineId', 'packageId', 'parentTaskId'].find(f => task.values[f]);
    const anchorPath = resolveAnchorPath(task, snapshot);
    return {
      id: task.id,
      anchorType: anchorField || 'NONE',
      anchorValue: anchorField ? task.values[anchorField] : 'N/A',
      resolvedProjectId: context.projectId || 'NULL',
      parentType: context.structuralParentType || 'NULL',
      parentId: context.structuralParentId || 'NULL',
      anchorPath
    };
  });

  // 4. Validation Matrix
  const validationMatrix = [
    {
      case: "No anchor",
      task: { id: 'v1', values: { title: 'No Anchor' } } as RecordDef,
      check: (t: RecordDef) => validateTaskAnchor(t) ? 'PASS' : 'FAIL',
      expected: 'FAIL'
    },
    {
      case: "Multiple anchors",
      task: { id: 'v2', values: { title: 'Multi Anchor', projectId: 'pr1', stageId: 'st1' } } as RecordDef,
      check: (t: RecordDef) => validateTaskAnchor(t) ? 'PASS' : 'FAIL',
      expected: 'FAIL'
    },
    {
      case: "Circular parentTaskId",
      isCyclic: hasCircularDependency('t-cycle-1', 't-cycle-2', {
        ...snapshot,
        databases: {
          ...snapshot.databases,
          tasks: {
            ...snapshot.databases.tasks,
            records: [
              { id: 't-cycle-1', values: { title: 'Cycle 1', parentTaskId: 't-cycle-2' } },
              { id: 't-cycle-2', values: { title: 'Cycle 2', parentTaskId: 't-cycle-1' } }
            ]
          }
        }
      } as any),
      expected: 'FAIL (Cyclic Detected)'
    },
    {
      case: "Broken anchor chain",
      context: resolveTaskContext(
        { id: 'v4', values: { title: 'Broken Stage', stageId: 'st-broken' } } as RecordDef,
        {
          ...snapshot,
          databases: {
            ...snapshot.databases,
            stages: { records: [{ id: 'st-broken', values: { name: 'Broken', projectId: '' } }] }
          }
        } as any
      ),
      expected: 'FAIL (Orphaned)'
    }
  ];

  // 5. Seed Inventory
  const seedInventory = MANDATORY_DATABASES.map(dbId => {
    const def = SCHEMA_REGISTRY[dbId];
    const primaryFieldId = def.fields[0].id;
    return {
      dbId,
      records: snapshot.databases[dbId]?.records.map(r => ({
        id: r.id,
        primaryValue: r.values[primaryFieldId]
      })) || []
    };
  });

  // 6. Schema & Relation Proof (Phase 2)
  const schemaProof = MANDATORY_DATABASES.map(dbId => {
    const db = snapshot.databases[dbId];
    return {
      dbId,
      fields: db.fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        target: f.targetDatabaseId || 'N/A'
      }))
    };
  });

  // 7. Dependency Scan Proof (Phase 2)
  // We'll scan for dependencies of a few key records
  const dependencyProof = [
    { dbId: 'areas', recordId: 'a1' },
    { dbId: 'projects', recordId: 'pr1' },
    { dbId: 'tasks', recordId: 't1' }
  ].map(p => ({
    ...p,
    deps: adminStore.checkDependencies(p.dbId, p.recordId)
  }));

  return (
    <div className="p-8 font-mono text-[10px] space-y-12 bg-black text-zinc-400 min-h-screen">
      <header className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-white uppercase tracking-tighter">Stratum Engine v1 // Phase 2 Runtime Proofs</h1>
        <p className="text-zinc-500 mt-1">Generated: {new Date().toISOString()}</p>
      </header>

      {/* 1. Metadata Labels */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          1. Metadata Labels (Live)
        </h2>
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(metadata).map(([k, v]) => (
            <div key={k} className="bg-zinc-900 p-3 border border-zinc-800 rounded">
              <div className="text-zinc-600 uppercase text-[8px] mb-1">{k}</div>
              <div className="text-white font-bold text-sm">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Schema & Relation Proof (Phase 2) */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          2. Schema & Relation Targets
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {schemaProof.map(db => (
            <div key={db.dbId} className="bg-zinc-900 p-4 border border-zinc-800 rounded">
              <div className="text-white font-bold mb-2 uppercase">{db.dbId}</div>
              <div className="grid grid-cols-4 gap-2 text-[8px] text-zinc-500 uppercase border-b border-zinc-800 pb-1 mb-2">
                <span>Field ID</span>
                <span>Label</span>
                <span>Type</span>
                <span>Target DB</span>
              </div>
              <div className="space-y-1">
                {db.fields.map(f => (
                  <div key={f.id} className="grid grid-cols-4 gap-2">
                    <span className="text-zinc-300">{f.id}</span>
                    <span className="text-zinc-400">{f.label}</span>
                    <span className="text-amber-500">{f.type}</span>
                    <span className={f.target !== 'N/A' ? 'text-blue-400 font-bold' : 'text-zinc-600'}>{f.target}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Dependency Scan Proof (Phase 2) */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          3. Deletion Dependency Scan
        </h2>
        <div className="space-y-4">
          {dependencyProof.map((p, i) => (
            <div key={i} className="bg-zinc-900 p-4 border border-zinc-800 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Record: {p.dbId} / {p.recordId}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${p.deps.length > 0 ? 'bg-rose-900/30 text-rose-500' : 'bg-emerald-900/30 text-emerald-500'}`}>
                  {p.deps.length > 0 ? 'Deletion Blocked' : 'Safe to Delete'}
                </span>
              </div>
              {p.deps.length > 0 ? (
                <div className="space-y-1">
                  {p.deps.map((d, j) => (
                    <div key={j} className="text-[9px] text-zinc-500 italic">
                      Referenced by <span className="text-zinc-300">{d.dbId}</span> record <span className="text-zinc-300">{d.recordId}</span> via field <span className="text-zinc-300">{d.fieldId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[9px] text-zinc-600 italic">No incoming relations found.</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. Task Resolver Matrix */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          2. Database Registry
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 font-normal uppercase">DB ID</th>
              <th className="pb-2 font-normal uppercase">Type</th>
              <th className="pb-2 font-normal uppercase">Primary Field</th>
              <th className="pb-2 font-normal uppercase">Record Count</th>
            </tr>
          </thead>
          <tbody>
            {registryProof.map(db => (
              <tr key={db.id} className="border-b border-zinc-900 hover:bg-zinc-900/30">
                <td className="py-2 text-white font-bold">{db.id}</td>
                <td className="py-2 capitalize">{db.type}</td>
                <td className="py-2 text-amber-500">{db.primaryFieldId}</td>
                <td className="py-2 text-blue-400">{db.recordCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 3. Task Resolver Matrix */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          3. Task Resolver Matrix
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 font-normal uppercase">Task ID</th>
              <th className="pb-2 font-normal uppercase">Anchor Type</th>
              <th className="pb-2 font-normal uppercase">Anchor Value</th>
              <th className="pb-2 font-normal uppercase">Resolved Project</th>
              <th className="pb-2 font-normal uppercase">Parent Type/ID</th>
              <th className="pb-2 font-normal uppercase">Resolved Anchor Path</th>
            </tr>
          </thead>
          <tbody>
            {resolverMatrix.map(row => (
              <tr key={row.id} className="border-b border-zinc-900 hover:bg-zinc-900/30">
                <td className="py-2 text-white">{row.id}</td>
                <td className="py-2 text-amber-500">{row.anchorType}</td>
                <td className="py-2">{row.anchorValue}</td>
                <td className="py-2 text-blue-400 font-bold">{row.resolvedProjectId}</td>
                <td className="py-2 text-zinc-500">{row.parentType} / {row.parentId}</td>
                <td className="py-2 text-[9px] text-zinc-600 italic">{row.anchorPath}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 4. Validation Matrix */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          4. Validation Matrix
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {validationMatrix.map((v, i) => (
            <div key={i} className="flex items-center justify-between bg-zinc-900 p-3 border border-zinc-800 rounded">
              <div className="flex items-center gap-4">
                <span className="text-zinc-500 w-4">{i+1}.</span>
                <span className="text-white font-bold w-48">{v.case}</span>
                <span className="text-zinc-600 italic">Expected: {v.expected}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Result:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  (v.task && v.check(v.task) === 'FAIL') || v.isCyclic || (v.context && !v.context.projectId) 
                  ? 'bg-rose-900/30 text-rose-500 border border-rose-900/50' 
                  : 'bg-emerald-900/30 text-emerald-500 border border-emerald-900/50'
                }`}>
                  {v.task ? v.check(v.task) : (v.isCyclic ? 'FAIL (Cyclic)' : (v.context && !v.context.projectId ? 'FAIL (Orphaned)' : 'PASS'))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Seed Inventory */}
      <section>
        <h2 className="text-emerald-500 font-bold mb-4 uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          5. Seed Inventory
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {seedInventory.map(db => (
            <div key={db.dbId} className="bg-zinc-900/50 border border-zinc-800 rounded overflow-hidden">
              <div className="bg-zinc-800 px-3 py-1.5 text-white font-bold uppercase flex justify-between items-center">
                <span>{db.dbId}</span>
                <span className="text-[8px] opacity-50">{db.records.length} records</span>
              </div>
              <div className="p-3 space-y-1 max-h-32 overflow-y-auto">
                {db.records.map(r => (
                  <div key={r.id} className="flex justify-between border-b border-zinc-800/50 pb-1 last:border-0">
                    <span className="text-zinc-500">{r.id}</span>
                    <span className="text-zinc-300">{String(r.primaryValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
