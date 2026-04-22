import React, { useMemo, useState, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import dayjs from "dayjs";
import {
    Loader2,
    Clock,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    CircleCheckBig,
    CheckCheck,
    Ban,
    LayoutList,
    Search,
    MoreHorizontal,
    Eye,
    UserPlus,
    XCircle,
} from "lucide-react";

import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

import useJorfTable from "@/Hooks/useJorfTable";
import useJorfDrawer from "@/Hooks/useJorfDrawer";
import JorfDrawer from "@/Components/jorf/JorfDrawer";
import UpdateAlternateDrawer from "@/Components/jorf/UpdateAlternateDrawer";
import TablePagination from "@/Components/TablePagination";
import { COLOR_CLASS_MAP } from "@/Utils/colorClasses";
import { renderValue } from "@/Utils/tableUtils";

const STATUS_CONFIG = [
    {
        key: "all",
        id: "all",
        label: "All Requests",
        icon: LayoutList,
        color: {
            icon: "text-slate-500",
            activeBg: "bg-slate-100 dark:bg-slate-800",
            activeBorder: "border-slate-500",
            activeText: "text-slate-700 dark:text-slate-200",
            pill: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
            pillInactive:
                "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400",
        },
    },
    {
        key: "Pending",
        id: 1,
        label: "Pending",
        icon: Clock,
        color: {
            icon: "text-amber-500",
            activeBg: "bg-amber-50 dark:bg-amber-950/40",
            activeBorder: "border-amber-500",
            activeText: "text-amber-700 dark:text-amber-300",
            pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            pillInactive:
                "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
        },
    },
    {
        key: "Approved",
        id: 2,
        label: "Approved",
        icon: ThumbsUp,
        color: {
            icon: "text-blue-500",
            activeBg: "bg-blue-50 dark:bg-blue-950/40",
            activeBorder: "border-blue-500",
            activeText: "text-blue-700 dark:text-blue-300",
            pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
            pillInactive:
                "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
        },
    },
    {
        key: "Ongoing",
        id: 3,
        label: "Ongoing",
        icon: RefreshCw,
        color: {
            icon: "text-orange-500",
            activeBg: "bg-orange-50 dark:bg-orange-950/40",
            activeBorder: "border-orange-500",
            activeText: "text-orange-700 dark:text-orange-300",
            pill: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
            pillInactive:
                "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
        },
    },
    {
        key: "Done",
        id: 4,
        label: "Done",
        icon: CircleCheckBig,
        color: {
            icon: "text-emerald-500",
            activeBg: "bg-emerald-50 dark:bg-emerald-950/40",
            activeBorder: "border-emerald-500",
            activeText: "text-emerald-700 dark:text-emerald-300",
            pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
            pillInactive:
                "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
        },
    },
    {
        key: "Acknowledged",
        id: 5,
        label: "Acknowledged",
        icon: CheckCheck,
        color: {
            icon: "text-teal-500",
            activeBg: "bg-teal-50 dark:bg-teal-950/40",
            activeBorder: "border-teal-500",
            activeText: "text-teal-700 dark:text-teal-300",
            pill: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
            pillInactive:
                "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
        },
    },
    {
        key: "Cancelled",
        id: 6,
        label: "Cancelled",
        icon: Ban,
        color: {
            icon: "text-gray-400",
            activeBg: "bg-gray-50 dark:bg-gray-900/40",
            activeBorder: "border-gray-400",
            activeText: "text-gray-600 dark:text-gray-400",
            pill: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            pillInactive:
                "bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-500",
        },
    },
    {
        key: "Disapproved",
        id: 7,
        label: "Disapproved",
        icon: ThumbsDown,
        color: {
            icon: "text-red-500",
            activeBg: "bg-red-50 dark:bg-red-950/40",
            activeBorder: "border-red-500",
            activeText: "text-red-700 dark:text-red-300",
            pill: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
            pillInactive:
                "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400",
        },
    },
    {
        key: "Returned",
        id: 8,
        label: "Returned",
        icon: XCircle,
        color: {
            icon: "text-red-500",
            activeBg: "bg-red-50 dark:bg-red-950/40",
            activeBorder: "border-red-500",
            activeText: "text-red-700 dark:text-red-300",
            pill: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
            pillInactive:
                "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400",
        },
    },
];

const StatusBadge = ({ label, color }) => (
    <span
        className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            COLOR_CLASS_MAP[color] ?? COLOR_CLASS_MAP.default,
        )}
    >
        {label}
    </span>
);

