# Stratum Engine v1

# System Architecture Document

Version: 1.3  
Status: Revised Engineering Baseline

---

# 1. Architecture Overview

Stratum is implemented as a **modular monolith-oriented SaaS architecture** designed to support:

- fixed hierarchical project structures
- floating execution tasks and recursive subtasks
- strict permission and scoped-visibility logic
- operational dashboards and execution filters
- time tracking, spent propagation, and package-level budget control
- schema-driven extensibility
- deterministic QA/demo infrastructure during pre-production stages

The architecture prioritizes:

- **data integrity**
- **clear domain boundaries**
- **centralized business rules**
- **low operational overhead**
- **future scalability without structural refactoring**

The current accepted baseline reflects the product state through the execution, permission, dashboard, filtering, seed/reset, and time/budget layers.  
Real-time collaboration, production auth, and billing remain architecturally anticipated but are **not part of the current active implementation baseline**.

---

## 1.1 Architectural Principles

The Stratum system follows eight architectural principles.

### Fixed Structural Core

The project hierarchy is structurally immutable:

```text
Typology → Project → Stage → Discipline → Package
```

This ensures predictable data relationships and stable traversal logic.

Important:

- hierarchy labels may be renamed by practices
- the code must not infer business meaning from those labels
- hierarchy is for **containment**, not semantic interpretation

---

### Floating Execution Layer

Tasks are **not part of the structural hierarchy** but attach to it through a single anchor.

This creates a dual-layer model:

```text
STRUCTURE
Typology
Project
Stage
Discipline
Package

EXECUTION
Tasks
Subtasks
```

---

### Centralized Engine Logic

All domain rules are enforced through centralized engine utilities and services.

This ensures:

- consistent permission enforcement
- consistent task resolution
- consistent budget and spent calculations
- consistent dashboard and filter semantics
- consistent ready-to-close and health-state projection

---

### Visibility Distinct from Control

Project visibility is not the same as edit authority.

The architecture must support:

- **project ownership**
- **node ownership**
- **assignment**
- **scoped visibility**
- **field-level editability**
- **role-based read-only access**

A user may see a full project tree through scope while remaining blocked from owner-level actions.

---

### Ownership Distinct from Assignment

Owner and assignee are separate operational concepts.

The architecture must keep distinct:

- **Project Owner** → accountability at project root
- **Node Owner** → accountability for structural or execution node
- **Assignee** → execution responsibility

These must not collapse into one generic control model.

---

### Package-Authored Budget Model

Budget is authored at **package level only** in v1.

Higher-level budgets are derived rollups. This avoids ambiguity in budget control and keeps the financial model coherent.

---

### Projection-Ready Analytics

Operational metrics such as:

- progress
- overdue counts
- unassigned counts
- ready-to-close
- over-budget
- spent
- average effort per task
- most-effort item
- people involved

are treated as **derived projections**, not separate competing sources of truth.

---

### Multi-Tenant Isolation

All business data belongs to an **Organization workspace**.

Tenant isolation is enforced through:

```text
organization_id
+ database-level row isolation
+ service-layer permission rules
```

---

## 1.2 Layered Architecture Model

The Stratum platform follows a layered architecture:

1. **Structural Layer**  
   Fixed containment hierarchy:

   ```text
   Typology → Project → Stage → Discipline → Package
   ```

2. **Execution Layer**  
   Tasks, subtasks, status logic, progress calculations, time tracking, spent propagation, and package budget awareness.

3. **Analytics / Projection Layer**  
   Dashboard metrics, health indicators, team load, local filters, project-wide filtered tree state, My Scope projection, and PDF snapshot/report projections.

4. **Demo / QA Stability Layer**  
   Deterministic seed data, reset mechanisms, and simulated identities used for repeatable validation before production auth.

5. **Coordination Layer (Reserved)**  
   A non-hierarchical dependency graph enabling coordination intelligence and future Gantt scheduling.

6. **Governance Layer (Reserved)**  
   Information release and approval states governing readiness for coordination and design delivery.

The Coordination and Governance layers do **not** modify the structural hierarchy or the current execution engine.  
They are designed as **overlay modules** that extend the platform without altering foundational logic.

---

# 2. System Components

The platform consists of five primary subsystems.

```text
Frontend
Application API Layer
Stratum Engine
Data Layer
Reserved Infrastructure Services
```

---

## 2.1 Frontend

Framework:

```text
Next.js (App Router)
React
```

Primary responsibilities:

