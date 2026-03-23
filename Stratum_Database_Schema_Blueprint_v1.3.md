# Stratum Database Schema Blueprint

Version 1.3  
Status: Revised Engineering Baseline

---

# 1. Design principles

The schema is built around nine rules.

### 1. Fixed structural spine

The core hierarchy is fixed:

```text
typologies → projects → stages → disciplines → packages
```

Display labels may be renamed in the UI, but the underlying relational spine does not change.

### 2. Floating execution layer

Tasks attach to the spine through a single anchor:

- `project_id`
- `stage_id`
- `discipline_id`
- `package_id`
- `parent_task_id`

Tasks are not hierarchy nodes. They are execution items anchored to hierarchy nodes or nested under other tasks.

### 3. Tenant isolation everywhere

Every tenant-owned business table includes:

```text
organization_id
```

### 4. Strong relational integrity

Core hierarchy uses foreign keys and delete blocking.  
No cascade delete is used for core execution data in v1.

### 5. Extensible metadata

Admin-created custom fields are stored separately from fixed core columns.

### 6. Ownership is distinct from assignment

The schema must support all of these distinctly:

- **project owner**
- **node owner**
- **assignee**
- **creator**

A user may own a record without being its current assignee.  
A user may see a project through scoped visibility while lacking owner-level edit rights.

### 7. Visibility is scoped, not global

For non-admin users, visibility is derived from explicit scope relations:

- project ownership
- project assignment
- structural assignment
- task ownership
- task assignment

Admin retains org-wide visibility.  
Observer retains org-wide visibility but read-only.

### 8. Package-authored budget, rolled-up above

Budgets are authored only at **package level** in v1.  
Budget values at discipline, stage, project, and typology level are derived rollups.

### 9. Hierarchy is structure; metadata carries meaning

Hierarchy labels are configurable structure.  
Business meaning such as **Project Type**, **Client**, or **Project Code** must be represented as metadata, not inferred from hierarchy labels.

---

# 2. Core schema domains

The schema is divided into these domains:

- tenancy and identity
- configuration dictionaries
- hierarchy
- execution
- time and budget
- scope and visibility relations
- operational projections
- schema customization
- coordination and governance (reserved)
- billing and audit

---

# 3. Tenancy and identity tables

## 3.1 organizations

Purpose: tenant root.

| Column                 | Type          | Notes                                |
| ---------------------- | ------------- | ------------------------------------ |
| id                     | uuid pk       |                                      |
| name                   | text          |                                      |
| slug                   | text unique   | human-friendly org key               |
| plan_tier              | text          | free, basic, pro, enterprise         |
| subscription_status    | text          | active, trialing, past_due, canceled |
| stripe_customer_id     | text nullable |                                      |
| stripe_subscription_id | text nullable |                                      |
| created_at             | timestamptz   |                                      |
| updated_at             | timestamptz   |                                      |

Indexes:

- unique on `slug`
- index on `subscription_status`

---

## 3.2 users

Purpose: auth-linked person identity.

| Column                | Type          | Notes             |
| --------------------- | ------------- | ----------------- |
| id                    | uuid pk       | internal user id  |
| auth_provider         | text          | clerk, auth0, etc |
| auth_provider_user_id | text unique   | external id       |
| email                 | citext        |                   |
| full_name             | text          |                   |
| avatar_url            | text nullable |                   |
| is_active             | boolean       | default true      |
| created_at            | timestamptz   |                   |
| updated_at            | timestamptz   |                   |

Indexes:

- unique on `auth_provider_user_id`
- unique on `email`

---

## 3.3 organization_memberships

Purpose: user membership per organization.

| Column          | Type                       | Notes                                                       |
| --------------- | -------------------------- | ----------------------------------------------------------- |
| id              | uuid pk                    |                                                             |
| organization_id | uuid fk → organizations.id |                                                             |
| user_id         | uuid fk → users.id         |                                                             |
| role_code       | text                       | admin, observer, manager, contributor; participant reserved |
| status          | text                       | invited, active, suspended                                  |
| joined_at       | timestamptz                |                                                             |
| created_at      | timestamptz                |                                                             |

Constraints:

- unique `(organization_id, user_id)`

Indexes:

- `(organization_id, role_code)`
- `(user_id)`

---

## 3.4 people

Purpose: in-app people directory for relation fields.

| Column          | Type                        | Notes                                              |
| --------------- | --------------------------- | -------------------------------------------------- |
| id              | uuid pk                     |                                                    |
| organization_id | uuid fk                     |                                                    |
| user_id         | uuid fk → users.id nullable | null for external/non-login person later if needed |
| name            | text                        | primary field                                      |
| email           | citext nullable             |                                                    |
| role_id         | uuid fk → roles.id nullable | app role dictionary                                |
| is_active       | boolean                     |                                                    |
| created_at      | timestamptz                 |                                                    |
| updated_at      | timestamptz                 |                                                    |

