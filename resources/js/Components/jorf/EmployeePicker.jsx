import React, { useMemo, useState } from "react";
import { Combobox } from "@/Components/ui/combobox";
import { Button } from "@/Components/ui/button";
import { X } from "lucide-react";

/**
 * EmployeePicker
 *
 * Cascading dept → prodline → station → employee selector
 * built entirely on top of your existing Combobox component.
 *
 * Props:
 *   employees  - [{ emp_id, empname, department, prodline, station }]
 *   value      - selected emp_id
 *   onChange   - (emp_id) => void
 *   label      - section heading string
 *   disabled   - boolean
 */
const EmployeePicker = ({
    employees = [],
    value,
    onChange,
    label,
    disabled,
}) => {
    const [dept, setDept] = useState("");
    const [prodline, setProdline] = useState("");
    const [station, setStation] = useState("");

    // ── Cascading options ─────────────────────────────────────────────────────

    const deptOptions = useMemo(() => {
        const unique = [
            ...new Set(
                employees.filter((e) => e.department).map((e) => e.department),
            ),
        ].sort();
        return unique.map((d) => ({ label: d, value: d }));
    }, [employees]);

    const prodlineOptions = useMemo(() => {
        const base = dept
            ? employees.filter((e) => e.department === dept)
            : employees;
        const unique = [
            ...new Set(base.filter((e) => e.prodline).map((e) => e.prodline)),
        ].sort();
        return unique.map((p) => ({ label: p, value: p }));
    }, [employees, dept]);

    const stationOptions = useMemo(() => {
        const base = employees.filter((e) => {
            if (dept && e.department !== dept) return false;
            if (prodline && e.prodline !== prodline) return false;
            return true;
        });
        const unique = [
            ...new Set(base.filter((e) => e.station).map((e) => e.station)),
        ].sort();
        return unique.map((s) => ({ label: s, value: s }));
    }, [employees, dept, prodline]);

    const employeeOptions = useMemo(() => {
        return employees
            .filter((e) => {
                if (!e.emp_id || !e.empname) return false;
                if (dept && e.department !== dept) return false;
                if (prodline && e.prodline !== prodline) return false;
                if (station && e.station !== station) return false;
                return true;
            })
            .map((e) => ({
                label: `${e.emp_id} - ${e.empname}`,
                value: e.emp_id,
            }));
    }, [employees, dept, prodline, station]);

    // ── Cascade reset handlers ────────────────────────────────────────────────

    const handleDeptChange = (val) => {
        setDept(val ?? "");
        setProdline("");
        setStation("");
        onChange(undefined);
    };

    const handleProdlineChange = (val) => {
        setProdline(val ?? "");
        setStation("");
        onChange(undefined);
    };

    const handleStationChange = (val) => {
        setStation(val ?? "");
        onChange(undefined);
    };

    const handleClear = () => {
        setDept("");
        setProdline("");
        setStation("");
        onChange(undefined);
    };

    const selectedEmployee = employees.find((e) => e.emp_id === value);
    const selectedLabel = selectedEmployee
        ? `${selectedEmployee.emp_id} - ${selectedEmployee.empname}`
        : undefined;
    const hasFilters = dept || prodline || station || value;

    return (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                </p>
                {hasFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Dept → Prodline → Station filters */}
            <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Department
                    </p>
                    <Combobox
                        options={deptOptions}
                        value={dept}
                        onChange={handleDeptChange}
                        placeholder="All"
                        allowCustomValue={false}
                        disabled={disabled}
                        className="h-8 text-xs"
                    />
                </div>

                <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Prod Line
                    </p>
                    <Combobox
                        options={prodlineOptions}
                        value={prodline}
                        onChange={handleProdlineChange}
                        placeholder="All"
                        allowCustomValue={false}
                        disabled={disabled || !dept}
                        className="h-8 text-xs"
                    />
                </div>

                <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Station
                    </p>
                    <Combobox
                        options={stationOptions}
                        value={station}
                        onChange={handleStationChange}
                        placeholder="All"
                        allowCustomValue={false}
                        disabled={disabled || !dept}
                        className="h-8 text-xs"
                    />
                </div>
            </div>

            {/* Final employee selector */}
            <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                    Employee
                    <span className="ml-1 text-muted-foreground/50">
                        ({employeeOptions.length} found)
                    </span>
                </p>
                <Combobox
                    options={employeeOptions}
                    value={value}
                    onChange={onChange}
                    placeholder="Search employee…"
                    allowCustomValue={false}
                    disabled={disabled}
                    className="h-9"
                />
            </div>

            {/* Selected preview */}
            {/* {selectedLabel && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                        {selectedLabel.charAt(0)}
                    </div>
                    <span className="truncate text-xs font-medium text-foreground">
                        {selectedLabel}
                    </span>
                </div>
            )} */}
        </div>
    );
};

export default EmployeePicker;
