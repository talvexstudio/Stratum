# Stratum API Contract Blueprint

Version 1.3  
Status: Revised Product + Engineering Baseline

---

# 0. Baseline note

This version supersedes **Version 1.2** wherever clauses conflict.

It aligns the contract with the accepted Step 6C stabilization decisions, especially around:

- portfolio visibility
- ownership semantics
- “My Scope” behavior
- project typology terminology
- ready-to-close logic
- over-budget visibility
- node-owner vs assignee permissions

Implementation may still be sequenced across multiple stabilization passes, but the contract below is the source of truth for the intended behavior.

---

# 1. API principles

The Stratum API follows these principles.

### 1. Single source of truth

All writes go through the backend.  
The frontend never applies business rules on its own.

### 2. Tenant isolation first

Every request is scoped to one `organization_id`.

### 3. Permission enforcement in service layer

The API validates:

- role
- project visibility scope
- ownership scope
- assignment scope
- field-level edit permissions
- task anchor validity
- delete blocking
- time-entry control rights
- package-only budget authoring

### 4. Stable resource naming

The API uses stable resource names matching the domain:

```text
typologies
projects
stages
disciplines
packages
tasks
time-entries
tags
people
statuses
priorities
roles
```

Notes:

- the top structural level is **Typology** in the current baseline
- hierarchy labels remain admin-configurable
- future reference tables such as geography, clients, and project codes may be added later
- structural labels are presentation-configurable and must not be confused with domain reference data

### 5. Predictable payloads

Responses should be explicit and machine-friendly.  
Avoid shape changes per role.

### 6. Visibility and editability are separate

A user may be able to **see** a project through ownership, assignment, or participation scope while lacking rights to:

- create structural records
- reassign owners
- author budgets
- reassign tasks
- update protected fields

### 7. Package-authored budgets, rolled-up above

Budgets are authored only at **package level** in v1.

Higher nodes expose rolled-up budget analytics, not authored budget inputs.

### 8. Project cards and scope lists are distinct projections

The Portfolio Dashboard exposes two different surfaces:

- **Project Cards** → project-only records
- **My Scope** → mixed actionable non-project records

They may use the same search/filter controls, but they do not represent the same resource projection.

### 9. Ownership and assignment are distinct

Stratum distinguishes:

- **owner** → accountability for the node
- **assignee** → execution responsibility for the node

These must be exposed separately in API responses and validated separately in permissions.

---

# 2. Authentication and tenancy

## 2.1 Authentication

Every protected request requires:

```http
Authorization: Bearer <JWT>
```

JWT should include at minimum:

- `sub`
- `organization_id`
- `role_code`

Recommended additional claims:

- `membership_id`
- `person_id`

## 2.2 Tenant scope

All endpoints operate within an organization context.

Recommended pattern:

```http
/orgs/{organizationId}/...
```

The backend must verify:

- JWT membership in `{organizationId}`
- active membership status
- role within `{organizationId}`

---

# 3. Common response envelope

Recommended response shape:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Error shape:

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "FORBIDDEN",
    "message": "Contributor cannot edit due date on this task.",
    "details": {}
  }
}
```

For list responses, `meta` should support:

- pagination
- filtering
- counts
- applied scope
- sort

Example:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 126,
    "filters": {
      "status": ["active"],
      "scope": "project"
    },
    "sort": {
      "field": "name",
      "direction": "asc"
    }
  },
  "error": null
}
```

---

# 4. Identity, roles, and visibility model

## 4.1 Effective roles

Active v1 roles:

- `admin`
- `observer`
- `manager`
- `contributor`

Reserved but not active in baseline logic:

- `participant`

## 4.2 Visibility rules

### Admin

- global org visibility
- full write access where business rules permit

### Observer

- read-only
- visible only within explicitly granted scope
- no implicit global visibility in v1.3

### Manager

Visible projects:

- projects they own
- projects where they are assigned at project level
- projects where they own any descendant node
- projects where they are assigned to any descendant node
- projects where they have explicit participation scope

Edit scope:

- full structural and task control inside owned-project scope
- field-level and workflow limits still apply outside owned scope

### Contributor

Visible projects:

- projects where they are assigned
- projects where they own self-created allowed subtasks
- projects where they have explicit participation scope

Visibility grants access to the **full visible project tree**, not only the directly assigned node.

## 4.3 Non-admin project visibility baseline

For all non-admin roles:

- only projects where the current user has a real role/scope relation are visible
- “All” does **not** mean all org projects
- only admins have true org-wide project visibility

## 4.4 Ownership metadata

Responses for major records should expose:

