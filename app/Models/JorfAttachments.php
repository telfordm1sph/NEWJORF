<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JorfAttachments extends Model
{
    // use SoftDeletes;

    protected $table = 'jorf_attachments';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $dates = ['uploaded_at'];

    protected $fillable = [
        'jorf_id',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'uploaded_by',
        'uploaded_at',
    ];
    public function jorf()
    {
        return $this->belongsTo(Jorf::class);
    }
}
