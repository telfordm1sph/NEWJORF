import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
    CheckCircle2,
    XCircle,
    Ban,
    Loader2,
    Star,
    History,
    X,
    PhilippinePeso,
    FileText,
    Info,
    Wrench,
    CalendarDays,
    Tag,
    AlertTriangle,
    AlertCircle,
    Zap,
    Clock,
} from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { Calendar } from "@/Components/ui/calendar";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { ScrollArea } from "@/Components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { MultiCombobox } from "@/Components/ui/combobox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import JorfLogsModal from "./JorfLogsModal";
import AttachmentsSection from "./AttachmentSection";
import { COLOR_CLASS_MAP } from "@/Utils/colorClasses";

const colorCls = (color) => COLOR_CLASS_MAP[color] ?? COLOR_CLASS_MAP.default;

const ColorBadge = ({ label, color }) => (
    <span
        className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
            colorCls(color),
        )}
    >
        {label}
    </span>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = ({ value, onChange, disabled = false, max = 5 }) => {
    const [hovered, setHovered] = useState(null);
    const display = hovered ?? value ?? 0;

    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: max }).map((_, i) => {
                const fullValue = i + 1;
                const halfValue = i + 0.5;

                // How filled is this star given the current display value
                const isFull = display >= fullValue;
                const isHalf = !isFull && display >= halfValue;

                return (
                    <div
                        key={i}
                        className={cn(
                            "relative h-5 w-5 transition-transform",
                            !disabled && "hover:scale-110",
                        )}
                        onMouseLeave={() => !disabled && setHovered(null)}
                    >
                        {/* Base: empty star */}
                        <Star className="absolute inset-0 h-5 w-5 fill-muted text-muted-foreground/30" />

                        {/* Full fill layer */}
                        {isFull && (
                            <Star className="absolute inset-0 h-5 w-5 fill-amber-400 text-amber-400" />
                        )}

                        {/* Half fill layer — clips the right half via overflow+width */}
                        {isHalf && (
                            <span className="absolute inset-0 w-[50%] overflow-hidden">
                                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                            </span>
                        )}

                        {/* Left half — hover/click = i + 0.5 */}
                        <button
                            type="button"
                            disabled={disabled}
                            className="absolute inset-y-0 left-0 w-[50%] cursor-pointer"
                            onClick={() => onChange?.(halfValue)}
                            onMouseEnter={() =>
                                !disabled && setHovered(halfValue)
                            }
                        />

                        {/* Right half — hover/click = i + 1 */}
                        <button
                            type="button"
                            disabled={disabled}
                            className="absolute inset-y-0 right-0 w-[50%] cursor-pointer"
                            onClick={() => onChange?.(fullValue)}
                            onMouseEnter={() =>
                                !disabled && setHovered(fullValue)
                            }
                        />
                    </div>
                );
            })}

            {value > 0 && (
                <span className="text-xs font-medium text-muted-foreground ml-1 tabular-nums">
                    {value} / {max}
                </span>
            )}
        </div>
    );
};

// ─── Action Config ────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
    APPROVE: {
        label: "Approve",
        icon: CheckCircle2,
        className:
            "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
    },
    DISAPPROVE: {
        label: "Disapprove",
        icon: XCircle,
        className:
            "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200",
    },
    ONGOING: {
        label: "Mark Ongoing",
        icon: CheckCircle2,
        className:
            "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200",
    },
    DONE: {
        label: "Mark Done",
        icon: CheckCircle2,
        className:
            "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
    },
    ACKNOWLEDGE: {
        label: "Acknowledge",
        icon: CheckCircle2,
        className:
            "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
    },
    RETURN: {
        label: "Return",
        icon: XCircle,
        className:
            "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200",
    },
    CANCEL: {
        label: "Cancel",
        icon: Ban,
        className: "bg-gray-700 hover:bg-gray-800 text-white shadow-sm",
    },
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted">
            <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
        </span>
        <div className="flex-1 h-px bg-border" />
    </div>
);

// ─── Field Item ───────────────────────────────────────────────────────────────

const FieldItem = ({ label, children }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {label}
        </p>
        <div className="text-sm text-foreground">{children}</div>
    </div>
);

// ─── Inner Component (only rendered when item is guaranteed non-null) ──────────