```json
{
  "ownershipContext": {
    "projectOwnerId": "p-manager-1",
    "nodeOwnerId": "p-manager-1",
    "assigneeId": "p-contributor-1",
    "ownedByCurrentUser": true,
    "assignedToCurrentUser": false,
    "visibleByScope": true
  }
}
```

This is critical for distinguishing:

- owned scope
- assigned scope
- visible but non-editable scope
- admin scope

---

# 5. Core resource endpoints

## 5.1 Typologies

Typologies are admin-managed reference records used to classify projects by project type.

Examples:

- High-Rise
- Retrofit
- Healthcare
- Residential
- Hotel
- Infrastructure

Typology is **not** geography.

### List typologies

```http
GET /orgs/{organizationId}/typologies
```

Allowed:

- all authenticated roles for read
- CRUD remains admin-only

Optional query params:

- `statusId`
- `search`

Response example:

```json
{
  "data": [
    {
      "id": "ty1",
      "name": "High-Rise",
      "statusId": "st-active",
      "statusCode": "active",
      "notes": "Tall building project type"
    }
  ],
  "meta": {},
  "error": null
}
```

### Create typology

```http
POST /orgs/{organizationId}/typologies
```

Allowed:

- Admin only

Request:

```json
{
  "name": "Healthcare",
  "statusId": "st-active",
  "notes": "Hospitals and clinical facilities"
}
```

### Update typology

```http
PATCH /orgs/{organizationId}/typologies/{typologyId}
```

Allowed:

- Admin only

### Delete typology

```http
DELETE /orgs/{organizationId}/typologies/{typologyId}
```

Allowed:

- Admin only
- blocked if linked projects exist unless reassignment policy is supported

---

## 5.2 Projects

### List visible projects

```http
GET /orgs/{organizationId}/projects
```

Optional query params:

- `typologyId`
- `ownerId`
- `status`
- `ownershipScope=all|owned|assigned`
- `health=overdue|unassigned|readyToClose|overBudget`
- `search`
- `includeMetrics=true`

Notes:

- this endpoint must respect role visibility
- for non-admins, `ownershipScope=all` means **all visible projects in user scope**, not all org projects
- default Portfolio card sort in v1.3 should be stable and deterministic; current baseline recommendation is `name ASC` unless an explicit sort is requested

Example response item:

```json
{
  "id": "pr1",
  "name": "Hudson Yards Tower B",
  "typologyId": "ty1",
  "typologyLabel": "High-Rise",
  "statusId": "st-active",
  "statusCode": "active",
  "priorityId": "pr-high",
  "ownerId": "p-manager-1",
  "assigneeId": "p-manager-1",
  "startDate": null,
  "dueDate": "2026-12-31",
  "budgetHours": 400,
  "spentHours": 522,
  "remainingHours": -122,
  "ownershipContext": {
    "projectOwnerId": "p-manager-1",
    "nodeOwnerId": "p-manager-1",
    "assigneeId": "p-manager-1",
    "ownedByCurrentUser": true,
    "assignedToCurrentUser": true,
    "visibleByScope": true
  },
  "health": {
    "overdueCount": 1,
    "unassignedCount": 1,
    "readyToCloseCount": 1,
    "isOverBudget": true
  },
  "budgetState": {
    "isOverBudget": true,
    "hasBudget": true,
    "utilizationPercent": 131
  },
  "taskMetrics": {
    "total": 7,
    "open": 4,
    "done": 3
  },
  "peopleMetrics": {
    "involvedCount": 4
  },
  "progress": 43
}
```

### Create project

```http
POST /orgs/{organizationId}/projects
```

Allowed:

- Admin
- Manager

Rules:

- Admin may set `ownerId` to anyone
- Manager always becomes owner unless policy explicitly allows otherwise
- Managers may create only inside permitted org scope

Request:

```json
{
  "typologyId": "ty-hotel",
  "name": "Miami Beach Hotel & Spa",
  "statusId": "st-active",
  "priorityId": "pr-high",
  "startDate": "2026-02-01",
  "dueDate": "2026-10-10",
  "notes": "Major hospitality delivery",
  "tagIds": ["tag-client-review"]
}
```

### Update project

```http
PATCH /orgs/{organizationId}/projects/{projectId}
```

Allowed:

- Admin
- owning Manager

Editable fields may include:

- `name`
- `typologyId`
- `statusId`
- `priorityId`
- `assigneeId`
- `startDate`
- `dueDate`
- `notes`
- `tagIds`

### Delete project

```http
DELETE /orgs/{organizationId}/projects/{projectId}
```

Allowed:

- Admin only
- blocked if stages, tasks, or dependent records exist

### Reassign project owner

