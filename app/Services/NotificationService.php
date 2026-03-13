<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use App\Notifications\JorfNotification;
use App\Models\NotificationUser;
use App\Repositories\UserRepository;

class NotificationService
{
    protected UserRoleService $userRoleService;
    protected UserRepository $userRepo;

    public function __construct(UserRoleService $userRoleService, UserRepository $userRepo)
    {
        $this->userRoleService = $userRoleService;
        $this->userRepo = $userRepo;
    }

    /**
     * Notify jorf action dynamically
     * This is the main entry point for all jorf notifications
     */
    public function notifyJorfAction($jorf, string $action, array $actor)
    {
        Log::info("=== NOTIFYING JORF ACTION: {$jorf->jorf_id}, ACTION: {$action} ===");

        try {


            // Determine recipients based on action type
            $recipients = $this->getRecipients($jorf, $actor, $action);

            if (empty($recipients)) {
                Log::info("No recipients for jorf {$jorf->jorf_id}, action {$action}");
                return ['success' => 0, 'failed' => 0, 'total' => 0];
            }

            // Get action required for this action type
            $actionRequired = $this->getActionRequired($action);

            // Create the notification prototype
            $notificationPrototype = new JorfNotification(
                $jorf->jorf_id,
                $jorf->request_type ?? '',
                $actor['name'] ?? '',
                $jorf->details ?? '',
                ucwords($action)
            );

            // Send notifications to all recipients
            return $this->sendNotifications(
                $recipients,
                $notificationPrototype,
                $actionRequired,
                strtoupper($action)
            );
        } catch (\Exception $e) {
            Log::error("Failed to notify jorf action {$jorf->jorf_id}: " . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return ['success' => 0, 'failed' => 0, 'total' => 0, 'error' => $e->getMessage()];
        }
    }

    /**
     * Check if notification should be skipped for Support Service requests
     */
    // private function shouldSkipNotification($jorf, string $action): bool
    // {

    // }

    /**
     * Core method to send notifications to multiple recipients
     * This is reusable for any notification type
     */
    private function sendNotifications($recipients, $notificationPrototype, $actionRequired, $notificationType)
    {
        // Ensure recipients is an array of unique values
        $recipients = array_values(array_unique(array_map(function ($recipient) {
            // Handle both object and string recipients
            return is_object($recipient) ? $recipient->emp_id : $recipient;
        }, $recipients)));

        $success = 0;
        $failed = 0;

        Log::info("=== STARTING NOTIFICATIONS ===", [
            'type' => $notificationType,
            'recipients' => $recipients,
            'total_recipients' => count($recipients),
            'action_required' => $actionRequired
        ]);

        foreach ($recipients as $recipientId) {
            try {
                Log::info("🔔 Processing recipient", [
                    'recipient_id' => $recipientId,
                    'notification_type' => $notificationType
                ]);

                // Get or create notification user
                $user = NotificationUser::firstOrCreate(
                    ['emp_id' => $recipientId],
                    [
                        'emp_name' => $this->getEmployeeName($recipientId),
                        'emp_dept' => $this->getEmployeeDept($recipientId)
                    ]
                );

                // 🔥 CRITICAL: CREATE NEW NOTIFICATION INSTANCE PER RECIPIENT
                // This ensures each recipient gets their own notification with correct recipient_id
                $notification = clone $notificationPrototype;

                // Set recipient-specific data
                $notification->setActionRequired($actionRequired, $recipientId);

                Log::info("🚀 About to send notification", [
                    'recipient_id' => $recipientId,
                    'notification_recipient_id' => $notification->recipientId,
                    'action_required' => $actionRequired,
                    'channel' => 'users.' . $recipientId
                ]);

                // CRITICAL FIX: Use notifyNow() to send immediately without queuing
                $user->notifyNow($notification);

                Log::info("✅ Notification sent successfully", [
                    'user_emp_id' => $recipientId,
                    'channel' => 'users.' . $recipientId
                ]);

                $success++;
            } catch (\Exception $e) {
                Log::error("❌ Failed to notify {$recipientId}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $failed++;
            }
        }

        Log::info("=== NOTIFICATION BATCH COMPLETE ===", [
            'type' => $notificationType,
            'success' => $success,
            'failed' => $failed,
            'total' => count($recipients)
        ]);

        return ['success' => $success, 'failed' => $failed, 'total' => count($recipients)];
    }

    /**
     * Get recipients based on action type
     * This is where the business logic for recipient selection lives
     */
    private function getRecipients($jorf, array $actor, string $action): array
    {
        // dd($jorf, $actor, $action);
        $action = strtoupper($action);
        // Default notification logic for non-Support Service requests
        switch ($action) {
            case 'CREATED':
                // New jorf - notify Department Head of requestor
             $deptHead = $this->userRepo->findDeptHeadOfRequestorById($jorf->employid);

            $recipients = [];
            if ($deptHead) {
                if (!empty($deptHead->approver2)) $recipients[] = $deptHead->approver2;
                if (!empty($deptHead->approver3)) $recipients[] = $deptHead->approver3;
            }
            return $recipients;

 
            case 'APPROVE':
                // Jorf Approved - notify Facilities Coordinator
                $facilitesCoordinators = $this->userRepo->getFacilitiesCoordinator();
                return $facilitesCoordinators ? [$facilitesCoordinators] : [];

            case 'ONGOING':
                // Split handled_by into individual IDs
                $handledByIds = explode(',', $jorf->handled_by);

                // Fetch each user
                $handlers = [];
                foreach ($handledByIds as $id) {
                    $id = trim($id); // remove extra spaces
                    $user = $this->userRepo->findUserById($id);
                    if ($user) {
                        $handlers[] = $user;
                    }
                }

                return $handlers;


            case 'DONE':
                // Jorf DOne - notify requestor
                $requestor = $this->userRepo->findUserById($jorf->employid);
                return $requestor ? [$requestor] : [];

            case 'ACKNOWLEDGE':
                // Get the facilities coordinator
                $facilitiesCoordinator = $this->userRepo->getFacilitiesCoordinator();

                // Split handled_by into individual IDs
                $handledByIds = explode(',', $jorf->handled_by);

                // Fetch each handler
                $handlers = [];
                foreach ($handledByIds as $id) {
                    $id = trim($id); // remove extra spaces
                    $user = $this->userRepo->findUserById($id);
                    if ($user) {
                        $handlers[] = $user;
                    }
                }

                // Merge coordinator and handlers into a single array
                $allUsers = $facilitiesCoordinator
                    ? array_merge([$facilitiesCoordinator], $handlers)
                    : $handlers;

                return $allUsers;

            case 'CANCEL':
            case 'DISAPPROVE':
                // Ticket cancelled - logic depends on who cancelled
                if ($jorf->employid === $actor['emp_id']) {
                    // Requestor cancelled - notify MIS support
                    // return $this->userRepo->getMISSupportUsers();
                } else {
                    // MIS cancelled - notify requestor
                    $requestor = $this->userRepo->findUserById($jorf->employid);
                    return $requestor ? [$requestor] : [];
                }

            default:
                Log::warning("Unknown action type: {$action}");
                return [];
        }
    }

    /**
     * Map action type to action required text
     * This determines what action the recipient should take
     */
    private function getActionRequired(string $action): ?string
    {
        return match (strtoupper($action)) {
            'CREATED' => 'REVIEW',
            'APPROVE' => 'APPROVE',
            'ONGOING' => 'ONGOING',
            'DONE' => 'DONE', 
            'ACKNOWLEDGE' => 'ACKNOWLEDGE',
            'APPROVED' => 'ASSIGN',
            'CANCEL' => 'CANCEL',  
            'DISAPPROVE' => 'DISAPPROVE',
            default => null,
        };
    }

    /**
     * Helper method to get employee name from masterlist
     */
    private function getEmployeeName($empId)
    {
        try {
            $user = $this->userRepo->findUserById($empId);
            return $user ? $user->empname : 'User ' . $empId;
        } catch (\Exception $e) {
            Log::warning("Could not fetch employee name for {$empId}");
            return 'User ' . $empId;
        }
    }

    /**
     * Helper method to get employee department from masterlist
     */
    private function getEmployeeDept($empId)
    {
        try {
            $user = $this->userRepo->findUserById($empId);
            return $user ? ($user->emp_dept ?? 'Unknown') : 'Unknown';
        } catch (\Exception $e) {
            Log::warning("Could not fetch employee department for {$empId}");
            return 'Unknown';
        }
    }
}