- portfolio dashboard and project cards
- three-pane workspace
- hierarchy tree visualization
- task and structural details editing
- permission-aware UI states
- dashboards and operational filters
- simulated-user switching during pre-auth implementation stage
- deterministic demo reset and diagnostics tooling
- Portfolio PDF export of current filtered view (current accepted product capability)

---

### Frontend Technologies

| Component | Technology |
|-----------|------------|
| Framework | Next.js |
| Styling | Tailwind CSS |
| UI primitives | Radix UI / composable primitives |
| Animation | Framer Motion |
| Server state | TanStack Query (recommended) |
| Client state | Zustand |
| Forms | React Hook Form |
| Validation | Zod |

---

### Frontend Interaction Model

The current accepted workspace model is:

- **left pane**: hierarchy tree
- **center pane**: selected-scope execution view
- **right pane**: details panel

The frontend must support:

- local filtering
- project-wide filtering
- tree dimming and match counts
- ownership context visibility
- read-only vs editable field rendering
- collapsible time tracking sections
- distinct task vs non-task panel layouts
- later: collapsible right sidebar (expanded by default)
- later: My Scope as a cross-layer responsibility surface

---

## 2.2 Application API Layer

Backend architecture is designed as a **Node.js modular monolith**.

Recommended runtime:

```text
Node.js + TypeScript
Fastify or equivalent
```

Responsibilities:

- REST API
- tenant scoping
- permission enforcement
- ownership / assignment / visibility resolution
- task anchoring resolution
- rollup calculations
- custom field orchestration
- dashboard and filter projections
- deterministic demo/admin support endpoints in non-production environments
- future billing and auth integration points

Important:

Production auth, billing, and real-time are architecturally planned but not yet part of the current accepted feature baseline.

---

## 2.3 Stratum Engine

The **Stratum Engine** is the central domain service / domain utility layer.

All business rules flow through this engine.

```text
StratumEngine
```

Responsibilities:

- task anchor validation
- project context resolution
- visibility evaluation
- ownership enforcement
- assignment enforcement
- field-level permission rules
- hierarchy traversal
- budget rollups
- spent calculations
- budget-state classification
- time-entry recalculation
- filtered tree-state derivation
- dashboard metric projection
- My Scope projection
- ready-to-close evaluation
- over-budget evaluation

---

# 3. Core Domain Modules

The backend monolith is divided into domain modules.

```text
modules/
```

---

## 3.1 Hierarchy Module

Manages structural objects:

```text
typologies
projects
stages
disciplines
packages
```

Responsibilities:

- enforcing containment rules
- retrieving project trees
- validating parent relationships
- exposing ownership and assignment context
- maintaining the immutable structural spine
- separating hierarchy structure from project metadata meaning

Important architectural rule:

- the hierarchy root may currently be used as project typology in the demo
- but hierarchy labels remain configurable structure, not hardcoded business semantics

---

## 3.2 Tasks Module

Manages:

```text
tasks
subtasks
task anchoring
task recursion
```

Responsibilities:

- anchor validation
- parent task chains
- recursion prevention
- task context resolution
- creator vs assignee semantics
- task date support (`startDate`, `dueDate`)
- task participation for visibility and My Scope projection

---

## 3.3 Permissions & Visibility Module

Evaluates user access and UI capability states.

Responsibilities:

```text
role evaluation
ownership scope
assignment scope
visibility resolution
field-level access control
action capability checks
```

Key architectural rules:

- **visibility** and **control** are separate concerns
- **owner** and **assignee** are separate concerns

Examples:

- Observer has org-wide visibility but no edit rights
- Manager may see a scoped project but only fully control an owned one
- Contributor may edit status/notes on assigned tasks but not protected fields
- Admin may reassign project owner / node owner
- Node Owner may reassign assignee where policy allows

---

## 3.4 Time Tracking Module

Handles:

```text
timeEntries
```

Responsibilities:

- time logging
- edit/delete control
- validation rules
- task spent recalculation
- spent rollups through hierarchy
- source-of-truth preservation for future admin reporting

---

## 3.5 Budget Module

Handles:

```text
package budget authoring
rolled-up budget projection
spent vs budget state
remaining calculation
over-budget visibility
```

Propagation chain:

```text
package → discipline → stage → project → typology
```

Budget state rules:

- No Budget Set
- On Track
- Near Budget
- Over Budget

Important:

- only packages author budget
- higher levels expose rolled-up budget only
- over-budget must be visibly projectable in Portfolio, not merely derivable in hidden logic

