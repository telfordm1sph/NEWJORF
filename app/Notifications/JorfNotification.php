<?php

namespace App\Notifications;


use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Support\Facades\Log;

class JorfNotification extends Notification implements ShouldBroadcast
{


    public $jorfId;
    public $requestType;
    public $actorName;
    public $details;
    public $requestTypeLabel;
    public $actionRequired;
    public $recipientId;

    public function __construct($jorfId, $requestType, $actorName, $details, $requestTypeLabel = '')
    {
        Log::info('📝 1. NOTIFICATION CONSTRUCTED', [
            'jorf_id' => $jorfId,
            'request_type' => $requestType,
            'actor' => $actorName,
            'request_type_label' => $requestTypeLabel
        ]);

        $this->jorfId = $jorfId;
        $this->requestType = $requestType;
        $this->actorName = $actorName;
        $this->details = $details;
        $this->requestTypeLabel = $requestTypeLabel;
        $this->actionRequired = null;
        $this->recipientId = null;
    }

    public function setActionRequired($action, $recipientId = null)
    {
        Log::info('📌 2. ACTION & RECIPIENT ID SET', [
            'action_required' => $action,
            'recipient_id' => $recipientId,
            'jorf_id' => $this->jorfId
        ]);

        $this->actionRequired = $action;
        $this->recipientId = $recipientId;
        return $this;
    }

    public function via($notifiable)
    {
        Log::info('📡 3. VIA METHOD CALLED', [
            'notifiable_emp_id' => $notifiable->emp_id ?? 'UNKNOWN',
            'recipient_id' => $this->recipientId,
            'jorf_id' => $this->jorfId,
            'action_required' => $this->actionRequired,
            'channels' => ['database', 'broadcast']
        ]);

        return ['database', 'broadcast'];
    }

    private function getMessageAndType()
    {
        $action = $this->actionRequired;

        $message = match ($action) {
            'REVIEW' => "New Jorf {$this->jorfId} created by {$this->actorName}",
            'APPROVE' => "Jorf {$this->jorfId} is approved by {$this->actorName}|| . Please assess.",
            'ONGOING' => "Jorf {$this->jorfId} assigned by {$this->actorName}|| . Please handle it.",
            'DONE' => "Jorf {$this->jorfId} closed by {$this->actorName}|| . Please acknowledge.",
            'ACKNOWLEDGE' => "Jorf {$this->jorfId} acknowledged by {$this->actorName}|| .",
            'CANCEL' => "Jorf {$this->jorfId} canceled by {$this->actorName}|| .",
            'DISAPPROVE' => "Jorf {$this->jorfId} disapproved by {$this->actorName}|| .",
            default => "Jorf {$this->jorfId} updated."
        };

        $type = match ($action) {
            'REVIEW' => 'JORF_CREATED',
            'APPROVE' => 'JORF_APPROVED',
            'ONGOING' => 'JORF_ONGOING',
            'DONE' => 'JORF_DONE',
            'ACKNOWLEDGE' => 'JORF_ACKNOWLEDGED',
            'CANCEL' => 'JORF_CANCELLED',
            'DISAPPROVE' => 'JORF_DISAPPROVED',
            default => 'JORF_UPDATED'
        };

        return [$message, $type];
    }

    public function toBroadcast($notifiable)
    {
        [$message, $type] = $this->getMessageAndType();

        $broadcastData = [
            'id' => uniqid('notif_', true),
            'jorf_id' => $this->jorfId,
            'message' => $message,
            'request_type' => $this->requestTypeLabel,
            'details' => substr($this->details, 0, 100),
            'type' => $type,
            'action_required' => $this->actionRequired,
            'timestamp' => now()->toDateTimeString(),
        ];

        Log::info('📤 4. TO BROADCAST METHOD CALLED', [
            'notifiable_emp_id' => $notifiable->emp_id ?? 'UNKNOWN',
            'recipient_id' => $this->recipientId,
            'jorf_id' => $this->jorfId,
            'action_required' => $this->actionRequired,
            'message_type' => $type,
            'message_payload' => $broadcastData
        ]);

        return new BroadcastMessage($broadcastData);
    }

    public function broadcastOn($notifiable = null)
    {
        Log::info('🎯 5. BROADCAST ON METHOD CALLED - START', [
            'notifiable_exists' => !is_null($notifiable),
            'notifiable_class' => $notifiable ? get_class($notifiable) : 'NULL',
            'notifiable_emp_id' => $notifiable ? ($notifiable->emp_id ?? 'NOT_SET') : 'NULL',
            'stored_recipient_id' => $this->recipientId,
            'jorf_id' => $this->jorfId,
            'action_required' => $this->actionRequired
        ]);

        // Use the stored recipientId first, fallback to notifiable
        $recipientId = $this->recipientId;

        // If recipientId wasn't set via setActionRequired, try to get it from notifiable
        if (!$recipientId && $notifiable) {
            $recipientId = $notifiable->emp_id ?? null;
            Log::info('🔄 Using notifiable emp_id as fallback', [
                'fallback_recipient_id' => $recipientId,
                'jorf_id' => $this->jorfId
            ]);
        }

        Log::info('🎯 5. BROADCAST ON - RECIPIENT DETERMINED', [
            'final_recipient_id' => $recipientId,
            'final_channel' => $recipientId ? 'users.' . $recipientId : 'NO_CHANNEL',
            'jorf_id' => $this->jorfId
        ]);

        if (!$recipientId) {
            Log::error('❌ NO RECIPIENT ID - BROADCAST CANCELLED', [
                'notification_class' => get_class($this),
                'jorf_id' => $this->jorfId,
                'action_required' => $this->actionRequired,
                'notifiable_class' => $notifiable ? get_class($notifiable) : 'NULL',
                'stored_recipient_id' => $this->recipientId
            ]);
            return [];
        }

        $channel = new PrivateChannel('users.' . $recipientId);

        Log::info('✅ 6. BROADCASTING TO CHANNEL - FINAL', [
            'channel' => 'users.' . $recipientId,
            'channel_object' => get_class($channel),
            'jorf_id' => $this->jorfId,
            'recipient_id' => $recipientId,
            'action_required' => $this->actionRequired
        ]);

        return $channel;
    }

    public function broadcastAs()
    {
        $eventName = 'notification.created';

        Log::info('🏷️ 7. BROADCAST AS METHOD CALLED', [
            'event_name' => $eventName,
            'jorf_id' => $this->jorfId,
            'recipient_id' => $this->recipientId,
            'action_required' => $this->actionRequired
        ]);

        return $eventName;
    }

    public function toDatabase($notifiable)
    {
        [$message, $type] = $this->getMessageAndType();

        Log::info('💾 DATABASE NOTIFICATION SAVED', [
            'notifiable_emp_id' => $notifiable->emp_id ?? 'UNKNOWN',
            'jorf_id' => $this->jorfId,
            'action_required' => $this->actionRequired,
            'message_type' => $type
        ]);

        return [
            'jorf_id' => $this->jorfId,
            'message' => $message,
            'request_type' => $this->requestTypeLabel,
            'details' => $this->details,
            'type' => $type,
            'action_required' => $this->actionRequired,
            'created_at' => now()->toDateTimeString(),
        ];
    }
}
