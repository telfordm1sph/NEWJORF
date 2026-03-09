import React, { useState, useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/Components/ui/Combobox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Send,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    AlertCircle,
} from "lucide-react";
import FileUpload from "./FileUpload";
import EmployeePicker from "./EmployeePicker";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_ENTRY = {
    request_type: undefined,
    location: "",
    request_details: "",
    attachments: [],
    incharge_id: "",
    approver_id: "",
};

const getEntryStatus = (entry) => {
    if (!entry) return "empty";
    const filled =
        entry.request_type &&
        entry.location &&
        entry.request_details &&
        entry.attachments?.length > 0;
    // entry.incharge_id &&
    // entry.approver_id;
    const partial =
        entry.request_type ||
        entry.location ||
        entry.request_details ||
        entry.attachments?.length > 0 ||
        entry.incharge_id ||
        entry.approver_id;
    if (filled) return "complete";
    if (partial) return "partial";
    return "empty";
};

// ─── Entry Sidebar Item ───────────────────────────────────────────────────────

const EntrySidebarItem = ({
    index,
    entry,
    isActive,
    onClick,
    onRemove,
    canRemove,
}) => {
    const status = getEntryStatus(entry);

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-xl px-3.5 py-3 transition-all duration-150 group",
                "border",
                isActive
                    ? "bg-primary/10 border-primary/30 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-muted/60 hover:border-border",
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 shrink-0">
                        {status === "complete" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : status === "partial" ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                    </span>
                    <div className="min-w-0">
                        <p
                            className={cn(
                                "text-xs font-semibold",
                                isActive ? "text-primary" : "text-foreground",
                            )}
                        >
                            Entry #{index + 1}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {entry?.request_type ?? "No type selected"}
                        </p>
                    </div>
                </div>

                {canRemove && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.stopPropagation(), onRemove())
                        }
                        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 rounded-md p-0.5
                            text-muted-foreground hover:text-destructive hover:bg-destructive/10
                            transition-all duration-150"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </span>
                )}
            </div>
        </button>
    );
};

// ─── Active Entry Form ────────────────────────────────────────────────────────

