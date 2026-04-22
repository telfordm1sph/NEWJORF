import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

const TablePagination = ({ pagination, onPageChange, onPageSizeChange }) => {
    const { current, total, pageSize, lastPage } = pagination;
    const from = Math.min((current - 1) * pageSize + 1, total);
    const to = Math.min(current * pageSize, total);

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{from}</span>–
                <span className="font-medium text-foreground">{to}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span>
            </p>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Rows</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => onPageSizeChange(Number(v))}
                    >
                        <SelectTrigger className="h-7 w-16 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map((s) => (
                                <SelectItem key={s} value={String(s)}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPageChange(1)}
                        disabled={current === 1}
                    >
                        <ChevronsLeft className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPageChange(current - 1)}
                        disabled={current === 1}
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 tabular-nums">
                        {current} / {lastPage}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPageChange(current + 1)}
                        disabled={current === lastPage}
                    >
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPageChange(lastPage)}
                        disabled={current === lastPage}
                    >
                        <ChevronsRight className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TablePagination;
