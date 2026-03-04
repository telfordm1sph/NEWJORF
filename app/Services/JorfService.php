<?php

namespace App\Services;

use App\Constants\Status;
use App\Models\Masterlist;
use App\Models\User;
use App\Repositories\JorfRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JorfService
{
    protected JorfRepository $jorfRepository;
    protected UserRepository $userRepo;


    public function __construct(JorfRepository $jorfRepository, UserRepository $userRepo,)
    {
        $this->jorfRepository = $jorfRepository;
        $this->userRepo = $userRepo;
    }

    public function getRequestType()
    {
        return $this->jorfRepository->getRequestType();
    }

    public function store(Request $request, array $empData): void
    {
        DB::transaction(function () use ($request, $empData) {
            $employeeData = [
                'employid'   => $empData['emp_id'] ?? $empData['EMPLOYID'] ?? null,
                'empname'    => $empData['emp_name'] ?? $empData['EMPNAME'] ?? null,
                'department' => $empData['emp_dept'] ?? $empData['DEPARTMENT'] ?? 'Unknown',
                'prodline'   => $empData['emp_prodline'] ?? $empData['PRODLINE'] ?? 'Unknown',
                'station'    => $empData['emp_station'] ?? $empData['STATION'] ?? 'Unknown',
            ];

            if (!$employeeData['employid'] || !$employeeData['empname']) {
                throw new \InvalidArgumentException('Employee ID and Name are required.');
            }

            $jorfNumber = $this->jorfRepository->generateJorfNumber();

            $jorf = $this->jorfRepository->createJorf(array_merge($employeeData, [
                'jorf_id'      => $jorfNumber,
                'request_type' => $request->request_type,
                'details'      => $request->request_details,
                'status'       => 1,
                'created_by'   => $employeeData['employid'],
            ]));
            // $this->notificationService->notifyJorfAction(
            //     $jorf,
            //     'Created',
            //     ['emp_id' => $employeeData['employid'], 'name' => $employeeData['empname']],
            //     $employeeData,
            //     ['DEPT_HEAD']
            // );

            $this->storeAttachments($request->file('attachments', []), $jorfNumber, $employeeData['employid']);
        });
    }

    protected function storeAttachments(array $attachments, string $jorfNumber, string $employeeId): void
    {
        foreach ($attachments as $file) {
            $path = $file->store(
                "jorf_attachments/{$employeeId}/{$jorfNumber}",
                'public'
            );

            $this->jorfRepository->createAttachment([
                'jorf_id'     => $jorfNumber,
                'file_name'   => $file->getClientOriginalName(),
                'file_path'   => $path,
                'file_size'   => $file->getSize(),
                'file_type'   => $file->getClientMimeType(),
                'uploaded_by' => $employeeId,
                'uploaded_at' => now(),
            ]);
        }
    }

    /**
     * Get paginated JORF table with filters, search, sort
     */
    public function getJorfDataTable(array $filters, array $empData): array
    {
        // ----- Base Queries -----
        $tableQuery = $this->applyRoleFilters($this->jorfRepository->query(), $empData);
        $countQuery = $this->applyRoleFilters($this->jorfRepository->query(), $empData);

        // ----- Apply status filter only for table -----
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $tableQuery->where('status', $filters['status']);
        }

        // ----- Apply request type filter only for table -----
        if (!empty($filters['requestType'])) {
            $tableQuery->where('request_type', $filters['requestType']);
        }

        // ----- Apply search filter only for table -----
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $tableQuery->where(function ($q) use ($search) {
                $q->where('jorf_id', 'like', "%{$search}%")
                    ->orWhere('empname', 'like', "%{$search}%")
                    ->orWhere('employid', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('prodline', 'like', "%{$search}%")
                    ->orWhere('details', 'like', "%{$search}%");
            });
        }

        // ----- Sorting & Pagination -----
        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';
        $tableQuery->orderBy($sortField, $sortOrder);

        $page     = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $tableQuery->paginate($pageSize, ['*'], 'page', $page);

        // ----- Status counts (unfiltered by status) -----
        $countQuery->getQuery()->orders = []; // remove orderBy for count query
        $statusCounts = $this->jorfRepository->getStatusCountsFromQuery($countQuery);

        // ----- Fetch all handled_by employee names in one query -----
        $empIds = collect($paginated->items())
            ->pluck('handled_by')
            ->filter() // remove nulls
            ->map(fn($ids) => explode(',', $ids)) // split comma-separated IDs
            ->flatten()
            ->unique()
            ->toArray();

        $users = [];
        if (!empty($empIds)) {
            $users = User::whereIn('EMPLOYID', $empIds)
                ->pluck('EMPNAME', 'EMPLOYID')
                ->toArray();
        }

        // ----- Prepare table data -----
        $data = collect($paginated->items())->map(function ($jorf) use ($users) {
            // Map handled_by IDs to names
            $handledByNames = null;
            if (!empty($jorf->handled_by)) {
                $ids = explode(',', $jorf->handled_by);
                $handledByNames = implode('| ', array_map(fn($id) => $users[$id] ?? $id, $ids));
            }

            return [
                ...$jorf->toArray(),
                'status_label'    => Status::getLabel($jorf->status),
                'status_color'    => Status::getColor($jorf->status),
                'handled_by_name' => $handledByNames,
            ];
        });

        return [
            'data' => $data,
            'pagination' => [
                'current'     => $paginated->currentPage(),
                'currentPage' => $paginated->currentPage(),
                'lastPage'    => $paginated->lastPage(),
                'total'       => $paginated->total(),
                'perPage'     => $paginated->perPage(),
                'pageSize'    => $paginated->perPage(),
            ],
            'statusCounts' => $statusCounts,
            'filters'      => $filters,
        ];
    }

    /**
     * Apply role-based filters to a query.
     */
    protected function applyRoleFilters($query, array $empData)
    {
        $currentEmpId = $empData['emp_id'] ?? null;
        $userRoles    = $empData['user_roles'] ?? '';
        $systemRoles  = $empData['system_roles'] ?? [];

        // ---- Department Head ----
        if ($userRoles === 'DEPARTMENT_HEAD' && $currentEmpId) {

            $requestorIds = Masterlist::where(function ($q) use ($currentEmpId) {
                $q->where('APPROVER2', $currentEmpId)
                    ->orWhere('APPROVER3', $currentEmpId);
            })
                ->pluck('EMPLOYID');

            if ($requestorIds->isEmpty()) {
                return $query->whereRaw('1 = 0');
            }

            return $query->whereIn('employid', $requestorIds);
        }
        // ---- Facilities ----
        if (in_array('Facilities_Coordinator', $systemRoles)) {
            return $query->where('status', '!=', 1);
        }
        if (in_array('Facilities', $systemRoles)) {
            return $query
                ->whereNotIn('status', [1, 2])
                ->whereRaw('FIND_IN_SET(?, handled_by)', [$currentEmpId]);
        }


        // ---- Requestor (OWN records only) ----
        if ($currentEmpId) {
            return $query->where('employid', $currentEmpId);
        }


        // ---- Default (others) ----
        return $query->whereRaw('1 = 0');
    }

    public function getAttachments(string $jorfId): array
    {
        $attachments = $this->jorfRepository->getAttachmentsByJorfId($jorfId);

        return $attachments->map(function ($attachment) {
            return [
                'id' => $attachment->id,
                'jorf_id' => $attachment->jorf_id,
                'file_name' => $attachment->file_name,
                'file_path' => $attachment->file_path,
                'file_size' => $attachment->file_size,
                'file_type' => $attachment->file_type,
                'uploaded_by' => $attachment->uploaded_by,
                'uploaded_at' => $attachment->uploaded_at,
            ];
        })->toArray();
    }
    public function getJorfLogs(string $jorfId, int $perPage = 5)
    {
        $logs = $this->jorfRepository->getJorfLogs($jorfId, $perPage);

        $logs->getCollection()->transform(function ($log) {
            $oldStatus = $log['OLD_VALUES']['status']['label'] ?? null;
            $oldColor  = $log['OLD_VALUES']['status']['color'] ?? null;

            $newStatus = $log['NEW_VALUES']['status']['label'] ?? null;
            $newColor  = $log['NEW_VALUES']['status']['color'] ?? null;

            $log['OLD_STATUS_LABEL'] = $oldStatus;
            $log['OLD_STATUS_COLOR'] = $oldColor;
            $log['NEW_STATUS_LABEL'] = $newStatus;
            $log['NEW_STATUS_COLOR'] = $newColor;

            return $log;
        });

        return $logs;
    }


    public function getAvailableActions($jorfId, array $empData): array
    {
        $jorf = $this->jorfRepository->getJorfById($jorfId);
        $currentEmpId = $empData['emp_id'] ?? null;
        $userRoles = $empData['user_roles'] ?? '';
        $systemRoles = $empData['system_roles'] ?? [];
        $status = $jorf->status;

        $actions = [];

        // Check if user is the requestor
        $isRequestor = $jorf->employid === $currentEmpId;

        // Check if user is the department head of this requestor
        $isDepartmentHead = false;
        if ($userRoles === 'DEPARTMENT_HEAD') {
            $requestorIds = Masterlist::where('APPROVER2', $currentEmpId)
                ->orWhere('APPROVER3', $currentEmpId)
                ->pluck('EMPLOYID');
            $isDepartmentHead = $requestorIds->contains($jorf->employid);
        }

        // Requestor actions
        if ($isRequestor) {
            if ($status == Status::PENDING) {
                // $actions[] = 'edit';
                $actions[] = 'CANCEL';
            }
        }

        // Department Head actions
        if ($isDepartmentHead) {
            if ($status == Status::PENDING) {
                // Don't allow dept head to approve their own request
                if (!$isRequestor) {
                    $actions[] = 'APPROVE';
                    $actions[] = 'DISAPPROVE';
                }
            }
        }

        if ($systemRoles && in_array('Facilities_Coordinator', $systemRoles) && !$isRequestor) {
            // Facilities actions
            if (in_array($status, [Status::APPROVED])) {
                $actions[] = 'ONGOING';
                // $actions[] = 'DONE';
                $actions[] = 'CANCEL';
            } elseif (in_array($status, [Status::ONGOING])) {
                $actions[] = 'ONGOING';
                $actions[] = 'DONE';
            }
        }
        if ($systemRoles && in_array('Facilities', $systemRoles) && !$isRequestor) {
            // Facilities Coordinator actions
            if (in_array($status, [Status::ONGOING])) {
                $actions[] = 'DONE';
            } else {
                $actions[] = 'VIEW';
            }
        }
        if ($isRequestor && in_array($status, [Status::DONE])) {
            $actions[] = 'ACKNOWLEDGE';
        }
        // Add view for anyone who has access
        if ($isRequestor || $isDepartmentHead) {
            $actions[] = 'VIEW';
        }

        // Remove duplicates and return
        return array_values(array_unique($actions));
    }
    public function jorfAction(
        string $jorfId,
        string $userId,
        string $actionType = 'APPROVE',
        string $remarks = '',
        ?int $costAmount = null,
        ?float $rating = null,
        ?array $handledBy = null

    ): bool {
        $actionType = strtoupper($actionType);

        // Only allow valid actions
        if (!in_array($actionType, ['APPROVE', 'DISAPPROVE', 'ONGOING', 'DONE', 'CANCEL', 'ACKNOWLEDGE'])) {
            throw new \InvalidArgumentException('Invalid action type');
        }

        // Require remarks for certain actions
        if (empty($remarks)) {
            throw new \InvalidArgumentException('Remarks are required for this action.');
        }

        return DB::transaction(function () use ($jorfId, $userId, $actionType, $remarks, $costAmount, $rating, $handledBy) {

            $jorf = $this->jorfRepository->getJorfById($jorfId);
            if (!$jorf) return false;

            // Map action to status
            $statusMap = [
                'APPROVE'    => 2,
                'ONGOING'    => 3,
                'DONE'       => 4,
                'ACKNOWLEDGE' => 5,
                'CANCEL'     => 6,
                'DISAPPROVE' => 7,
            ];

            $newStatus = $statusMap[$actionType] ?? null;
            $updateData = [
                'status' => $newStatus,
            ];
            if (is_null($newStatus)) {
                throw new \InvalidArgumentException("No status mapping found for action $actionType");
            }

            if ($actionType === 'ONGOING' || $actionType === 'DONE') {
                if (!is_null($costAmount)) $updateData['cost_amount'] = $costAmount;

                if (!is_null($handledBy) && !empty($handledBy)) {

                    $updateData['handled_by'] = implode(',', $handledBy);
                    $updateData['handled_at'] = now();
                }
            }
            if ($actionType === 'ACKNOWLEDGE') {
                if (!is_null($rating)) $updateData['rating'] = $rating;
            }
            // dd($updateData);
            // Attach in-memory properties for logging
            $jorf->currentAction = $actionType;
            $jorf->remarks = $remarks;

            // Perform the update
            $this->jorfRepository->updateJorf($jorf, $updateData);

            // Optional: send notification
            $actorUser = $this->userRepo->findUserById($userId);
            $actorData = [
                'emp_id' => $userId,
                'name'   => $actorUser->empname ?? 'Unknown',
            ];

            // $this->notificationService->notifyJorfAction($jorf, $actionType, $actorData);

            return true;
        });
    }
}
