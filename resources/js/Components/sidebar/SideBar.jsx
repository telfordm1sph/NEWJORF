import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Navigation from "@/Components/sidebar/Navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    ToolCaseIcon,
} from "lucide-react";

export default function Sidebar() {
    const { display_name } = usePage().props;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const formattedAppName = display_name
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    if (!mounted) return null;

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex">
                {/* ── Mobile Hamburger ── */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed z-[60] top-4 left-4 md:hidden h-9 w-9
                    bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
                    border border-orange-200 dark:border-zinc-700
                    text-orange-500 dark:text-amber-400
                    hover:bg-orange-50 dark:hover:bg-zinc-800
                    shadow-md rounded-xl"
                    onClick={() => setIsMobileSidebarOpen(true)}
                >
                    <Menu className="w-4 h-4" />
                </Button>

                {/* ── Mobile Overlay ── */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 dark:bg-black/70 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar ── */}
                <aside
                    className={cn(
                        "fixed md:relative top-0 left-0 z-50 flex flex-col min-h-screen",
                        "transition-all duration-300 ease-in-out",

                        /* Light mode — clean white with warm tint */
                        "bg-white border-r border-orange-100",

                        /* Dark mode — deep zinc */
                        "dark:bg-zinc-900 dark:border-zinc-800",

                        isSidebarOpen ? "w-64" : "w-[68px]",
                        isMobileSidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0",
                    )}
                    style={{ boxShadow: "4px 0 20px 0 rgba(0,0,0,0.05)" }}
                >
                    {/* ── Desktop Collapse Toggle ── */}
                    <button
                        className={cn(
                            "hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10",
                            "w-6 h-6 items-center justify-center rounded-full",
                            "bg-orange-500 text-white border-2 border-white shadow-md",
                            "dark:bg-amber-500 dark:text-zinc-900 dark:border-zinc-900 dark:shadow-amber-500/20",
                            "hover:scale-110 transition-all duration-200",
                        )}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? (
                            <PanelLeftClose className="w-3 h-3" />
                        ) : (
                            <PanelLeftOpen className="w-3 h-3" />
                        )}
                    </button>

                    {/* ── Mobile Close ── */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 md:hidden h-7 w-7
                        text-zinc-400 hover:text-zinc-700 dark:hover:text-white
                        hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    {/* ── Logo ── */}
                    <div
                        className={cn(
                            "flex items-center h-16 border-b",
                            "border-orange-100 dark:border-zinc-800",
                            isSidebarOpen ? "px-4" : "px-0 justify-center",
                        )}
                    >
                        <Link
                            href={route("dashboard")}
                            className={cn(
                                "flex items-center gap-3 min-w-0",
                                !isSidebarOpen && "justify-center",
                            )}
                        >
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
                                    boxShadow:
                                        "0 4px 12px rgba(249,115,22,0.4)",
                                }}
                            >
                                <ToolCaseIcon className="w-4 h-4 text-white" />
                            </div>

                            {isSidebarOpen && (
                                <div className="flex flex-col min-w-0">
                                    <span
                                        className="text-sm font-semibold tracking-tight leading-tight truncate
                                        text-zinc-800 dark:text-zinc-100"
                                    >
                                        {formattedAppName}
                                    </span>
                                    <span
                                        className="text-[10px] font-medium tracking-widest uppercase
                                        text-orange-400 dark:text-amber-500/80"
                                    >
                                        Workspace
                                    </span>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* ── Navigation ── */}
                    <div
                        className="flex-1 overflow-y-auto overflow-x-hidden py-4
                        scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-zinc-700
                        scrollbar-track-transparent"
                    >
                        <Navigation isSidebarOpen={isSidebarOpen} />
                    </div>

                    {/* ── Bottom glow line ── */}
                    <div
                        className="h-px w-full"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(249,115,22,0.25), transparent)",
                        }}
                    />
                </aside>
            </div>
        </TooltipProvider>
    );
}
