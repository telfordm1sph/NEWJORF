<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class RequestorListRepository
{
    public function requestorListTable()
    {
        return DB::table('additional_users')
            ->select('id', 'employid', 'empname', 'department', 'prodline', 'station', 'created_at', 'updated_at')
            ->orderBy('id')
            ->get();
    }
    public function getUserOptions(): Collection
    {
        return User::getUserOptions();
    }
    public function create(array $data): object
    {
        $id = DB::table('additional_users')->insertGetId([
            'employid' => $data['employid'],
            'empname' => $data['empname'],
            'department' => $data['department'],
            'prodline' => $data['prodline'],
            'station' => $data['station'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->findById($id);
    }
    public function findById(int $id): ?object
    {
        return DB::table('additional_users')
            ->where('id', $id)
            ->first();
    }
    public function delete(int $id): bool
    {
        return DB::table('additional_users')
            ->where('id', $id)
            ->delete() > 0;
    }
}
