import { useEffect } from "react";
import { message } from "antd";
import { router } from "@inertiajs/react";

/**
 * Hook to handle real-time JORF updates
 */
export const useRealtimeJorfUpdates = ({
    jorfUpdates,
    clearJorfUpdates,
}) => {
    useEffect(() => {
        if (jorfUpdates.length === 0) return;

        console.log("🔄 Processing JORF updates:", jorfUpdates);

        // Show toast notification for updates
        jorfUpdates.forEach((update) => {
            message.info(`JORF ${update.jorfId} has been updated`, 2);
        });

        // Clear processed updates
        clearJorfUpdates();

        // Refetch the table with current filters
        router.reload({
            only: ["jorfs", "statusCounts", "pagination"],
            preserveScroll: true,
            preserveState: false,
        });
    }, [jorfUpdates, clearJorfUpdates]);
};
