<?php

namespace App\Services;

use App\Constants\Status;
use App\Models\Masterlist;
use App\Models\User;
use App\Repositories\JorfRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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


    public function storeBatch(Request $request, array $empData): void
    {
        $employeeData = [
            'employid'   => $empData['emp_id']      ?? $empData['EMPLOYID']   ?? null,
            'empname'    => $empData['emp_name']     ?? $empData['EMPNAME']    ?? null,
            'department' => $empData['emp_dept']     ?? $empData['DEPARTMENT'] ?? 'Unknown',
            'prodline'   => $empData['emp_prodline'] ?? $empData['PRODLINE']   ?? 'Unknown',
            'station'    => $empData['emp_station']  ?? $empData['STATION']    ?? 'Unknown',
        ];

        if (!$employeeData['employid'] || !$employeeData['empname']) {
            throw new \InvalidArgumentException('Employee ID and Name are required.');
        }

        $entries = $request->input('entries', []);

        // ── Phase 1: Store all files BEFORE the DB transaction ──────────────────
        // We upload files first so we have their paths ready to insert.
        // If any upload fails here, no DB writes have happened yet — clean state.
        $uploadedPaths = [];  // track for rollback if DB transaction fails

        $preparedEntries = [];

        foreach ($entries as $index => $entry) {
            $jorfNumber = $this->jorfRepository->generateJorfNumber($index); // see repository
            $files      = $request->file("entries.{$index}.attachments", []);

            $attachments = [];

            foreach ($files as $file) {
                $path = $file->store(
                    "jorf_attachments/{$employeeData['employid']}/{$jorfNumber}",
                    'public'
                );

                $uploadedPaths[] = $path; // track for rollback

                $attachments[] = [
                    'jorf_id'     => $jorfNumber,
                    'file_name'   => $file->getClientOriginalName(),
                    'file_path'   => $path,
                    'file_size'   => $file->getSize(),
                    'file_type'   => $file->getClientMimeType(),
                    'uploaded_by' => $employeeData['employid'],
                    'uploaded_at' => now(),
                ];
            }

            $preparedEntries[] = [
                'jorf' => array_merge($employeeData, [
                    'jorf_id'      => $jorfNumber,
                    'request_type' => $entry['request_type'],
                    'location'     => $entry['location'],
                    'details'      => $entry['request_details'],
                    'incharge_id'  => $entry['incharge_id'],
                    'approver_id'  => $entry['approver_id'],
                    'status'       => 1,
                    'created_by'   => $employeeData['employid'],
                ]),
                'attachments' => $attachments,
            ];
        }

        // ── Phase 2: Insert everything in one DB transaction ─────────────────────
        // If anything fails here, we roll back the DB AND delete uploaded files.
        try {
            DB::transaction(function () use ($preparedEntries) {
                foreach ($preparedEntries as $prepared) {
                    $this->jorfRepository->createJorf($prepared['jorf']);

                    foreach ($prepared['attachments'] as $attachment) {
                        $this->jorfRepository->createAttachment($attachment);
                    }
                }
            });
        } catch (\Throwable $e) {
            // DB failed — delete all files that were already uploaded
            foreach ($uploadedPaths as $path) {
                Storage::disk('public')->delete($path);
            }

            throw $e; // re-throw so the controller returns a 500
        }
    }
    // public function store(Request $request, array $empData, array $entry, int $index): void
    // {
    //     DB::transaction(function () use ($request, $empData, $entry, $index) {
    //         $employeeData = [
    //             'employid'   => $empData['emp_id']       ?? $empData['EMPLOYID']   ?? null,
    //             'empname'    => $empData['emp_name']      ?? $empData['EMPNAME']    ?? null,
    //             'department' => $empData['emp_dept']      ?? $empData['DEPARTMENT'] ?? 'Unknown',
    //             'prodline'   => $empData['emp_prodline']  ?? $empData['PRODLINE']   ?? 'Unknown',
    //             'station'    => $empData['emp_station']   ?? $empData['STATION']    ?? 'Unknown',
    //         ];

    //         if (!$employeeData['employid'] || !$employeeData['empname']) {
    //             throw new \InvalidArgumentException('Employee ID and Name are required.');
    //         }

    //         $jorfNumber = $this->jorfRepository->generateJorfNumber();

    //         $jorf = $this->jorfRepository->createJorf(array_merge($employeeData, [
    //             'jorf_id'      => $jorfNumber,
    //             'request_type' => $entry['request_type'],
    //             'location'     => $entry['location'],
    //             'details'      => $entry['request_details'],
    //             'status'       => 1,
    //             'created_by'   => $employeeData['employid'],
    //         ]));

    //         // Get the uploaded files for this specific entry index
    //         $attachments = $request->file("entries.{$index}.attachments") ?? [];

    //         $this->storeAttachments($attachments, $jorfNumber, $employeeData['employid']);
    //     });
    // }
    public function updateAlternatePersonnel(
        string $jorfId,
        ?string $inchargeId,
        ?string $approverId,
        array $empData
    ): bool {
        $jorf = $this->jorfRepository->getJorfById($jorfId);
        $currentEmpId = $empData['emp_id'] ?? null;

        // Check if user is authorized to update
        $isRequestor = $jorf->employid === $currentEmpId;
        $isAltIncharge = !empty($jorf->incharge_id) && $jorf->incharge_id === $currentEmpId;
        $isAltApprover = !empty($jorf->approver_id) && $jorf->approver_id === $currentEmpId;

        $canUpdate = $isRequestor || $isAltIncharge || $isAltApprover;

        // Check role-based conditions
        if ($jorf->status == Status::PENDING) {
            // Can update both in pending status
        } elseif ($jorf->status != Status::DONE) {
            // Can only update incharge if not done
            if (!$isRequestor && !$isAltIncharge) {
                $canUpdate = false;
            }
        } else {
            // Done status - no updates allowed
            $canUpdate = false;
        }

        if (!$canUpdate) {
            throw new \Exception('You are not authorized to update this JORF');
        }

        return DB::transaction(function () use ($jorf, $inchargeId, $approverId, $currentEmpId) {
            $updateData = [];

            // Prepare update data
            if (!is_null($inchargeId)) {
                $updateData['incharge_id'] = $inchargeId;
            }

            if (!is_null($approverId)) {
                $updateData['approver_id'] = $approverId;
            }

            if (empty($updateData)) {
                return false;
            }

            // Attach metadata for logging
            $jorf->currentAction = 'UPDATE_ALTERNATE';
            $jorf->remarks = "Updated alternate personnel: " .
                (isset($updateData['incharge_id']) ? "incharge={$updateData['incharge_id']} " : "") .
                (isset($updateData['approver_id']) ? "approver={$updateData['approver_id']}" : "");

            // Perform the update
            $this->jorfRepository->updateJorf($jorf, $updateData);

            return true;
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

        // ----- Fetch all employee names (handled_by, incharge_id, approver_id) in one query -----
        $empIds = collect($paginated->items())
            ->flatMap(function ($jorf) {
                $ids = [];
                // Add handled_by IDs
                if (!empty($jorf->handled_by)) {
                    $ids = array_merge($ids, explode(',', $jorf->handled_by));
                }
                // Add incharge_id
                if (!empty($jorf->incharge_id)) {
                    $ids[] = $jorf->incharge_id;
                }
                // Add approver_id
                if (!empty($jorf->approver_id)) {
                    $ids[] = $jorf->approver_id;
                }
                return $ids;
            })
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
            $inChargeByName = null;
            $alternateApprover = null;
            if (!empty($jorf->handled_by)) {
                $ids = explode(',', $jorf->handled_by);
                $handledByNames = implode('| ', array_map(fn($id) => $users[$id] ?? $id, $ids));
            }
            if (!empty($jorf->incharge_id)) {
                $inChargeByName = $users[$jorf->incharge_id] ?? $jorf->incharge_id;
            }
            if (!empty($jorf->approver_id)) {
                $alternateApprover = $users[$jorf->approver_id] ?? $jorf->approver_id;
            }
            return [
                ...$jorf->toArray(),
                'status_label'    => Status::getLabel($jorf->status),
                'status_color'    => Status::getColor($jorf->status),
                'handled_by_name' => $handledByNames,
                'incharge_name'   => $inChargeByName,
                'approver_name'   => $alternateApprover,
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

    protected function applyRoleFilters($query, array $empData)
    {
        $currentEmpId = $empData['emp_id'] ?? null;
        $userRoles    = $empData['user_roles'] ?? '';
        $systemRoles  = $empData['system_roles'] ?? [];

        if (!$currentEmpId) {
            return $query->whereRaw('1 = 0');
        }

        $query->where(function ($mainQuery) use ($currentEmpId, $userRoles, $systemRoles) {

            /*
        |--------------------------------------------------------------------------
        | Requestor visibility (always allowed)
        |--------------------------------------------------------------------------
        */
            $mainQuery->where('employid', $currentEmpId)
                ->orWhere('incharge_id', $currentEmpId)
                ->orWhere('approver_id', $currentEmpId);


            /*
        |--------------------------------------------------------------------------
        | Default approver from Masterlist (no alternate approver set)
        |--------------------------------------------------------------------------
        */
            $mainQuery->orWhere(function ($q) use ($currentEmpId) {
                $q->whereNull('approver_id')
                    ->whereIn(
                        'employid',
                        Masterlist::where(function ($m) use ($currentEmpId) {
                            $m->where('APPROVER1', $currentEmpId)
                                ->orWhere('APPROVER2', $currentEmpId)
                                ->orWhere('APPROVER3', $currentEmpId);
                        })->pluck('EMPLOYID')
                    );
            });


            /*
        |--------------------------------------------------------------------------
        | Department Head
        |--------------------------------------------------------------------------
        */
            if ($userRoles === 'DEPARTMENT_HEAD') {

                $requestorIds = Masterlist::where(function ($q) use ($currentEmpId) {
                    $q->where('APPROVER2', $currentEmpId)
                        ->orWhere('APPROVER3', $currentEmpId);
                })->pluck('EMPLOYID');

                if ($requestorIds->isNotEmpty()) {
                    $mainQuery->orWhereIn('employid', $requestorIds);
                }
            }


            /*
        |--------------------------------------------------------------------------
        | Facilities Coordinator (can see everything)
        |--------------------------------------------------------------------------
        */
            if (in_array('Facilities_Coordinator', $systemRoles)) {
                $mainQuery->orWhereRaw('1 = 1');
            }


            /*
        |--------------------------------------------------------------------------
        | Facilities Staff
        |--------------------------------------------------------------------------
        */
            if (in_array('Facilities', $systemRoles)) {
                $mainQuery->orWhere(function ($q) use ($currentEmpId) {
                    $q->whereNotIn('status', [1, 2])
                        ->whereRaw('FIND_IN_SET(?, handled_by)', [$currentEmpId]);
                });
            }
        });

        return $query;
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

        // Check if user is the requestor or alternate incharge
        $isRequestor = $jorf->employid === $currentEmpId;
        $isAltIncharge = !empty($jorf->incharge_id) && $jorf->incharge_id === $currentEmpId;
        $canActAsRequestor = $isRequestor || $isAltIncharge;

        // Check if user is the alternate approver
        $isAltApprover = !empty($jorf->approver_id) && $jorf->approver_id === $currentEmpId;

        // Check if user is the department head of this requestor (default approver)
        $isDepartmentHead = false;
        if ($userRoles === 'DEPARTMENT_HEAD') {
            $requestorIds = Masterlist::where('APPROVER2', $currentEmpId)
                ->orWhere('APPROVER3', $currentEmpId)
                ->pluck('EMPLOYID');
            $isDepartmentHead = $requestorIds->contains($jorf->employid);
        }

        // If alternate approver is set, only they can approve — not the default dept head
        // If no alternate approver, fall back to department head
        $canApprove = $isAltApprover || ($isDepartmentHead && empty($jorf->approver));

        // Requestor / Alternate Incharge actions
        if ($canActAsRequestor) {
            if ($status == Status::PENDING) {
                $actions[] = 'CANCEL';
            }
        }

        // Approver actions (alternate approver OR default dept head)
        if ($canApprove && !$canActAsRequestor) {
            if ($status == Status::PENDING) {
                $actions[] = 'APPROVE';
                $actions[] = 'DISAPPROVE';
            }
        }

        // Facilities Coordinator actions
        if ($systemRoles && in_array('Facilities_Coordinator', $systemRoles) && !$canActAsRequestor) {
            if (in_array($status, [Status::APPROVED])) {
                $actions[] = 'ONGOING';
                $actions[] = 'CANCEL';
            } elseif (in_array($status, [Status::ONGOING])) {
                $actions[] = 'ONGOING';
                $actions[] = 'DONE';
            } elseif (in_array($status, [Status::RETURNED])) {
                $actions[] = 'ONGOING';
                $actions[] = 'DONE';
            }
        }

        // Facilities actions
        if ($systemRoles && in_array('Facilities', $systemRoles) && !$canActAsRequestor) {
            if (in_array($status, [Status::ONGOING])) {
                $actions[] = 'DONE';
            } else {
                $actions[] = 'VIEW';
            }
        }

        // Acknowledge — requestor or alternate incharge once DONE
        if ($canActAsRequestor && in_array($status, [Status::DONE])) {
            $actions[] = 'ACKNOWLEDGE';
            $actions[] = 'RETURN';
        }

        // VIEW — anyone with a role on this JORF
        if ($canActAsRequestor || $canApprove || $isDepartmentHead) {
            $actions[] = 'VIEW';
        }

        return array_values(array_unique($actions));
    }
    public function jorfAction(
        string $jorfId,
        string $userId,
        array $data  // Receive all data as one array
    ): bool {
        // Extract data with defaults
        $actionType = strtoupper($data['action'] ?? 'APPROVE');
        $remarks = $data['remarks'] ?? '';
        $costAmount = $data['cost_amount'] ?? null;
        $rating = $data['rating'] ?? null;
        $handledBy = $data['handled_by'] ?? [];
        $classification = $data['classification'] ?? null;
        $executionDate = $data['execution_date'] ?? null;
        $leadTimeValue = $data['lead_time_value'] ?? null;
        $leadTimeUnit = $data['lead_time_unit'] ?? null;

        // Only allow valid actions
        if (!in_array($actionType, ['APPROVE', 'DISAPPROVE', 'ONGOING', 'DONE', 'CANCEL', 'ACKNOWLEDGE', 'RETURN'])) {
            throw new \InvalidArgumentException('Invalid action type');
        }

        // Require remarks for certain actions
        if (empty($remarks)) {
            throw new \InvalidArgumentException('Remarks are required for this action.');
        }

        return DB::transaction(function () use ($jorfId, $userId, $actionType, $remarks, $costAmount, $rating, $handledBy, $classification, $executionDate, $leadTimeValue, $leadTimeUnit) {
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
                'RETURN'     => 8,
            ];

            $newStatus = $statusMap[$actionType] ?? null;
            $updateData = ['status' => $newStatus];

            if (is_null($newStatus)) {
                throw new \InvalidArgumentException("No status mapping found for action $actionType");
            }

            if ($actionType === 'ONGOING' || $actionType === 'DONE') {
                // only record these when facilities are actually doing work
                if (!is_null($classification)) {
                    $updateData['classification'] = $classification;
                }
                if (!is_null($executionDate)) {
                    $updateData['execution_date'] = $executionDate;
                }
                if (!is_null($leadTimeValue)) {
                    $updateData['lead_time_value'] = $leadTimeValue;
                }
                if (!is_null($leadTimeUnit)) {
                    $updateData['lead_time_unit'] = $leadTimeUnit;
                }


                if (!is_null($costAmount)) $updateData['cost_amount'] = $costAmount;
                if (!empty($handledBy)) {
                    $updateData['handled_by'] = implode(',', $handledBy);
                    $updateData['handled_at'] = now();
                }
            }

            if ($actionType === 'ACKNOWLEDGE' && !is_null($rating)) {
                $updateData['rating'] = $rating;
            }

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
