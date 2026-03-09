// resources/js/Pages/Jorf/Index.jsx
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FilePlus2 } from "lucide-react";

// shadcn/ui
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Local components
import PageHeader from "@/Components/jorf/PageHeader";
import EmployeeInfo from "@/Components/jorf/EmployeeInfo";
import JorfForm from "@/Components/jorf/JorfForm";

// ─── Page ────────────────────────────────────────────────────────────────────

const Index = () => {
    const { requestType, emp_data } = usePage().props;
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            // Start with one empty entry; user can add more
            entries: [
                {
                    request_type: undefined,
                    location: "",
                    request_details: "",
                    attachments: [],
                },
            ],
        },
    });

    const onSubmit = async (values) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const formData = new FormData();

            values.entries.forEach((entry, i) => {
                formData.append(
                    `entries[${i}][request_type]`,
                    entry.request_type,
                );
                formData.append(`entries[${i}][location]`, entry.location);
                formData.append(
                    `entries[${i}][request_details]`,
                    entry.request_details,
                );
                entry.attachments.forEach((file) => {
                    formData.append(`entries[${i}][attachments][]`, file);
                });
                formData.append(
                    `entries[${i}][incharge_id]`,
                    entry.incharge_id,
                );
                formData.append(
                    `entries[${i}][approver_id]`,
                    entry.approver_id,
                );
            });

            // for (let [key, value] of formData.entries()) {
            //     console.log(key, value);
            // }
            await axios.post(route("jorf.store"), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const count = values.entries.length;
            toast.success(
                count === 1
                    ? "JORF submitted successfully!"
                    : `${count} JORFs submitted successfully!`,
            );

            await new Promise((resolve) => setTimeout(resolve, 1500));

            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Generate" />

            <div className="space-y-5 p-6">
                {/* Page Header */}
                <PageHeader
                    icon={FilePlus2}
                    title="Generate JORF"
                    description="Job Order Request Form — add one or more entries then submit."
                />

                {/* Employee Info (collapsible) */}
                <EmployeeInfo emp_data={emp_data} />

                {/* Request Form Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Request Information
                        </CardTitle>
                        <CardDescription>
                            Add multiple entries below. Each entry becomes a
                            separate JORF on submission.
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <JorfForm
                            emp_data={emp_data}
                            form={form}
                            requestType={requestType}
                            submitting={submitting}
                            onSubmit={onSubmit}
                        />
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;
