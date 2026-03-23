# Stratum Engine v1

## Product Specification

**Version:** 1.3  
**Status:** Revised Approved Baseline

---

# 1. Product Overview

**Stratum** is a structured project execution platform designed for complex multidisciplinary projects, optimized for **design delivery coordination in architecture and engineering (A&E)**.

The system combines:

- a **fixed structural hierarchy** for project organization
- **flexible execution tasks** anchored to that hierarchy
- **strict permission logic** based on role, ownership, assignment, and visibility scope
- **schema-driven metadata**
- **time and budget awareness** for execution control
- **operational dashboards and filters** for project health visibility
- a **responsibility surface** that projects user-relevant work across hierarchy levels

The structural model ensures organizational alignment, while the task model allows flexible execution within that structure.

---

## 1.1 Deliverables Boundary

Deliverables are **not first-class entities** in Stratum v1.

Deliverables are handled as:

- attachments to **tasks**
- attachments to **packages**

The following are **explicitly out of scope for v1**:

- document version control
- revision management
- check-in / check-out workflows
- automated revision numbering

These capabilities may be addressed in future integrations with document management systems.

---

# 2. Structural Hierarchy

The structural containment model in Stratum is **fixed and immutable**.

Administrators may rename display labels (for example *Typology → Market Sector* or *Stage → Phase*), but the underlying hierarchy remains constant.

## Hierarchy Structure

```text
Typology
 └ Project
    └ Stage
       └ Discipline
          └ Package
```

---

## 2.1 Structural Meaning vs Metadata Meaning

A core v1 rule is:

- **hierarchy labels are containment structure**
- **metadata fields carry business meaning**

This means the system must **not infer business meaning from hierarchy labels**.

Examples:

- the top hierarchy level may be labeled *Typology*, *Portfolio Bucket*, or another practice-defined term
- project card labels such as *High-rise*, *Retrofit*, *Healthcare*, or *Hospitality* are **Project Type metadata**, not hierarchy meaning

This separation is essential for future extensibility.

---

## 2.2 Level Definitions

### Typology

Top-level structural container.

In the current demo baseline it is used as a top hierarchy grouping aligned with project typology, but in product terms it remains a **configurable structural level**, not a permanently hardcoded business category.

- created and managed **only by Admins**
- used for structural grouping and rollups

---

### Project

Primary unit of work and accountability.

Projects represent the **execution boundary** of the system.

Each project has:

- a **project owner**
- an optional **assignee**
- project-level health and execution analytics

Projects are rendered in the Portfolio dashboard as project cards.

---

### Stage

Major phase or milestone period of a project.

Examples:

- Concept
- Design Development
- Construction Documentation

Stages may carry the same core operational fields as other execution nodes:
- owner
- assignee
- status
- priority
- start date
- due date

---

### Discipline

Specialized work stream or department within a stage.

Examples:

- Architecture
- Structural
- Mechanical
- Electrical

Disciplines are operational items, not merely labels.

---

### Package

Lowest structural unit.

Packages represent **execution scope containers** and are the **budget authoring anchor** in v1.

Package budgets are explicit. Higher levels display **rolled-up budgets** derived from descendant packages.

Packages also participate in readiness and closure workflows where applicable.

---

# 3. Item Model

Stratum contains two broad classes of execution-bearing records:

1. **structural items**
   - Typology
   - Project
   - Stage
   - Discipline
   - Package

2. **tasks**
   - anchored to structural levels or to parent tasks

A practical UI rule in v1 is that many operational surfaces treat records as **Items** with shared metadata such as:
- owner
- assignee
- status
- priority
- start date
- due date

This allows coherent filtering and responsibility views across hierarchy levels.

---

# 4. Task Model

Tasks represent **execution work items**.

Tasks are **not part of the structural hierarchy**, but are **anchored to it**.

---

## 4.1 Anchoring and Placement

Tasks may exist under any structural item from **Project → Package**.

Each task must have **exactly one anchor**.

### Allowed Anchors

```text
projectId
stageId
disciplineId
packageId
parentTaskId
```

### Restrictions

Tasks **may not anchor to Typology**.

The system must also prevent:

- circular `parentTaskId` chains
- orphaned task anchors
- anchor / project-context mismatches

---

## 4.2 Recursive Subtasks

Tasks support **recursive nesting** through `parentTaskId`.

Example:

```text
Task
 └ Subtask
    └ Sub-subtask
       └ Sub-sub-subtask
```

Subtasks inherit the **project context** of their parent.

Tasks with children are treated as **container items** for certain workflow rules such as readiness to close.

---

## 4.3 Project Context Resolution

