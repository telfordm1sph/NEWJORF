<?php

namespace App\Constants;

class Status
{
    // Status values
    const PENDING = 1;
    const APPROVED = 2;
    const ONGOING = 3;
    const DONE = 4;
    const ACKNOWLEDGED = 5;
    const CANCELLED = 6;
    const DISAPPROVED = 7;

    // Status labels
    const LABELS = [
        self::PENDING => 'Pending',
        self::APPROVED => 'Approved',
        self::ONGOING => 'Ongoing',
        self::DONE => 'Done',
        self::ACKNOWLEDGED => 'Acknowledged',
        self::CANCELLED => 'Cancelled',
        self::DISAPPROVED => 'Disapproved',
    ];

    // Status colors for UI
    const COLORS = [
        self::PENDING      => 'gold',
        self::APPROVED     => 'lime',
        self::ONGOING      => 'blue',
        self::DONE         => 'green',
        self::ACKNOWLEDGED  => 'green',
        self::CANCELLED    => 'volcano',
        self::DISAPPROVED  => 'red',
    ];


    /**
     * Get status label by value
     *
     * @param int $status
     * @return string
     */
    public static function getLabel(int $status): string
    {
        return self::LABELS[$status] ?? 'Unknown';
    }


    public static function getColor(int $status): string
    {
        return self::COLORS[$status] ?? 'default';
    }

    /**
     * Get status value by label
     *
     * @param string $label
     * @return int|null
     */
    public static function getValueByLabel(string $label): ?int
    {
        $flipped = array_flip(self::LABELS);
        return $flipped[$label] ?? null;
    }
}
