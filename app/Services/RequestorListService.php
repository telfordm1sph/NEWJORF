<?php

namespace App\Services;

use App\Repositories\RequestorListRepository;

class RequestorListService
{
    protected RequestorListRepository $requestorListRepository;

    public function __construct(RequestorListRepository $requestorListRepository)
    {
        $this->requestorListRepository = $requestorListRepository;
    }
    public function requestorListTable()
    {
        return $this->requestorListRepository->requestorListTable();
    }
    public function getUserOptions()
    {
        return $this->requestorListRepository->getUserOptions();
    }
    public function create(array $data)
    {
        return $this->requestorListRepository->create($data);
    }
    public function findById(int $id)
    {
        return $this->requestorListRepository->findById($id);
    }
    public function delete(int $id): bool
    {
        return $this->requestorListRepository->delete($id);
    }
}