Constraints:

- unique `(organization_id, user_id)` where `user_id` is not null

Indexes:

- `(organization_id, name)`
- `(organization_id, role_id)`

Note:

- `people` is the relational target for owner, creator, assignee, and time-entry person fields.

---

# 4. Dictionary tables

All dictionary tables are tenant-scoped to allow organization-level customization.

## 4.1 roles

| Column          | Type        | Notes                                              |
| --------------- | ----------- | -------------------------------------------------- |
| id              | uuid pk     |                                                    |
| organization_id | uuid fk     |                                                    |
| code            | text        | admin, observer, manager, contributor, participant |
| label           | text        | primary field                                      |
| is_system       | boolean     | protected                                          |
| created_at      | timestamptz |                                                    |
| updated_at      | timestamptz |                                                    |

Constraints:

- unique `(organization_id, code)`

Note:

- `participant` may be reserved in dictionaries for future use, but it is not part of the active v1 permission baseline.

---

## 4.2 statuses

| Column          | Type          | Notes                 |
| --------------- | ------------- | --------------------- |
| id              | uuid pk       |                       |
| organization_id | uuid fk       |                       |
| code            | text          | stable optional code  |
| label           | text          | primary field         |
| color           | text nullable |                       |
| is_terminal     | boolean       | completed-state flag  |
| sort_order      | int           |                       |
| is_system       | boolean       | protected recommended |
| created_at      | timestamptz   |                       |
| updated_at      | timestamptz   |                       |

Indexes:

- `(organization_id, is_terminal)`
- `(organization_id, sort_order)`

---

## 4.3 priorities

| Column          | Type          | Notes                 |
| --------------- | ------------- | --------------------- |
| id              | uuid pk       |                       |
| organization_id | uuid fk       |                       |
| code            | text          | critical, high, medium, low etc |
| label           | text          | primary field         |
| color           | text nullable |                       |
| sort_order      | int           |                       |
| is_system       | boolean       |                       |
| created_at      | timestamptz   |                       |
| updated_at      | timestamptz   |                       |

Constraints:

- unique `(organization_id, code)`

---

## 4.4 tags

| Column               | Type                | Notes         |
| -------------------- | ------------------- | ------------- |
| id                   | uuid pk             |               |
| organization_id      | uuid fk             |               |
| label                | text                | primary field |
| color                | text nullable       |               |
| created_by_person_id | uuid fk → people.id |               |
| created_at           | timestamptz         |               |
| updated_at           | timestamptz         |               |

Constraints:

- unique `(organization_id, label)`

---

# 5. Hierarchy tables

## 5.1 typologies

Top-level hierarchy bucket.

Important:
- this is structural containment, not a hardcoded business meaning
- the UI label may be renamed by a practice
- in the current demo it may align with project typology, but the schema must not depend on that assumption

| Column               | Type                             | Notes                         |
| -------------------- | -------------------------------- | ----------------------------- |
| id                   | uuid pk                          |                               |
| organization_id      | uuid fk                          |                               |
| name                 | text                             | primary field                 |
| status_id            | uuid fk → statuses.id nullable   | optional                      |
| priority_id          | uuid fk → priorities.id nullable | optional                      |
| owner_id             | uuid fk → people.id nullable     | admin-controlled context      |
| assignee_id          | uuid fk → people.id nullable     | optional execution context    |
| start_date           | date nullable                    |                               |
| due_date             | date nullable                    |                               |
| budget_hours         | numeric(14,2) nullable           | rolled-up / cache only        |
| spent_hours          | numeric(14,2) not null default 0 | computed/cache                |
| remaining_hours      | numeric(14,2) nullable           | derived where budget exists   |
| notes                | text nullable                    |                               |
| created_by_person_id | uuid fk → people.id              |                               |
| created_at           | timestamptz                      |                               |
| updated_at           | timestamptz                      |                               |

Indexes:

- `(organization_id, name)`

---

## 5.2 projects

Projects are the execution boundary and portfolio-card records.

Important:
- `project_type` is metadata, not inferred from `typology_id`
- in demo stage `project_type` may remain hardcoded text
- later it may normalize into a supporting/reference database

