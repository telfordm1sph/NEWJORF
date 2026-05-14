import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    Cell,
} from "recharts";
import { FileText, Clock, CheckCircle2, Activity } from "lucide-react";

const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const STATUS_BADGE_COLORS = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-blue-100 text-blue-700",
    Ongoing: "bg-sky-100 text-sky-700",
    Acknowledged: "bg-slate-100 text-slate-700",
    Done: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-700",
    Disapproved: "bg-rose-100 text-rose-700",
    Returned: "bg-orange-100 text-orange-700",
};

const STATUS_CHART_COLORS = {
    Pending: "hsl(var(--chart-3))",
    Approved: "hsl(var(--chart-1))",
    Ongoing: "hsl(var(--chart-2))",
    Acknowledged: "hsl(var(--chart-4))",
    Done: "hsl(var(--chart-2))",
    Cancelled: "hsl(var(--chart-5))",
    Disapproved: "hsl(var(--chart-5))",
    Returned: "hsl(var(--chart-5))",
};

const TOP_STATS = [
    {
        key: "total",
        label: "Total JORFs",
        icon: FileText,
        iconBg: "bg-blue-500",
        getValue: ({ totalJorfs }) => totalJorfs,
    },
    {
        key: "pending",
        label: "Pending",
        icon: Clock,
        iconBg: "bg-amber-500",
        getValue: ({ statusCounts }) => statusCounts["Pending"] ?? 0,
    },
    {
        key: "completed",
        label: "Completed",
        icon: CheckCircle2,
        iconBg: "bg-emerald-500",
        getValue: ({ statusCounts }) => statusCounts["Done"] ?? 0,
    },
    {
        key: "avg",
        label: "Avg. Completion (hrs)",
        icon: Activity,
        iconBg: "bg-purple-500",
        getValue: ({ avgCompletionTime }) => avgCompletionTime ?? "N/A",
    },
];

const monthlyConfig = {
    count: { label: "Requests", color: "hsl(var(--chart-1))" },
};

export default function Dashboard({
    statusCounts,
    monthlyTrends,
    requestTypeCounts,
    departmentCounts,
    recentJorfs,
    avgCompletionTime,
    totalJorfs,
}) {
    const props = {
        statusCounts,
        monthlyTrends,
        requestTypeCounts,
        departmentCounts,
        recentJorfs,
        avgCompletionTime,
        totalJorfs,
    };

    const monthlyData = Object.entries(monthlyTrends).map(([month, count]) => ({
        month,
        count,
    }));
    const requestTypeData = Object.entries(requestTypeCounts).map(
        ([type, count]) => ({ type, count }),
    );
    const statusData = Object.entries(statusCounts)
        .filter(([key]) => key !== "All")
        .map(([label, count]) => ({ label, count }));

    const statusConfig = Object.fromEntries(
        statusData.map(({ label }, i) => [
            label,
            {
                label,
                color:
                    STATUS_CHART_COLORS[label] ??
                    CHART_COLORS[i % CHART_COLORS.length],
            },
        ]),
    );

    const requestTypeConfig = Object.fromEntries(
        requestTypeData.map(({ type }, i) => [
            type,
            { label: type, color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
    );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6 p-6">
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TOP_STATS.map(
                        ({ key, label, icon: Icon, iconBg, getValue }) => (
                            <Card key={key}>
                                <CardContent className="flex items-center justify-between p-5">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {label}
                                        </p>
                                        <p className="text-3xl font-bold mt-1">
                                            {getValue(props)}
                                        </p>
                                    </div>
                                    <div
                                        className={`${iconBg} p-3 rounded-full shrink-0`}
                                    >
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        ),
                    )}
                </div>

                {/* Monthly Trends + Status Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Trends</CardTitle>
                            <CardDescription>
                                JORF requests over the last 6 months
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={monthlyConfig}
                                className="h-[240px] w-full"
                            >
                                <LineChart data={monthlyData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="var(--color-count)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status Distribution</CardTitle>
                            <CardDescription>
                                Current JORF status breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={statusConfig}
                                className="h-[240px] w-full"
                            >
                                <BarChart data={statusData} layout="vertical">
                                    <CartesianGrid horizontal={false} />
                                    <XAxis
                                        type="number"
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        dataKey="label"
                                        type="category"
                                        width={90}
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {statusData.map(({ label }, i) => (
                                            <Cell
                                                key={label}
                                                fill={
                                                    STATUS_CHART_COLORS[
                                                        label
                                                    ] ??
                                                    CHART_COLORS[
                                                        i % CHART_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                {/* Requests by Type + By Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Requests by Type</CardTitle>
                            <CardDescription>
                                Distribution of JORF request types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={requestTypeConfig}
                                className="h-[220px] w-full"
                            >
                                <BarChart data={requestTypeData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="type"
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {requestTypeData.map(({ type }, i) => (
                                            <Cell
                                                key={type}
                                                fill={
                                                    CHART_COLORS[
                                                        i % CHART_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Requests by Department</CardTitle>
                            <CardDescription>
                                JORF volume per department
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={departmentConfig}
                                className="h-[220px] w-full"
                            >
                                <BarChart
                                    data={departmentData}
                                    layout="vertical"
                                >
                                    <CartesianGrid horizontal={false} />
                                    <XAxis
                                        type="number"
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        dataKey="dept"
                                        type="category"
                                        width={90}
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="var(--color-count)"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent JORFs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent JORFs</CardTitle>
                        <CardDescription>Latest JORF requests</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {recentJorfs.map((jorf) => (
                                <div
                                    key={jorf.id}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div>
                                        <p className="font-semibold text-sm">
                                            {jorf.jorf_id}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {jorf.empname} • {jorf.department}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_BADGE_COLORS[jorf.status_label] ?? "bg-gray-100 text-gray-700"}`}
                                    >
                                        {jorf.status_label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Requests by Type + Recent JORFs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Requests by Type</CardTitle>
                            <CardDescription>
                                Distribution of JORF request types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={requestTypeConfig}
                                className="h-[220px] w-full"
                            >
                                <BarChart data={requestTypeData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="type"
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {requestTypeData.map(({ type }, i) => (
                                            <Cell
                                                key={type}
                                                fill={
                                                    CHART_COLORS[
                                                        i % CHART_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent JORFs</CardTitle>
                            <CardDescription>
                                Latest JORF requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {recentJorfs.map((jorf) => (
                                    <div
                                        key={jorf.id}
                                        className="flex items-center justify-between px-6 py-4"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {jorf.jorf_id}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {jorf.empname} •{" "}
                                                {jorf.department}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_BADGE_COLORS[jorf.status_label] ?? "bg-gray-100 text-gray-700"}`}
                                        >
                                            {jorf.status_label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