// Left Sidebar Component
const StatusSidebar = ({
    statusCounts,
    totalCount,
    activeStatus,
    onStatusChange,
}) => {
    const getCount = (key) => {
        if (key === "all") return totalCount;
        const v = statusCounts[key];
        if (v == null) return 0;
        return typeof v === "object" ? (v?.count ?? 0) : Number(v);
    };

    return (
        <aside className="w-48 shrink-0 flex flex-col py-3 px-2 gap-0.5">
            <p className="px-2 pb-2 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                Status
            </p>
            {STATUS_CONFIG.map((s) => {
                const count = getCount(s.key);
                const isActive = activeStatus === s.id;
                const Icon = s.icon;

                return (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => onStatusChange(s.id)}
                        className={cn(
                            "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                            "border-l-[3px]",
                            isActive
                                ? cn(
                                      s.color.activeBg,
                                      s.color.activeBorder,
                                      s.color.activeText,
                                  )
                                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                    >
                        <Icon
                            className={cn(
                                "h-3.5 w-3.5 shrink-0 transition-colors",
                                isActive
                                    ? s.color.icon
                                    : "opacity-50 group-hover:opacity-80",
                            )}
                        />
                        <span className="flex-1 truncate text-[12.5px] font-medium leading-none">
                            {s.label}
                        </span>
                        <span
                            className={cn(
                                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
                                isActive ? s.color.pill : s.color.pillInactive,
                            )}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </aside>
    );
};

// Main Component
const JorfTable = () => {
    const {
        jorfs,
        pagination,
        statusCounts,
        filters: initialFilters,
        emp_data,
    } = usePage().props;
    console.log(jorfs);

    const {
        loading,
        searchValue,
        statusFilter,
        handleStatusChange,
        handleSearch,
        handlePageChange,
        handlePageSizeChange,
    } = useJorfTable({ initialFilters, pagination });

    const {
        drawerOpen,
        selectedItem,
        attachments,
        availableAction,
        jorfLogs,
        logsLoading,
        logsHasMore,
        openDrawer,
        closeDrawer,
        fetchAttachments,
        fetchJorfLogs,
        handleLoadMoreLogs,
        handleJorfAction,
    } = useJorfDrawer();

    const [alternateDrawerOpen, setAlternateDrawerOpen] = useState(false);
    const [selectedForAlternate, setSelectedForAlternate] = useState(null);

    // Ref for the table container to handle scroll shadows
    const tableContainerRef = useRef(null);
    const [showRightShadow, setShowRightShadow] = useState(false);

    // Check scroll position to show/hide shadow
    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        const checkScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10);
        };

        container.addEventListener("scroll", checkScroll);
        checkScroll(); // Initial check

        return () => container.removeEventListener("scroll", checkScroll);
    }, []);

    // Sum all per-status counts; skip the "All" rollup the server sends
    const totalCount = useMemo(
        () =>
            Object.entries(statusCounts)
                .filter(([label]) => label !== "All")
                .reduce((sum, [, v]) => {
                    const n =
                        typeof v === "object" ? (v?.count ?? 0) : Number(v);
                    return sum + (isNaN(n) ? 0 : n);
                }, 0),
        [statusCounts],
    );

    const activeStatus = statusFilter || "all";
    const activeConfig =
        STATUS_CONFIG.find((s) => s.id === activeStatus) ?? STATUS_CONFIG[0];

    const activeCount = useMemo(() => {
        if (activeStatus === "all") return totalCount;
        const cfg = STATUS_CONFIG.find((s) => s.id === activeStatus);
        const v = cfg ? statusCounts[cfg.key] : null;
        if (v == null) return 0;
        return typeof v === "object" ? (v?.count ?? 0) : Number(v);
    }, [activeStatus, statusCounts, totalCount]);

    const handleViewDetails = async (record) => {
        openDrawer(record);
        await fetchAttachments(record.jorf_id);
        await fetchJorfLogs(record.jorf_id);
    };

    const handleUpdateAlternate = (record) => {
        setSelectedForAlternate(record);
        setAlternateDrawerOpen(true);
    };

    const jorfFieldGroups = [
        {
            title: "General Information",
            column: 2,
            fields: [
                { key: "jorf_id", label: "JORF ID", dataIndex: "jorf_id" },
                { key: "requestor", label: "Requestor", dataIndex: "empname" },
                {
                    key: "department",
                    label: "Department",
                    dataIndex: "department",
                },
                {
                    key: "product_line",
                    label: "Product Line",
                    dataIndex: "prodline",
                },
                { key: "station", label: "Station", dataIndex: "station" },
                {
                    key: "request_type",
                    label: "Request Type",
                    dataIndex: "request_type",
                },
            ],
        },
        {
            title: "Details & Remarks",
            column: 2,
            fields: [
                { key: "details", label: "Details", dataIndex: "details" },
                { key: "remarks", label: "Remarks", dataIndex: "remarks" },
                {
                    key: "classification",
                    label: "Classification",
                    dataIndex: "classification",
                    render: (v) =>
                        v
                            ? v.charAt(0).toUpperCase() + v.slice(1)
                            : "Not Specified",
                },
                {
                    key: "execution_date",
                    label: "Execution Date",
                    dataIndex: "execution_date",
                    render: (v) => (v ? dayjs(v).format("MMM D, YYYY") : "—"),
                },
                {
                    key: "lead_time_value",
                    label: "Lead Time Value",
                    dataIndex: "lead_time_value",
                },
                {
                    key: "lead_time_unit",
                    label: "Lead Time Unit",
                    dataIndex: "lead_time_unit",
                },
                {
                    key: "cost_amount",
                    label: "Cost Amount",
                    dataIndex: "cost_amount",
                    render: (v) =>
                        v == null
                            ? "Not Specified"
                            : `₱ ${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
                },
                { key: "rating", label: "Rating", dataIndex: "rating" },
            ],
        },
        {
            title: "Handling",
            column: 2,
            fields: [
                {
                    key: "handled_by_name",
                    label: "Handled By",
                    dataIndex: "handled_by_name",
                },
                {
                    key: "handled_at",
                    label: "Handled At",
                    dataIndex: "handled_at",
                    render: (v) =>
                        v ? dayjs(v).format("MMM D, YYYY h:mm A") : "—",
                },
            ],
        },
    ];

    // Table column configuration
    const tableFields = [
        {
            key: "jorf_id",
            label: "JORF ID",
            render: (record) => (
                <TableCell className="font-mono font-medium whitespace-nowrap">
                    {record.jorf_id}
                </TableCell>
            ),
        },
        {
            key: "requestor",
            label: "Requestor",
            render: (record) => (
                <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{record.employid}</div>
                    <div className="text-muted-foreground">
                        {record.empname}
                    </div>
                </TableCell>
            ),
        },
        {
            key: "department",
            label: "Department",
            render: (record) => (
                <TableCell className="whitespace-nowrap">
                    {renderValue(record.department)}
                </TableCell>
            ),
        },
        {
            key: "product_line",
            label: "Product Line",
            render: (record) => (
                <TableCell className="whitespace-nowrap">
                    {renderValue(record.prodline)}
                </TableCell>
            ),
        },
        {
            key: "station",
            label: "Station",
            render: (record) => (
                <TableCell className="whitespace-nowrap">
                    {renderValue(record.station)}
                </TableCell>
            ),
        },
        {
            key: "request_type",
            label: "Request Type",
            render: (record) => (
                <TableCell className="whitespace-nowrap">
                    {renderValue(record.request_type)}
                </TableCell>
            ),
        },
        {
            key: "details",
            label: "Details",
            render: (record) => (
                <TableCell className="max-w-[140px] truncate">
                    {renderValue(record.details)}
                </TableCell>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (record) => (
                <TableCell>
                    <StatusBadge
                        label={record.status_label}
                        color={record.status_color}
                    />
                </TableCell>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (record) => (
                <TableCell className="sticky right-0 z-10 bg-background group-hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-center px-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => handleViewDetails(record)}
                                    className="gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    <span>View / Approve</span>
                                </DropdownMenuItem>
                                {emp_data?.emp_id === record.employid && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleUpdateAlternate(record)
                                        }
                                        className="gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        <span>Update Alternate</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TableCell>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="p-6">
                <Card className="overflow-hidden shadow-sm border">
                    <div
                        className="flex"
                        style={{ minHeight: "calc(100vh - 10rem)" }}
                    >
                        {/* Left Sidebar */}
                        <div className="border-r bg-muted/20 dark:bg-muted/10">
                            <StatusSidebar
                                statusCounts={statusCounts}
                                totalCount={totalCount}
                                activeStatus={activeStatus}
                                onStatusChange={handleStatusChange}
                            />
                        </div>

                        {/* Main Panel */}
                        <div className="flex flex-1 flex-col min-w-0">
                            {/* Topbar */}
                            <div className="flex items-center justify-between gap-4 border-b px-4 py-2.5 bg-background/80">
                                <div className="flex items-center gap-2 min-w-0">
                                    <activeConfig.icon
                                        className={cn(
                                            "h-4 w-4 shrink-0",
                                            activeConfig.color.icon,
                                        )}
                                    />
                                    <span className="text-sm font-semibold truncate">
                                        {activeConfig.label}
                                    </span>
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums shrink-0",
                                            activeConfig.color.pill,
                                        )}
                                    >
                                        {activeCount}
                                    </span>
                                </div>
                                <div className="relative w-64 shrink-0">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Search ID, name, dept…"
                                        value={searchValue}
                                        onChange={(e) =>
                                            handleSearch(e.target.value)
                                        }
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Table with fixed header and sticky actions */}
                            <div
                                ref={tableContainerRef}
                                className="relative overflow-auto flex-1"
                            >
                                {loading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>
                                )}

                                {/* Right shadow indicator */}
                                {showRightShadow && (
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent pointer-events-none z-30" />
                                )}

                                <Table className="relative">
                                    <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            {tableFields.map((field, idx) => {
                                                const isLastColumn =
                                                    idx ===
                                                    tableFields.length - 1; // Actions column is last

                                                return (
                                                    <TableHead
                                                        key={field.key}
                                                        className={cn(
                                                            "whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70",
                                                            isLastColumn && [
                                                                "sticky right-0 z-20",
                                                                "bg-background shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]",
                                                                "after:absolute after:left-0 after:top-0 after:bottom-0 after:w-px after:bg-border",
                                                            ],
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                isLastColumn &&
                                                                    "px-4",
                                                            )}
                                                        >
                                                            {field.label}
                                                        </div>
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {jorfs.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={tableFields.length}
                                                    className="h-40 text-center"
                                                >
                                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                        <activeConfig.icon
                                                            className={cn(
                                                                "h-10 w-10 opacity-15",
                                                                activeConfig
                                                                    .color.icon,
                                                            )}
                                                        />
                                                        <p className="text-sm font-medium">
                                                            No{" "}
                                                            {activeConfig.label.toLowerCase()}{" "}
                                                            records
                                                        </p>
                                                        {activeStatus !==
                                                            "all" && (
                                                            <p className="text-xs opacity-60">
                                                                Try switching to
                                                                a different
                                                                status
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            jorfs.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    className="text-xs group"
                                                >
                                                    {tableFields.map((field) =>
                                                        field.render(record),
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Footer / Pagination */}
                            <div className="border-t px-4 py-3 bg-muted/10">
                                <TablePagination
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <JorfDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                item={selectedItem}
                attachments={attachments}
                fieldGroups={jorfFieldGroups}
                title={(item) => `JORF Details: ${item?.jorf_id}`}
                headerBadges={[
                    {
                        key: "status_label",
                        label: "Status",
                        dataIndex: "status_label",
                        render: (value, record) => (
                            <StatusBadge
                                label={value}
                                color={record?.status_color}
                            />
                        ),
                    },
                ]}
                availableAction={availableAction}
                action={handleJorfAction}
                jorfLogs={jorfLogs}
                onLoadMoreLogs={handleLoadMoreLogs}
                logsHasMore={logsHasMore}
                logsLoading={logsLoading}
                systemRoles={emp_data?.system_roles || []}
            />

            <UpdateAlternateDrawer
                open={alternateDrawerOpen}
                onClose={() => {
                    setAlternateDrawerOpen(false);
                    setSelectedForAlternate(null);
                }}
                item={selectedForAlternate}
                currentUserId={emp_data?.emp_id}
            />
        </AuthenticatedLayout>
    );
};

export default JorfTable;