| Column               | Type                             | Notes                                    |
| -------------------- | -------------------------------- | ---------------------------------------- |
| id                   | uuid pk                          |                                          |
| organization_id      | uuid fk                          |                                          |
| typology_id          | uuid fk → typologies.id          | mandatory parent                         |
| name                 | text                             | primary field                            |
| project_type         | text nullable                    | metadata shown on cards                  |
| client_name          | text nullable                    | demo-stage metadata / future reference   |
| project_code         | text nullable                    | demo-stage metadata / future reference   |
| status_id            | uuid fk → statuses.id nullable   |                                          |
| priority_id          | uuid fk → priorities.id nullable |                                          |
| owner_id             | uuid fk → people.id              | project owner                            |
| assignee_id          | uuid fk → people.id nullable     | optional execution context               |
| start_date           | date nullable                    |                                          |
| due_date             | date nullable                    |                                          |
| budget_hours         | numeric(14,2) nullable           | rolled-up from packages                  |
| spent_hours          | numeric(14,2) not null default 0 | computed/cache                           |
| remaining_hours      | numeric(14,2) nullable           | derived where budget exists              |
| is_over_budget       | boolean not null default false   | derived/cache for fast portfolio reads   |
| notes                | text nullable                    |                                          |
| created_by_person_id | uuid fk → people.id              |                                          |
| created_at           | timestamptz                      |                                          |
| updated_at           | timestamptz                      |                                          |

Indexes:

- `(organization_id, typology_id)`
- `(organization_id, owner_id)`
- `(organization_id, assignee_id)`
- `(organization_id, status_id)`
- `(organization_id, project_type)`

---

## 5.3 stages

| Column               | Type                             | Notes                         |
| -------------------- | -------------------------------- | ----------------------------- |
| id                   | uuid pk                          |                               |
| organization_id      | uuid fk                          |                               |
| project_id           | uuid fk → projects.id            | mandatory parent              |
| name                 | text                             | primary field                 |
| status_id            | uuid fk → statuses.id nullable   |                               |
| priority_id          | uuid fk → priorities.id nullable |                               |
| owner_id             | uuid fk → people.id nullable     | node owner context            |
| assignee_id          | uuid fk → people.id nullable     | optional execution context    |
| start_date           | date nullable                    |                               |
| due_date             | date nullable                    |                               |
| budget_hours         | numeric(14,2) nullable           | rolled-up from packages       |
| spent_hours          | numeric(14,2) not null default 0 | computed/cache                |
| remaining_hours      | numeric(14,2) nullable           | derived where budget exists   |
| notes                | text nullable                    |                               |
| created_by_person_id | uuid fk → people.id              |                               |
| created_at           | timestamptz                      |                               |
| updated_at           | timestamptz                      |                               |

Indexes:

- `(organization_id, project_id)`
- `(organization_id, status_id)`
- `(organization_id, owner_id)`
- `(organization_id, assignee_id)`

---

## 5.4 disciplines

| Column               | Type                             | Notes                         |
| -------------------- | -------------------------------- | ----------------------------- |
| id                   | uuid pk                          |                               |
| organization_id      | uuid fk                          |                               |
| stage_id             | uuid fk → stages.id              | mandatory parent              |
| name                 | text                             | primary field                 |
| status_id            | uuid fk → statuses.id nullable   |                               |
| priority_id          | uuid fk → priorities.id nullable |                               |
| owner_id             | uuid fk → people.id nullable     | node owner context            |
| assignee_id          | uuid fk → people.id nullable     | optional execution context    |
| start_date           | date nullable                    |                               |
| due_date             | date nullable                    |                               |
| budget_hours         | numeric(14,2) nullable           | rolled-up from packages       |
| spent_hours          | numeric(14,2) not null default 0 | computed/cache                |
| remaining_hours      | numeric(14,2) nullable           | derived where budget exists   |
| notes                | text nullable                    |                               |
| created_by_person_id | uuid fk → people.id              |                               |
| created_at           | timestamptz                      |                               |
| updated_at           | timestamptz                      |                               |

Indexes:

- `(organization_id, stage_id)`
- `(organization_id, status_id)`
- `(organization_id, owner_id)`
- `(organization_id, assignee_id)`

---

## 5.5 packages

| Column               | Type                             | Notes                         |
| -------------------- | -------------------------------- | ----------------------------- |
| id                   | uuid pk                          |                               |
| organization_id      | uuid fk                          |                               |
| discipline_id        | uuid fk → disciplines.id         | mandatory parent              |
| name                 | text                             | primary field                 |
| status_id            | uuid fk → statuses.id nullable   |                               |
| priority_id          | uuid fk → priorities.id nullable |                               |
| owner_id             | uuid fk → people.id nullable     | node owner context            |
| assignee_id          | uuid fk → people.id nullable     | optional execution context    |
| start_date           | date nullable                    |                               |
| due_date             | date nullable                    |                               |
| budget_hours         | numeric(14,2) nullable           | authored here in v1           |
| spent_hours          | numeric(14,2) not null default 0 | computed/cache                |
| remaining_hours      | numeric(14,2) nullable           | derived where budget exists   |
| is_over_budget       | boolean not null default false   | derived/cache                 |
| notes                | text nullable                    |                               |
| created_by_person_id | uuid fk → people.id              |                               |
| created_at           | timestamptz                      |                               |
| updated_at           | timestamptz                      |                               |

