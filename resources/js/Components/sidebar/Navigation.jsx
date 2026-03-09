import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { FileText, SheetIcon } from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;

    return (
        <nav className="flex flex-col gap-0.5">
            <SidebarLink
                href={route("jorf.form")}
                icon={<FileText className="w-[18px] h-[18px]" />}
                label="Generate JORF"
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("jorf.table")}
                icon={<SheetIcon className="w-5 h-5" />}
                label="JORF Table"
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
