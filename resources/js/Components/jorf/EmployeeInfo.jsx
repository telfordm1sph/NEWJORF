import React, { useState } from "react";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import { Button } from "@/Components/ui/button";
import {
    User,
    Hash,
    Building2,
    Layers,
    MapPin,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const InfoCell = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
                {value}
            </p>
        </div>
    </div>
);

const EmployeeInfo = ({ emp_data }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="rounded-xl border bg-muted/30 px-5 py-4 transition-all duration-200">
            {/* Header — always visible */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Employee Information
                    </p>
                    <Badge variant="secondary" className="text-xs">
                        <Hash className="mr-1.5 h-3 w-3" />
                        {emp_data.emp_id}
                    </Badge>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    {isOpen ? (
                        <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Minimize
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">
                                {emp_data.emp_name}
                            </span>
                        </>
                    )}
                </Button>
            </div>

            {/* Collapsible body */}
            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen
                        ? "grid-rows-[1fr] opacity-100 mt-4"
                        : "grid-rows-[0fr] opacity-0 mt-0",
                )}
            >
                <div className="overflow-hidden">
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        <InfoCell
                            icon={User}
                            label="Name"
                            value={emp_data.emp_name}
                        />
                        <InfoCell
                            icon={Building2}
                            label="Department"
                            value={emp_data.emp_dept}
                        />
                        <InfoCell
                            icon={Layers}
                            label="Product Line"
                            value={emp_data.emp_prodline}
                        />
                        <InfoCell
                            icon={MapPin}
                            label="Station"
                            value={emp_data.emp_station}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeInfo;
