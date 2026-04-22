import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useEffect, useMemo } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { useForm, Controller } from "react-hook-form";
import { CheckCircle2, PlusIcon, Trash2Icon, XCircle } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Badge } from "@/Components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/Components/ui/alert-dialog";
import { toast } from "sonner";
import { useRequestTypeDrawer } from "@/Hooks/useRequestTypeDrawer";

const RequestType = () => {
    const { requestTypes } = usePage().props;

    const {
        drawerVisible,
        drawerMode,
        editingRequestType,
        openCreateDrawer,
        closeDrawer,
        handleRowClick,
    } = useRequestTypeDrawer();

    const {
        control,
        handleSubmit,
        reset,
        register,
        formState: { errors },
    } = useForm({
        defaultValues: {
            id: undefined,
            request_name: "",
            is_active: true,
        },
    });

    useEffect(() => {
        if (editingRequestType) {
            reset({
                id: editingRequestType.id,
                request_name: editingRequestType.request_name,
                is_active: Boolean(editingRequestType.is_active),
            });
        } else {
            reset({ id: undefined, request_name: "", is_active: true });
        }
    }, [editingRequestType, drawerVisible]);

    const dataSource = useMemo(
        () =>
            requestTypes?.map((type) => ({
                key: type.id,
                id: type.id,
                request_name: type.request_name,
                is_active: Boolean(type.is_active),
            })) || [],
        [requestTypes],
    );

    const onSubmit = async (data) => {
        try {
            const { id, ...formData } = data;
            const response = id
                ? await axios.put(route("request-types.update", id), formData)
                : await axios.post(route("request-types.store"), formData);

            if (response.data.success) {
                toast.success(
                    id
                        ? "Request type updated successfully!"
                        : "Request type created successfully!",
                );
                closeDrawer();
                router.reload({ only: ["requestTypes"] });
            } else {
                toast.error(response.data.message || "Operation failed");
            }
        } catch (error) {
            toast.error("Failed to save request type. Please try again.");
            console.error(error);
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            const response = await axios.delete(
                route("request-types.destroy", id),
            );
            if (response.data.success) {
                toast.success("Request type deleted successfully!");
                router.reload({ only: ["requestTypes"] });
            } else {
                toast.error(response.data.message || "Delete operation failed");
            }
        } catch (error) {
            toast.error("Failed to delete request type. Please try again.");
            console.error(error);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Request Types" />
            <div className="container mx-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Request Types</CardTitle>
                        <Button onClick={openCreateDrawer}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Create Request Type
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="w-32 text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="w-24 text-center">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataSource.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-muted-foreground"
                                        >
                                            No request types data available
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dataSource.map((record) => (
                                        <TableRow
                                            key={record.key}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() =>
                                                handleRowClick(record)
                                            }
                                        >
                                            <TableCell>{record.id}</TableCell>
                                            <TableCell>
                                                {record.request_name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {record.is_active ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-green-500 text-green-600 gap-1"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-red-400 text-red-500 gap-1"
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className="text-center"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2Icon className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Delete Request
                                                                Type
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you
                                                                want to delete
                                                                this request
                                                                type?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                No
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={(e) =>
                                                                    handleDelete(
                                                                        record.id,
                                                                        e,
                                                                    )
                                                                }
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Yes
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Sheet
                    open={drawerVisible}
                    onOpenChange={(open) => !open && closeDrawer()}
                >
                    <SheetContent className="w-[400px]">
                        <SheetHeader>
                            <SheetTitle>
                                {drawerMode === "edit"
                                    ? "Edit Request Type"
                                    : "Create Request Type"}
                            </SheetTitle>
                        </SheetHeader>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="mt-6 space-y-4"
                        >
                            <input type="hidden" {...register("id")} />

                            <div className="space-y-1">
                                <Label>Request Name</Label>
                                <Input
                                    placeholder="Enter request name"
                                    {...register("request_name", {
                                        required: "Request name is required",
                                    })}
                                />
                                {errors.request_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.request_name.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label>Active</Label>
                                <Controller
                                    control={control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full">
                                {drawerMode === "edit" ? "Update" : "Create"}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>
        </AuthenticatedLayout>
    );
};

export default RequestType;
