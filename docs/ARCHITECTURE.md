# Architecture Documentation

## Overview

JORF (Job Order Request Form) is a Laravel 12 + Inertia.js + React application for managing job order requests with approval workflows, real-time notifications, and file attachments. It integrates with an external SSO service (Authify) and reads employee data from a separate masterlist database.

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Backend   | Laravel 12 (PHP 8.2+)              |
| Frontend  | React 18 + Inertia.js 2            |
| Styling   | Tailwind CSS + shadcn/ui + DaisyUI |
| Database  | MySQL — three separate connections |
| Real-time | Pusher / Laravel Reverb            |
| Build     | Vite 6                             |
| Auth      | External SSO (Authify)             |
| Testing   | Pest PHP                           |

---

## Project Structure

```
app/
├── Constants/
│   └── Status.php              # Status integer constants + label/color helpers
├── Helpers/
│   └── helpers.php             # getCurrentUser() global helper
├── Http/
│   ├── Controllers/
│   │   ├── AuthenticationController.php
│   │   ├── DashboardController.php
│   │   ├── DemoController.php
│   │   ├── JorfController.php
│   │   ├── UserController.php
│   │   ├── General/
│   │   │   ├── AdminController.php
│   │   │   └── ProfileController.php
│   │   └── Admin/
│   │       ├── RequestTypeController.php
│   │       └── RequestorListController.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php   # SSO token validation
│   │   ├── AdminMiddleware.php  # Admin table check
│   │   └── CorsMiddleware.php  # Origin whitelist
│   └── Requests/               # Form request validation classes
├── Models/
│   ├── Jorf.php
│   ├── JorfAttachments.php
│   ├── JorfLogs.php
│   ├── User.php                # masterlist connection
│   ├── Masterlist.php          # masterlist connection
│   ├── NotificationUser.php
│   ├── AdditionalUser.php
│   └── RequestType.php
├── Notifications/
│   └── JorfNotification.php    # Database + broadcast notification
├── Providers/
│   └── AppServiceProvider.php
├── Repositories/
│   ├── JorfRepository.php
│   ├── DashboardRepository.php
│   ├── UserRepository.php
│   ├── RequestTypeRepository.php
│   └── RequestorListRepository.php
├── Services/
│   ├── JorfService.php
│   ├── JorfStatusService.php
│   ├── DashboardService.php
│   ├── UserRoleService.php
│   ├── NotificationService.php
│   ├── RequestTypeService.php
│   ├── RequestorListService.php
│   └── DataTableService.php
└── Traits/
    └── Loggable.php            # Auto-logs model changes to jorf_logs

routes/
├── web.php                     # Root + includes all sub-routes
├── auth.php                    # Login/logout
├── general.php                 # Dashboard, profile
├── jorf.php                    # All JORF CRUD/action routes
├── admin.php                   # Admin + request type + requestor list
└── api.php                     # Notifications API + broadcast auth

resources/js/
├── Context/
│   └── NotificationContext.jsx # Global notification state + Echo WebSocket
├── Hooks/
│   ├── useJorfTable.js         # Table pagination and filter state
│   ├── useJorfDrawer.js        # Drawer state, attachments, logs, actions
│   ├── useDrawer.js            # Generic drawer state
│   ├── useRealtimeJorfUpdates.js
│   └── useRequestTypeDrawer.js
├── Pages/
│   ├── Dashboard.jsx
│   ├── Jorf/
│   │   ├── Index.jsx           # JORF creation form
│   │   └── JorfTable.jsx       # JORF list with filters
│   ├── Admin/
│   │   ├── Admin.jsx
│   │   ├── NewAdmin.jsx
│   │   ├── RequestType.jsx
│   │   └── RequestorList.jsx
│   ├── Authentication/Login.jsx
│   ├── Profile.jsx
│   └── 404.jsx / Unauthorized.jsx
└── components/
    ├── jorf/                   # JorfForm, JorfDrawer, JorfLogsModal, etc.
    ├── sidebar/                # SideBar, Navigation, ThemeToggler
    └── ui/                     # shadcn/ui primitives
```