The system automatically resolves a task's **project context**.

| Anchor | Resolution |
|------|------|
| projectId | direct project |
| stageId | stage.projectId |
| disciplineId | discipline.stage.projectId |
| packageId | package.discipline.stage.projectId |
| parentTaskId | inherit from parent task |

This guarantees **data isolation per project**.

---

## 4.4 Ownership vs Assignment

Tasks distinguish between **creator**, **owner**, **assignee**, and **project ownership context**.

### creatorId

The task creator.

- automatically set at creation
- immutable

### ownerId / node owner

The accountable owner of the task/node.

In v1, task and structural item ownership must remain distinct from assignment.

### assigneeId

Person responsible for execution.

- may default to creator on creation
- editable based on permissions
- may be intentionally left unassigned

### ownership context surfaced in UI

The UI should distinguish at least:

- **project owner**
- **node owner**
- **assignee**
- whether the current user is owner and/or assignee

These are separate concepts and must not be collapsed into one generic “owner” state.

---

## 4.5 Dates

Tasks support:

```text
startDate
dueDate
```

These dates are part of the core execution model and prepare the system for future dependency and Gantt capabilities.

Where both dates exist:

```text
dueDate >= startDate
```

---

# 5. Data Model

Stratum v1 uses **12 mandatory databases**.

## 5.1 Database Registry

| Database | Type | Primary Field |
|--------|--------|--------|
| roles | List | label |
| statuses | List | label |
| priorities | List | label |
| tags | List | label |
| people | Entity | name |
| typologies | Entity | name |
| projects | Entity | name |
| stages | Entity | name |
| disciplines | Entity | name |
| packages | Entity | name |
| tasks | Execution | title |
| timeEntries | Data | — |

---

## 5.2 Core Entity Expectations

### Projects

Must support at minimum:

```text
id
name
typologyId
projectType
ownerId
assigneeId (optional)
statusId
priorityId (optional)
startDate (optional)
dueDate (optional)
tagIds[]
```

### Stages / Disciplines / Packages

Must support at minimum:

```text
id
name
projectId
parent structural relation
ownerId
assigneeId (optional)
statusId
priorityId (optional)
startDate (optional)
dueDate (optional)
tagIds[]
```

### Packages

Packages additionally support:

```text
budgetHours (optional)
```

### Tasks

Must support at minimum:

```text
id
title
creatorId
ownerId
assigneeId (optional)
statusId
priorityId
startDate (optional)
dueDate (optional)
notes (optional)
tagIds[]
anchor reference
resolved project context
```

### Time Entries

Must support at minimum:

```text
id
taskId
userId
hours
entryDate
notes (optional)
createdAt
updatedAt
```

---

# 6. Tags

Tags provide cross-project categorization.

### Fields

```text
id
label
color (optional)
```

### Relations

```text
tasks.tagIds[]
projects.tagIds[]
stages.tagIds[]
disciplines.tagIds[]
packages.tagIds[]
```

### Permissions

| Role | Permission |
|------|------|
| Admin | create / edit / assign |
| Manager | create / edit / assign within owned scope |
| Contributor | assign existing where allowed |
| Observer | read-only |

---

# 7. Budget and Time Tracking

## 7.1 Budget Model

Budgets are authored **only at Package level** in v1.

```text
packages.budgetHours
```

Budgets propagate upward as **rolled-up budget values**.

```text
discipline.budgetHours = sum(descendant packages)
stage.budgetHours = sum(descendant packages)
project.budgetHours = sum(descendant packages)
typology.budgetHours = sum(descendant packages)
```

Tasks **do not carry budgets**.

Higher-level nodes may display budget information, but that information is always **derived**, not authored, above Package level.

---

## 7.2 Budget State Rules

Budget state is determined from **spent vs budgetHours**.

| Condition | State |
|------|------|
| no budget set | No Budget Set |
| utilization <= 80% | On Track |
| utilization > 80% and <= 100% | Near Budget |
| utilization > 100% | Over Budget |

### No Budget Set Handling

If a node has no explicit or rolled-up budget:

- state is **No Budget Set**
- utilization is not shown as a misleading percentage
- spent vs budget displays as `[spent]h / --`
- remaining is not treated as a real numeric control state

### Over-budget visibility

Over-budget is not merely a hidden calculation.

It must be surfaced visibly in operational portfolio views so users can identify budget risk in the visible scope.

---

## 7.3 Time Tracking

Time is recorded in **timeEntries**.

### Fields

```text
taskId
userId
hours
entryDate
notes
```

### Validation

Users **cannot log time on terminal tasks**.

