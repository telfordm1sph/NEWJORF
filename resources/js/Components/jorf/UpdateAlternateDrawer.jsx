import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
    X,
    Loader2,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Save,
} from "lucide-react";
import { toast } from "sonner";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Separator } from "@/Components/ui/separator";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils";
import EmployeePicker from "./EmployeePicker";
import { COLOR_CLASS_MAP } from "@/Utils/colorClasses";

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

const UpdateAlternateDrawer = ({ open, onClose, item, currentUserId }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    const [inchargeId, setInchargeId] = useState(null);
    const [approverId, setApproverId] = useState(null);

    const [showAltIncharge, setShowAltIncharge] = useState(false);
    const [showAltApprover, setShowAltApprover] = useState(false);

    // Check conditions based on status
    const canUpdateApprover = item?.status == 1; // Pending (not yet approved)
    const canUpdateIncharge =
        item?.status != 4 &&
        item?.status != 5 &&
        item?.status != 6 &&
        item?.status != 7; // Not Done (4 = Done)
    // requestor means the one who created the JORF
    const isRequestor = currentUserId && item?.employid === currentUserId;

    useEffect(() => {
        if (open && item) {
            // Reset states when opening with new item
            setInchargeId(null);
            setApproverId(null);
            setShowAltIncharge(false);
            setShowAltApprover(false);

            // Fetch employees if needed
            fetchAllEmployees();
        }
    }, [open, item]);

    const fetchAllEmployees = async () => {
        if (employees.length > 0) return;

        setEmployeesLoading(true);
        try {
            const res = await axios.get(
                route("users.available-approvers-requestors"),
                {
                    params: { emp_id: currentUserId },
                },
            );
            setEmployees(res.data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        } finally {
            setEmployeesLoading(false);
        }
    };

    const handleSave = async () => {
        if (!inchargeId && !approverId) {
            toast.error("Please set at least one alternate personnel");
            return;
        }

        setSaving(true);
        try {
            const res = await axios.post(route("jorf.update.alternate"), {
                jorf_id: item.jorf_id,
                incharge_id: inchargeId,
                approver_id: approverId,
            });

            if (res.data.success) {
                toast.success(res.data.message);
                // Close drawer after successful save
                setTimeout(() => {
                    onClose();
                    // Optionally refresh the page or update local data
                    window.location.reload();
                }, 1000);
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            console.error("Error updating alternate personnel:", err);
            toast.error("Failed to update alternate personnel");
        } finally {
            setSaving(false);
        }
    };

    if (!item) return null;

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="!max-w-[500px] w-full p-0 flex flex-col gap-0"
                showCloseButton={false}
            >
                {/* Header */}
                <SheetHeader className="shrink-0 border-b bg-muted/20">
                    <div className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <UserPlus className="h-4 w-4 text-primary" />
                            </div>
                            <SheetTitle className="text-sm font-semibold truncate text-foreground/90">
                                Update Alternate Personnel
                            </SheetTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* JORF Info */}
                    <div className="px-5 pb-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium bg-muted px-2 py-1 rounded">
                                {item.jorf_id}
                            </span>
                            <StatusBadge
                                label={item.status_label}
                                color={item.status_color}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {item.empname}
                            </span>
                            {" • "}
                            {item.department}
                            {" • "}
                            {dayjs(item.created_at).format("MMM D, YYYY")}
                        </div>
                    </div>
                </SheetHeader>

                {/* Body */}
                <ScrollArea className="flex-1">
                    <div className="px-5 py-5 space-y-6">
                        {/* Current Values */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Current Assignment
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Incharge
                                    </p>
                                    <p className="text-xs">
                                        {item.incharge_name ? (
                                            `${item.incharge_id} - ${item.incharge_name}`
                                        ) : (
                                            <span className="text-muted-foreground italic">
                                                Not assigned
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Approver
                                    </p>
                                    <p className="text-xs">
                                        {item.approver_name ? (
                                            `${item.approver_id} - ${item.approver_name}`
                                        ) : (
                                            <span className="text-muted-foreground italic">
                                                Not assigned
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Update Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    Set Alternates
                                </h4>
                                {(canUpdateApprover || canUpdateIncharge) && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        {canUpdateApprover && canUpdateIncharge
                                            ? "Both available"
                                            : canUpdateApprover
                                              ? "Approver only"
                                              : "Incharge only"}
                                    </Badge>
                                )}
                            </div>

                            {!isRequestor ? (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p className="text-xs">
                                        Only requestors can update alternate
                                        personnel.
                                    </p>
                                </div>
                            ) : employeesLoading ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading employees…
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Alternate Incharge */}
                                    {canUpdateIncharge && (
                                        <div className="space-y-2">
                                            {!showAltIncharge ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowAltIncharge(true)
                                                    }
                                                    className="flex w-full items-center gap-2 text-xs font-medium rounded-lg border border-dashed
                                                        px-3 py-2 text-muted-foreground hover:text-primary hover:border-primary/40
                                                        hover:bg-primary/5 transition-all duration-150"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Set alternate incharge
                                                </button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-medium">
                                                            Alternate Incharge
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAltIncharge(
                                                                    false,
                                                                );
                                                                setInchargeId(
                                                                    null,
                                                                );
                                                            }}
                                                            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <EmployeePicker
                                                        label={null}
                                                        employees={employees}
                                                        value={inchargeId}
                                                        onChange={setInchargeId}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Alternate Approver */}
                                    {canUpdateApprover && (
                                        <div className="space-y-2">
                                            {!showAltApprover ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowAltApprover(true)
                                                    }
                                                    className="flex w-full items-center gap-2 text-xs font-medium rounded-lg border border-dashed
                                                        px-3 py-2 text-muted-foreground hover:text-primary hover:border-primary/40
                                                        hover:bg-primary/5 transition-all duration-150"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Set alternate approver
                                                </button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-medium">
                                                            Alternate Approver
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAltApprover(
                                                                    false,
                                                                );
                                                                setApproverId(
                                                                    null,
                                                                );
                                                            }}
                                                            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <EmployeePicker
                                                        label={null}
                                                        employees={employees}
                                                        value={approverId}
                                                        onChange={setApproverId}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!canUpdateApprover &&
                                        !canUpdateIncharge && (
                                            <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <p className="text-xs">
                                                    No updates allowed for this
                                                    status.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                {(canUpdateApprover || canUpdateIncharge) && isRequestor && (
                    <div className="shrink-0 border-t bg-muted/10 px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={
                                    saving || (!inchargeId && !approverId)
                                }
                                className="gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default UpdateAlternateDrawer;