---

## Database Architecture

### Three MySQL Connections

| Connection        | Alias           | Purpose                                   |
| ----------------- | --------------- | ----------------------------------------- |
| `mysql` (default) | `jorf_db`       | All JORF application data                 |
| `masterlist`      | `masterlist_db` | Employee masterlist — read-only reference |
| `authify`         | `auth_db`       | External SSO user authentication          |

### Core Tables

| Table                 | Connection | Purpose                                                                        |
| --------------------- | ---------- | ------------------------------------------------------------------------------ |
| `jorf_table`          | default    | Main JORF request records                                                      |
| `jorf_attachments`    | default    | Uploaded file metadata per JORF                                                |
| `jorf_logs`           | default    | Full audit trail of all model changes                                          |
| `type_of_request`     | default    | JORF request type catalogue                                                    |
| `additional_users`    | default    | Extra requestors added by admin                                                |
| `admin`               | default    | Admin/Incharge/Approver role assignments                                       |
| `notification_users`  | default    | Users registered for broadcast notifications                                   |
| `notifications`       | default    | Laravel default notification storage                                           |
| `employee_masterlist` | masterlist | Employee directory (EMPLOYID, EMPNAME, DEPARTMENT, APPROVER2, APPROVER3, etc.) |
| `users`               | authify    | SSO user accounts                                                              |

### Key Model Relationships

```
Jorf ──hasMany──► JorfAttachments
Jorf ──hasMany──► JorfLogs  (via Loggable trait)
NotificationUser ──notifications──► (Laravel Notifiable)
```

### Jorf Model Fields (`jorf_table`)

| Field             | Type     | Description                             |
| ----------------- | -------- | --------------------------------------- |
| `jorf_id`         | string   | Human-readable ID e.g. `JORF-2024-001`  |
| `employid`        | string   | Requestor employee ID                   |
| `empname`         | string   | Requestor name                          |
| `department`      | string   | Requestor department                    |
| `prodline`        | string   | Production line                         |
| `station`         | string   | Station                                 |
| `request_type`    | string   | Request type name                       |
| `details`         | text     | Request details                         |
| `remarks`         | text     | Action remarks                          |
| `status`          | int      | Status code (1–8, see Status constants) |
| `cost_amount`     | double   | Estimated cost                          |
| `classification`  | string   | Work classification                     |
| `execution_date`  | date     | Scheduled execution date                |
| `lead_time_value` | int      | Lead time quantity                      |
| `lead_time_unit`  | string   | Lead time unit (days/hours)             |
| `rating`          | int      | Requestor satisfaction rating           |
| `incharge_id`     | string   | Assigned incharge employee ID           |
| `approver_id`     | string   | Assigned approver employee ID           |
| `handled_by`      | JSON     | Array of facilities employee IDs        |
| `handled_at`      | datetime | Time work was completed                 |

---

## Status Constants & Workflow

### Status Values (`app/Constants/Status.php`)

| Constant       | Value | Label        | Color   |
| -------------- | ----- | ------------ | ------- |
| `PENDING`      | 1     | Pending      | blue    |
| `APPROVED`     | 2     | Approved     | blue    |
| `ONGOING`      | 3     | Ongoing      | cyan    |
| `DONE`         | 4     | Done         | green   |
| `ACKNOWLEDGED` | 5     | Acknowledged | green   |
| `CANCELLED`    | 6     | Canceled     | volcano |
| `DISAPPROVED`  | 7     | Disapproved  | red     |
| `RETURNED`     | 8     | Returned     | red     |

### Full Status Transition Flow

