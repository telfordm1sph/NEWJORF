import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils";

const SidebarLink = ({
    href,
    label,
    icon,
    notifications = 0,
    isSidebarOpen,
}) => {
    const { url } = usePage();
    const isActive = url === new URL(href, window.location.origin).pathname;

    return (
        <Link
            href={href}
            title={!isSidebarOpen ? label : ""}
            className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl",
                "text-sm font-medium transition-all duration-200",

                /* Default */
                "text-zinc-400 hover:text-white",

                /* Hover background */
                "hover:bg-zinc-800",

                /* Active */
                isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "border border-transparent",

                !isSidebarOpen && "justify-center px-0 mx-2",
            )}
        >
            {/* Active left accent bar */}
            {isActive && (
                <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-amber-400"
                    style={{ boxShadow: "0 0 8px 1px rgba(251,191,36,0.5)" }}
                />
            )}

            {/* Icon */}
            <span
                className={cn(
                    "flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center transition-colors",
                    isActive
                        ? "text-amber-400"
                        : "text-zinc-500 group-hover:text-zinc-200",
                )}
            >
                {icon}
            </span>

            {/* Label */}
            {isSidebarOpen && <span className="truncate">{label}</span>}

            {/* Notification badge */}
            {notifications > 0 && (
                <span
                    className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none",
                        "bg-red-500/20 text-red-400 border border-red-500/30",
                        isSidebarOpen ? "ml-auto" : "absolute -top-1 -right-1",
                    )}
                >
                    {notifications > 99 ? "99+" : notifications}
                </span>
            )}
        </Link>
    );
};

export default SidebarLink;
