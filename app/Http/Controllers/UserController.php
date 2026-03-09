<?php

namespace App\Http\Controllers;

use App\Services\UserRoleService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected UserRoleService $userRoleService;

    public function __construct(UserRoleService $userRoleService)
    {
        $this->userRoleService = $userRoleService;
    }
    public function getLocationList()
    {
        $locationList = $this->userRoleService->getLocationList();
        return response()->json($locationList);
    }
    public function getFacilitiesEmployees()
    {
        $employees = $this->userRoleService->getFacilitiesEmployees();

        return response()->json([
            'success' => true,
            'employees' => $employees,
        ]);
    }
    public function getAvailableApproversAndRequestors(Request $request)
    {
        $empId = $request->query('emp_id');
        $employees = $this->userRoleService->getAvailableApproversAndRequestors($empId);

        return response()->json([
            'success' => true,
            'employees' => $employees,
        ]);
    }
}