```
                 ┌─────────────────────────────────┐
                 ▼                                 │
[1] PENDING ──APPROVE──► [2] APPROVED             │
     │                       │                    │
     │                    ONGOING                 │
     │                       │                    │
  CANCEL/                    ▼                    │
  DISAPPROVE            [3] ONGOING               │
     │                  /       \                 │
     ▼               DONE      CANCEL             │
[6] CANCELLED      /               \              │
[7] DISAPPROVED   ▼                 ▼             │
                [4] DONE    [6] CANCELLED         │
                /    \                            │
         ACKNOWLEDGE RETURN                       │
            /           \                         │
           ▼             ▼                        │
   [5] ACKNOWLEDGED  [8] RETURNED ────────────────┘
```

### Available Actions per Role & Status

| Status       | Role                   | Available Actions   |
| ------------ | ---------------------- | ------------------- |
| 1 – Pending  | Requestor              | CANCEL              |
| 1 – Pending  | Dept Head (Approver)   | APPROVE, DISAPPROVE |
| 2 – Approved | Facilities Coordinator | ONGOING, CANCEL     |
| 3 – Ongoing  | Facilities Coordinator | DONE, CANCEL        |
| 3 – Ongoing  | Facilities Staff       | DONE                |
| 4 – Done     | Requestor              | ACKNOWLEDGE, RETURN |
| 8 – Returned | Facilities Coordinator | ONGOING, DONE       |

---

## Authentication & Authorization Flow

### SSO Authentication (AuthMiddleware)

```
Request arrives
      │
      ▼
Check token sources (priority order):
  1. Query param ?key=TOKEN
  2. Cookie
  3. Session
      │
      ▼
If session valid + token matches → allow request
      │
      ▼
Otherwise → query authify database for user by token
      │
      ▼
Check access:
  - emp_position >= 2, OR
  - Department like '%Facilities%', OR
  - Exists in additional_users table
      │
      ├─── No access → redirect to unauthorized page
      │
      ▼
Build emp_data session:
  {token, emp_id, emp_name, emp_firstname, emp_jobtitle,
   emp_dept, emp_prodline, emp_station, emp_position,
   user_roles, system_roles, is_additional_user}

System roles assigned:
  - 'Facilities_Coordinator' if dept=Facilities AND JOB_TITLE like 'Facility Engineer%'
  - 'Facilities' if dept like '%Facilities%'
      │
      ▼
Set 7-day cookie → strip ?key from URL → allow request
```

### Logout Flow

```
GET /{APP_NAME}/logout
      │
      ▼
AuthenticationController::logout()
  - Gets SSO token from cookie/session
  - Clears Laravel session
  - Deletes cookie
  - Redirects to: http://192.168.2.221:8200/logout?token=TOKEN&redirect=...
```

### Admin Middleware

- Checks if current user's `emp_id` exists in the `admin` table
- If not found: redirects to dashboard

### Roles

| Role                   | Source                                    | Description                |
| ---------------------- | ----------------------------------------- | -------------------------- |
| Admin                  | `admin` table                             | Full system access         |
| Incharge               | `admin` table (`emp_role`)                | Reviews JORF requests      |
| Approver               | `admin` table (`emp_role`)                | Approves/rejects requests  |
| Requestor              | Any authenticated user                    | Creates JORF requests      |
| Dept Head              | `APPROVER2`/`APPROVER3` in masterlist     | Approves requestors' JORFs |
| Facilities Coordinator | Facilities dept + Facility Engineer title | Manages execution          |
| Facilities Staff       | Facilities dept                           | Handles assigned JORFs     |

---

## API Routes

### Web Routes (require `AuthMiddleware`)

All routes are prefixed by `{APP_NAME}` (set in config).

#### Authentication (`routes/auth.php`)

| Method | Path            | Handler                           |
| ------ | --------------- | --------------------------------- |
| GET    | `/logout`       | `AuthenticationController@logout` |
| GET    | `/unauthorized` | Inertia render                    |

#### General (`routes/general.php`)

| Method | Path               | Handler                            |
| ------ | ------------------ | ---------------------------------- |
| GET    | `/`                | `DashboardController@index`        |
| GET    | `/profile`         | `ProfileController@index`          |
| POST   | `/change-password` | `ProfileController@changePassword` |

#### JORF (`routes/jorf.php`)

