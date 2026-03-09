import React, { useState, useCallback } from "react";
import { UploadCloud, X, FileText } from "lucide-react";

const FileUpload = ({ value = [], onChange }) => {
    const [dragging, setDragging] = useState(false);

    const addFiles = useCallback(
        (newFiles) => {
            const merged = [
                ...value,
                ...Array.from(newFiles).filter(
                    (f) => !value.find((v) => v.name === f.name),
                ),
            ];
            onChange(merged);
        },
        [value, onChange],
    );

    const removeFile = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
    };

    const handleInputChange = (e) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = "";
    };

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <label
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-all duration-200
                    ${
                        dragging
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UploadCloud className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                        Drop files here or{" "}
                        <span className="text-primary underline underline-offset-2">
                            browse
                        </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Any file type supported
                    </p>
                </div>
                <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleInputChange}
                />
            </label>

            {/* File list */}
            {value.length > 0 && (
                <ul className="space-y-1.5">
                    {value.map((file, i) => (
                        <li
                            key={i}
                            className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm shadow-sm"
                        >
                            <span className="flex items-center gap-2.5 truncate">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="truncate max-w-[180px] font-medium">
                                    {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FileUpload;