```http
POST /orgs/{organizationId}/projects/{projectId}/reassign-owner
```

Allowed:

- Admin only

Request:

```json
{
  "ownerId": "p-manager-2"
}
```

---

## 5.3 Stages / Disciplines / Packages

These resources follow the same CRUD pattern, with ownership and dates supported at all levels.

### Create stage

```http
POST /orgs/{organizationId}/stages
```

Allowed:

- Admin
- owning Manager

Request:

```json
{
  "projectId": "pr1",
  "name": "Schematic Design",
  "statusId": "st-active",
  "priorityId": "pr-high",
  "ownerId": "p-manager-1",
  "assigneeId": "p-manager-1",
  "startDate": "2026-01-15",
  "dueDate": "2026-04-30",
  "tagIds": ["tag-strategy"]
}
```

### Create discipline

```http
POST /orgs/{organizationId}/disciplines
```

Allowed:

- Admin
- owning Manager

Request:

```json
{
  "stageId": "st1",
  "name": "Structural Engineering",
  "statusId": "st-active",
  "priorityId": "pr-high",
  "ownerId": "p-manager-1",
  "assigneeId": null,
  "startDate": "2026-02-01",
  "dueDate": "2026-05-15"
}
```

### Create package

```http
POST /orgs/{organizationId}/packages
```

Allowed:

- Admin
- owning Manager

Request:

```json
{
  "disciplineId": "d1",
  "name": "Piling & Shoring",
  "statusId": "st-active",
  "priorityId": "pr-medium",
  "ownerId": "p-manager-1",
  "assigneeId": null,
  "startDate": "2026-02-10",
  "dueDate": "2026-06-01",
  "budgetHours": 400,
  "tagIds": ["tag-commercial"]
}
```

Delete rules:

- delete blocked if child structural records exist
- delete blocked if anchored tasks exist

### Budget authoring rule

Only packages may author `budgetHours`.

Attempting to PATCH `budgetHours` on:

- typology
- project
- stage
- discipline

