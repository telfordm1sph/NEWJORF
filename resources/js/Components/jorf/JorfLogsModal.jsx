import React from "react";
import dayjs from "dayjs";
import {
    History,
    Loader2,
    User,
    Clock,
    ArrowRight,
    ChevronDown,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
import { ScrollArea } from "@/Components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";
import { COLOR_CLASS_MAP, DOT_COLOR_MAP } from "@/Utils/colorClasses";

const colorCls = (color) => COLOR_CLASS_MAP[color] ?? COLOR_CLASS_MAP.default;
const dotCls = (color) => DOT_COLOR_MAP[color] ?? DOT_COLOR_MAP.default;

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

const formatValue = (value) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const d = dayjs(value);
        if (d.isValid()) {
            const hasTime =
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ||
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value);
            return d.format(hasTime ? "MMM DD, YYYY hh:mm A" : "MMM DD, YYYY");
        }
    }
    return String(value);
};
// ─── Log Entry ────────────────────────────────────────────────────────────────

const LogEntry = ({ log, isLast }) => {
    const dotColor = dotCls(log.NEW_STATUS_COLOR || "blue");

    return (
        <div className="relative flex gap-4">
            {/* Timeline spine + dot */}
            <div className="flex flex-col items-center">
                <div
                    className={cn(
                        "mt-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background shrink-0",
                        dotColor,
                    )}
                />
                {!isLast && <div className="mt-1 w-px flex-1 bg-border/60" />}
            </div>

            {/* Content */}
            <div className={cn("pb-6 min-w-0 flex-1", isLast && "pb-2")}>
                {/* Top row: action badge + actor + time */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <ColorBadge
                        label={log.ACTION_TYPE}
                        color={log.NEW_STATUS_COLOR || "blue"}
                    />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="font-medium text-foreground/80">
                            {log.ACTION_BY}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Clock className="h-3 w-3 shrink-0" />
                        {log.ACTION_AT
                            ? dayjs(log.ACTION_AT).format(
                                  "MMM D, YYYY · h:mm A",
                              )
                            : "—"}
                    </div>
                </div>

                {/* Status transition */}
                <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-muted/40 border border-border/50 w-fit">
                    <ColorBadge
                        label={log.OLD_STATUS_LABEL || "—"}
                        color={log.OLD_STATUS_COLOR || "gray"}
                    />
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    <ColorBadge
                        label={log.NEW_STATUS_LABEL || "—"}
                        color={log.NEW_STATUS_COLOR || "blue"}
                    />
                </div>

                {/* Changed values */}
                {log.NEW_VALUES && Object.keys(log.NEW_VALUES).length > 0 && (
                    <div className="rounded-lg border border-border/60 overflow-hidden mb-2">
                        <div className="px-3 py-1.5 bg-muted/30 border-b border-border/40">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Changes
                            </span>
                        </div>
                        <div className="divide-y divide-border/40">
                            {Object.entries(log.NEW_VALUES).map(
                                ([key, value]) => {
                                    if (
                                        key === "status" &&
                                        typeof value === "object"
                                    )
                                        return null;
                                    const oldVal = log.OLD_VALUES?.[key];
                                    return (
                                        <div
                                            key={key}
                                            className="flex items-start gap-3 px-3 py-2"
                                        >
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                                                {key}
                                            </code>
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                {oldVal !== undefined && (
                                                    <>
                                                        <span className="text-xs text-muted-foreground line-through truncate max-w-[120px]">
                                                            {formatValue(
                                                                oldVal,
                                                            )}
                                                        </span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                                    </>
                                                )}
                                                <span className="text-xs text-foreground font-medium truncate max-w-[160px]">
                                                    {formatValue(value)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                )}

                {/* Remarks */}
                {log.REMARKS && (
                    <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                            Remarks
                        </span>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                            {log.REMARKS}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

const JorfLogsModal = ({
    open,
    onClose,
    logs = [],
    onLoadMore,
    hasMore,
    loading,
}) => {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
                    <DialogTitle className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                            <History className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold leading-none">
                                Activity Log
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {logs.length}{" "}
                                {logs.length === 1 ? "entry" : "entries"}
                                {hasMore ? "+" : ""}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Log list — flex-1 + min-h-0 ensures ScrollArea gets a bounded height */}
                <ScrollArea className="flex-1 min-h-0 px-6 py-5">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <History className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                No activity yet
                            </p>
                        </div>
                    ) : (
                        <div>
                            {logs.map((log, i) => (
                                <LogEntry
                                    key={log.ID}
                                    log={log}
                                    isLast={i === logs.length - 1 && !hasMore}
                                />
                            ))}
                        </div>
                    )}

                    {hasMore && (
                        <div className="flex justify-center pt-2 pb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onLoadMore}
                                disabled={loading}
                                className="gap-2 text-xs h-8"
                            >
                                {loading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                {loading ? "Loading…" : "Load more"}
                            </Button>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default JorfLogsModal;
