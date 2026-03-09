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

        return Inertia::render('Jorf/Index', [
            'requestType' => $requestType,
        ]);
    }

    public function store(Request $request)
    {
        // dd($request->all());
        $request->validate([
            'entries'                   => 'required|array|min:1',
            'entries.*.request_type'    => 'required|string',
            'entries.*.location'        => 'required|string',
            'entries.*.request_details' => 'required|string',
            'entries.*.attachments'     => 'required|array|min:1',
            'entries.*.attachments.*'   => 'file|max:10240',
            'entries.*.incharge_id'     => 'required|string',
            'entries.*.approver_id'     => 'required|string',
        ]);

        $empData = session('emp_data');

        $this->jorfService->storeBatch($request, $empData);

        return response()->json([
            'message' => 'JORF(s) created successfully.',
        ]);
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
    public function updateAlternate(Request $request)
    {
        dd($request->all());
        $validated = $request->validate([
            'jorf_id' => 'required|string',
            'incharge_id' => 'nullable|string',
            'approver_id' => 'nullable|string',
        ]);

        $empData = session('emp_data');

        $result = $this->jorfService->updateAlternatePersonnel(
            $validated['jorf_id'],
            $validated['incharge_id'],
            $validated['approver_id'],
            $empData
        );

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => 'Alternate personnel updated successfully.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to update alternate personnel.'
        ], 400);
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
        try {
            // dd($request->all());
            // Validate all at once and get validated data
            $validated = $request->validate([
                'jorf_id' => 'required|string',
                'action' => 'required|string|in:APPROVE,DISAPPROVE,ONGOING,DONE,CANCEL,ACKNOWLEDGE,RETURN',
                'classification' => 'nullable|string|in:minor,major,critical',
                'execution_date' => 'nullable|date',
                'lead_time_value' => 'nullable|string',
                'lead_time_unit' => 'nullable|string',
                'remarks' => 'nullable|string',
                'cost_amount' => 'nullable|numeric|min:0',
                'rating' => 'nullable|numeric|min:0|max:5',
                'handled_by' => 'nullable|array',
                'handled_by.*' => 'integer',
            ]);

            // Get emp data from session
            $empData = session('emp_data');

            // Pass all validated data directly to service
            $success = $this->jorfService->jorfAction(
                $validated['jorf_id'],
                $empData['emp_id'],
                $validated
            );

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => "Jorf {$validated['action']} successfully."
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

    /**
     * Helper to decode base64 JSON filters
     */
    protected function decodeFilters(string $encoded): array
    {
        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