Completion is defined by a **terminal status** in the `statuses` database.

### Entry Management

Permitted users may:

- create time entries
- edit time entries
- delete time entries

All time-entry changes must trigger immediate recalculation of:

- task spent
- rolled-up spent
- budget states
- execution metrics

---

## 7.4 Spent Propagation

Spent values derive from time entries.

### Task Level

```text
task.spentHours = sum(timeEntries.hours)
```

### Structural Rollup

Task spent contributes upward through the task's resolved project context.

Examples:

```text
Package-anchored task
→ package.spentHours
→ discipline.spentHours
→ stage.spentHours
→ project.spentHours
→ typology.spentHours
```

```text
Stage-anchored task
→ stage.spentHours
→ project.spentHours
→ typology.spentHours
```

### Remaining Budget

Where budget exists:

```text
remainingHours = budgetHours − spentHours
```

Negative remaining values are valid and indicate **Over Budget** state.

---

## 7.5 Execution Metrics

The system must support execution metrics at task and structural scopes.

Examples:

- total spent
- average spent per task
- most effort item in scope
- open vs done counts
- people involved in visible scope

These metrics may appear in the workspace header, portfolio cards, and supporting panels.

---

# 8. Roles and Permissions

## 8.1 Role Definitions

| Role | Description |
|------|------|
| Admin | system controller |
| Observer | scoped read-only auditor |
| Manager | project owner / delivery leader |
| Contributor | execution participant |

---

## 8.2 Permission Matrix

### Admin

Full system access:

- schema editing
- typology management
- project creation
- structural creation and editing anywhere
- task creation and editing anywhere
- time logging anywhere
- budget editing on packages
- project owner reassignment
- node owner reassignment
- assignee reassignment
- global visibility

---

### Observer

Read-only access to:

- all projects in the organization
- dashboards
- hierarchy
- tasks
- time and budget information

Observers cannot:

- create
- edit
- log time
- modify budgets

---

### Manager

Managers may:

- create projects
- create and edit structural items within **owned projects**
- create and edit anchored tasks within **owned projects**
- view projects they own and projects where they have scope
- log, edit, and delete time within **owned project scope**
- set and edit **package budgets** within owned projects
- reassign assignee on nodes they own

Managers cannot:

- create Typologies
- change project ownership unless explicitly allowed by Admin controls
- change node ownership unless explicitly allowed by Admin controls
- perform owner-level structural actions in projects they only see through assignment/scope

---

### Contributor

Contributors **cannot create structural items**.

#### Case 1 — Assigned Task Created by Someone Else

Allowed:

- edit status
- edit notes
- log time on the assigned task
- edit or delete their own time entries

Not allowed:

- edit title
- edit priority
- edit assignee
- edit start date
- edit due date
- edit tags
- edit structural context
- edit owner fields

#### Case 2 — Self-Created Subtask Under an Assigned Parent Task

Allowed:

- create the subtask
- edit title
- edit priority
- edit status
- edit start date
- edit due date
- edit notes
- edit tags where permitted
- log time
- edit or delete their own time entries

Restriction:

- reassignment away from self is not allowed unless a higher-permission user intervenes

---

## 8.3 Visibility and Scope

Users see only projects within their permitted visibility scope.

### Visibility Rules

- **Admin** sees all projects
- **Observer** sees all projects, read-only
- **Manager** sees only projects where they own or have scope
- **Contributor** sees only projects where they have scope

For non-admins, there is no implicit global project visibility.

Project scope can come from:

- project ownership
- project assignment
- structural ownership or assignment
- task creator relation
- task ownership
- task assignment

Project scope grants visibility of the **entire project tree** for that project.

---

## 8.4 Ownership Boundaries

Owner-level actions are separate from visibility.

A Manager or Contributor may be able to **see** a project through assignment/scope but still be blocked from:

- creating structural nodes
- creating anchored tasks at structural level
- editing budget information
- changing owner fields
- other owner-only actions

This distinction between **visibility** and **control** is a core v1 rule.

---

## 8.5 Ownership Field Edit Rules

The following edit rules are part of the baseline product contract:

- **Project Owner** → editable by **Admin only**
- **Node Owner** → editable by **Admin only**
- **Assignee** → editable by:
  - **Admin**
  - **Owner of the node**

These fields are distinct and must remain distinct in both API and UI.

---

# 9. Workspace and Admin Console

## 9.1 Admin Console

Admin Console manages:

- schema
- metadata
- records

Capabilities:

- level label editing
- field CRUD
- relation configuration
- record CRUD
- dependency-aware deletion blocking

---

## 9.2 Stratum Workspace