---

## 3.6 Dashboard & Analytics Module

Provides aggregated system metrics and filter projections.

Examples:

```text
portfolio summary
project health
task load per user
overdue items
ready-to-close items
spent metrics
project-wide filtered tree state
people involved
My Scope
```

Responsibilities:

- KPI projection
- local execution filtering
- project-wide filtered tree calculations
- team load summaries
- header summary metrics
- card-level health badges
- current filtered-scope metrics for Portfolio
- PDF snapshot projection of current filtered portfolio view

Important rule:

- visible metrics must reflect the current filtered scope when the UI presents them as view-specific summaries

---

## 3.7 Schema Customization Module

Handles:

```text
custom field definitions
custom field values
hierarchy display labels
reference-data extensibility
```

Responsibilities:

- admin-defined metadata
- field rendering metadata
- preserving core fixed columns while allowing extensibility in details views

Important distinction:

- hierarchy labels are configurable structure
- business meaning such as Project Type, Client, Project Code belongs in metadata/reference data

---

## 3.8 Demo / QA Stability Module

Supports deterministic pre-production validation.

Responsibilities:

```text
seed data
reset-to-baseline
simulated identities
diagnostics tooling
```

Purpose:

- make feature verification repeatable
- reduce QA drift caused by persistent local mutations
- support stabilization before real auth and real-time collaboration

Important:

- this is an active architectural concern in the current baseline
- it is not merely an implementation convenience

---

## 3.9 Coordination Module (Reserved)

This module is reserved for future dependency logic.

Purpose:

- model dependency relationships between structural nodes and/or tasks
- support coordination intelligence
- enable future Gantt scheduling
- identify blockers across disciplines

Architecture concept:

A **directed dependency graph** separate from the structural hierarchy.

Examples:

```text
Facade Package → depends on → Structural Grid Package
Task A → blocked by → Task B
```

Important:

- this module does **not** replace the parent-child hierarchy
- it operates as a **side-car graph layer**
- implementation is reserved for future versions

---

## 3.10 Governance Module (Reserved)

This module is reserved for future information release and approval logic.

Purpose:

- represent design readiness
- model release / approval gates
- distinguish execution completion from governance approval

Architecture concept:

A **state-machine overlay** on top of structural nodes and selected execution nodes.

Examples:

```text
Execution Status: Complete
Governance Status: Pending Approval
```

Potential governance states:

```text
Draft
Ready for Review
Released for Coordination
Approved for Construction
```

Important:

- this module does **not** alter execution status logic
- it operates as a distinct governance layer
- implementation is reserved for future versions

---

# 4. Database Architecture

Primary database:

```text
PostgreSQL
```

Recommended hosting:

```text
Supabase or equivalent managed PostgreSQL
```

---

## 4.1 Multi-Tenant Model

All business tables include:

```text
organization_id
```

Example:

```text
projects
---------
id
organization_id
name
typology_id
owner_id
assignee_id
project_type
```

---

## 4.2 Row-Level Isolation

Database policies should enforce tenant isolation.

Example concept:

```text
organization_id = current_user_org
```

Fine-grained execution permissions remain in the service layer.

---

## 4.3 Core Tables

| Table | Purpose |
|-------|---------|
| typologies | hierarchy root / top structural bucket |
| projects | execution boundary / project accountability root |
| stages | project phases |
| disciplines | functional streams |
| packages | execution units / budget authoring node |
| tasks | work items |
| time_entries | logged effort |
| people | user-facing person registry |
| statuses | workflow states |
| priorities | urgency levels |
| tags | categorization |
| roles | permission definitions |

Important:

- `project_type` should be modeled as metadata / reference data, not inferred from the typology label

---

## 4.4 Derived / Cached Columns

The architecture assumes some denormalized cached values for performance.

Examples:

- `tasks.resolved_project_id`
- `tasks.spent_hours`
- `packages.spent_hours`
- `projects.spent_hours`
- `typologies.budget_hours`
- `remaining_hours`
- `projects.is_over_budget`
- `items.ready_to_close_candidate` (or equivalent projection cache if adopted later)

These are projections maintained by engine logic, not user-authored facts.

---

# 5. Task Anchoring Architecture

Tasks attach to structural nodes through **single anchors**.

Allowed anchors:

```text
projectId
stageId
disciplineId
packageId
parentTaskId
```

---

## 5.1 Anchor Example

```text
Stage
 ├ Discipline
 ├ Package
 └ Task
```

---

