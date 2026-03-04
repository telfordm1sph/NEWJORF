<?php

namespace App\Repositories;

use App\Constants\Status;
use App\Models\Jorf;
use App\Models\JorfAttachments;
use App\Models\JorfLogs;
use App\Models\RequestType;
use App\Models\User;
use App\Services\JorfStatusService;
use Illuminate\Pagination\LengthAwarePaginator;

class JorfRepository
{
    public function query()
    {
        return Jorf::query();
    }

    public function getRequestType()
    {
        return RequestType::all();
    }

    public function createJorf(array $data)
    {
        return Jorf::create($data);
    }

    public function createAttachment(array $data)
    {
        return JorfAttachments::create($data);
    }

    public function generateJorfNumber(): string
    {
        $year = date('Y');
        $prefix = "JORF-{$year}-";

        $lastJorf = Jorf::where('jorf_id', 'like', "{$prefix}%")
            ->orderBy('jorf_id', 'desc')
            ->first();

        $newNumber = $lastJorf ? ((int) substr($lastJorf->jorf_id, -3)) + 1 : 1;

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
    public function getAllJorfs()
    {
        return Jorf::all()->map(function ($jorf) {
            return [
                'id'           => $jorf->id,
                'employid'     => $jorf->employid,
                'empname'      => $jorf->empname,
                'jorf_id'      => $jorf->jorf_id,
                'request_type' => $jorf->request_type,
                'details'      => $jorf->details,
                'status'       => $jorf->status,
                'status_label' => Status::getLabel($jorf->status),
                'status_color' => Status::getColor($jorf->status),
            ];
        });
    }

    public function getStatusCounts(): array
    {
        // Get counts grouped by status
        $statusCounts = Jorf::groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();

        $result = [];

        // Total of all statuses
        $total = array_sum($statusCounts);

        // Add "All" first
        $result['All'] = [
            'count' => $total,
            'color' => 'default', // or any color you want
        ];

        // Add each status based on labels
        foreach (Status::LABELS as $value => $label) {
            $result[$label] = [
                'count' => $statusCounts[$value] ?? 0,
                'color' => Status::COLORS[$value] ?? 'default',
            ];
        }

        return $result;
    }
    public function getStatusCountsFromQuery($query): array
    {
        $statusCounts = $query->clone()
            ->groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();

        $result = [];
        $total = array_sum($statusCounts);

        $result['All'] = [
            'count' => $total,
            'color' => 'default',
        ];

        foreach (Status::LABELS as $value => $label) {
            $result[$label] = [
                'count' => $statusCounts[$value] ?? 0,
                'color' => Status::COLORS[$value] ?? 'default',
            ];
        }

        return $result;
    }

    public function getJorfWithAttachments(int $id)
    {
        return Jorf::with(['attachments' => function ($query) {
            $query
                ->orderBy('uploaded_at', 'desc');
        }])->findOrFail($id);
    }

    public function getAttachmentsByJorfId(string $jorfId)
    {
        return JorfAttachments::where('jorf_id', $jorfId)

            ->orderBy('uploaded_at', 'desc')
            ->get();
    }

    public function getJorfById(string $jorfId)
    {
        return Jorf::where('jorf_id', $jorfId)->firstOrFail();
    }
    public function getJorfLogs(string $jorf_id, int $perPage = 5): LengthAwarePaginator
    {
        $logs = JorfLogs::with('actor')
            ->where('loggable_type', Jorf::class)
            ->where('loggable_id', $jorf_id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $userFields = ['employid'];
        $statusFields = ['status']; // numeric or string status fields

        // Collect EMPLOYIDs from old_values and new_values
        $empIds = [];
        foreach ($logs->items() as $log) {
            $oldValues = $log->old_values ?? [];
            $newValues = $log->new_values ?? [];
            foreach ($userFields as $field) {
                if (!empty($oldValues[$field])) $empIds[] = $oldValues[$field];
                if (!empty($newValues[$field])) $empIds[] = $newValues[$field];
            }
        }

        $users = User::whereIn('EMPLOYID', array_unique($empIds))
            ->pluck('EMPNAME', 'EMPLOYID')
            ->toArray();

        $logs->getCollection()->transform(function ($log) use ($users, $userFields, $statusFields) {
            $oldValues = $log->old_values ?? [];
            $newValues = $log->new_values ?? [];
            $metadata  = $log->metadata ?? [];

            // Map EMPLOYID to names
            foreach ($userFields as $field) {
                if (!empty($oldValues[$field]) && isset($users[$oldValues[$field]])) {
                    $oldValues[$field] = $users[$oldValues[$field]];
                }
                if (!empty($newValues[$field]) && isset($users[$newValues[$field]])) {
                    $newValues[$field] = $users[$newValues[$field]];
                }
            }

            // Map status to label + color
            foreach ($statusFields as $field) {
                // Old status
                if (isset($oldValues[$field])) {
                    $oldStatusId = is_numeric($oldValues[$field])
                        ? (int) $oldValues[$field]
                        : JorfStatusService::getStatusIdByLabel($oldValues[$field]);

                    $oldValues[$field] = [
                        'label' => JorfStatusService::getStatusLabelById($oldStatusId),
                        'color' => JorfStatusService::getStatusColorById($oldStatusId),
                    ];
                }

                // New status
                if (isset($newValues[$field])) {
                    $newStatusId = is_numeric($newValues[$field])
                        ? (int) $newValues[$field]
                        : JorfStatusService::getStatusIdByLabel($newValues[$field]);

                    $newValues[$field] = [
                        'label' => JorfStatusService::getStatusLabelById($newStatusId),
                        'color' => JorfStatusService::getStatusColorById($newStatusId),
                    ];
                }
            }

            return [
                'ID'          => $log->id,
                'ACTION_TYPE' => $log->action_type,
                'ACTION_BY'   => $log->actor->empname ?? 'N/A',
                'ACTION_AT'   => $log->action_at,
                'OLD_VALUES'  => $oldValues,
                'NEW_VALUES'  => $newValues,
                'REMARKS'     => $log->remarks,
                'METADATA'    => $metadata,
            ];
        });

        return $logs;
    }

    public function updateJorf(Jorf $jorf, array $data): bool
    {
        return $jorf->update($data);
    }
}
