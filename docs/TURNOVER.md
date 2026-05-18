# Developer Turnover Guide

## Prerequisites

| Requirement | Version |
| ----------- | ------- |
| PHP         | 8.2+    |
| MySQL       | 8.0+    |
| Node.js     | 18+     |
| Composer    | Latest  |
| NPM         | Latest  |

---

## Installation

```bash
# 1. Install PHP dependencies
composer install

# 2. Install JS dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Generate app key
php artisan key:generate

# 5. Import system tables
#    Open System_Tables.sql and run it against your MySQL server

# 6. Configure your .env (see Environment Configuration below)

# 7. Run migrations (if applicable)
php artisan migrate
```

---

## Environment Configuration

Update `.env` with your local database credentials. The app uses **three separate databases**:

```env
# App
APP_NAME=JORF
APP_URL=http://localhost:8001

# Primary JORF Database (application data)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=jorf_db
DB_USERNAME=root
DB_PASSWORD=

# Employee Masterlist (read-only, employee directory)
MDB_CONNECTION=mysql
MDB_HOST=127.0.0.1
MDB_DATABASE=masterlist_db
MDB_USERNAME=root
MDB_PASSWORD=

# Auth Database (Authify SSO)
ADB_CONNECTION=mysql
ADB_HOST=127.0.0.1
ADB_DATABASE=auth_db
ADB_USERNAME=root
ADB_PASSWORD=

# Real-time notifications (Pusher)
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1
```

---

## Running the Application

```bash
composer run dev
```

This starts three processes concurrently:

- PHP server at `http://localhost:8001`
- Queue listener (`php artisan queue:listen`)
- Vite dev server (Hot Module Replacement)

---

## Database Setup

### Three Databases Explained

| Connection key    | Database        | What it stores                                                                  |
| ----------------- | --------------- | ------------------------------------------------------------------------------- |
| `mysql` (default) | `jorf_db`       | JORF requests, attachments, logs, notifications, request types                  |
| `masterlist`      | `masterlist_db` | Employee directory — read-only. Used for name lookup, approver chain, dept info |
| `authify`         | `auth_db`       | SSO token validation. Managed by the external Authify service                   |

### Key Tables in `jorf_db`

| Table                | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `jorf_table`         | All JORF requests                                        |
| `jorf_attachments`   | Uploaded files metadata per request                      |
| `jorf_logs`          | Full audit trail of every status change and model update |
| `type_of_request`    | Catalogue of JORF request types                          |
| `additional_users`   | Extra requestors manually added by admin                 |
| `admin`              | Admin/Incharge/Approver role assignments                 |
| `notification_users` | Users registered to receive broadcast notifications      |
| `notifications`      | Stored notification records (Laravel default)            |

### Key Columns in `employee_masterlist` (masterlist_db)

| Column        | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `EMPLOYID`    | Primary key, employee ID                       |
| `EMPNAME`     | Full name                                      |
| `DEPARTMENT`  | Department                                     |
| `JOB_TITLE`   | Job title                                      |
| `APPROVER2`   | Department head (first-level)                  |
| `APPROVER3`   | Department head (second-level)                 |
| `EMPPOSITION` | Position level (must be ≥ 2 for system access) |
| `ACCSTATUS`   | Account status (1 = active)                    |

---

## Key Concepts

### JORF Status Workflow

```
[1] PENDING ──APPROVE──► [2] APPROVED ──ONGOING──► [3] ONGOING ──DONE──► [4] DONE
      │                        │                        │                   │    │
   CANCEL/                  CANCEL                   CANCEL            ACKNOWLEDGE RETURN
  DISAPPROVE                   │                        │                   │        │
      │                        ▼                        ▼                   ▼        ▼
[6] CANCELLED            [6] CANCELLED           [6] CANCELLED     [5] ACKNOWLEDGED [8] RETURNED
[7] DISAPPROVED                                                                          │
                                                                                    (re-enters)
                                                                                   ONGOING/DONE
```

### Status Codes

| Code | Label        | Who transitions to it                          |
| ---- | ------------ | ---------------------------------------------- |
| 1    | Pending      | Auto on creation                               |
| 2    | Approved     | Dept Head (Approver)                           |
| 3    | Ongoing      | Facilities Coordinator                         |
| 4    | Done         | Facilities Coordinator or Staff                |
| 5    | Acknowledged | Requestor                                      |
| 6    | Canceled     | Requestor (status 1), Coordinator (status 2–3) |
| 7    | Disapproved  | Dept Head                                      |
| 8    | Returned     | Requestor (from Done)                          |