## 5.2 Subtask Example

```text
Task
 └ Subtask
    └ Sub-subtask
```

---

## 5.3 Resolution Requirement

Every task must resolve to exactly one project context.

This enables:

- permission checks
- project visibility
- project-wide filtering
- dashboard rollups
- time-entry propagation
- My Scope projection

---

# 6. Workspace Resolution and Projection

The workspace is not just a CRUD surface.  
It is a projected operational view over hierarchy + execution + analytics.

---

## 6.1 Project Tree Resolution

The system retrieves hierarchy using recursive or batched tree queries.

Conceptually:

```text
Typology
 → Projects
 → Stages
 → Disciplines
 → Packages
```

Tasks are injected under their anchor nodes.

---

## 6.2 Filter Scope Model

The workspace supports two filter scopes:

### Local

Applies only to the selected center-pane list.

### Project-wide

Applies the active execution filter across the currently selected project.

This requires tree-state projection including:

- match counts
- dimmed non-matching branches
- ancestor visibility
- auto-expand hints for matching branches

---

## 6.3 Header Projection

The main workspace header projects operational metrics for the selected scope.

Examples:

- progress
- total / open / done
- spent
- average effort per task
- most effort item
- health badges
- current status capsule

This projection replaces the need to duplicate the same summary in the right details panel.

---

## 6.4 Details Panel Projection

The right panel is optimized for:

- editable fields
- ownership context
- dates
- time tracking
- budget context
- team load
- notes
- tags

Different node types use different panel ordering rules.

Future accepted UX item:
- right sidebar collapsible, expanded by default

---

# 7. Permission Architecture

Permissions are enforced in two layers:

1. **service / engine layer**
2. **frontend capability rendering layer**

The frontend must never be the source of truth, but it should expose permission results clearly.

---

## 7.1 Permission Dimensions

The engine evaluates at least:

- role
- organization membership
- project visibility
- project ownership
- node ownership
- assignment
- field-level permissions
- action-level permissions
- time-entry control permissions
- budget authoring permissions

---

## 7.2 Key Permission Outcomes

### Admin

- full org visibility
- broad write access
- may reassign project owner
- may reassign node owner
- may reassign assignee

### Observer

- full org visibility
- fully read-only

### Manager

- owned projects: full structural + execution control within policy
- scoped visible projects outside owned scope: visible but restricted

### Contributor

- no structural creation
- limited task editing on assigned tasks
- full editing on allowed self-created subtasks
- task-only time logging within assignment rules

### Assignee edit rule

Assignee may be editable by:

- Admin
- Node Owner

Project Owner and Node Owner reassignment remain Admin-controlled architectural actions.

---

# 8. Budget and Spent Rollups

Rollups propagate upward through the hierarchy.

When a time entry is created, edited, or deleted:

```text
task.spent_hours changes
```

Propagation updates:

```text
package.spent_hours
discipline.spent_hours
stage.spent_hours
project.spent_hours
typology.spent_hours
```

---

## 8.1 Budget Authoring Rule

Budget is authored only at:

```text
package.budget_hours
```

Higher-level budgets are rolled-up projections.

---

## 8.2 Budget Semantics

If budget exists:

```text
remaining = budget - spent
utilization = spent / budget
```

If budget does not exist:

- state = No Budget Set
- utilization is neutral
- remaining is not treated as a real constrained control value

Over-budget must be surfaced in Portfolio projections, not remain purely latent in data.

---

# 9. Real-Time Collaboration (Reserved Next Layer)

Real-time collaboration is planned for a later step.

Recommended technology:

```text
WebSockets
Socket.io
```

Planned event examples:

```text
TaskCreated
TaskUpdated
TaskAssigned
HierarchyUpdated
TimeEntryCreated
TimeEntryUpdated
TimeEntryDeleted
DashboardUpdated
```

Event channels should be scoped by project:

```text
project:<projectId>
```

Important:

- real-time is architecturally anticipated
- it is **not part of the currently accepted active baseline**
- Step 7 must remain blocked until Step 6C stabilization closes

---

# 10. Coordination Graph (Reserved)

Future versions of Stratum will introduce a dependency graph representing
execution relationships between nodes.

This graph will operate independently from the hierarchy tree and will be
stored in a dedicated relationship structure.

Example concept:

```text
Package A → depends on → Package B
Task A → blocked by → Task B
```

This approach ensures that the structural hierarchy remains stable while
allowing flexible coordination modeling across disciplines.

