<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jorf extends Model
{
    use HasFactory;
    use Loggable;
    protected $table = 'jorf_table';
    protected $primaryKey = 'id';
    public string|null $currentAction = null;

    protected $fillable = [
        'jorf_id',
        'employid',
        'empname',
        'department',
        'prodline',
        'station',
        'request_type',
        'details',
        'remarks',
        'status',
        'cost_amount',
        'rating',
        'handled_by',
        'handled_at',
    ];

    protected $casts = [
        'handled_at' => 'datetime',
        'cost_amount' => 'double',
    ];
    public function attachments()
    {
        return $this->hasMany(JorfAttachments::class, 'jorf_id');
    }
}