| Method | Path                              | Handler                                             |
| ------ | --------------------------------- | --------------------------------------------------- |
| GET    | `/form`                           | `JorfController@index`                              |
| POST   | `/store`                          | `JorfController@store`                              |
| GET    | `/table`                          | `JorfController@getJorfTable`                       |
| GET    | `/{jorfId}/attachments`           | `JorfController@getAttachments`                     |
| GET    | `/logs/{jorfId}`                  | `JorfController@logs`                               |
| GET    | `/attachments/download/{id}`      | `JorfController@downloadAttachment`                 |
| GET    | `/{jorfId}/actions`               | `JorfController@getJorfActions`                     |
| POST   | `/action`                         | `JorfController@jorfAction`                         |
| POST   | `/update-alternate`               | `JorfController@updateAlternate`                    |
| GET    | `/locations`                      | `UserController@getLocationList`                    |
| GET    | `/available-approvers-requestors` | `UserController@getAvailableApproversAndRequestors` |
| GET    | `/facilities-employees`           | `UserController@getFacilitiesEmployees`             |

#### Admin (`routes/admin.php` — requires `AdminMiddleware`)

| Method | Path                 | Handler                           |
| ------ | -------------------- | --------------------------------- |
| GET    | `/admin`             | `AdminController@index`           |
| GET    | `/new-admin`         | `AdminController@index_addAdmin`  |
| POST   | `/add-admin`         | `AdminController@addAdmin`        |
| POST   | `/remove-admin`      | `AdminController@removeAdmin`     |
| PATCH  | `/change-admin-role` | `AdminController@changeAdminRole` |
| GET    | `/requestType`       | `RequestTypeController@index`     |
| POST   | `/requestTypes`      | `RequestTypeController@store`     |
| PUT    | `/requestTypes/{id}` | `RequestTypeController@update`    |
| DELETE | `/requestTypes/{id}` | `RequestTypeController@destroy`   |
| GET    | `/requestor`         | `RequestorListController@index`   |
| POST   | `/requestor`         | `RequestorListController@store`   |
| DELETE | `/requestor/{id}`    | `RequestorListController@destroy` |

#### API (`routes/api.php` — `/api` prefix)

| Method | Path                       | Handler                  |
| ------ | -------------------------- | ------------------------ |
| POST   | `/JORF/broadcasting/auth`  | Broadcast auth           |
| GET    | `/notifications`           | Get unread notifications |
| PUT    | `/notifications/{id}/read` | Mark single as read      |
| PUT    | `/notifications/read-all`  | Mark all as read         |
| GET    | `/notifications/count`     | Get unread count         |
| GET    | `/debug/session`           | Debug session data       |
| GET    | `/debug/user`              | Debug current user       |

---

## Service Layer

### JorfService

Central orchestrator for all JORF business logic.

```
Dependencies: JorfRepository, UserRepository, NotificationService

storeBatch(Request $request, array $empData)
  1. Upload files → storage/app/public/jorf_attachments/{empid}/{jorfNumber}/
  2. DB transaction:
     a. Generate JORF number (JORF-YYYY-XXX, with batch offset)
     b. Create jorf_table record (status=1)
     c. Create jorf_attachments records
  3. Notify dept heads (APPROVER2, APPROVER3 of requestor)
  4. Rollback files if DB transaction fails

getJorfDataTable(array $filters, array $empData): array
  Filters: page, pageSize, search, status, requestType, sortField, sortOrder
  Returns: { data, pagination, statusCounts, filters }

applyRoleFilters($query, array $empData)
  - Requestor: own JORFs only
  - Incharge/Approver: JORFs assigned to them
  - Dept Head (APPROVER2/3): requestors' JORFs
  - Facilities Coordinator: all JORFs
  - Facilities Staff: JORFs in handled_by with status > 2

getAvailableActions(string $jorfId, array $empData): array
  Returns list of actions current user may perform

jorfAction(string $jorfId, string $empId, array $validated): bool
  Updates JORF status + notifies appropriate recipients
```

