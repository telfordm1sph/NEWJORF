import React from "react";
import {
    Clock,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    CircleCheckBig,
    CheckCheck,
    Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = [
    {
        key: "Pending",
        label: "Pending",
        icon: Clock,
        tw: {
            icon: "text-amber-500",
            ring: "ring-amber-200 dark:ring-amber-800",
            active: "bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700",
            iconBg: "bg-amber-100 dark:bg-amber-900/50",
            count: "text-amber-600 dark:text-amber-400",
            dot: "bg-amber-400",
        },
    },
    {
        key: "Approved",
        label: "Approved",
        icon: ThumbsUp,
        tw: {
            icon: "text-blue-500",
            ring: "ring-blue-200 dark:ring-blue-800",
            active: "bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700",
            iconBg: "bg-blue-100 dark:bg-blue-900/50",
            count: "text-blue-600 dark:text-blue-400",
            dot: "bg-blue-400",
        },
    },
    {
        key: "Ongoing",
        label: "Ongoing",
        icon: RefreshCw,
        tw: {
            icon: "text-orange-500",
            ring: "ring-orange-200 dark:ring-orange-800",
            active: "bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:border-orange-700",
            iconBg: "bg-orange-100 dark:bg-orange-900/50",
            count: "text-orange-600 dark:text-orange-400",
            dot: "bg-orange-400",
        },
    },
    {
        key: "Done",
        label: "Done",
        icon: CircleCheckBig,
        tw: {
            icon: "text-emerald-500",
            ring: "ring-emerald-200 dark:ring-emerald-800",
            active: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
            count: "text-emerald-600 dark:text-emerald-400",
            dot: "bg-emerald-400",
        },
    },
    {
        key: "Acknowledged",
        label: "Acknowledged",
        icon: CheckCheck,
        tw: {
            icon: "text-teal-500",
            ring: "ring-teal-200 dark:ring-teal-800",
            active: "bg-teal-50 border-teal-300 dark:bg-teal-950/40 dark:border-teal-700",
            iconBg: "bg-teal-100 dark:bg-teal-900/50",
            count: "text-teal-600 dark:text-teal-400",
            dot: "bg-teal-400",
        },
    },
    {
        key: "Cancelled",
        label: "Cancelled",
        icon: Ban,
        tw: {
            icon: "text-gray-400",
            ring: "ring-gray-200 dark:ring-gray-700",
            active: "bg-gray-50 border-gray-300 dark:bg-gray-900/40 dark:border-gray-600",
            iconBg: "bg-gray-100 dark:bg-gray-800/60",
            count: "text-gray-500 dark:text-gray-400",
            dot: "bg-gray-400",
        },
    },
    {
        key: "Disapproved",
        label: "Disapproved",
        icon: ThumbsDown,
        tw: {
            icon: "text-red-500",
            ring: "ring-red-200 dark:ring-red-800",
            active: "bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-700",
            iconBg: "bg-red-100 dark:bg-red-900/50",
            count: "text-red-600 dark:text-red-400",
            dot: "bg-red-400",
        },
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatCard({ stats, activeStatus, onStatusChange }) {
    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {STATUS_CONFIG.map((status) => {
                const statusData = stats?.[status.key];
                const count =
                    typeof statusData === "object"
                        ? (statusData?.count ?? 0)
                        : (statusData ?? 0);

                const isActive = activeStatus === status.key;
                const Icon = status.icon;
                const tw = status.tw;

                return (
                    <button
                        key={status.key}
                        type="button"
                        onClick={() => onStatusChange?.(status.key)}
                        className={cn(
                            "group relative flex flex-col gap-3 rounded-xl border p-4 text-left",
                            "transition-all duration-200 ease-out",
                            "hover:shadow-md hover:-translate-y-0.5",
                            isActive
                                ? cn("shadow-sm border-2", tw.active)
                                : "bg-card border-border hover:border-border/80",
                        )}
                    >
                        {/* Active indicator dot */}
                        {isActive && (
                            <span
                                className={cn(
                                    "absolute right-3 top-3 h-1.5 w-1.5 rounded-full",
                                    tw.dot,
                                )}
                            />
                        )}

                        {/* Icon */}
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                isActive
                                    ? tw.iconBg
                                    : "bg-muted group-hover:" + tw.iconBg,
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-4 w-4 transition-colors",
                                    isActive
                                        ? tw.icon
                                        : "text-muted-foreground group-hover:" +
                                              tw.icon.split(" ")[0],
                                )}
                            />
                        </div>

                        {/* Count */}
                        <div>
                            <p
                                className={cn(
                                    "text-2xl font-bold leading-none tabular-nums transition-colors",
                                    isActive ? tw.count : "text-foreground",
                                )}
                            >
                                {count}
                            </p>
                            <p
                                className={cn(
                                    "mt-1 text-[11px] font-medium leading-none transition-colors",
                                    isActive
                                        ? "text-foreground/70"
                                        : "text-muted-foreground",
                                )}
                            >
                                {status.label}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
