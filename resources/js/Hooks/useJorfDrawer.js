import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

const useJorfDrawer = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [availableAction, setAvailableAction] = useState(null);
    const [jorfLogs, setJorfLogs] = useState([]);
    const [logsCurrentPage, setLogsCurrentPage] = useState(1);
    const [logsHasMore, setLogsHasMore] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);

    const openDrawer = useCallback((item) => {
        setSelectedItem(item);
        setDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setSelectedItem(null);
        setAttachments([]);
        setAvailableAction(null);
        setJorfLogs([]);
        setLogsCurrentPage(1);
        setLogsHasMore(false);
    }, []);

    const fetchAttachments = useCallback(async (jorfId) => {
        try {
            const [attRes, actRes] = await Promise.all([
                axios.get(route("jorf.attachments", jorfId)),
                axios.get(route("jorf.getActions", jorfId)),
            ]);
            setAvailableAction(actRes.data.actions || null);
            setAttachments(attRes.data.attachments || []);
        } catch {
            setAttachments([]);
        }
    }, []);

    const fetchJorfLogs = useCallback(async (jorfId, page = 1) => {
        if (!jorfId) {
            setJorfLogs([]);
            return;
        }

        setLogsLoading(true);
        try {
            const res = await axios.get(route("jorf.logs", jorfId), {
                params: { page },
            });
            console.log(res);

            const newLogs = Array.isArray(res.data?.data) ? res.data.data : [];

            if (page === 1) {
                setJorfLogs(newLogs);
            } else {
                setJorfLogs((prev) => [...prev, ...newLogs]);
            }

            setLogsCurrentPage(page);
            setLogsHasMore(res.data?.pagination?.has_more || false);
        } catch {
            if (page === 1) setJorfLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    const handleLoadMoreLogs = useCallback(() => {
        if (selectedItem?.jorf_id) {
            fetchJorfLogs(selectedItem.jorf_id, logsCurrentPage + 1);
        }
    }, [selectedItem?.jorf_id, logsCurrentPage, fetchJorfLogs]);

    const validateAction = useCallback(
        ({
            action,
            remarks,
            costAmount,
            handledBy,
            rating,
            classification,
            executionDate,
        }) => {
            if (!remarks?.trim()) {
                toast.error("Please enter remarks.");
                return false;
            }

            if ((action === "ONGOING" || action === "DONE") && !costAmount) {
                toast.error("Please enter cost amount.");
                return false;
            }

            if (
                (action === "ONGOING" || action === "DONE") &&
                (!handledBy || handledBy.length === 0)
            ) {
                toast.error("Please select at least one Facilities Employee.");
                return false;
            }

            if (action === "ACKNOWLEDGE" && !rating) {
                toast.error("Please enter rating.");
                return false;
            }

            if (["ONGOING", "DONE"].includes(action) && !classification) {
                toast.error("Please select classification.");
                return false;
            }

            if (["ONGOING", "DONE"].includes(action) && !executionDate) {
                toast.error("Please select execution date.");
                return false;
            }

            return true;
        },
        [],
    );

    const handleJorfAction = useCallback(
        async ({
            action,
            item,
            remarks,
            costAmount,
            rating,
            handledBy,
            classification,
            executionDate,
            leadTimeValue,
            leadTimeUnit,
        }) => {
            // Validation
            const isValid = validateAction({
                action,
                remarks,
                costAmount,
                handledBy,
                rating,
                classification,
                executionDate,
            });

            if (!isValid) {
                throw new Error("validation");
            }

            // Submit
            const res = await axios.post(route("jorf.actions"), {
                jorf_id: item.jorf_id,
                action,
                remarks,
                cost_amount: costAmount,
                rating,
                handled_by: handledBy,
                classification,
                execution_date: executionDate,
                lead_time_value: leadTimeValue,
                lead_time_unit: leadTimeUnit,
            });

            if (res.data.success) {
                toast.success(res.data.message);
                // Small delay so the toast is visible before reload
                await new Promise((r) => setTimeout(r, 1200));
                window.location.reload();
            } else {
                toast.error(res.data.message);
                throw new Error(res.data.message);
            }
        },
        [validateAction],
    );

    return {
        drawerOpen,
        selectedItem,
        attachments,
        availableAction,
        jorfLogs,
        logsLoading,
        logsHasMore,
        openDrawer,
        closeDrawer,
        fetchAttachments,
        fetchJorfLogs,
        handleLoadMoreLogs,
        handleJorfAction,
    };
};

export default useJorfDrawer;
