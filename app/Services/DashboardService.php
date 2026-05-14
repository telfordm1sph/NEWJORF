<?php

namespace App\Services;

use App\Repositories\DashboardRepository;

class DashboardService
{
    protected DashboardRepository $dashboardRepository;

    public function __construct(DashboardRepository $dashboardRepository)
    {
        $this->dashboardRepository = $dashboardRepository;
    }

    public function getDashboardData(): array
    {
        $statusCounts = $this->dashboardRepository->getStatusCounts();
        $monthlyTrends = $this->dashboardRepository->getMonthlyTrends(6);
        $requestTypeCounts = $this->dashboardRepository->getRequestTypeCounts();
        $departmentCounts = $this->dashboardRepository->getDepartmentCounts();
        $recentJorfs = $this->dashboardRepository->getRecentJorfs(5);
        $avgCompletionTime = $this->dashboardRepository->getAverageCompletionTime();

        return [
            'statusCounts' => $statusCounts,
            'monthlyTrends' => $monthlyTrends,
            'requestTypeCounts' => $requestTypeCounts,
            'departmentCounts' => $departmentCounts,
            'recentJorfs' => $recentJorfs,
            'avgCompletionTime' => $avgCompletionTime,
            'totalJorfs' => $statusCounts['All'] ?? 0,
        ];
    }
}