must return:

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "BUDGET_AUTHORED_AT_PACKAGE_ONLY",
    "message": "Budget may only be authored on packages in v1.",
    "details": {}
  }
}
```

Higher nodes expose rolled-up budgets in GET responses.

### Node owner reassignment

For stages, disciplines, packages, and tasks:

```http
POST /orgs/{organizationId}/{database}/{recordId}/reassign-owner
```

Allowed:

- Admin only

Request example:

```json
{
  "ownerId": "p-manager-2"
}
```

### Assignee update rule

Assignee may be updated by:

- Admin
- current node owner
- owning Manager where policy already grants broader edit scope

This rule applies to stages, disciplines, packages, and tasks where assignee exists.

---

# 6. Task endpoints

## 6.1 List visible tasks

```http
GET /orgs/{organizationId}/tasks
```

Query params:

- `projectId`
- `assigneeId`
- `creatorId`
- `statusId`
- `status=active|pending|blocked|completed`
- `dueBefore`
- `overdue=true`
- `unassigned=true`
- `search=...`

This endpoint must respect participation visibility.

Notes:

- this remains a **task resource** endpoint
- mixed-node “My Scope” projection is handled via dashboard/workspace projections, not by changing the task resource model itself

---

## 6.2 Create task

```http
POST /orgs/{organizationId}/tasks
```

Allowed:

- Admin
- Manager in owned projects
- Contributor only for subtasks under assigned parent task, assigned to self unless policy explicitly allows broader assignment

Request examples:

### Project-anchored

```json
{
  "title": "Project-Level Strategy Review",
  "projectId": "pr1",
  "statusId": "st-active",
  "priorityId": "pr-high",
  "assigneeId": "p-contributor-1",
  "startDate": "2026-03-01",
  "dueDate": "2026-03-05",
  "tagIds": ["tag-strategy"]
}
```

### Stage-anchored

```json
{
  "title": "Stage-Level Quality Audit",
  "stageId": "st1",
  "statusId": "st-pending",
  "priorityId": "pr-medium",
  "assigneeId": "p-contributor-1",
  "dueDate": "2026-04-01"
}
```

### Discipline-anchored

```json
{
  "title": "Discipline Coordination Review",
  "disciplineId": "d1",
  "statusId": "st-active",
  "priorityId": "pr-medium",
  "assigneeId": "p-contributor-2"
}
```

### Package-anchored

```json
{
  "title": "Foundation Load Test",
  "packageId": "pk1",
  "statusId": "st-active",
  "priorityId": "pr-high",
  "assigneeId": "p-contributor-2",
  "startDate": "2026-03-01",
  "dueDate": "2026-03-12"
}
```

### Subtask

```json
{
  "title": "Sensor Calibration",
  "parentTaskId": "t100",
  "statusId": "st-active",
  "priorityId": "pr-medium",
  "assigneeId": "p-contributor-2"
}
```

Validation:

- exactly one anchor
- no typology anchor
- no parent cycle
- resolved project context required
- `dueDate >= startDate` when both exist

Response should include:

- `resolvedProjectId`
- `anchorType`
- `anchorId`
- `creatorId`

---

## 6.3 Update task

```http
PATCH /orgs/{organizationId}/tasks/{taskId}
```

Allowed by role:

### Admin

- all fields

### Manager

- all allowed business fields in owned-project scope

### Contributor

If assigned but not creator:

- `statusId`
- `notes`
- any explicitly allowed workflow fields by policy

If creator of a self-created subtask:

- full subtask fields allowed
- `assigneeId` may still be restricted from reassigning away from self by product policy

Example request:

```json
{
  "statusId": "st-completed",
  "notes": "Issued to team."
}
```

Contributor-forbidden example:

```json
{
  "dueDate": "2026-04-20"
}
```

on a task created by someone else.

### Start date support

`startDate` is a core field in v1 and may be updated where role permissions allow.

---

## 6.4 Delete task

```http
DELETE /orgs/{organizationId}/tasks/{taskId}
```

Allowed:

- Admin
- Manager where allowed
- Contributor only for owned subtasks if product policy permits

Blocked if:

- child subtasks exist and no cascade is allowed

---

## 6.5 Reassign task

```http
POST /orgs/{organizationId}/tasks/{taskId}/reassign
```

Allowed:

- Admin
- current node owner
- owning Manager in owned scope

Request:

```json
{
  "assigneeId": "p-contributor-4"
}
```

---

# 7. Time entry endpoints

## 7.1 Create time entry

```http
POST /orgs/{organizationId}/time-entries
```

Request:

```json
{
  "taskId": "t1",
  "hours": 2.5,
  "entryDate": "2026-03-15",
  "notes": "Coordination and markup."
}
```

Rules:

- Admin may log anywhere
- Manager only within owned-project scope
- Contributor only on assigned tasks
- blocked on completed tasks if the status is terminal and policy forbids further logging

Response must trigger:

- task spent refresh
- hierarchical spent propagation
- budget state refresh
- dashboard metric refresh

---

## 7.2 List time entries

```http
GET /orgs/{organizationId}/time-entries
```

Query params:

- `taskId`
- `personId`
- `from`
- `to`
- `projectId`

---

## 7.3 Update time entry

```http
PATCH /orgs/{organizationId}/time-entries/{entryId}
```

Allowed:

- Admin
- owning Manager within owned-project scope
- contributor only for their own entry

Request:

```json
{
  "hours": 4,
  "entryDate": "2026-03-13",
  "notes": "Updated coordination duration."
}
```

Must trigger immediate spent recalculation and rollup propagation.

---

## 7.4 Delete time entry

```http
DELETE /orgs/{organizationId}/time-entries/{entryId}
```

Allowed:

- Admin
- owning Manager within owned-project scope
- contributor only for their own entry

Must trigger spent rollback propagation.

Response example:

```json
{
  "data": {
    "id": "te1",
    "deleted": true
  },
  "meta": {},
  "error": null
}
```

---

# 8. Tag endpoints

## 8.1 List tags

```http
GET /orgs/{organizationId}/tags
```

## 8.2 Create tag

```http
POST /orgs/{organizationId}/tags
```

Allowed:

- Admin
- Manager

Request:

```json
{
  "label": "Client Review",
  "color": "#6B7280"
}
```

## 8.3 Update tag

```http
PATCH /orgs/{organizationId}/tags/{tagId}
```

## 8.4 Delete tag

```http
DELETE /orgs/{organizationId}/tags/{tagId}
```

Blocked if linked records exist, unless detach policy is explicitly supported.

## 8.5 Tag assignment to records

Recommended generic endpoints:

```http
POST /orgs/{organizationId}/records/{database}/{recordId}/tags/{tagId}
DELETE /orgs/{organizationId}/records/{database}/{recordId}/tags/{tagId}
```

Supported `database` values in v1:

- `projects`
- `stages`
- `disciplines`
- `packages`
- `tasks`

---

# 9. People, statuses, priorities, roles

## 9.1 People

```http
GET /orgs/{organizationId}/people
POST /orgs/{organizationId}/people
PATCH /orgs/{organizationId}/people/{personId}
DELETE /orgs/{organizationId}/people/{personId}
```

Allowed:

- Admin only for CRUD

Managers / Contributors / Observers:

- read / select only where permitted

Delete blocked if referenced by:

- ownership
- assignment
- time entry
- created records where policy requires audit preservation

---

## 9.2 Statuses / Priorities / Roles

Same CRUD pattern.

Roles:

- Admin only
- mostly protected system records

Statuses:

- Admin CRUD
- may include `isTerminal`

Priorities:

- Admin CRUD

---

# 10. Schema and metadata endpoints

## 10.1 Get hierarchy labels

```http
GET /orgs/{organizationId}/settings/hierarchy-labels
```

Response:

```json
{
  "typologyLabel": "Typology",
  "projectLabel": "Project",
  "stageLabel": "Stage",
  "disciplineLabel": "Discipline",
  "packageLabel": "Package",
  "taskLabel": "Task"
}
```

## 10.2 Update hierarchy labels

```http
PATCH /orgs/{organizationId}/settings/hierarchy-labels
```

Allowed:

- Admin only

Note:

- hierarchy labels are configurable presentation labels
- renaming a label does not change the underlying database semantics

---

## 10.3 List custom field definitions

```http
GET /orgs/{organizationId}/schema/fields?targetDatabase=projects
```

## 10.4 Create custom field

```http
POST /orgs/{organizationId}/schema/fields
```

Request:

```json
{
  "targetDatabase": "projects",
  "fieldKey": "client_code",
  "label": "Client Code",
  "fieldType": "text",
  "showInDetails": true
}
```

## 10.5 Update custom field

```http
PATCH /orgs/{organizationId}/schema/fields/{fieldId}
```

Allowed changes:

- label
- fieldType
- relation target
- showInDetails
- showInList (reserved; list UI remains constrained)

## 10.6 Delete custom field

```http
DELETE /orgs/{organizationId}/schema/fields/{fieldId}
```

Allowed:

- Admin only
- blocked if protected / system field

---

# 11. Custom field value endpoints

## 11.1 Upsert custom field value

```http
PUT /orgs/{organizationId}/records/{database}/{recordId}/custom-fields/{fieldKey}
```

Request examples:

### Text

```json
{
  "value": "Acme"
}
```

### Number

```json
{
  "value": 120.5
}
```

### Date

```json
{
  "value": "2026-05-01"
}
```

### Multi relation

```json
{
  "value": ["client-1", "client-2"]
}
```

## 11.2 Delete custom field value

```http
DELETE /orgs/{organizationId}/records/{database}/{recordId}/custom-fields/{fieldKey}
```

---

# 12. Tree and workspace endpoints

## 12.1 Get project tree

```http
GET /orgs/{organizationId}/projects/{projectId}/tree
```

Purpose:  
Returns the full visible tree for one project, including:

- stages
- disciplines
- packages
- tasks injected at anchor nodes
- subtasks recursively

Optional query params:

- `filterScope=local|project`
- `status=all|active|pending|blocked|completed`
- `myScope=true`
- `overdue=true`
- `unassigned=true`
- `readyToClose=true`
- `search=...`
- `expandMode=auto`

Response shape should support project-wide filtered tree mode:

```json
{
  "data": {
    "project": {},
    "tree": [
      {
        "id": "st1",
        "type": "stage",
        "name": "Schematic Design",
        "visible": true,
        "dimmed": false,
        "expanded": true,
        "matchCount": 1,
        "totalCount": 1,
        "children": []
      }
    ],
    "columns": [
      "title",
      "status",
      "priority",
      "assignee",
      "dueDate"
    ],
    "expandedNodeIds": ["st1"]
  },
  "meta": {
    "filterScope": "project"
  },
  "error": null
}
```

When `filterScope=project`, the API should support:

- match counts per subtree
- dimming metadata for non-matching branches
- auto-expand hints for branches containing matches

## 12.2 Get workspace projects

```http
GET /orgs/{organizationId}/workspace/projects
```

Returns visible projects for the current user only.

Optional query params:

- same project filters used on `/projects`

## 12.3 Get item details

```http
GET /orgs/{organizationId}/records/{database}/{recordId}
```

Returns:

- system fields
- relation labels
- custom fields
- field editability metadata
- ownership context
- analytics summary relevant to the node

Example:

```json
{
  "data": {
    "database": "tasks",
    "record": {
      "id": "t1",
      "title": "Overdue Safety Inspection",
      "statusId": "st-active",
      "statusLabel": "Active",
      "priorityId": "pr-critical",
      "assigneeId": "p-contributor-1",
      "ownerId": "p-manager-1",
      "startDate": null,
      "dueDate": "2026-03-01",
      "spentHours": 44
    },
    "ownershipContext": {
      "projectOwnerId": "p-manager-1",
      "nodeOwnerId": "p-manager-1",
      "assigneeId": "p-contributor-1",
      "ownedByCurrentUser": false,
      "assignedToCurrentUser": true
    },
    "fieldPermissions": {
      "title": "readOnly",
      "statusId": "editable",
      "notes": "editable",
      "priorityId": "readOnly",
      "assigneeId": "editableByNodeOwner",
      "ownerId": "editableByAdminOnly",
      "startDate": "readOnly",
      "dueDate": "readOnly"
    },
    "timeTracking": {
      "totalSpent": 44,
      "entryCount": 5
    }
  },
  "meta": {},
  "error": null
}
```

---

# 13. Dashboard endpoints

## 13.1 Project dashboard

```http
GET /orgs/{organizationId}/projects/{projectId}/dashboard
```

Response should include:

- unassigned item count
- overdue item count
- ready-to-close item count
- over-budget state
- total spent
- average hours per task
- most-effort task
- team load
- progress
- open / done counts
- rolled-up budget state
- ownership context

Notes:

- “ready to close” is a workflow state, not merely a visual badge
- over-budget must be visible in project dashboard payloads, not hidden in derived UI logic only

## 13.2 Portfolio dashboard

```http
GET /orgs/{organizationId}/dashboards/portfolio
```

Allowed:

- Admin
- Observer within granted scope
- Manager within visible scope
- Contributor within visible scope

This endpoint is the main contract surface for the Portfolio Dashboard.

It should support:

- project cards
- filter-aware KPI cards
- My Scope projection
- applied filters
- deterministic sort
- filter-aware metrics

### Portfolio query params

Recommended query params:

- `status=all|active|pending|blocked|completed`
- `ownership=all|owned|assigned`
- `health=all|overdue|unassigned|readyToClose|overBudget`
- `search=...`
- `includeCards=true`
- `includeMyScope=true`

### KPI contract

Portfolio KPI metrics must reflect the **current filtered view**.

At minimum the payload should support:

- total projects
- active projects
- total spent
- overdue count
- unassigned count

Additional indicators may be included by UI policy.

Important rule:

- **Ready to Close is not a KPI card in v1.3**
- ready-to-close must be exposed as a health/filter state instead

### Project card projection

Project cards remain **project-only**.

They should expose:

- project name
- typology label
- ownership context
- progress
- task count
- spent hours
- people involved count
- project-level health state
- project-level over-budget state

### People involved metric

`peopleMetrics.involvedCount` should count distinct people involved in the project within the current visible/filter scope.

Current baseline recommendation:

- include owners and assignees on visible actionable items in scope
- exclude `null`
- exclude synthetic “Unassigned” placeholders from distinct person counts

### My Scope projection

`myScopeItems` replaces the old “My Items” contract.

It is a mixed actionable-node list for the Portfolio Dashboard.

Default included node types:

- `stage`
- `discipline`
- `package`
- `task`

Default excluded node types:

- `typology`
- `project`

Each item should include at minimum:

- `nodeType`
- `nodeId`
- `title`
- `statusId`
- `statusCode`
- `priorityId`
- `assigneeId`
- `ownerId`
- `startDate`
- `dueDate`
- `resolvedProjectId`
- `resolvedProjectName`
- `ownershipContext`
- `health`
- `readyToClose`

Example item:

```json
{
  "nodeType": "task",
  "nodeId": "t-overdue",
  "title": "Overdue Safety Inspection",
  "statusId": "st-active",
  "statusCode": "active",
  "priorityId": "pr-critical",
  "ownerId": "p-manager-1",
  "assigneeId": "p-contributor-1",
  "startDate": null,
  "dueDate": "2026-03-01",
  "resolvedProjectId": "pr1",
  "resolvedProjectName": "Hudson Yards Tower B",
  "ownershipContext": {
    "projectOwnerId": "p-manager-1",
    "nodeOwnerId": "p-manager-1",
    "assigneeId": "p-contributor-1",
    "ownedByCurrentUser": false,
    "assignedToCurrentUser": true
  },
  "health": {
    "isOverdue": true,
    "isUnassigned": false,
    "isOverBudget": false
  },
  "readyToClose": false
}
```

### Ownership filter semantics

Ownership filter labels in v1.3 are:

- `All`
- `Owned by me`
- `Assigned to me`

The legacy `Participating` label is deprecated.

For **project cards**:

- `All` = all visible projects in current user scope
- `Owned by me` = projects where current user is the project owner
- `Assigned to me` = projects where current user has assignment scope in the project, whether at project level or actionable descendant level

For **My Scope**:

- `All` = union of owned-by-me items and assigned-to-me items
- `Owned by me` = items where `nodeOwnerId == currentUser`
- `Assigned to me` = items where `assigneeId == currentUser`

### Status filter semantics

For **project cards**:

- filters by **project status**

For **My Scope**:

- filters by the **item’s own status**

### Health filter semantics

Health filter labels in v1.3 are:

- `All`
- `Overdue`
- `Unassigned`
- `Ready to close`

For **project cards**:

- filters by project-level derived health

For **My Scope**:

- filters by item-level derived health

`OverBudget` is a valid derived health/budget state and must be present in payloads, but its UI surfacing may be handled as a badge, card state, or later filter extension according to implementation sequence.

### Search semantics

Search is one shared query with two parallel result surfaces.

For **project cards**, search should match project-related fields such as:

- project name
- project id
- project owner label
- typology label
- tags
- selected searchable custom fields

For **My Scope**, search should match:

- item title
- item id
- status
- priority
- tags
- parent project name
- parent project id
- project owner label
- typology label

Search combines with operational filters; it does not replace them.

### Ready-to-close rule

Ready-to-close is a **container workflow condition**.

It applies to:

- projects
- stages
- disciplines
- packages
- tasks that have direct child subtasks

It does **not** apply to leaf tasks with no direct children.

An item is `readyToClose = true` when:

1. it has at least one direct child
2. all direct children are in terminal/completed status
3. the current item itself is not already terminal/completed

The rule is based on **direct children only**, not full recursive descendants.

### Example portfolio dashboard response skeleton

```json
{
  "data": {
    "kpis": {
      "totalProjects": 5,
      "activeProjects": 3,
      "totalSpent": 672,
      "overdueCount": 2,
      "unassignedCount": 2
    },
    "appliedFilters": {
      "status": "active",
      "ownership": "all",
      "health": "all",
      "search": ""
    },
    "projectCards": [],
    "myScopeItems": []
  },
  "meta": {
    "sort": {
      "field": "name",
      "direction": "asc"
    }
  },
  "error": null
}
```

---

# 14. Notifications endpoints

## 14.1 List notifications

```http
GET /orgs/{organizationId}/notifications
```

## 14.2 Mark notification as read

```http
POST /orgs/{organizationId}/notifications/{notificationId}/read
```

---

# 15. Audit endpoints

## 15.1 List audit logs

```http
GET /orgs/{organizationId}/audit-logs
```

Query params:

- `entityType`
- `entityId`
- `actorPersonId`
- `from`
- `to`

Allowed:

- Admin
- Observer may be added later if policy allows

---

# 16. Development diagnostics endpoints

These endpoints are environment-scoped utilities for deterministic QA and preview flows.

They are not part of the commercial runtime contract, but they are valid for demo/staging environments.

## 16.1 Reset demo data

```http
POST /orgs/{organizationId}/diagnostics/reset-demo-data
```

Allowed:

- Admin only
- development / staging environments only

Expected behavior:

- restore canonical demo hierarchy seed
- restore canonical demo UI baseline where relevant
- clear persisted search/filter state
- return or redirect to agreed default baseline route

Example response:

```json
{
  "data": {
    "reset": true,
    "redirectTo": "/projects"
  },
  "meta": {},
  "error": null
}
```

---

# 17. Reserved API modules

The following API modules are reserved for future platform capabilities.

They are not part of Stratum Engine v1 implementation, but they are defined here so the API surface can evolve without breaking the current contract.

## 17.1 Dependencies API (Future)

Purpose:

- manage dependency relationships between structural nodes and/or tasks
- support future Gantt scheduling
- enable coordination dashboards
- expose blockers and predecessor / successor logic

Planned endpoints:

```http
GET /orgs/{organizationId}/dependencies
POST /orgs/{organizationId}/dependencies
PATCH /orgs/{organizationId}/dependencies/{dependencyId}
DELETE /orgs/{organizationId}/dependencies/{dependencyId}
```

Proposed request example:

```json
{
  "sourceType": "package",
  "sourceId": "pk1",
  "targetType": "package",
  "targetId": "pk2",
  "dependencyType": "FS"
}
```

Notes:

- dependencies are non-hierarchical
- they do not modify the structural tree
- they form a side-car graph layer

---

## 17.2 Governance API (Future)

Purpose:

- manage information release states
- expose approval / readiness gates
- separate governance status from execution status

Planned endpoints:

```http
GET /orgs/{organizationId}/governance/{nodeType}/{nodeId}
POST /orgs/{organizationId}/governance/{nodeType}/{nodeId}
PATCH /orgs/{organizationId}/governance/{nodeType}/{nodeId}
```

Proposed request example:

```json
{
  "gateState": "ReadyForReview",
  "checklistData": {
    "allInputsReceived": true,
    "internalReviewComplete": false
  }
}
```

Notes:

- governance state is distinct from execution status
- implementation is reserved for future versions

---

## 17.3 Admin analytics API (Future)

Purpose:

- roll up hours spent by user
- support filters by project and period
- support admin reporting across all scoped projects

Planned endpoints:

```http
GET /orgs/{organizationId}/analytics/time-by-user
GET /orgs/{organizationId}/analytics/time-by-user/export
```

Recommended query params:

- `projectId`
- `personId`
- `from`
- `to`
- `groupBy=person|project|week|month`

---

## 17.4 Portfolio export API (Future)

Purpose:

- export current Portfolio Dashboard view
- preserve active search and filter scope
- support PDF generation

Planned endpoints:

```http
POST /orgs/{organizationId}/exports/portfolio-pdf
GET /orgs/{organizationId}/exports/{exportId}
```

Recommended request:

```json
{
  "filters": {
    "status": "active",
    "ownership": "all",
    "health": "overdue",
    "search": "Hudson"
  }
}
```

---

# 18. Billing endpoints

## 18.1 Get subscription

```http
GET /orgs/{organizationId}/billing/subscription
```

## 18.2 Create checkout session

```http
POST /orgs/{organizationId}/billing/checkout
```

Request:

```json
{
  "targetTier": "basic"
}
```

## 18.3 Open billing portal

```http
POST /orgs/{organizationId}/billing/portal
```

---

# 19. WebSocket event contracts

Project-scoped channel:

```text
project:{projectId}
```

Portfolio / org channel:

```text
org:{organizationId}
```

## Event types

### TaskUpdated

```json
{
  "type": "TaskUpdated",
  "projectId": "pr1",
  "taskId": "t1",
  "changes": {
    "statusId": "st-completed"
  }
}
```

### TaskCreated

```json
{
  "type": "TaskCreated",
  "projectId": "pr1",
  "taskId": "t7",
  "anchorType": "package",
  "anchorId": "pk3"
}
```

### TimeEntryCreated

```json
{
  "type": "TimeEntryCreated",
  "projectId": "pr1",
  "taskId": "t1",
  "entryId": "te1",
  "hours": 3
}
```

### TimeEntryUpdated

```json
{
  "type": "TimeEntryUpdated",
  "projectId": "pr1",
  "taskId": "t1",
  "entryId": "te1"
}
```

### TimeEntryDeleted

```json
{
  "type": "TimeEntryDeleted",
  "projectId": "pr1",
  "taskId": "t1",
  "entryId": "te1"
}
```

### HierarchyUpdated

```json
{
  "type": "HierarchyUpdated",
  "projectId": "pr1",
  "entityType": "discipline",
  "entityId": "d2"
}
```

### DashboardUpdated

```json
{
  "type": "DashboardUpdated",
  "projectId": "pr1"
}
```

### DependencyUpdated (Future)

```json
{
  "type": "DependencyUpdated",
  "projectId": "pr1",
  "sourceType": "package",
  "sourceId": "pk1",
  "targetType": "package",
  "targetId": "pk2"
}
```

### GovernanceUpdated (Future)

```json
{
  "type": "GovernanceUpdated",
  "projectId": "pr1",
  "nodeType": "package",
  "nodeId": "pk1",
  "gateState": "ApprovedForConstruction"
}
```

---

# 20. Error contract

Standard error codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `DEPENDENCY_BLOCKED`
- `ANCHOR_INVALID`
- `CYCLE_DETECTED`
- `TENANT_SCOPE_VIOLATION`
- `BILLING_LIMIT_EXCEEDED`
- `BUDGET_AUTHORED_AT_PACKAGE_ONLY`
- `TIME_LOGGING_BLOCKED_ON_COMPLETED_TASK`

Additional v1.3-relevant codes:

- `OWNER_REASSIGN_ADMIN_ONLY`
- `ASSIGNEE_REASSIGN_FORBIDDEN`
- `READY_TO_CLOSE_NOT_APPLICABLE`
- `VISIBILITY_SCOPE_REQUIRED`

Reserved future error codes:

- `DEPENDENCY_CONFLICT`
- `BLOCKED_BY_DEPENDENCY`
- `GOVERNANCE_GATE_BLOCKED`

Example:

```json
{
  "error": {
    "code": "DEPENDENCY_BLOCKED",
    "message": "Cannot delete package pk2 because 4 tasks are anchored to it.",
    "details": {
      "dependencies": [
        {"type": "task", "id": "t1"},
        {"type": "task", "id": "t2"}
      ]
    }
  }
}
```
