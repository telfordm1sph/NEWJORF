<?php

namespace App\Repositories;

use App\Models\Masterlist;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserRepository
{

    /**
     * Check if user is a department head
     */
    public function isDepartmentHead(string $userId): bool
    {
        try {
            $result = DB::connection('masterlist')->select("
                SELECT COUNT(*) as count 
                FROM employee_masterlist 
                WHERE ACCSTATUS = 1 AND (APPROVER2 = ? OR APPROVER3 = ?)
            ", [$userId, $userId]);

            return ($result[0]->count ?? 0) > 0;
        } catch (\Exception $e) {
            Log::error("Failed to check department head status for user {$userId}: " . $e->getMessage());
            return false;
        }
    }
    public function findUserById(string $empId): ?object
    {
        return Masterlist::where('EMPLOYID', $empId)
            ->select([
                'EMPLOYID as emp_id',
                'EMPNAME as empname',
            ])
            ->first();
    }
    public function findDeptHeadOfRequestorById(string $empId): ?object
    {
        return Masterlist::where('EMPLOYID', $empId)
            ->where('ACCSTATUS', '1')
            ->select([
                'APPROVER2 as approver2',
                'APPROVER3 as approver3',
            ])
            ->first();
    }
    public function getFacilitiesCoordinator(): ?object
    {
        return Masterlist::where('DEPARTMENT', 'Facilities')
            ->where('JOB_TITLE', 'like', 'Facilities Engineer%')
            ->where('ACCSTATUS', '1')
            ->select([
                'EMPLOYID as emp_id',
                'EMPNAME as empname',
            ])
            ->first();
    }

    public function getFacilitiesEmployees(): array
    {
        return Masterlist::where('DEPARTMENT', 'Facilities')
            ->where('ACCSTATUS', '1')
            ->select([
                'EMPLOYID as emp_id',
                'EMPNAME as empname',
            ])
            ->get()
            ->toArray();
    }
    public function getApproversById(string $empId): ?object
    {
        return Masterlist::where('EMPLOYID', $empId)
            ->select(['APPROVER1', 'APPROVER2', 'APPROVER3'])
            ->first();
    }

    public function getAvailableApproversAndRequestors(array $excludedIds = []): array
    {
        return Masterlist::where('ACCSTATUS', '1')
            ->whereNotIn('EMPPOSITION', [0, 1, 6])
            ->when(!empty($excludedIds), fn($q) => $q->whereNotIn('EMPLOYID', $excludedIds))
            ->select([
                'EMPLOYID as emp_id',
                'EMPNAME as empname',
                'DEPARTMENT as department',
                'PRODLINE as prodline',
                'STATION as station',
            ])
            ->get()
            ->toArray();
    }
}