const JorfDrawer = ({
    open,
    onClose,
    item,
    fieldGroups,
    attachments = [],
    title,
    headerBadges = [],
    availableAction = [],
    action,
    jorfLogs = [],
    onLoadMoreLogs,
    logsHasMore,
    logsLoading,
    systemRoles = [],
}) => {
    const [remarks, setRemarks] = useState("");
    const [costAmount, setCostAmount] = useState(0);
    const [classification, setClassification] = useState("");
    const [executionDate, setExecutionDate] = useState("");
    const [logsOpen, setLogsOpen] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [employee, setEmployee] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [rating, setRating] = useState(null);
    // ✅ FIX: Track per-action loading state to prevent closing on error
    const [loadingAction, setLoadingAction] = useState(null);
    const [leadTimeValue, setLeadTimeValue] = useState("");
    const [leadTimeUnit, setLeadTimeUnit] = useState("hours");

    useEffect(() => {
        if (item) {
            if (item.handled_by) {
                setEmployee(item.handled_by.split(",").map((id) => id.trim()));
            } else {
                setEmployee([]);
            }
            setRemarks("");
            setCostAmount(item.cost_amount || 0);
            setClassification(item.classification || "");
            setExecutionDate(
                item.execution_date
                    ? dayjs(item.execution_date).format("YYYY-MM-DD")
                    : "",
            );
            setLeadTimeValue(item.lead_time_value || "");
            setLeadTimeUnit(item.lead_time_unit || "hours");
            setRating(item.rating || null);
        } else {
            setEmployee([]);
            setRemarks("");
            setCostAmount(0);
            setClassification("");
            setExecutionDate("");
            setLeadTimeValue("");
            setLeadTimeUnit("hours");
            setRating(null);
        }
    }, [item]);

    const fetchFacilitiesEmployees = async () => {
        if (employees.length > 0) return;
        setEmployeesLoading(true);
        try {
            const res = await axios.get(route("jorf.facilities.employees"));
            setEmployees(res.data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        } finally {
            setEmployeesLoading(false);
        }
    };

    useEffect(() => {
        if (open && systemRoles.includes("Facilities_Coordinator")) {
            fetchFacilitiesEmployees();
        }
    }, [open]);

    const availableActions = Array.isArray(availableAction)
        ? availableAction
        : Array.isArray(availableAction?.availableActions)
          ? availableAction.availableActions
          : [];

    const actionableActions = availableActions.filter(
        (a) => a.toUpperCase() !== "VIEW",
    );
    const showRemarksField = actionableActions.length > 0;
    const showFacilitiesFields =
        systemRoles.includes("Facilities_Coordinator") &&
        ["2", "3", "8"].includes(String(item?.status));

    const getValue = (obj, dataIndex) => {
        if (!obj) return undefined;
        if (Array.isArray(dataIndex))
            return dataIndex.reduce((acc, key) => acc?.[key], obj);
        return obj[dataIndex];
    };

    const renderFieldValue = (field, value) => {
        if (field.render) return field.render(value, item);
        if (field.key === "rating") {
            return value != null ? (
                <StarRating value={value} disabled />
            ) : (
                <span className="text-xs text-muted-foreground italic">
                    Not yet rated
                </span>
            );
        }
        if (value === null || value === undefined) {
            return (
                <span className="text-xs text-muted-foreground italic">
                    Not specified
                </span>
            );
        }
        return <span>{value}</span>;
    };

    // ✅ FIX: handleAction awaits the result and only calls onClose on success.
    //         The `action` prop must return a Promise that resolves on success
    //         and rejects (or returns a falsy value) on error.
    const handleAction = async (key) => {
        if (loadingAction) return; // prevent double-click
        setLoadingAction(key);
        try {
            const result = await action?.({
                action: key,
                item,
                remarks,
                costAmount,
                rating,
                handledBy: employee,
                classification,
                executionDate: executionDate
                    ? dayjs(executionDate).format("YYYY-MM-DD")
                    : executionDate,
                leadTimeValue,
                leadTimeUnit,
            });
            // Only close if the action succeeded (resolved without throwing)
            onClose?.();
        } catch (err) {
            // Action failed — drawer stays open so the user can retry
            console.error("Action failed:", err);
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
                <SheetContent
                    side="right"
                    className="!max-w-[900px] w-full p-0 flex flex-col gap-0"
                    showCloseButton={false}
                >
                    {item && (
                        <>
                            {/* ── Header ── */}
                            <SheetHeader className="shrink-0 border-b bg-muted/20">
                                {/* Top bar: title + close + logs */}
                                <div className="flex items-center justify-between gap-3 px-5 py-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {/* Status badge(s) */}
                                        {headerBadges.map((field) => (
                                            <div key={field.key}>
                                                {field.render ? (
                                                    field.render(
                                                        item[field.dataIndex],
                                                        item,
                                                    )
                                                ) : (
                                                    <ColorBadge
                                                        label={
                                                            item[
                                                                field.dataIndex
                                                            ] || "N/A"
                                                        }
                                                        color="default"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <SheetTitle className="text-sm font-semibold font-mono truncate text-foreground/90">
                                            {typeof title === "function"
                                                ? title(item)
                                                : title}
                                        </SheetTitle>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {jorfLogs.length > 0 && (
                                            <Button
                                                size="sm"
                                                className="h-8 gap-1.5 text-xs over:text-foreground"
                                                onClick={() =>
                                                    setLogsOpen(true)
                                                }
                                            >
                                                <History className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">
                                                    History
                                                </span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={onClose}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Meta strip */}
                                <div className="flex items-center gap-4 px-5 pb-3 text-xs text-muted-foreground">
                                    {item.empname && (
                                        <span className="flex items-center gap-1">
                                            <span className="font-medium text-foreground/70">
                                                {item.empname}
                                            </span>
                                        </span>
                                    )}
                                    {item.department && (
                                        <>
                                            <span className="text-border">
                                                ·
                                            </span>
                                            <span>{item.department}</span>
                                        </>
                                    )}
                                    {item.created_at && (
                                        <>
                                            <span className="text-border">
                                                ·
                                            </span>
                                            <span>
                                                {dayjs(item.created_at).format(
                                                    "MMM D, YYYY",
                                                )}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </SheetHeader>

                            {/* ── Body ── */}
                            <ScrollArea className="flex-1">
                                <div className="px-5 py-5 space-y-6">
                                    {/* Field Groups */}
                                    {fieldGroups.map((group, groupIndex) => (
                                        <div key={groupIndex}>
                                            {group.title && (
                                                <SectionHeader
                                                    icon={Info}
                                                    title={group.title}
                                                />
                                            )}
                                            <div
                                                className={cn(
                                                    "grid gap-x-6 gap-y-4",
                                                    group.column === 2
                                                        ? "grid-cols-2"
                                                        : "grid-cols-1",
                                                )}
                                            >
                                                {group.fields.map((field) => (
                                                    <FieldItem
                                                        key={field.key}
                                                        label={field.label}
                                                    >
                                                        {renderFieldValue(
                                                            field,
                                                            getValue(
                                                                item,
                                                                field.dataIndex,
                                                            ),
                                                        )}
                                                    </FieldItem>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Attachments */}
                                    {attachments.length > 0 && (
                                        <AttachmentsSection
                                            attachments={attachments}
                                        />
                                    )}

                                    {/* Rating */}
                                    {availableActions.includes(
                                        "ACKNOWLEDGE",
                                    ) && (
                                        <div>
                                            <SectionHeader
                                                icon={Star}
                                                title="Rate your experience"
                                            />
                                            <StarRating
                                                value={rating}
                                                onChange={setRating}
                                            />
                                        </div>
                                    )}

                                    {/* Facilities fields */}
                                    {showFacilitiesFields && (
                                        <div>
                                            <SectionHeader
                                                icon={Wrench}
                                                title="Facilities"
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Row 1: Classification | Execution Date */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                        <Tag className="h-2.5 w-2.5" />
                                                        Classification
                                                    </label>
                                                    <Select
                                                        value={classification}
                                                        onValueChange={
                                                            setClassification
                                                        }
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Select…" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="minor">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                                                                    <span>
                                                                        Minor
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="major">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                                    <span>
                                                                        Major
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="critical">
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="h-3.5 w-3.5 text-red-500" />
                                                                    <span>
                                                                        Critical
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {classification && (
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                                                classification ===
                                                                    "minor" &&
                                                                    "bg-blue-50 text-blue-700 border-blue-200",
                                                                classification ===
                                                                    "major" &&
                                                                    "bg-amber-50 text-amber-700 border-amber-200",
                                                                classification ===
                                                                    "critical" &&
                                                                    "bg-red-50 text-red-700 border-red-200",
                                                            )}
                                                        >
                                                            {classification ===
                                                                "minor" && (
                                                                <AlertCircle className="h-2.5 w-2.5" />
                                                            )}
                                                            {classification ===
                                                                "major" && (
                                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                            )}
                                                            {classification ===
                                                                "critical" && (
                                                                <Zap className="h-2.5 w-2.5" />
                                                            )}
                                                            {classification
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                classification.slice(
                                                                    1,
                                                                )}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                        <CalendarDays className="h-2.5 w-2.5" />
                                                        Execution Date
                                                    </label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal h-9",
                                                                    !executionDate &&
                                                                        "text-muted-foreground",
                                                                )}
                                                            >
                                                                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                                                                {executionDate ? (
                                                                    format(
                                                                        new Date(
                                                                            executionDate,
                                                                        ),
                                                                        "PPP",
                                                                    )
                                                                ) : (
                                                                    <span>
                                                                        Pick a
                                                                        date
                                                                    </span>
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={
                                                                    executionDate
                                                                        ? new Date(
                                                                              executionDate,
                                                                          )
                                                                        : undefined
                                                                }
                                                                onSelect={(
                                                                    date,
                                                                ) => {
                                                                    if (date) {
                                                                        setExecutionDate(
                                                                            format(
                                                                                date,
                                                                                "yyyy-MM-dd",
                                                                            ),
                                                                        );
                                                                    } else {
                                                                        setExecutionDate(
                                                                            "",
                                                                        );
                                                                    }
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                {/* Row 2: Lead Time | Cost Amount */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        Lead Time
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={1}
                                                            className="h-9 text-sm"
                                                            placeholder="0"
                                                            value={
                                                                leadTimeValue
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;
                                                                if (
                                                                    val ===
                                                                        "" ||
                                                                    parseFloat(
                                                                        val,
                                                                    ) >= 0
                                                                ) {
                                                                    setLeadTimeValue(
                                                                        val,
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <Select
                                                            value={leadTimeUnit}
                                                            onValueChange={
                                                                setLeadTimeUnit
                                                            }
                                                        >
                                                            <SelectTrigger className="h-9 w-[110px] text-sm shrink-0">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {/* <SelectItem value="minutes">
                                                                    Minutes
                                                                </SelectItem>
                                                                <SelectItem value="hours">
                                                                    Hours
                                                                </SelectItem> */}
                                                                <SelectItem value="days">
                                                                    Days
                                                                </SelectItem>
                                                                <SelectItem value="weeks">
                                                                    Weeks
                                                                </SelectItem>
                                                                <SelectItem value="months">
                                                                    Months
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {leadTimeValue && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {leadTimeValue}{" "}
                                                            {leadTimeUnit}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                        <PhilippinePeso className="h-2.5 w-2.5" />
                                                        Cost Amount
                                                    </label>
                                                    <div className="relative">
                                                        <PhilippinePeso className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={100}
                                                            className="pl-8 h-9 text-sm"
                                                            placeholder="0.00"
                                                            value={costAmount}
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target
                                                                        .value;
                                                                if (
                                                                    value ===
                                                                        "" ||
                                                                    parseFloat(
                                                                        value,
                                                                    ) >= 0
                                                                ) {
                                                                    setCostAmount(
                                                                        value,
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 3: Handler(s) — full width */}
                                                <div className="col-span-2 space-y-1.5">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                        Handler(s)
                                                        {employeesLoading && (
                                                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                        )}
                                                    </label>
                                                    <MultiCombobox
                                                        options={employees.map(
                                                            (emp) => ({
                                                                label: `${emp.emp_id} — ${emp.empname}`,
                                                                value: emp.emp_id,
                                                            }),
                                                        )}
                                                        value={employee}
                                                        onChange={setEmployee}
                                                        placeholder={
                                                            employeesLoading
                                                                ? "Loading…"
                                                                : "Select employees…"
                                                        }
                                                        loading={
                                                            employeesLoading
                                                        }
                                                        disabled={
                                                            employeesLoading
                                                        }
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Remarks */}
                                    {showRemarksField && (
                                        <div>
                                            <SectionHeader
                                                icon={FileText}
                                                title="Remarks"
                                            />
                                            <Textarea
                                                rows={3}
                                                placeholder="Add a remark before taking action…"
                                                value={remarks}
                                                onChange={(e) =>
                                                    setRemarks(e.target.value)
                                                }
                                                className="resize-none text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* ── Footer ── */}
                            {actionableActions.length > 0 && (
                                <div className="shrink-0 border-t bg-muted/10 px-5 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-muted-foreground hidden sm:block">
                                            {actionableActions.length} action
                                            {actionableActions.length > 1
                                                ? "s"
                                                : ""}{" "}
                                            available
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap ml-auto">
                                            {actionableActions.map((a) => {
                                                const key = a.toUpperCase();
                                                const cfg = ACTION_CONFIG[key];
                                                const Icon = cfg?.icon;
                                                const isLoading =
                                                    loadingAction === key;

                                                return (
                                                    <Button
                                                        key={key}
                                                        size="sm"
                                                        disabled={
                                                            !!loadingAction
                                                        }
                                                        className={cn(
                                                            "gap-1.5 h-8 text-xs font-medium",
                                                            cfg?.className,
                                                        )}
                                                        // ✅ FIX: call handleAction instead of
                                                        //         calling action + onClose directly
                                                        onClick={() =>
                                                            handleAction(key)
                                                        }
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            Icon && (
                                                                <Icon className="h-3.5 w-3.5" />
                                                            )
                                                        )}
                                                        {cfg?.label ??
                                                            a.replace(
                                                                /_/g,
                                                                " ",
                                                            )}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <JorfLogsModal
                open={logsOpen}
                onClose={() => setLogsOpen(false)}
                logs={jorfLogs}
                onLoadMore={onLoadMoreLogs}
                hasMore={logsHasMore}
                loading={logsLoading}
            />
        </>
    );
};

export default JorfDrawer;