The Coordination Graph is reserved for future implementation and should be
anticipated in service boundaries, event design, and data modeling.

---

# 11. Governance Overlay (Reserved)

Future versions of Stratum will introduce a governance overlay representing
information release states and approval gates.

This overlay is distinct from execution status and allows the system to model
design delivery readiness.

Example concept:

```text
Node: Facade Package
Execution Status: Complete
Governance Status: Ready for Review
```

This approach enables workflows such as:

- review readiness
- release for coordination
- approval for construction

The Governance Overlay is reserved for future implementation and should be
anticipated in service design and dashboard extensibility.

---

# 12. SaaS Infrastructure Direction

Recommended infrastructure stack for production architecture.

---

## 12.1 Frontend

```text
Vercel
```

Responsibilities:

- Next.js hosting
- asset and CDN distribution

---

## 12.2 Application Backend

```text
Railway / Render / Fly.io
```

Runs:

```text
Node.js API
future WebSocket layer
```

---

## 12.3 Database

```text
Managed PostgreSQL
```

Provides:

- primary relational store
- backups
- row isolation support

---

## 12.4 Caching

```text
Redis / Upstash Redis
```

Used for:

```text
session caching
project tree caching
dashboard caching
rate limiting
```

---

## 12.5 Storage

```text
Object storage / Supabase Storage
```

Used for:

```text
attachments
package/task files
future deliverable attachments
PDF export artifacts if persisted later
```

---

# 13. Authentication (Reserved for Production Foundation)

Production authentication provider may be:

```text
Clerk / Auth0 / equivalent
```

Provides:

- login
- SSO
- MFA
- organization management

Users are synchronized into the **people** table.

Important:

- current accepted baseline uses simulated identities for QA and permission validation
- production auth is a later architectural layer, not yet active

---

# 14. Billing System (Reserved for Production SaaS)

Billing provider may be:

```text
Stripe
```

Handles:

```text
subscriptions
invoices
payment methods
tax handling
```

Billing tiers:

```text
Free → 2 users
Basic → $6/month up to 10 users
Pro → $10/user/month unlimited users
Enterprise → custom
```

Important:

- billing is architecturally anticipated
- it is not part of the current active implementation baseline

---

# 15. Observability

Recommended monitoring tools.

| Tool | Purpose |
|------|---------|
| Sentry | error monitoring |
| PostHog | product analytics |
| Logs / audit store | audit events |

Additional recommendation during stabilization:
- lightweight diagnostics logging around reset flows, projection mismatches, and modal input regressions

---

# 16. Security

Security layers include:

```text
JWT authentication (future production layer)
database tenant isolation
API permission guards
audit logging
```

Current baseline already depends on:

- permission guards
- ownership enforcement
- tenant-aware data modeling
- deterministic separation of visibility vs control

---

# 17. Deployment Pipeline

Recommended CI/CD via:

```text
GitHub Actions
```

Deployment stages:

```text
Preview
Staging
Production
```

---

# 18. Future Expansion

Architecture supports future views.

### Kanban

```text
Discipline board
Packages = columns
Tasks = cards
```

### Gantt

Timeline view for:

```text
stages
disciplines
packages
tasks
start dates
due dates
dependencies
```

### Calendar

User-focused deadline visualization.

### Feature Configuration Layer

Per-organization module toggles are now an accepted architectural capability.

Examples:

- time tracking on/off
- budgeting on/off
- dashboard modules on/off
- tags on/off
- subtasks on/off

### Mobile Companion UI

A later reduced mobile experience may expose:

- portfolio scan
- project health
- task detail
- quick status / notes / time entry

This should be treated as a separate interaction mode, not a compressed desktop workspace.

### Admin Reporting & Time Analytics

A later admin-only reporting layer will support:

- roll-up of hours spent by user
- filters by project
- filters by date range
- future export/reporting workflows

Source of truth must remain:
- time-entry records

---

# 19. High-Level Architecture Diagram

```text
Frontend (Next.js)
        │
        │ REST
        ▼
Application API Layer (Node.js / modular monolith)
        │
        │ Domain Modules + Projection Services
        ▼
Stratum Engine
        │
        ├ Structural Layer
        ├ Execution Layer
        ├ Analytics / Projection Layer
        ├ Demo / QA Stability Layer
        ├ Coordination Layer (reserved)
        └ Governance Layer (reserved)
        ▼
PostgreSQL
        │
        ├ Cache (optional)
        ├ Storage
        ├ Future Auth Provider
        └ Future Billing Provider
```