The workspace renders the hierarchy as a **nested tree**.

```text
Typology
 └ Project
   └ Stage
     └ Discipline
       └ Package
```

Tasks appear under their **anchor node**.

The workspace uses a **three-pane model**:

- left: hierarchy tree
- center: selected scope view
- right: details panel

The right details panel may be collapsible, but is expanded by default.

---

## 9.3 Hierarchy Rendering Rules

The left tree must preserve the **full structural map**.

It also surfaces:

- anchored tasks beneath their relevant scope
- completed-task visual distinction
- filter match counts when project-wide filtering is active
- dimmed non-matching branches while preserving structural orientation

Completed tasks should be visually distinguishable from incomplete tasks.

---

## 9.4 Center Pane

The center pane changes based on selected node type.

### Structural Node Selected

Displays:

- header metrics
- sub-hierarchy cards where applicable
- anchored task list

### Task Selected

Displays:

- task-specific header metrics
- subtask list
- task-scoped filters

---

## 9.5 Detail Panel

The detail panel displays schema-defined fields, relations, metadata, and operational cards.

Editing permissions depend on role.

### Task Order

For tasks, the expected order is:

```text
Title
Ownership Context
Status + Priority
Assignee
Start Date + Due Date
Time Tracking
Notes
Tags
Anchor Context
```

### Non-Task Order

For structural nodes, the expected order is:

```text
Title
Ownership Context
Status + Priority
Assignee
Start Date + Due Date
Budget
Team Load
Notes
Tags
```

The redundant execution summary card should not duplicate information already promoted to the main header.

---

## 9.6 List View Columns

Typical task-list columns include:

```text
Title
Status
Priority
Assignee
Due Date
Tags
```

Admins may hide columns but cannot alter the underlying execution model through list configuration.

---

# 10. Operational Filters and Search

## 10.1 Projects Page Filters

The Projects page functions as a **portfolio dashboard within the current user's visibility scope**.

It supports:

- search across project fields and operational item fields where appropriate
- status filters
- ownership filters
- health filters

### Status

Examples:

- All
- Active
- Completed
- Pending
- Blocked

Project cards are filtered by **project status**.
My Scope is filtered by **item status**.

### Ownership

Examples:

- All
- Owned by me
- Assigned to me

For project cards:
- **All** means all visible projects in user scope
- **Owned by me** means project owner is current user
- **Assigned to me** means project assignee is current user

For My Scope:
- **All** means items owned by me or assigned to me
- **Owned by me** means node owner is current user
- **Assigned to me** means assignee is current user

### Health

Examples:

- All
- Overdue
- Unassigned
- Ready to close

Project cards are filtered by **project-level health**.
My Scope is filtered by **item-level health** within the allowed project scope.

---

## 10.2 My Scope

The Portfolio dashboard includes a responsibility projection called **My Scope**.

This replaces the narrower task-only concept of “My Items.”

### My Scope includes

- Stage
- Discipline
- Package
- Task

### My Scope excludes

- Typology
- Project

### My Scope purpose

My Scope provides a direct operational view of the current user's responsibility surface across hierarchy levels.

It is not a second workspace and does not replace the project cards.

---

## 10.3 Search Contract

Portfolio search behaves as **one shared query with two parallel result surfaces**:

1. **Project cards**
   - filtered by project-related fields

2. **My Scope**
   - filtered by item-related fields
   - may also match on parent project fields for convenience

Search does not force My Scope to be a subset of visible project-card matches, but operational filters still constrain scope.

---

## 10.4 Workspace Filters

The workspace supports operational filtering of tasks and subtasks.

Examples:

- All
- Active
- Pending
- Completed
- My Items
- Overdue
- Unassigned

---

## 10.5 Filter Scope

Workspace filtering supports two scopes:

### Local

Only the center-pane list is filtered.

### Project-wide

The active filter applies across the currently selected project and updates:

- center-pane list
- hierarchy-tree emphasis
- tree match counts
- match vs total summary indicators

The project-wide view must preserve hierarchy context while making matching branches prominent.

---

# 11. Dashboards

## 11.1 Projects / Portfolio Dashboard

Visible to all roles within their visibility scope.

### Summary Strip

May include metrics such as:

- total projects
- active projects
- completed projects
- overdue tasks
- unassigned tasks
- total spent

These metrics must reflect the **current search and filter scope**.

### Project Cards

Project cards may surface:

- project owner
- progress
- item/task count
- people involved
- due date
- health badges
- over-budget visibility
- project type

Project cards use project-level metrics only.

My Scope uses item-level operational logic.

### Portfolio subtitle

