<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdditionalUser extends Model
{
    use HasFactory;

    protected $table = 'additional_users';

    public $timestamps = false;

    protected $fillable = [
        'employid',
        'empname',
        'department',
        'prodline',
        'station',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];
}
