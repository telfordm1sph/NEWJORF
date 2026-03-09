import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";

const encodeParams = (params) => {
    const filtered = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== "" && v !== null),
    );
    return { f: btoa(JSON.stringify(filtered)) };
};

export default function useJorfTable({ initialFilters, pagination }) {
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState(
        initialFilters?.search || "",
    );
    const [statusFilter, setStatusFilter] = useState(
        initialFilters?.status || "all",
    );
    const [filters, setFilters] = useState(initialFilters || {});

    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        setSearchValue(filters?.search || "");
        setStatusFilter(filters?.status || "all");
    }, [filters?.search, filters?.status]);

    const fetchTableData = (params) => {
        setLoading(true);
        router.get(route("jorf.table"), encodeParams(params), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    const buildParams = (overrides = {}) => ({
        page: pagination?.current || 1,
        pageSize: pagination?.perPage || pagination?.pageSize || 10,
        search: filters?.search || "",
        status: statusFilter,
        sortField: filters?.sortField || "created_at",
        sortOrder: filters?.sortOrder || "desc",
        ...overrides,
    });

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        fetchTableData(buildParams({ page: 1, status: value }));
    };

    // Kept for backwards compat (Ant Table onChange)
    const handleTableChange = (paginationData, _, sorter) => {
        fetchTableData(
            buildParams({
                page: paginationData.current,
                pageSize: paginationData.pageSize,
                sortField: sorter?.field || "created_at",
                sortOrder: sorter?.order === "ascend" ? "asc" : "desc",
            }),
        );
    };

    // Shadcn pagination
    const handlePageChange = (page) => {
        fetchTableData(buildParams({ page }));
    };

    const handlePageSizeChange = (pageSize) => {
        fetchTableData(buildParams({ page: 1, pageSize }));
    };

    const handleSearch = (value) => {
        setSearchValue(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchTableData(buildParams({ page: 1, search: value }));
        }, 500);
    };

    return {
        loading,
        searchValue,
        statusFilter,
        filters,
        setFilters,
        handleStatusChange,
        handleTableChange,
        handlePageChange,
        handlePageSizeChange,
        handleSearch,
    };
}