Approved copy:

**“Strategic overview and operational control of all projects.”**

---

## 11.2 Workspace Operational Dashboard

The main workspace header should surface the selected scope's operational summary.

### Header Metrics

Examples:

- progress
- total tasks
- open tasks
- done tasks
- spent
- average per task
- most effort item
- health badges
- current status capsule

The current status capsule should align visually with health badges and should not require a redundant label.

---

## 11.3 Team Load

Team load summarizes work distribution for the selected scope.

Examples:

- open tasks per person
- task count per person
- relative load bars

This is operational context, not a replacement for the underlying task list.

---

## 11.4 PDF Snapshot Export

The Portfolio dashboard should support export of the **current filtered view** to PDF.

This is a snapshot export and should reflect:

- current visible metrics
- current filters
- current visible project cards
- current visible My Scope content
- timestamp
- current persona / role context

This is not the same as later formal reporting.

---

# 12. Commercial Model

Stratum is a **multi-tenant SaaS platform**.

### Pricing Tiers

| Tier | Limits |
|------|------|
| Free | up to 2 users |
| Basic | $6/month, up to 10 users |
| Pro | $10/month per user, unlimited users |
| Enterprise | custom pricing |

Usage limits are enforced at API level.

---

# 13. Future Considerations

Architecture must support future views:

### Kanban

Discipline board  
Packages = columns  
Tasks = cards

### Gantt

Timeline view including:

- stages
- disciplines
- packages
- tasks
- start dates
- due dates

### Calendar

User-centric timeline view.

## Extensibility

Admins may create **supporting databases** such as:

- clients
- project types
- project codes
- vendors
- cost codes
- geography

These may relate to core entities but **cannot alter the execution hierarchy**.

A future **Participant** role may be introduced, but it is **not part of the active v1 permission baseline**.

---

# 14. Reserved Architectural Layers

These layers are **architectural reservations** for future versions of Stratum.

They do **not modify the Stratum Engine v1 execution model**.

## 14.1 Coordination Layer — Dependencies

Stratum will support **dependency relationships between nodes and/or tasks**.

These relationships form a **directed dependency graph separate from the structural hierarchy**.

Purpose:

- support Gantt scheduling
- identify coordination blockers
- detect cross-discipline risks
- enable coordination intelligence dashboards

Example:

```text
Facade Package
  depends on
Structural Grid Package
```

Important principles:

- dependencies do **not modify the hierarchy**
- dependencies are **optional**
- dependencies may apply to **tasks or structural nodes**

Implementation is **reserved for future versions**.

---

## 14.2 Governance Layer — Information Release Gates

Stratum will support a **governance state layer** representing information readiness and approvals.

This layer allows execution status and governance status to be independent.

Example:

```text
Execution Status: Completed
Governance Status: Pending Approval
```

Purpose:

- represent design delivery approvals
- enforce release conditions
- support coordination readiness

Example states:

```text
Draft
Ready for Review
Released for Coordination
Approved for Construction
```

Implementation is **reserved for future versions**.

---

# 15. Acceptance Criteria

System must validate:

### Task Anchoring

Tasks resolve project context correctly.

### Deletion Blocking

Records with dependencies cannot be deleted.

### Contributor Limits

Contributors cannot edit protected fields of tasks they did not create.

### Manager Ownership Rules

Managers may create structural items only within owned projects.

### Visibility Rules

Non-admin users only see projects where they have valid scope.  
Admin sees all projects.

### Ownership and Assignment Rules

Project Owner, Node Owner, and Assignee remain distinct and follow approved edit rules.

### My Scope Rules

My Scope includes Stage / Discipline / Package / Task and excludes Typology / Project.

### Observer Scope

Observers see all projects but remain fully read-only.

### Budget Authoring

Package budget updates propagate correctly as rolled-up values above package level.

### Budget State Logic

No Budget Set, On Track, Near Budget, and Over Budget behave consistently.

### Over-budget Visibility

Over-budget condition is visibly surfaced in portfolio operations.

### Time Tracking

Spent values update through the hierarchy after create, edit, or delete of time entries.

### Filter Scope

Local filters affect the list only; project-wide filters affect the project lens and tree emphasis.

### Ready-to-close Logic

An eligible container item becomes ready to close only when all direct children are terminal and the item itself is not terminal.

### Header Metrics

Main header metrics remain consistent with rolled-up execution data.

### Details Panel Order

Task and non-task detail layouts follow the approved operational order.

### Schema Propagation

Renaming level labels updates UI immediately.

### PDF Snapshot Export

Portfolio export reflects the currently visible filtered dashboard state.