const EntryForm = ({
    index,
    control,
    watch,
    setValue,
    requestType,
    locationLists,
    locationsLoading,
    employees,
    employeesLoading,
}) => {
    const [showAltIncharge, setShowAltIncharge] = useState(false);
    const [showAltApprover, setShowAltApprover] = useState(false);
    const watchedDetails = watch(`entries.${index}.request_details`);
    const inchargeValue = watch(`entries.${index}.incharge_id`);
    const approverValue = watch(`entries.${index}.approver_id`);

    return (
        <div className="space-y-5">
            {/* Request Type + Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                    control={control}
                    name={`entries.${index}.request_type`}
                    rules={{ required: "Please select request type" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Request Type</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={requestType.map((req) => ({
                                        value: req.request_name,
                                        label: req.request_name,
                                    }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a request type…"
                                    allowCustomValue={false}
                                    className="h-9"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={`entries.${index}.location`}
                    rules={{ required: "Please select a location" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Location
                                {locationsLoading && (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                )}
                            </FormLabel>
                            <FormControl>
                                <Combobox
                                    options={locationLists}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={
                                        locationsLoading
                                            ? "Loading locations…"
                                            : "Select a location…"
                                    }
                                    allowCustomValue={false}
                                    className="h-9"
                                    disabled={locationsLoading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Attachments */}
            <FormField
                control={control}
                name={`entries.${index}.attachments`}
                rules={{
                    validate: (v) =>
                        v.length > 0 || "Please upload at least one file",
                }}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Attachments</FormLabel>
                        <FormControl>
                            <FileUpload
                                value={field.value}
                                onChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Request Details */}
            <FormField
                control={control}
                name={`entries.${index}.request_details`}
                rules={{
                    required: "Please enter request details",
                    maxLength: {
                        value: 500,
                        message: "Maximum 500 characters",
                    },
                }}
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel>Request Details</FormLabel>
                            <span
                                className={cn(
                                    "text-xs tabular-nums",
                                    (watchedDetails?.length ?? 0) >= 450
                                        ? "text-destructive"
                                        : "text-muted-foreground",
                                )}
                            >
                                {watchedDetails?.length ?? 0} / 500
                            </span>
                        </div>
                        <FormControl>
                            <Textarea
                                {...field}
                                rows={4}
                                placeholder="Describe your request in detail…"
                                maxLength={500}
                                className="resize-none"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Alternate Incharge / Approver (optional) */}
            {employeesLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading employees…
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {/* Alternate Incharge */}
                    <div className="space-y-2">
                        {!showAltIncharge ? (
                            <button
                                type="button"
                                onClick={() => setShowAltIncharge(true)}
                                className="flex w-full items-center gap-2 text-xs font-medium rounded-lg border border-dashed
                        px-3 py-2 text-muted-foreground hover:text-primary hover:border-primary/40
                        hover:bg-primary/5 transition-all duration-150"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Set alternate incharge
                            </button>
                        ) : (
                            <FormField
                                control={control}
                                name={`entries.${index}.incharge_id`}
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>
                                                Alternate Incharge
                                            </FormLabel>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAltIncharge(false);
                                                    setValue(
                                                        `entries.${index}.incharge_id`,
                                                        undefined,
                                                    );
                                                }}
                                                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <FormControl>
                                            <EmployeePicker
                                                label={null}
                                                employees={employees}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    {/* Alternate Approver */}
                    <div className="space-y-2">
                        {!showAltApprover ? (
                            <button
                                type="button"
                                onClick={() => setShowAltApprover(true)}
                                className="flex w-full items-center gap-2 text-xs font-medium rounded-lg border border-dashed
                        px-3 py-2 text-muted-foreground hover:text-primary hover:border-primary/40
                        hover:bg-primary/5 transition-all duration-150"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Set alternate approver
                            </button>
                        ) : (
                            <FormField
                                control={control}
                                name={`entries.${index}.approver_id`}
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>
                                                Alternate Approver
                                            </FormLabel>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAltApprover(false);
                                                    setValue(
                                                        `entries.${index}.approver_id`,
                                                        undefined,
                                                    );
                                                }}
                                                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <FormControl>
                                            <EmployeePicker
                                                label={null}
                                                employees={employees}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Form ────────────────────────────────────────────────────────────────

const JorfForm = ({ emp_data, form, requestType, submitting, onSubmit }) => {
    const { control, watch, setValue } = form;
    const [activeIndex, setActiveIndex] = useState(0);

    const [locationLists, setLocationLists] = useState([]);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(true);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "entries",
    });
    const allEntries = watch("entries");

    useEffect(() => {
        const fetchLocationLists = async () => {
            try {
                const res = await axios.get(route("locations.list"));
                const locations = res.data.locations;
                setLocationLists(
                    locations.map((loc) => ({
                        label: loc.location_name,
                        value: loc.location_name,
                    })),
                );
            } catch (err) {
                console.error("Error fetching locations:", err);
            } finally {
                setLocationsLoading(false);
            }
        };

        const fetchEmployees = async () => {
            try {
                const res = await axios.get(
                    route("users.available-approvers-requestors"),
                    {
                        params: { emp_id: emp_data?.emp_id },
                    },
                );
                setEmployees(res.data.employees || []);
            } catch (err) {
                console.error("Error fetching employees:", err);
            } finally {
                setEmployeesLoading(false);
            }
        };

        fetchLocationLists();
        fetchEmployees();
    }, []);

    const handleRemove = (index) => {
        remove(index);
        if (activeIndex >= index && activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const handleAdd = () => {
        append(EMPTY_ENTRY);
        setActiveIndex(fields.length);
    };

    const completedCount =
        allEntries?.filter((e) => getEntryStatus(e) === "complete").length ?? 0;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex gap-5">
                    {/* ── Left: Entry List ── */}
                    <div className="flex w-52 shrink-0 flex-col gap-1.5">
                        <div className="mb-1 flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Entries
                            </span>
                            <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                            >
                                {completedCount}/{fields.length}
                            </Badge>
                        </div>

                        {fields.map((field, index) => (
                            <EntrySidebarItem
                                key={field.id}
                                index={index}
                                entry={allEntries?.[index]}
                                isActive={activeIndex === index}
                                onClick={() => setActiveIndex(index)}
                                onRemove={() => handleRemove(index)}
                                canRemove={fields.length > 1}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={handleAdd}
                            className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed
                                px-3.5 py-2.5 text-xs font-medium text-muted-foreground
                                hover:border-primary/40 hover:text-primary hover:bg-primary/5
                                transition-all duration-150"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add entry
                        </button>
                    </div>

                    {/* ── Divider ── */}
                    <div className="w-px bg-border shrink-0" />

                    {/* ── Right: Active Entry Form ── */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-5 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                                {activeIndex + 1}
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                                Entry #{activeIndex + 1}
                            </span>
                            {getEntryStatus(allEntries?.[activeIndex]) ===
                                "complete" && (
                                <Badge className="ml-1 gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800 text-[10px]">
                                    <CheckCircle2 className="h-3 w-3" />{" "}
                                    Complete
                                </Badge>
                            )}
                        </div>

                        <EntryForm
                            index={activeIndex}
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            requestType={requestType}
                            locationLists={locationLists}
                            locationsLoading={locationsLoading}
                            employees={employees}
                            employeesLoading={employeesLoading}
                        />
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {completedCount}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-foreground">
                            {fields.length}
                        </span>{" "}
                        {fields.length === 1 ? "entry" : "entries"} complete
                    </p>

                    <Button
                        type="submit"
                        size="lg"
                        className="min-w-40 gap-2"
                        disabled={
                            submitting || locationsLoading || employeesLoading
                        }
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Submit{" "}
                                {fields.length > 1
                                    ? `${fields.length} JORFs`
                                    : "JORF"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default JorfForm;