Indexes:

- `(organization_id, discipline_id)`
- `(organization_id, status_id)`
- `(organization_id, owner_id)`
- `(organization_id, assignee_id)`

Important:
- `budget_hours` is nullable, not zero-default, so the system can correctly represent **No Budget Set**.

---

# 6. Execution tables

## 6.1 tasks

This is the key execution table.

Important:
- tasks now support both `owner_id` and `creator_id`
- `creator_id` is immutable audit origin
- `owner_id` is the node owner context for responsibility and can be admin-reassigned where product rules allow

| Column              | Type                              | Notes                                |
| ------------------- | --------------------------------- | ------------------------------------ |
| id                  | uuid pk                           |                                      |
| organization_id     | uuid fk                           |                                      |
| title               | text                              | primary field                        |
| project_id          | uuid fk → projects.id nullable    | direct anchor only if used           |
| stage_id            | uuid fk → stages.id nullable      |                                      |
| discipline_id       | uuid fk → disciplines.id nullable |                                      |
| package_id          | uuid fk → packages.id nullable    |                                      |
| parent_task_id      | uuid fk → tasks.id nullable       | recursive anchor                     |
| resolved_project_id | uuid fk → projects.id             | denormalized/cache for fast querying |
| status_id           | uuid fk → statuses.id             |                                      |
| priority_id         | uuid fk → priorities.id nullable  |                                      |
| creator_id          | uuid fk → people.id               | immutable task creator               |
| owner_id            | uuid fk → people.id nullable      | node owner context                   |
| assignee_id         | uuid fk → people.id nullable      | executor                             |
| start_date          | date nullable                     |                                      |
| due_date            | date nullable                     |                                      |
| spent_hours         | numeric(14,2) not null default 0  | computed from time entries           |
| is_ready_to_close   | boolean not null default false    | derived/cache for container tasks    |
| notes               | text nullable                     |                                      |
| created_at          | timestamptz                       |                                      |
| updated_at          | timestamptz                       |                                      |

Critical validation rules:

- exactly one of `project_id`, `stage_id`, `discipline_id`, `package_id`, `parent_task_id` must be non-null
- `parent_task_id` cannot create loops
- `resolved_project_id` must be derivable from the anchor
- if both dates exist, `due_date >= start_date`

Indexes:

- `(organization_id, resolved_project_id)`
- `(organization_id, owner_id)`
- `(organization_id, assignee_id)`
- `(organization_id, creator_id)`
- `(organization_id, parent_task_id)`
- `(organization_id, status_id)`
- `(organization_id, start_date)`
- `(organization_id, due_date)`

### Why `resolved_project_id` should exist

It makes these operations much faster:

- project visibility checks
- dashboards
- tree fetch
- overdue queries
- scope checks
- project-wide filter scope
- my-scope projections

This should be treated as a maintained denormalized column.

---

## 6.2 project_tags

Many-to-many bridge.

| Column          | Type                  | Notes |
| --------------- | --------------------- | ----- |
| project_id      | uuid fk → projects.id |       |
| tag_id          | uuid fk → tags.id     |       |
| organization_id | uuid fk               |       |

Constraints:

- primary key `(project_id, tag_id)`

Indexes:

- `(organization_id, tag_id)`

---

## 6.3 stage_tags

Many-to-many bridge.

| Column          | Type                | Notes |
| --------------- | ------------------- | ----- |
| stage_id        | uuid fk → stages.id |       |
| tag_id          | uuid fk → tags.id   |       |
| organization_id | uuid fk             |       |

Constraints:

- primary key `(stage_id, tag_id)`

Indexes:

- `(organization_id, tag_id)`

---

## 6.4 discipline_tags

Many-to-many bridge.

| Column          | Type                     | Notes |
| --------------- | ------------------------ | ----- |
| discipline_id   | uuid fk → disciplines.id |       |
| tag_id          | uuid fk → tags.id        |       |
| organization_id | uuid fk                  |       |

Constraints:

- primary key `(discipline_id, tag_id)`

Indexes:

- `(organization_id, tag_id)`

---

## 6.5 package_tags

