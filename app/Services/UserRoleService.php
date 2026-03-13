<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Http;

class UserRoleService
{
    protected string $baseUrl;
    protected string $token;
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
        $this->baseUrl = config('services.inventory.url');
        $this->token   = config('services.inventory.token');
    }
    protected function get(string $endpoint, array $params = [])
    {
        // If filters exist, append as path param
        if (!empty($params)) {
            $encoded = base64_encode(json_encode($params));
            $endpoint = rtrim($endpoint, '/') . '/' . $encoded;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get("{$this->baseUrl}/{$endpoint}");

        if ($response->failed()) {
            return [
                'success' => false,
                'status' => $response->status(),
                'body' => $response->body(),
            ];
        }

        return $response->json();
    }
    public function getLocationList()
    {
        return $this->get('emp/loc-list');
    }
    /**
     * Check if employee is a Department Head (has approval rights in masterlist)
     */
    public function isDepartmentHead(string $userId): bool
    {
        return $this->userRepository->isDepartmentHead($userId);
    }
    public function getRole(string $userId): ?string
    {
        if ($this->userRepository->isDepartmentHead($userId)) {
            return 'DEPARTMENT_HEAD';
        }

        return null;
    }
    public function getFacilitiesEmployees(): array
    {
        return $this->userRepository->getFacilitiesEmployees();
    }
    public function getAvailableApproversAndRequestors(?string $empId): array
    {
        $excludedIds = [];

        if ($empId) {
            $excludedIds[] = $empId;

            $approvers = $this->userRepository->getApproversById($empId);

            if ($approvers) {
                $excludedIds = array_merge($excludedIds, array_filter([
                    $approvers->APPROVER1,
                    $approvers->APPROVER2,
                    $approvers->APPROVER3,
                ]));
            }
        }

        return $this->userRepository->getAvailableApproversAndRequestors($excludedIds);
    }
}
