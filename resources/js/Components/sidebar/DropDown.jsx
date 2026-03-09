import { useState, useEffect, useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dropdown({
    label,
    icon = null,
    links = [],
    notification = null,
    isSidebarOpen = false,
}) {
    const { url } = usePage();

    const normalizePath = (href) => {
        try {
            return new URL(href, window.location.origin).pathname;
        } catch {
            return href;
        }
    };

    const isActiveLink = (href) => url === normalizePath(href);

    const hasActiveChild = useMemo(
        () => links.some((link) => isActiveLink(link.href)),
        [url, links],
    );

    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(isSidebarOpen && hasActiveChild);
    }, [isSidebarOpen, hasActiveChild]);

    const parentActive = hasActiveChild;

    return (
        <div className="relative w-full">
            {/* Parent button */}
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "relative flex items-center justify-between w-full px-3 py-2.5 mx-2 rounded-xl",
                    "text-sm font-medium transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    parentActive
                        ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                        : "border border-transparent",
                    !isSidebarOpen && "justify-center px-0",
                )}
                style={{
                    width: isSidebarOpen ? "calc(100% - 1rem)" : undefined,
                }}
            >
                {/* Active left accent bar */}
                {parentActive && (
                    <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
                        style={{
                            boxShadow: "0 0 8px 1px hsl(var(--primary) / 0.5)",
                        }}
                    />
                )}

                <div className="flex items-center gap-3">
                    {icon && (
                        <span
                            className={cn(
                                "flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center transition-colors",
                                parentActive
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-foreground",
                            )}
                        >
                            {icon}
                        </span>
                    )}
                    {isSidebarOpen && <span className="truncate">{label}</span>}
                </div>

                {isSidebarOpen && (
                    <div className="flex items-center gap-2">
                        {notification && typeof notification === "number" && (
                            <span className="bg-destructive/20 text-destructive border border-destructive/30 text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none">
                                {notification > 99 ? "99+" : notification}
                            </span>
                        )}
                        <span className="text-muted-foreground">
                            {open ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </span>
                    </div>
                )}
            </button>

            {/* Child links */}
            {isSidebarOpen && open && (
                <div className="relative mt-1 space-y-1 pl-4 mx-2">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-border rounded" />

                    {links.map((link, idx) => {
                        const active = isActiveLink(link.href);
                        return (
                            <Link
                                key={idx}
                                href={link.href}
                                className={cn(
                                    "relative flex items-center w-full pl-6 pr-4 py-2 rounded-xl",
                                    "text-xs font-medium transition-all duration-200",
                                    active
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                )}
                            >
                                {/* Dot indicator */}
                                <span
                                    className={cn(
                                        "absolute left-[3px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors duration-200",
                                        active
                                            ? "bg-primary border-primary"
                                            : "bg-muted border-muted-foreground/40",
                                    )}
                                />

                                {link.icon && (
                                    <span className="mr-2">{link.icon}</span>
                                )}
                                <span className="truncate">{link.label}</span>
                                {link.notification &&
                                    typeof link.notification === "number" && (
                                        <span className="ml-auto bg-destructive/20 text-destructive border border-destructive/30 text-[10px] px-1.5 py-0.5 rounded-md font-semibold leading-none">
                                            {link.notification > 99
                                                ? "99+"
                                                : link.notification}
                                        </span>
                                    )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
