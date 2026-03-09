import React, { useState, useEffect } from "react";
import {
    Paperclip,
    X,
    Download,
    ZoomIn,
    FileText,
    File,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── File Icon Helper ─────────────────────────────────────────────────────────

const getFileIcon = (fileType = "", fileName = "") => {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    if (fileType.startsWith("image/"))
        return { Icon: Paperclip, bg: "bg-blue-50", color: "text-blue-500" };
    if (fileType.includes("pdf") || ext === "pdf")
        return { Icon: File, bg: "bg-red-50", color: "text-red-500" };
    if (
        ["xls", "xlsx", "csv"].includes(ext) ||
        fileType.includes("spreadsheet") ||
        fileType.includes("excel")
    )
        return {
            Icon: FileText,
            bg: "bg-emerald-50",
            color: "text-emerald-500",
        };
    if (["doc", "docx"].includes(ext) || fileType.includes("word"))
        return { Icon: FileText, bg: "bg-blue-50", color: "text-blue-500" };
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
        return { Icon: File, bg: "bg-amber-50", color: "text-amber-500" };
    return { Icon: File, bg: "bg-muted", color: "text-muted-foreground" };
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

// ─── Component ────────────────────────────────────────────────────────────────

const AttachmentsSection = ({ attachments = [] }) => {
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const images = attachments.filter((f) => f.file_type?.startsWith("image/"));
    const others = attachments.filter(
        (f) => !f.file_type?.startsWith("image/"),
    );

    const openLightbox = (file) => {
        const idx = images.findIndex((f) => f.id === file.id);
        if (idx !== -1) setLightboxIndex(idx);
    };

    const prev = () =>
        setLightboxIndex((i) => (i - 1 + images.length) % images.length);
    const next = () => setLightboxIndex((i) => (i + 1) % images.length);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if (e.key === "Escape") setLightboxIndex(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxIndex]);

    if (!attachments.length) return null;

    return (
        <div>
            <SectionHeader
                icon={Paperclip}
                title={`Attachments (${attachments.length})`}
            />

            {/* Image files — thumbnail + name card, click opens lightbox */}
            {images.length > 0 && (
                <div className="space-y-1.5 mb-2">
                    {images.map((file) => (
                        <button
                            key={file.id}
                            type="button"
                            onClick={() => openLightbox(file)}
                            className="flex items-center gap-3 w-full rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/50 transition-colors group text-left"
                        >
                            <div className="relative h-9 w-9 rounded-md overflow-hidden border shrink-0">
                                <img
                                    src={file.file_path}
                                    alt={file.file_name}
                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <ZoomIn className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {file.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.file_size / 1024).toFixed(1)} KB ·
                                    Click to view
                                </p>
                            </div>
                            <ZoomIn className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {/* Non-image files — download on click */}
            {others.length > 0 && (
                <div className="space-y-1.5">
                    {others.map((file) => {
                        const { Icon, bg, color } = getFileIcon(
                            file.file_type,
                            file.file_name,
                        );
                        return (
                            <a
                                key={file.id}
                                href={file.file_path}
                                download={file.file_name}
                                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                            >
                                <div
                                    className={cn(
                                        "h-9 w-9 rounded-md flex items-center justify-center shrink-0",
                                        bg,
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", color)} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {file.file_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.file_size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/60 tabular-nums">
                        {lightboxIndex + 1} / {images.length}
                    </div>

                    {/* Download current image */}
                    <a
                        href={images[lightboxIndex].file_path}
                        download={images[lightboxIndex].file_name}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 right-16 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <Download className="h-4 w-4" />
                    </a>

                    {/* Prev */}
                    {images.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                prev();
                            }}
                            className="absolute left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}

                    {/* Image */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3"
                    >
                        <img
                            src={images[lightboxIndex].file_path}
                            alt={images[lightboxIndex].file_name}
                            className="max-w-full max-h-[78vh] rounded-lg object-contain shadow-2xl"
                        />
                        <p className="text-xs text-white/60 truncate max-w-xs">
                            {images[lightboxIndex].file_name}
                        </p>
                    </div>

                    {/* Next */}
                    {images.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                next();
                            }}
                            className="absolute right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttachmentsSection;