Many-to-many bridge.

| Column          | Type                  | Notes |
| --------------- | --------------------- | ----- |
| package_id      | uuid fk → packages.id |       |
| tag_id          | uuid fk → tags.id     |       |
| organization_id | uuid fk               |       |

Constraints:

- primary key `(package_id, tag_id)`

Indexes:

- `(organization_id, tag_id)`

---

## 6.6 task_tags

Many-to-many bridge.

| Column          | Type               | Notes |
| --------------- | ------------------ | ----- |
| task_id         | uuid fk → tasks.id |       |
| tag_id          | uuid fk → tags.id  |       |
| organization_id | uuid fk            |       |

Constraints:

- primary key `(task_id, tag_id)`

Indexes:

- `(organization_id, tag_id)`

---

## 6.7 time_entries

| Column          | Type                        | Notes                     |
| --------------- | --------------------------- | ------------------------- |
| id              | uuid pk                     |                           |
| organization_id | uuid fk                     |                           |
| task_id         | uuid fk → tasks.id          |                           |
| user_id         | uuid fk → users.id nullable | optional direct auth link |
| person_id       | uuid fk → people.id         |                           |
| hours           | numeric(8,2)                | positive                  |
| entry_date      | date                        |                           |
| notes           | text nullable               |                           |
| created_at      | timestamptz                 |                           |
| updated_at      | timestamptz                 |                           |

Validation:

- `hours > 0`
- cannot log against a terminal/completed task
- contributor can only log on assigned tasks
- manager can only log in owned-project scope
- admin unrestricted
- permitted users may edit and delete time entries they control according to role rules

Indexes:

- `(organization_id, task_id)`
- `(organization_id, person_id)`
- `(organization_id, entry_date)`

Important:
- time-entry create, update, and delete must all trigger spent recalculation and rollup propagation.

---

# 7. Scope and visibility tables

Non-admin visibility is based on explicit scope relations.  
These tables are also the foundation for ownership-slice and my-scope projections.

## 7.1 project_assignments

| Column          | Type                  | Notes                   |
| --------------- | --------------------- | ----------------------- |
| id              | uuid pk               |                         |
| organization_id | uuid fk               |                         |
| project_id      | uuid fk → projects.id |                         |
| person_id       | uuid fk → people.id   |                         |
| assignment_role | text nullable         | optional semantic label |
| created_at      | timestamptz           |                         |

Constraints:

- unique `(organization_id, project_id, person_id)`

Indexes:

- `(organization_id, project_id)`
- `(organization_id, person_id)`

---

## 7.2 stage_assignments

| Column          | Type                | Notes                   |
| --------------- | ------------------- | ----------------------- |
| id              | uuid pk             |                         |
| organization_id | uuid fk             |                         |
| stage_id        | uuid fk → stages.id |                         |
| person_id       | uuid fk → people.id |                         |
| assignment_role | text nullable       | optional semantic label |
| created_at      | timestamptz         |                         |

Constraints:

- unique `(organization_id, stage_id, person_id)`

Indexes:

- `(organization_id, stage_id)`
- `(organization_id, person_id)`

---

## 7.3 discipline_assignments

| Column          | Type                     | Notes                   |
| --------------- | ------------------------ | ----------------------- |
| id              | uuid pk                  |                         |
| organization_id | uuid fk                  |                         |
| discipline_id   | uuid fk → disciplines.id |                         |
| person_id       | uuid fk → people.id      |                         |
| assignment_role | text nullable            | optional semantic label |
| created_at      | timestamptz              |                         |

Constraints:

- unique `(organization_id, discipline_id, person_id)`

Indexes:

- `(organization_id, discipline_id)`
- `(organization_id, person_id)`

---

## 7.4 package_assignments

| Column          | Type                  | Notes                   |
| --------------- | --------------------- | ----------------------- |
| id              | uuid pk               |                         |
| organization_id | uuid fk               |                         |
| package_id      | uuid fk → packages.id |                         |
| person_id       | uuid fk → people.id   |                         |
| assignment_role | text nullable         | optional semantic label |
| created_at      | timestamptz           |                         |

Constraints:

- unique `(organization_id, package_id, person_id)`

Indexes:

- `(organization_id, package_id)`
- `(organization_id, person_id)`

Notes:
- task scope is also inherently represented by `tasks.owner_id`, `tasks.creator_id`, and `tasks.assignee_id`.

---

# 8. Operational projections (recommended)

These are not required as source-of-truth tables, but they are recommended as views or materialized views for performance and consistency.

## 8.1 my_scope_items_v

Purpose:
Provide the mixed-node **My Scope** projection used on Portfolio.

