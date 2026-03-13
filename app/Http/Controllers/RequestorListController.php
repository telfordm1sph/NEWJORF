<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\RequestorListService;
use Inertia\Inertia;

class RequestorListController extends Controller
{
    protected RequestorListService $requestorListService;

    public function __construct(RequestorListService $requestorListService)
    {
        $this->requestorListService = $requestorListService;
    }
    public function index()
    {
        $requestorList = $this->requestorListService->requestorListTable();
        $requestorOptions = $this->requestorListService->getUserOptions();
        return Inertia::render('Admin/RequestorList', [
            'requestorList' => $requestorList,
            'requestorOptions' => $requestorOptions
        ]);
    }
    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'employid' => 'required|integer',
            'empname' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'prodline' => 'required|string|max:255',
            'station' => 'required|string|max:255',
        ]);

        try {
            $requestType = $this->requestorListService->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'id' => $requestType->id,
                'data' => $requestType
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroy($id)
    {
        try {
            $requestType = $this->requestorListService->findById($id);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $deleted = $this->requestorListService->delete($id);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'User deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }
}
