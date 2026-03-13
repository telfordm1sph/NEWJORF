<?php

namespace App\Repositories;

use App\Models\RequestType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class RequestTypeRepository
{
    /**
     * Get all request types grouped by category (excluding Support Services)
     */
    public function getAllGrouped(): array
    {
        return RequestType::where('is_active', 1)
            ->where('request_name', '!=', 'Support Services')
            ->orderBy('request_name')
            ->get()
            ->groupBy(function ($item) {
                // Assuming category is part of request_name, otherwise adjust
                return explode('-', $item->request_name)[0];
            })
            ->toArray();
    }

    /**
     * Get all request types as flat array for table display
     */
    public function getAllForTable()
    {
        return RequestType::orderBy('id', 'desc')->get();
    }



    /**
     * Get request types with their options for form display
     */
    public function getRequestTypesForForm($userRoles): array
    {
        // Example: filter by user roles if needed
        $query = RequestType::where('is_active', 1);

        if (!in_array('admin', $userRoles)) {
            $query->where('request_name', '!=', 'Admin Only Request');
        }

        return $query->orderBy('request_name')->get()->toArray();
    }

    /**
     * Create a new request type
     */
    public function create(array $data): object
    {
        return RequestType::create($data);
    }

    /**
     * Update an existing request type
     */
    public function update(int $id, array $data): ?object
    {
        $requestType = RequestType::find($id);
        if (!$requestType) return null;

        $requestType->update($data);
        return $requestType;
    }

    /**
     * Delete a request type
     */
    public function delete(int $id): bool
    {
        $requestType = RequestType::find($id);
        if (!$requestType) return false;

        return $requestType->delete();
    }

    /**
     * Find request type by ID
     */
    public function findById(int $id): ?object
    {
        return RequestType::find($id);
    }
}