Recommended columns:

```text
organization_id
project_id
node_type          -- stage | discipline | package | task
node_id
title
owner_id
assignee_id
status_id
priority_id
start_date
due_date
is_overdue
is_unassigned
is_ready_to_close
resolved_project_id
```

Rules:
- exclude `typology`
- exclude `project`
- include only Stage / Discipline / Package / Task
- support filters:
  - all
  - owned
  - assigned
  - overdue
  - unassigned
  - ready_to_close

## 8.2 project_health_v

Purpose:
Support Portfolio cards and KPIs.

Recommended columns:

```text
organization_id
project_id
overdue_count
unassigned_count
ready_to_close_count
is_over_budget
people_involved_count
total_items
open_items
done_items
```

## 8.3 ready_to_close_candidates_v

Purpose:
Expose the direct-children ready-to-close rule consistently.

Recommended columns:

```text
organization_id
node_type
node_id
project_id
is_ready_to_close
child_count
terminal_child_count
```

Rule:
- node has at least one direct child
- node itself is not terminal
- all direct children are terminal

Note:
- this is a projection concern, not a core authored field requirement for every table
- cached booleans may still be used where performance justifies them

---

# 9. Schema customization tables

This is how Admin-defined fields should work cleanly.

## 9.1 custom_field_definitions

| Column                   | Type                  | Notes                                                                       |
| ------------------------ | --------------------- | --------------------------------------------------------------------------- |
| id                       | uuid pk               |                                                                             |
| organization_id          | uuid fk               |                                                                             |
| target_database          | text                  | typologies, projects, stages, disciplines, packages, tasks                  |
| field_key                | text                  | stable machine key                                                          |
| label                    | text                  | display label                                                               |
| field_type               | text                  | text, number, boolean, date, relation, multi_relation, select, multi_select |
| is_required              | boolean               |                                                                             |
| show_in_details          | boolean               |                                                                             |
| show_in_list             | boolean default false | reserved for constrained list behavior                                      |
| relation_target_database | text nullable         |                                                                             |
| options_json             | jsonb nullable        | for select options                                                          |
| is_system                | boolean               | protected field flag                                                        |
| sort_order               | int                   |                                                                             |
| created_at               | timestamptz           |                                                                             |
| updated_at               | timestamptz           |                                                                             |

Constraints:

- unique `(organization_id, target_database, field_key)`

Important:
- core list columns remain fixed in UI
- custom fields appear primarily in details, not in the main execution list

---

## 9.2 custom_field_values

Generic values for custom fields.

| Column              | Type                                  | Notes                                      |
| ------------------- | ------------------------------------- | ------------------------------------------ |
| id                  | uuid pk                               |                                            |
| organization_id     | uuid fk                               |                                            |
| target_database     | text                                  |                                            |
| record_id           | uuid                                  | id in target database                      |
| field_definition_id | uuid fk → custom_field_definitions.id |                                            |
| value_text          | text nullable                         |                                            |
| value_number        | numeric nullable                      |                                            |
| value_boolean       | boolean nullable                      |                                            |
| value_date          | date nullable                         |                                            |
| value_json          | jsonb nullable                        | multi-select / multi-relation / structured |
| created_at          | timestamptz                           |                                            |
| updated_at          | timestamptz                           |                                            |

Constraints:

- unique `(organization_id, record_id, field_definition_id)`

Recommendation:
- prefer definition/value tables over free-form JSONB blobs because Stratum is reporting-oriented and requires validation and queryability.

---

# 10. Label customization

## 10.1 hierarchy_labels

| Column           | Type        | Notes                  |
| ---------------- | ----------- | ---------------------- |
| organization_id  | uuid pk/fk  |                        |
| typology_label   | text        | default Typology       |
| project_label    | text        | default Project        |
| stage_label      | text        | default Stage          |
| discipline_label | text        | default Discipline     |
| package_label    | text        | default Package        |
| task_label       | text        | default Task           |
| updated_at       | timestamptz |                        |

One row per organization.

---

# 11. Supporting databases (future-ready)

Supporting databases may exist in future versions but must not alter the hierarchy.

## 11.1 supporting_database_definitions

| Column            | Type        | Notes                       |
| ----------------- | ----------- | --------------------------- |
| id                | uuid pk     |                             |
| organization_id   | uuid fk     |                             |
| database_key      | text        | clients, project_types, etc |
| label             | text        |                             |
| primary_field_key | text        | usually label or name       |
| created_at        | timestamptz |                             |

---

## 11.2 supporting_records

