import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { FileText } from "lucide-react";

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
        </nav>
    );
}
