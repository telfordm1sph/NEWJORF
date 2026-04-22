# Developer Turnover Guide

## Getting Started

### Prerequisites

- PHP 8.2+
- MySQL 8.0+
- Node.js 18+
- Composer
- NPM

### Installation

```bash
# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Create system tables (see System_Tables.sql)
# Import to your MySQL database
```

### Running the Application

```bash
composer run dev
```

Access at: `http://localhost:8001`

## Database Setup

### Required System Tables

Run `System_Tables.sql` in your MySQL database to create the base tables.

### Environment Configuration

Update `.env` with your database credentials:

```env
# Primary JORF Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=jorf_db
DB_USERNAME=root
DB_PASSWORD=

# Employee Masterlist (separate DB)
MDB_CONNECTION=mysql
MDB_HOST=127.0.0.1
MDB_DATABASE=masterlist_db
MDB_USERNAME=root
MDB_PASSWORD=

# Auth Database
ADB_CONNECTION=mysql
ADB_HOST=127.0.0.1
ADB_DATABASE=auth_db
ADB_USERNAME=root
ADB_PASSWORD=
```

## Key Concepts

### Multiple Databases

This app uses **three separate MySQL databases**:

1. **jorf_db** (default connection) - Application data
2. **masterlist_db** - Employee information (read-only for auth)
3. **auth_db** - User authentication

The `User` model uses `masterlist` connection with `$connection = 'masterlist'`.

### JORF Status Workflow

```
PENDING → INCHARGE_REVIEW → APPROVER_REVIEW → APPROVED/DISAPPROVED
         ↓
      CANCELLED
```

### Roles

| Role | Description |
|------|-------------|
| Admin | Full system access |
| Incharge | Review requests |
| Approver | Approve/reject requests |
| Requestor | Create requests |

## Common Tasks

### Creating a New JORF Type

1. Add to `request_types` table in database
2. Update `constants/Status.php` if needed

### Adding a New Field to JORF

1. Add column to `jorf_table` in database
2. Add to `$fillable` in `app/Models/Jorf.php`
3. Update frontend form component

### Modifying Status Flow

1. Update `app/Constants/Status.php`
2. Update `app/Services/JorfStatusService.php`
3. Update frontend status display

## Important Files

| File | Purpose |
|------|---------|
| `app/Models/Jorf.php` | Core JORF model |
| `app/Services/JorfService.php` | JORF business logic |
| `app/Http/Controllers/JorfController.php` | JORF API endpoints |
| `app/Constants/Status.php` | Status definitions |
| `resources/js/Hooks/useJorfDrawer.js` | JORF drawer (CRUD UI) |

## Debugging

### Enable Query Logging

```php
// Add to .env
DB_LOG=true
```

### Check Logs

```bash
tail -f storage/logs/laravel.log
```

### Clear Cache

```bash
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
```

## Testing

```bash
# Run all tests
composer test

# Run specific test
php artisan test --filter=ProfileTest
```

## Common Issues

### "Table not found"

- Run migrations: `php artisan migrate`
- Check database connection in `.env`

### "Class not found"

- Clear cache: `php artisan optimize`
- Run: `composer dump-autoload`

### Authentication not working

- Check `ADB_*` env variables
- Verify auth database exists and has users table

### Real-time notifications not working

- Check `PUSHER_*` variables in `.env`
- Verify Pusher app credentials

## Adding New Features

### Backend

1. Create/update Model in `app/Models/`
2. Add Repository in `app/Repositories/`
3. Add Service in `app/Services/`
4. Add Controller in `app/Http/Controllers/`
5. Add route in appropriate `routes/*.php`
6. Add middleware if needed in `app/Http/Middleware/`

### Frontend

1. Create React component in `resources/js/components/`
2. Add page in `resources/js/Pages/`
3. Add hook in `resources/js/Hooks/`
4. Register route in `routes/*.php`

## Code Style

- Follow Laravel Pint formatting
- Run before commits: `composer pint`

## Deployment Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure database credentials
- [ ] Configure Pusher credentials
- [ ] Run migrations: `php artisan migrate`
- [ ] Clear cache: `php artisan optimize`
- [ ] Build assets: `npm run build`