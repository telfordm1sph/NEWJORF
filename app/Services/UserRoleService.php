<?php

namespace App\Services;

use App\Repositories\UserRepository;

class UserRoleService
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
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
}