### JorfStatusService

```
getStatusLabel(Jorf $jorf): string
getStatusColor(Jorf $jorf): string
getStatusLabelById(?int $statusId): string
getStatusColorById(?int $statusId): string
getStatusIdByLabel(?string $label): ?int
```

### NotificationService

```
notifyJorfAction($jorf, string $action, array $actor): array

Notification recipients by action:
  CREATED    → requestor's APPROVER2 + APPROVER3
  APPROVE    → Facilities Coordinator
  ONGOING    → users in handled_by array
  DONE       → requestor (employid)
  ACKNOWLEDGE→ Facilities Coordinator + handled_by users
  CANCEL     → requestor
  DISAPPROVE → requestor
```

### UserRoleService

```
getLocationList()                        → external inventory API: emp/loc-list
isDepartmentHead(string $userId): bool   → checks APPROVER2/APPROVER3 in masterlist
getFacilitiesEmployees(): array
getAvailableApproversAndRequestors(?string $empId): array
  → ACCSTATUS=1, EMPPOSITION NOT IN [0,1,6], excludes current user + existing approvers
```

### DataTableService

```
handle(Request $request, string $connection, string $table, array $options): array|StreamedResponse

Options:
  defaultSortBy, defaultSortDirection
  dateColumn, searchColumns
  joins: [{table, first, second, type}]
  conditions: callable
  filename, exportColumns (triggers CSV export when set)
```

### DashboardService

```
getDashboardData(): array
  Returns: {
    statusCounts,
    monthlyTrends (6 months),
    requestTypeCounts,
    departmentCounts,
    recentJorfs (5),
    avgCompletionTime (hours, for status 4+5),
    totalJorfs
  }
```

---

## Audit Logging (Loggable Trait)

The `Loggable` trait on the `Jorf` model automatically records all changes to `jorf_logs`.

```
Events captured:
  created  → action_type='created', new_values=all attributes
  updated  → action_type='updated', old_values=originals, new_values=dirty attributes
  deleted  → action_type='deleted'

Each log record includes:
  loggable_type   model class
  loggable_id     jorf_id or record ID
  action_by       session emp_id
  action_at       timestamp
  metadata        JSON extra context
```

---

## Real-time Notifications

### Architecture

```
JORF action occurs
      │
      ▼
NotificationService::notifyJorfAction()
      │
      ▼
JorfNotification dispatched (implements ShouldBroadcast)
      │
      ├── toDatabase() → stored in `notifications` table
      └── toBroadcast() → sent via Pusher to PrivateChannel('users.{empId}')

Broadcast event name: 'notification.created'

Payload:
  { id, jorf_id, message, request_type, details, type, action_required, timestamp }
```

### Frontend Subscription (`NotificationContext.jsx`)

```
Laravel Echo connects to Pusher
      │
      ▼
Subscribes to private channel: 'users.{emp_id}'
      │
      ▼
Listens for 'notification.created' event
      │
      ▼
Updates notifications[], unreadCount in React context
      │
      ▼
NotificationBell component reflects unread count
```

---

## Frontend Architecture

### State Management

- **React Context** (`NotificationContext`) — global notification state
- **Inertia.js** — server-side data passing via `usePage().props`
- **Zustand** — local component state where needed
- **Custom Hooks** — encapsulate feature-specific state:

| Hook                        | Responsibility                                                         |
| --------------------------- | ---------------------------------------------------------------------- |
| `useJorfTable.js`           | Table pagination, search, status filter                                |
| `useJorfDrawer.js`          | Drawer open/close, fetch attachments/logs/actions, perform JORF action |
| `useDrawer.js`              | Generic drawer state (open/close/selectedItem)                         |
| `useRealtimeJorfUpdates.js` | Subscribe and react to real-time JORF updates                          |
| `useRequestTypeDrawer.js`   | Request type management drawer                                         |

### Shared Inertia Props (HandleInertiaRequests)

Every page receives:

```js
{
  emp_data: session('emp_data'),   // current user object
  flash: { success, error },       // flash messages
  auth: { user },                  // Laravel auth user
  appName: config('app.name'),
  display_name: config('app.name')
}
```

### Form Validation

- `react-hook-form` + `zod` for client-side schema validation
- Laravel Form Requests for server-side validation
- Inertia error bag bridges server errors back to form fields

---

## JORF Request Full Flow

### 1. Creation

```
User → /form (JorfController@index)
         │
         ▼
     Jorf/Index.jsx
     Fills multi-entry form:
       - request_type, location, details (required)
       - attachments (required, max 10MB each)
       - incharge_id, approver_id (required)
         │
         ▼
     POST /store → JorfController@store()
         │
         ▼
     JorfService::storeBatch()
       1. Upload files to: storage/app/public/jorf_attachments/{empid}/{jorfNumber}/
       2. DB transaction:
          - Create jorf_table record (status=1, Pending)
          - Create jorf_attachments records
       3. Notify dept heads via JorfNotification
         │
         ▼
     JSON response: { success: true, message: "..." }
```

### 2. Department Head Review

```
Dept head sees JORF in JorfTable (role filter: APPROVER2/3 = their ID)
         │
         ▼
Opens drawer → fetches attachments + logs + available actions
         │
         ▼
Available actions: APPROVE, DISAPPROVE
         │
         ▼
POST /action { jorf_id, action: 'APPROVE' }
         │
         ▼
JorfService::jorfAction()
  - Updates status to 2 (Approved)
  - Logs change via Loggable trait
  - Notifies Facilities Coordinator
```

### 3. Facilities Coordinator Execution

```
Coordinator sees approved JORF
         │
         ▼
Selects ONGOING action:
  - Sets: classification, execution_date, lead_time, cost_amount, handled_by[]
  - Status → 3 (Ongoing)
  - Notifies assigned facilities employees
         │
         ▼
Facilities employee marks DONE:
  - Status → 4 (Done)
  - Sets handled_at timestamp
  - Notifies requestor
```

### 4. Requestor Acknowledgement

```
Requestor sees Done JORF
         │
         ├── ACKNOWLEDGE → status = 5 (Acknowledged), notifies coordinator + handlers
         └── RETURN      → status = 8 (Returned), coordinator can re-open as Ongoing
```

---

## File Storage

Files are stored in Laravel's local disk under:

```
storage/app/public/jorf_attachments/{empid}/{jorfNumber}/{filename}
```

Accessible publicly via:

```
/storage/jorf_attachments/{empid}/{jorfNumber}/{filename}
```

Download route: `GET /attachments/download/{id}` — streams the file from storage.

---

## JORF Number Generation

```
Format: JORF-YYYY-XXX

Where:
  YYYY = current year
  XXX  = zero-padded sequence number (latest count + 1 + batch offset)

Supports batch creation: each entry in a batch gets offset +1
```

---

## Environment Variables

```env
# App
APP_NAME=JORF
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8001

# Default DB (JORF data)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=jorf_db
DB_USERNAME=root
DB_PASSWORD=

# Masterlist DB (employee data)
MDB_CONNECTION=mysql
MDB_HOST=127.0.0.1
MDB_DATABASE=masterlist_db
MDB_USERNAME=root
MDB_PASSWORD=

# Auth DB (Authify SSO)
ADB_CONNECTION=mysql
ADB_HOST=127.0.0.1
ADB_DATABASE=auth_db
ADB_USERNAME=root
ADB_PASSWORD=

# Real-time
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

# External services
INVENTORY_API_URL=http://192.168.2.221:8191
INVENTORY_API_TOKEN=
```

---

## Testing

- **Framework**: Pest PHP
- **Feature tests**: `tests/Feature/`
- **Unit tests**: `tests/Unit/`

```bash
composer test
php artisan test --filter=ClassName
```

---

## Development Server

```bash
composer run dev
```

Starts concurrently:

- PHP server on port `8001`
- Queue listener (`php artisan queue:listen`)
- Vite dev server (HMR)