| Column                 | Type        | Notes |
| ---------------------- | ----------- | ----- |
| id                     | uuid pk     |       |
| organization_id        | uuid fk     |       |
| supporting_database_id | uuid fk     |       |
| primary_value          | text        |       |
| data_json              | jsonb       |       |
| created_at             | timestamptz |       |

---

# 12. Reserved tables for future modules

The following tables are **reserved for future platform capabilities**.  
They are not required for Stratum Engine v1, but they are documented here so the architecture can evolve without refactoring the core engine.

## 12.1 node_dependencies

Represents dependency relationships between structural nodes and/or tasks.

Purpose:

- support future Gantt scheduling
- model coordination blockers
- enable dependency-aware dashboards
- support cross-discipline coordination intelligence

Proposed fields:

| Column          | Type        | Notes                                     |
| --------------- | ----------- | ----------------------------------------- |
| id              | uuid pk     |                                           |
| organization_id | uuid fk     | tenant scope                              |
| source_type     | text        | task, stage, discipline, package, project |
| source_id       | uuid        | id of source node                         |
| target_type     | text        | task, stage, discipline, package, project |
| target_id       | uuid        | id of target node                         |
| dependency_type | text        | FS, SS, FF, SF, blocked_by, reference     |
| created_by      | uuid fk     | person who created the relationship       |
| created_at      | timestamptz |                                           |
| updated_at      | timestamptz |                                           |

Indexes:

- `(organization_id, source_type, source_id)`
- `(organization_id, target_type, target_id)`

Notes:
- this table forms a directed graph separate from the hierarchy
- it must not alter the parent-child hierarchy
- implementation is reserved for future versions

---

## 12.2 governance_states

Represents approval / release gate state for nodes.

Purpose:

- support information release gates
- represent readiness for review / coordination / approval
- distinguish governance state from execution state

Proposed fields:

| Column          | Type                 | Notes                                                                        |
| --------------- | -------------------- | ---------------------------------------------------------------------------- |
| id              | uuid pk              |                                                                              |
| organization_id | uuid fk              | tenant scope                                                                 |
| node_type       | text                 | stage, discipline, package, task                                             |
| node_id         | uuid                 | target node                                                                  |
| gate_state      | text                 | Draft, ReadyForReview, ReleasedForCoordination, ApprovedForConstruction       |
| approver_id     | uuid fk → people.id  | nullable until approved                                                      |
| approved_at     | timestamptz nullable |                                                                              |
| checklist_data  | jsonb nullable       | readiness checks / governance metadata                                       |
| created_at      | timestamptz          |                                                                              |
| updated_at      | timestamptz          |                                                                              |

Indexes:

- `(organization_id, node_type, node_id)`
- `(organization_id, gate_state)`

Notes:
- governance state is distinct from execution status
- implementation is reserved for future versions

---

# 13. Billing and subscription tables

## 13.1 subscriptions

| Column                 | Type                 | Notes                                |
| ---------------------- | -------------------- | ------------------------------------ |
| id                     | uuid pk              |                                      |
| organization_id        | uuid fk              |                                      |
| tier                   | text                 | free, basic, pro, enterprise         |
| status                 | text                 | active, trialing, canceled, past_due |
| max_users              | int nullable         |                                      |
| is_unlimited_users     | boolean              |                                      |
| stripe_customer_id     | text nullable        |                                      |
| stripe_subscription_id | text nullable        |                                      |
| current_period_start   | timestamptz nullable |                                      |
| current_period_end     | timestamptz nullable |                                      |
| created_at             | timestamptz          |                                      |
| updated_at             | timestamptz          |                                      |

---

## 13.2 usage_counters

| Column            | Type        | Notes |
| ----------------- | ----------- | ----- |
| organization_id   | uuid pk/fk  |       |
| active_user_count | int         |       |
| project_count     | int         |       |
| storage_bytes     | bigint      |       |
| updated_at        | timestamptz |       |

---

# 14. Audit and notifications

## 14.1 audit_logs

| Column          | Type                         | Notes                                           |
| --------------- | ---------------------------- | ----------------------------------------------- |
| id              | uuid pk                      |                                                 |
| organization_id | uuid fk                      |                                                 |
| actor_person_id | uuid fk → people.id nullable |                                                 |
| action          | text                         | create, update, delete, reassign, schema_change |
| entity_type     | text                         | project, task, field, etc                       |
| entity_id       | uuid nullable                |                                                 |
| payload_json    | jsonb                        | before/after or metadata                        |
| created_at      | timestamptz                  |                                                 |

Indexes:

- `(organization_id, entity_type, entity_id)`
- `(organization_id, actor_person_id)`
- `(organization_id, created_at)`

---

## 14.2 notifications

