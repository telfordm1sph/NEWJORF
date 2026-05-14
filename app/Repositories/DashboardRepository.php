<?php

namespace App\Repositories;

use App\Constants\Status;
use App\Models\Jorf;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardRepository
{
    public function query()
    {
        return Jorf::query();
    }

    public function getStatusCounts(): array
    {
        $statusCounts = Jorf::groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();

        $result = [];
        $total = array_sum($statusCounts);
        $result['All'] = $total;

        foreach (Status::LABELS as $value => $label) {
            $result[$label] = $statusCounts[$value] ?? 0;
        }

        return $result;
    }

    public function getMonthlyTrends(int $months = 6): array
    {
        $data = Jorf::select(
            DB::raw('MONTH(created_at) as month'),
            DB::raw('YEAR(created_at) as year'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', now()->subMonths($months))
        ->groupBy('year', 'month')
        ->orderBy('year')
        ->orderBy('month')
        ->get();

        $result = [];
        foreach ($data as $row) {
            $key = date('M Y', mktime(0, 0, 0, $row->month, 1, $row->year));
            $result[$key] = $row->count;
        }

        return $result;
    }

    public function getRequestTypeCounts(): array
    {
        $data = Jorf::groupBy('request_type')
            ->selectRaw('request_type, COUNT(*) as count')
            ->pluck('count', 'request_type')
            ->toArray();

        return $data;
    }

    public function getDepartmentCounts(): array
    {
        $data = Jorf::groupBy('department')
            ->selectRaw('department, COUNT(*) as count')
            ->pluck('count', 'department')
            ->toArray();

        return $data;
    }

    public function getStatusByRequestType(): array
    {
        $data = Jorf::select('request_type', 'status', DB::raw('COUNT(*) as count'))
            ->groupBy('request_type', 'status')
            ->get();

        $result = [];
        foreach ($data as $row) {
            $result[$row->request_type][$row->status] = $row->count;
        }

        return $result;
    }

    public function getRecentJorfs(int $limit = 5): array
    {
        $jorfs = Jorf::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $empIds = $jorfs->pluck('employid')->unique()->toArray();
        $users = User::whereIn('EMPLOYID', $empIds)->pluck('EMPNAME', 'EMPLOYID')->toArray();

        return $jorfs->map(function ($jorf) use ($users) {
            return [
                'id' => $jorf->id,
                'jorf_id' => $jorf->jorf_id,
                'employid' => $jorf->employid,
                'empname' => $users[$jorf->employid] ?? $jorf->empname,
                'department' => $jorf->department,
                'request_type' => $jorf->request_type,
                'status' => $jorf->status,
                'status_label' => Status::getLabel($jorf->status),
                'created_at' => $jorf->created_at,
            ];
        })->toArray();
    }

    public function getAverageCompletionTime(): ?float
    {
        $result = Jorf::whereIn('status', [4, 5])
            ->whereNotNull('handled_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, handled_at)) as avg_hours')
            ->first();

        return $result->avg_hours ? round($result->avg_hours, 1) : null;
    }
}
