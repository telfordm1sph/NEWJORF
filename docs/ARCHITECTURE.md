# Architecture Documentation

## Overview

This is a Laravel 12 + Inertia.js + React application for managing JORF (Job Order Request Form) requests. The system handles job order requests with approval workflows, notifications, and file attachments.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12 (PHP 8.2+) |
| Frontend | React 19 + Inertia.js |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MySQL (primary + masterlist + authify connections) |
| Real-time | Pusher/Reverb for notifications |
| Build | Vite |

## Project Structure

```
app/
├── Constants/          # Application constants (Status.php)
├── Helpers/            # Global helper functions
├── Http/
│   ├── Controllers/    # Request handlers
│   ├── Middleware/     # Auth, CORS, Admin checks
│   └── Requests/       # Form request validation
├── Models/             # Eloquent models
├── Notifications/      # Notification classes
├── Providers/          # Service providers
├── Repositories/       # Data access layer
├── Services/           # Business logic
└── Traits/             # Shared behaviors (Loggable)
```

## Database Architecture

### Multiple Database Connections

The application uses three MySQL connections:

1. **Default** (`mysql`) - JORF application data
2. **masterlist** - Employee masterlist (read-only reference)
3. **authify** - Authentication data

### Core Tables

| Table | Purpose | Connection |
|-------|---------|------------|
| `jorf_table` | Main JORF requests | default |
| `jorf_attachments` | File attachments | default |
| `jorf_logs` | Audit trail | default |
| `notification_users` | User notifications | default |
| `request_types` | Request categories | default |
| `requestor_list` | Requestor management | default |
| `employee_masterlist` | Employee data | masterlist |
| `users` | Auth users | authify |

### Key Models

- **Jorf** (`app/Models/Jorf.php`) - Job order requests with status tracking
- **User** (`app/Models/User.php`) - Employee authentication (connected to masterlist)
- **RequestType** - Request categorization
- **JorfAttachments** - File attachments
- **JorfLogs** - Activity logging

## Request Flow

```
User Login → Dashboard
     ↓
Create JORF Request → RequestType selection
     ↓
Details + Attachments
     ↓
Submit → Incharge Review
     ↓
Approver Review (if required)
     ↓
Status Updates → Real-time Notifications
```

## Key Services

| Service | Responsibility |
|---------|----------------|
| JorfService | JORF CRUD operations |
| JorfStatusService | Status transitions |
| UserRoleService | Role management |
| NotificationService | Real-time notifications |
| RequestTypeService | Request type management |
| RequestorListService | Requestor management |
| DataTableService | DataTables pagination |

## Authentication & Authorization

- Uses Laravel Sanctum for SPA authentication
- Roles: Admin, Incharge, Approver, Requestor
- Middleware: `auth`, `admin`, `cors`
- User data synced from masterlist database

## Real-time Features

- Pusher/Reverb for live notifications
- Notification sound for new JORF updates
- Auto-refresh on status changes

## API Routes

| File | Purpose |
|------|---------|
| `routes/web.php` | Web routes |
| `routes/api.php` | API endpoints |
| `routes/jorf.php` | JORF-specific routes |
| `routes/admin.php` | Admin routes |
| `routes/auth.php` | Authentication |
| `routes/general.php` | General pages |

## Frontend Structure

```
resources/js/
├── Context/           # React contexts
├── Hooks/            # Custom React hooks
│   ├── useJorfTable.js
│   ├── useJorfDrawer.js
│   ├── useRealtimeJorfUpdates.js
│   └── ...
└── Pages/            # Inertia pages
```

## Environment Variables

Key variables in `.env`:

```
# Default DB (JORF data)
DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Masterlist DB (employees)
MDB_HOST, MDB_DATABASE, MDB_USERNAME, MDB_PASSWORD

# Auth DB
ADB_HOST, ADB_DATABASE, ADB_USERNAME, ADB_PASSWORD

# Real-time
PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET
```

## Testing

- Pest PHP for testing
- Feature tests in `tests/Feature/`
- Unit tests in `tests/Unit/`

Run tests: `composer test`

## Development Server

```bash
composer run dev
```

This starts:
- PHP server on port 8001
- Queue listener
- Vite dev server
