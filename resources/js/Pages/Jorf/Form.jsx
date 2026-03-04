import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState, useCallback } from "react";
import { Head, usePage } from "@inertiajs/react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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
import { toast } from "sonner";

// react-hook-form
import { useForm } from "react-hook-form";

// Icons
import { UploadCloud, X, FileText, Loader2, FilePlus2 } from "lucide-react";

import EmployeeInfo from "@/Components/form/EmployeeInfo";

// ─── File Upload Component ───────────────────────────────────────────────────

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
        const updated = value.filter((_, i) => i !== index);
        onChange(updated);
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

// ─── Main Component ──────────────────────────────────────────────────────────

const FormJORF = () => {
    const { requestType, locations, emp_data } = usePage().props;
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            request_type: undefined,
            location: "",
            request_details: "",
            attachments: [],
        },
    });

    const onSubmit = async (values) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("request_type", values.request_type);
            formData.append("location", values.location);
            formData.append("request_details", values.request_details);
            values.attachments.forEach((file) => {
                formData.append("attachments[]", file);
            });

            await axios.post(route("jorf.store"), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("JORF submitted successfully!");
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit JORF.");
            setSubmitting(false);
        }
    };

    const watchedDetails = form.watch("request_details");

    return (
        <AuthenticatedLayout>
            <Head title="Generate JORF" />

            <div className="space-y-5 p-6">
                {/* Page header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <FilePlus2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Generate JORF
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Job Order Request Form — fill in the details below
                        </p>
                    </div>
                </div>

                {/* Employee Info */}
                <EmployeeInfo emp_data={emp_data} />

                {/* Form Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Request Information
                        </CardTitle>
                        <CardDescription>
                            Select a request type, attach supporting documents,
                            and describe your request.
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* Row 1: Request Type + Location */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="request_type"
                                        rules={{
                                            required:
                                                "Please select request type",
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Request Type
                                                </FormLabel>
                                                <FormControl>
                                                    <Combobox
                                                        options={requestType.map(
                                                            (req) => ({
                                                                value: req.request_name,
                                                                label: req.request_name,
                                                            }),
                                                        )}
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
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
                                        control={form.control}
                                        name="location"
                                        rules={{
                                            required:
                                                "Please select a location",
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Combobox
                                                        options={(
                                                            locations ?? []
                                                        ).map((loc) => ({
                                                            value: loc.location_name,
                                                            label: loc.location_name,
                                                        }))}
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        placeholder="Select a location…"
                                                        allowCustomValue={false}
                                                        className="h-9"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Row 2: Attachments full width */}
                                <FormField
                                    control={form.control}
                                    name="attachments"
                                    rules={{
                                        validate: (v) =>
                                            v.length > 0 ||
                                            "Please upload at least one file",
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
                                    control={form.control}
                                    name="request_details"
                                    rules={{
                                        required:
                                            "Please enter request details",
                                        maxLength: {
                                            value: 500,
                                            message: "Maximum 500 characters",
                                        },
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>
                                                    Request Details
                                                </FormLabel>
                                                <span
                                                    className={`text-xs tabular-nums ${
                                                        watchedDetails.length >=
                                                        450
                                                            ? "text-destructive"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {watchedDetails.length} /
                                                    500
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    rows={5}
                                                    placeholder="Describe your request in detail…"
                                                    maxLength={500}
                                                    className="resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="min-w-36"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting…
                                            </>
                                        ) : (
                                            "Generate JORF"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default FormJORF;
