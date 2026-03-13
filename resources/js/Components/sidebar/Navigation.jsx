import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import { ClipboardList, FileText, Settings, SheetIcon } from "lucide-react";
import Dropdown from "./DropDown";
import { UserAddOutlined } from "@ant-design/icons";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;
    console.log(usePage().props);

    const adminLinks = [
        {
            href: route("requestType.form"),
            label: "Request Types",
            icon: <ClipboardList className="text-base" />,
        },
        {
            href: route("requestor.form"),
            label: "Add Requestor",
            icon: <UserAddOutlined className="text-base" />,
        },
        // other admin links here
    ];
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
            {emp_data?.system_roles?.includes("Facilities_Coordinator") && (
                <Dropdown
                    label="Settings"
                    icon={<Settings className="w-5 h-5" />}
                    links={adminLinks}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
        </nav>
    );
}