### Roles

| Role                   | How assigned                                    | What they can do                                                      |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Requestor              | Any authenticated user                          | Create JORFs, cancel own pending JORFs, acknowledge/return Done JORFs |
| Dept Head              | `APPROVER2`/`APPROVER3` field in masterlist     | Approve or disapprove JORFs from their requestors                     |
| Facilities Coordinator | Facilities dept + "Facility Engineer" job title | Move JORFs to Ongoing, assign handlers, mark Done                     |
| Facilities Staff       | Any Facilities dept employee                    | Mark assigned JORFs as Done                                           |
| Incharge               | `admin` table, `emp_role=Incharge`              | Admin panel access                                                    |
| Approver               | `admin` table, `emp_role=Approver`              | Admin panel access                                                    |
| Admin                  | `admin` table, `emp_role=Admin`                 | Full admin access                                                     |

### Multiple Databases — What to Know

- The `User` model uses `$connection = 'masterlist'` (reads from masterlist_db).
- The `Masterlist` model also reads from masterlist_db. Do **not** write to it.
- All application data (JORFs, logs, notifications) goes to the default `mysql` connection.
- The authify database is queried only by `AuthMiddleware` for SSO token validation.

### Authentication (SSO)

This app does **not** have its own login page. It uses an external Authify SSO:

1. Unauthenticated users are redirected to `http://192.168.2.221:8200/login?redirect=...`
2. After login, Authify redirects back with `?key=TOKEN`
3. `AuthMiddleware` validates the token against the authify database
4. A 7-day cookie is set so subsequent requests don't re-query authify
5. User data is stored in PHP session as `emp_data`

For local development without the SSO server, you'll need to seed the authify database or mock the middleware.

---

## Important Files

| File                                           | Purpose                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `app/Models/Jorf.php`                          | Core JORF model — fillable fields, relationships, Loggable trait |
| `app/Services/JorfService.php`                 | All JORF business logic: create, filter, actions, notifications  |
| `app/Services/JorfStatusService.php`           | Status label/color helpers                                       |
| `app/Services/NotificationService.php`         | Determines who gets notified for each action                     |
| `app/Http/Controllers/JorfController.php`      | JORF API endpoints                                               |
| `app/Constants/Status.php`                     | Status integer constants                                         |
| `app/Http/Middleware/AuthMiddleware.php`       | SSO token validation + session setup                             |
| `app/Traits/Loggable.php`                      | Auto-logs all Jorf model changes to `jorf_logs`                  |
| `resources/js/Hooks/useJorfDrawer.js`          | Frontend drawer: attachments, logs, actions                      |
| `resources/js/Hooks/useJorfTable.js`           | Frontend table: pagination, filters, search                      |
| `resources/js/Context/NotificationContext.jsx` | Real-time notification state via Laravel Echo                    |
| `routes/jorf.php`                              | All JORF-related route definitions                               |

---

## Common Tasks

### Creating a New JORF Request Type

1. Go to Admin → Request Types in the UI, or:
2. Insert a row into `type_of_request` table: `{request_name, is_active=1}`
3. No code changes needed — types are loaded dynamically.

### Adding a New Field to JORF

1. Add column to `jorf_table` (write a migration or alter the table)
2. Add the field name to `$fillable` in `app/Models/Jorf.php`
3. Update the frontend form: `resources/js/Pages/Jorf/Index.jsx`
4. Update the drawer if it should display: `resources/js/components/jorf/JorfDrawer.jsx`

### Modifying the Status Flow

1. Add/update constants in `app/Constants/Status.php`
2. Update `app/Services/JorfService.php` — `getAvailableActions()` method defines which actions are shown per status/role
3. Update `app/Services/JorfStatusService.php` — `STATUS_LABELS` and `STATUS_COLORS` arrays
4. Update `app/Services/NotificationService.php` — `notifyJorfAction()` for new notification recipients
5. Update frontend status badge display if needed

### Adding a New Admin

1. Go to Admin → Add Admin in the UI, or:
2. `POST /{APP_NAME}/add-admin` with `{emp_id, emp_name, emp_role}`