| Column          | Type                  | Notes                                            |
| --------------- | --------------------- | ------------------------------------------------ |
| id              | uuid pk               |                                                  |
| organization_id | uuid fk               |                                                  |
| person_id       | uuid fk → people.id   |                                                  |
| type            | text                  | task_assigned, overdue, due_soon, ready_to_close |
| title           | text                  |                                                  |
| body            | text nullable         |                                                  |
| entity_type     | text nullable         |                                                  |
| entity_id       | uuid nullable         |                                                  |
| is_read         | boolean default false |                                                  |
| created_at      | timestamptz           |                                                  |

---

# 15. Recommended constraints and rules

## 15.1 Delete protection

Use FK + service-layer checks.

Blocked examples:

- delete project with stages
- delete stage with disciplines
- delete discipline with packages
- delete package with anchored tasks
- delete person assigned to active scope records
- delete status used by active records

No cascade delete in v1.

---

## 15.2 Task validation

Enforce on create/update:

- exactly one anchor
- no typology anchor
- no task cycles
- resolved project must exist
- start / due chronology must be valid

---

## 15.3 Time entry validation

Enforce:

- positive hours
- task not completed
- actor allowed by role
- actor allowed by project ownership / scope rules

---

## 15.4 Budget semantics

Enforce:

- only packages may carry authored `budget_hours`
- non-package `budget_hours` values are rolled-up cache, not direct authoring inputs
- `remaining_hours` is null when budget is null
- budget state must distinguish `No Budget Set` from real zero
- `is_over_budget` must be derivable from `spent_hours > budget_hours` where budget exists

---

## 15.5 Ready-to-close semantics

Enforce / derive:

- item must have at least one direct child
- item itself must not be terminal
- all direct children must be terminal
- applies to container items only

Note:
- leaf tasks are not ready-to-close candidates
- tasks with subtasks may be ready-to-close candidates

---

# 16. Recommended indexes

At minimum:

### Hierarchy

- projects `(organization_id, typology_id)`
- projects `(organization_id, owner_id)`
- projects `(organization_id, assignee_id)`
- stages `(organization_id, project_id)`
- disciplines `(organization_id, stage_id)`
- packages `(organization_id, discipline_id)`

### Tasks

- `(organization_id, resolved_project_id)`
- `(organization_id, owner_id)`
- `(organization_id, assignee_id)`
- `(organization_id, creator_id)`
- `(organization_id, parent_task_id)`
- `(organization_id, start_date)`
- `(organization_id, due_date)`
- `(organization_id, status_id)`

### Time

- `(organization_id, task_id)`
- `(organization_id, person_id, entry_date)`

### Scope / visibility

- assignment indexes by person and structural scope
- project owner / assignee indexes
- task owner / assignee indexes

### Projection support

- ready-to-close indexes by `(organization_id, is_ready_to_close)` where cached
- over-budget indexes by `(organization_id, is_over_budget)` where cached

### Reserved future modules

- dependency indexes by source and target
- governance state indexes by node and gate_state

---

# 17. RLS policy model (high level)

Every table with tenant data must scope by `organization_id`.

Typical rule:
- user may only access rows for organizations they belong to

Then apply application-layer permission rules for:

- role-specific edits
- contributor field restrictions
- ownership boundaries
- scoped visibility
- assignment rules

**Important:** do not try to encode all fine-grained visibility logic only in RLS. Keep:

- tenant isolation in DB
- business permissions in service layer

That is the sane split.

---

# 18. Suggested engineering decisions

## Use explicit relational columns for:

- hierarchy parents
- creator / owner / assignee
- status / priority
- dates
- budget / spent / remaining caches
- billing
- scope / assignment relations

## Use dedicated bridge tables for:

- tags across projects, stages, disciplines, packages, and tasks

## Use custom field definition/value tables for:

- admin-created metadata

## Use denormalized cached columns for:

- `resolved_project_id` on tasks
- `spent_hours` on tasks
- budget / spent / remaining rollups on structural nodes
- `is_over_budget` where needed for fast portfolio reads
- `is_ready_to_close` where needed for fast projections

## Reserve dedicated tables for future coordination and governance layers:

- `node_dependencies`
- `governance_states`

This keeps reads fast, reporting practical, and future coordination features compatible with the existing engine.

---

# 19. QA and demo-support note

The deterministic demo seed and reset mechanism are not core relational schema features, but the schema must support them cleanly.

This means:

- seed data should be representable without contradictions
- reset operations must be able to restore canonical baseline data
- projections should be derivable consistently after reset

This is particularly important for:

- ownership / assignment QA
- portfolio KPI QA
- ready-to-close QA
- over-budget QA
- My Scope projection QA
