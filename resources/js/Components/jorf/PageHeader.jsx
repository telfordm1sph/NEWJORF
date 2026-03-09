import React from "react";
import { FilePlus2 } from "lucide-react";

const PageHeader = ({ title, description, icon: Icon = FilePlus2 }) => (
    <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);

export default PageHeader;
