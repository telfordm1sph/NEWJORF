<?php

namespace App\Services;

use App\Models\Jorf;
use Carbon\Carbon;

class JorfStatusService
{
    public const STATUS_LABELS = [
        1 => 'Pending',
        2 => 'Approved',
        3 => 'Ongoing',
        4 => 'Done',
        5 => 'Acknowledged',
        6 => 'Canceled',
        7 => 'Disapproved',
        8 => 'Returned',

    ];

    public const STATUS_COLORS = [
        1 => 'blue',
        2 => 'blue',
        3 => 'cyan',
        4 => 'green',
        5 => 'green',
        6 => 'volcano',
        7 => 'red',
        8 => 'red',


    ];

    // Existing methods for Jorf object
    public static function getStatusLabel(Jorf $jorf): string
    {

        return self::STATUS_LABELS[$jorf->status] ?? '-';
    }

    public static function getStatusColor(Jorf $jorf): string
    {
        return self::STATUS_COLORS[$jorf->status] ?? 'default';
    }

    // New helper methods for numeric status IDs (used in remarks)
    public static function getStatusLabelById(?int $statusId): string
    {
        return self::STATUS_LABELS[$statusId] ?? '-';
    }

    public static function getStatusColorById(?int $statusId): string
    {
        return self::STATUS_COLORS[$statusId] ?? 'default';
    }
    public static function getStatusIdByLabel(?string $label): ?int
    {
        if (!$label) return null;
        $flipped = array_flip(self::STATUS_LABELS);
        return $flipped[$label] ?? null;
    }
}