### Adding a Requestor (non-masterlist user)

1. Go to Admin → Requestor List in the UI, or:
2. `POST /{APP_NAME}/requestor` with `{employid, empname, department, prodline, station}`
3. This inserts into `additional_users`, allowing access regardless of emp_position

### Modifying Role-Based Table Visibility

Edit `app/Services/JorfService.php` → `applyRoleFilters()`. This method builds the query constraints for each role type.

---

## Backend Architecture Patterns

### Controller → Service → Repository

All business logic follows this layered pattern:

```
Controller        validates request, calls Service, returns response
    └── Service   orchestrates logic, calls Repositories, sends notifications
         └── Repository  raw DB queries only, returns models/collections
```

Never put DB queries in controllers or business logic in repositories.

### Adding a New Feature (Backend)

1. **Model** — `app/Models/YourModel.php`
2. **Repository** — `app/Repositories/YourModelRepository.php` (DB queries only)
3. **Service** — `app/Services/YourModelService.php` (business logic)
4. **Controller** — `app/Http/Controllers/YourController.php` (HTTP layer)
5. **Route** — add to appropriate `routes/*.php`
6. **Middleware** — add to route if auth/admin protection needed

### Adding a New Feature (Frontend)

1. **Component** — `resources/js/components/yourfeature/`
2. **Page** — `resources/js/Pages/YourPage.jsx`
3. **Hook** — `resources/js/Hooks/useYourFeature.js` (state + API calls)
4. **Route** — register in `routes/*.php` returning an Inertia response

---

## Debugging

### Enable Query Logging

```php
// Temporarily add to a controller or service
\DB::enableQueryLog();
// ... your code ...
dd(\DB::getQueryLog());
```

### Check Laravel Logs

```bash
tail -f storage/logs/laravel.log
```

### Clear All Cache

```bash
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
```

### Check Current User Session

Call `GET /api/debug/session` or `GET /api/debug/user` (authenticated) to inspect what's in the session.

---

## Testing

```bash
# Run all tests
composer test

# Run a specific test class or method
php artisan test --filter=JorfTest
php artisan test --filter=JorfTest::it_creates_a_jorf
```

Tests are in:

- `tests/Feature/` — integration tests (HTTP, DB)
- `tests/Unit/` — unit tests (services, helpers)

---

## Code Style

This project uses **Laravel Pint** for PHP formatting. Run before every commit:

```bash
composer pint
```

---

## Common Issues

### "Table not found"

- Check you have imported `System_Tables.sql`
- Run `php artisan migrate`
- Verify `DB_DATABASE`, `MDB_DATABASE`, `ADB_DATABASE` in `.env`

### "Class not found"

```bash
php artisan optimize
composer dump-autoload
```

### Authentication not working (local dev)

- Verify `ADB_*` env variables point to a reachable authify database
- The app redirects to `http://192.168.2.221:8200/login` — this must be accessible from your machine
- Check the `AuthMiddleware` — you can temporarily bypass it for local development by returning `$next($request)` at the top and manually seeding `session('emp_data')`

### Real-time notifications not working

- Check `PUSHER_*` variables in `.env`
- Verify the Pusher app credentials in your Pusher dashboard
- Check browser console for WebSocket errors
- Verify `broadcasting.php` config is using the correct connection

### "419 Page Expired" (CSRF error)

- Ensure `APP_URL` matches the URL you're accessing the app from
- Clear session: `php artisan session:table && php artisan migrate`

### File uploads failing

- Check `storage/app/public` is writable
- Run `php artisan storage:link` to create the public symlink
- Max upload size is **10MB** per file (enforced in `JorfController@store`)

---

## Deployment Checklist

```
[ ] Set APP_ENV=production
[ ] Set APP_DEBUG=false
[ ] Configure all DB credentials (DB_*, MDB_*, ADB_*)
[ ] Configure Pusher credentials (PUSHER_*)
[ ] Run migrations: php artisan migrate
[ ] Clear and rebuild cache: php artisan optimize
[ ] Build frontend assets: npm run build
[ ] Create storage symlink: php artisan storage:link
[ ] Verify SSO redirect URL is correct for production domain
[ ] Set correct APP_URL for CSRF and asset paths
[ ] Verify queue worker is running (notifications depend on it)
```
