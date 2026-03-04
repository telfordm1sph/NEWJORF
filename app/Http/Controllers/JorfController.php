<?php

namespace App\Http\Controllers;

use App\Models\JorfAttachments;
use App\Services\JorfService;
use App\Services\UserRoleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JorfController extends Controller
{
    protected JorfService $jorfService;
    protected UserRoleService $userRoleService;

    public function __construct(JorfService $jorfService, UserRoleService $userRoleService)
    {
        $this->jorfService = $jorfService;
        $this->userRoleService = $userRoleService;
    }

    public function index(): Response
    {
        $requestType = $this->jorfService->getRequestType();

        return Inertia::render('Jorf/Form', [
            'requestType' => $requestType,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'request_type' => 'required',
            'request_details' => 'required',
            'attachments.*' => 'file|max:10240',
        ]);

        $empData = session('emp_data');

        $this->jorfService->store($request, $empData);

        return redirect()->back()->with('success', 'JORF created successfully.');
    }

    public function getJorfTable(Request $request)
    {
        $empData = session('emp_data');
        // Decode base64 filters
        $filters = $this->decodeFilters($request->input('f', ''));

        // Validate and set defaults
        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
            'requestType' => $filters['requestType'] ?? '',
        ];
        // dd($empData);
        $result = $this->jorfService->getJorfDataTable($filters, $empData);
        // dd($result);
        return Inertia::render('Jorf/JorfTable', [
            'jorfs' => $result['data'],
            'pagination' => $result['pagination'],
            'statusCounts' => $result['statusCounts'],
            'filters' => $result['filters'],
        ]);
    }
    /**
     * Get attachments for a specific JORF
     */
    public function getAttachments(string $jorfId)
    {
        $attachments = $this->jorfService->getAttachments($jorfId);

        // Convert file_path to public URL
        $attachments = array_map(function ($attachment) {
            return [
                'id' => $attachment['id'],
                'jorf_id' => $attachment['jorf_id'],
                'file_name' => $attachment['file_name'],
                'file_path' => asset('storage/' . $attachment['file_path']), // <-- public URL
                'file_size' => $attachment['file_size'],
                'file_type' => $attachment['file_type'],
                'uploaded_by' => $attachment['uploaded_by'],
                'uploaded_at' => $attachment['uploaded_at'],
            ];
        }, $attachments);

        return response()->json(['attachments' => $attachments]);
    }
    public function logs(string $jorfId, Request $request)
    {
        $page = $request->get('page', 1);
        $logs = $this->jorfService->getJorfLogs($jorfId, 5, $page);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
                'has_more'     => $logs->hasMorePages(),
            ],
        ]);
    }
    public function getJorfActions(string $jorfId)
    {
        try {
            $empData = session('emp_data');


            $actions = $this->jorfService->getAvailableActions($jorfId, $empData);

            return response()->json([
                'success' => true,
                'actions' => $actions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'JORF not found',
            ], 404);
        }
    }
    public function jorfAction(Request $request)
    {
        // dd($request->all());
        $empData = session('emp_data');
        $jorfId = $request->input('jorf_id');
        $remarks = $request->input('remarks');
        $costAmount = $request->input('cost_amount', null);
        $rating = $request->input('rating', null);
        $actionType = strtoupper($request->input('action'));
        $handledBy = $request->input('handled_by', []);

        $request->merge([
            'action' => $actionType
        ]);

        $request->validate([
            'jorf_id' => 'required|string',
            'action' => 'required|string|in:APPROVE,DISAPPROVE,ONGOING,DONE,CANCEL,ACKNOWLEDGE',
            'remarks' => 'nullable|string',
            'cost_amount' => 'nullable|numeric|min:0',
            'rating' => 'nullable|numeric|min:0|max:5',
            'handled_by' => 'nullable|array',
            'handled_by.*' => 'integer',
        ]);

        try {
            $success = $this->jorfService->jorfAction($jorfId, $empData['emp_id'], $actionType, $remarks, $costAmount, $rating, $handledBy);
            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => "Jorf {$actionType} successfully."
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => "Jorf not found."
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update jorf: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Download attachment
     */
    public function downloadAttachment(int $id)
    {
        try {
            $attachment = JorfAttachments::findOrFail($id);

            $filePath = storage_path('app/public/' . $attachment->file_path);

            if (!file_exists($filePath)) {
                abort(404, 'File not found');
            }

            return response()->download($filePath, $attachment->file_name);
        } catch (\Exception $e) {
            abort(404, 'Attachment not found');
        }
    }
    public function getFacilitiesEmployees()
    {
        $employees = $this->userRoleService->getFacilitiesEmployees();

        return response()->json([
            'success' => true,
            'employees' => $employees,
        ]);
    }
    /**
     * Helper to decode base64 JSON filters
     */
    protected function decodeFilters(string $encoded): array
    {
        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
