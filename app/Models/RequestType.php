<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestType extends Model
{
    use HasFactory;

    protected $table = 'type_of_request';

    public $timestamps = false;

    protected $fillable = [
        'request_name',
        'is_active',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];
}
