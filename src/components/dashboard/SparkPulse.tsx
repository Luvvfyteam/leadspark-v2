'use client';

import { useAppStore } from '@/stores/app-store';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TODAY = '2026-02-17';
const THIS_MONTH_START = '2026-02-01';
const THIS_MONTH = '2026-02';
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type PulseStatus = 'green' | 'yellow' | 'red';

interface PulseResult {
    status: PulseStatus;
    score: number; // จำนวน metrics ที่ "ไม่ดี"
    title: string;
    message: string;
    issues: string[];
}

function computePulse(
    leads: ReturnType<typeof useAppStore.getState>['leads'],
    customers: ReturnType<typeof useAppStore.getState>['customers'],
    tasks: ReturnType<typeof useAppStore.getState>['tasks'],
    deals: ReturnType<typeof useAppStore.getState>['deals'],
    goals: ReturnType<typeof useAppStore.getState>['goals'],
    activities: ReturnType<typeof useAppStore.getState>['activities'],
): PulseResult {
    const issues: string[] = [];
    let badCount = 0;

    // 1. ยอดขาย on track?
    const completedDeals = deals.filter(
        (d) => d.status === 'completed' && d.created_at >= THIS_MONTH_START,
    );
    const totalRevenue = completedDeals.reduce((sum, d) => sum + d.value, 0);
    const goal = goals.find((g) => g.month === THIS_MONTH);
    const revenuePercent = goal && goal.revenue_target > 0
        ? (totalRevenue / goal.revenue_target) * 100
        : 100;
    if (revenuePercent < 30) {
        badCount += 2;
        issues.push(`ยอดขายต่ำกว่าเป้า ${Math.round(revenuePercent)}%`);
    } else if (revenuePercent < 60) {
        badCount += 1;
        issues.push(`ยอดขายอยู่ที่ ${Math.round(revenuePercent)}% ของเป้า`);
    }

    // 2. Pipeline มี deal อยู่ไหม?
    const activePipelineLeads = leads.filter(
        (l) => l.board_status === 'contacted' || l.board_status === 'interested',
    ).length;
    if (activePipelineLeads === 0) {
        badCount += 2;
        issues.push('pipeline ว่างเปล่า ไม่มีลีดในขั้นติดต่อ/สนใจ');
    } else if (activePipelineLeads < 3) {
        badCount += 1;
        issues.push(`pipeline มีแค่ ${activePipelineLeads} ลีด`);
    }

    // 3. ลูกค้า active?
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const now = new Date(TODAY).getTime();
    const overdueContact = customers.filter((c) => {
        if (c.status !== 'active') return false;
        const lastAct = activities
            .filter((a) => a.customer_id === c.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        if (!lastAct) return true;
        return (now - new Date(lastAct.created_at).getTime()) / MS_PER_DAY > 14;
    }).length;
    if (overdueContact > activeCustomers * 0.5) {
        badCount += 2;
        issues.push(`${overdueContact} ลูกค้าไม่ได้ติดต่อเกิน 2 สัปดาห์`);
    } else if (overdueContact > 2) {
        badCount += 1;
        issues.push(`${overdueContact} ลูกค้าต้อง follow up`);
    }

    // 4. งาน overdue?
    const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date < TODAY).length;
    if (overdueTasks > 5) {
        badCount += 1;
        issues.push(`งานค้างอยู่ ${overdueTasks} งาน`);
    }

    // คำนวณ status
    let status: PulseStatus;
    let title: string;
    let message: string;

    if (badCount === 0) {
        status = 'green';
        title = 'ธุรกิจวันนี้สถานะดี 🎉';
        message = 'ยอดขาย pipeline และลูกค้าอยู่ในเกณฑ์ดี';
    } else if (badCount <= 2) {
        status = 'yellow';
        title = `มี ${issues.length} เรื่องต้องดูแล ⚠️`;
        message = issues[0] || 'บางตัวชี้วัดต่ำกว่าเป้า';
    } else {
        status = 'red';
        title = `ต้องแก้ไขเร่งด่วน ${issues.length} เรื่อง 🚨`;
        message = issues[0] || 'หลาย metrics ต่ำกว่าเป้าหมาย';
    }

    return { status, score: badCount, title, message, issues };
}

const STATUS_CONFIG = {
    green: {
        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
        icon: TrendingUp,
        iconColor: 'text-emerald-500',
        titleColor: 'text-emerald-900',
        messageColor: 'text-emerald-700',
        issueColor: 'text-emerald-600',
        label: 'สุขภาพดี',
    },
    yellow: {
        bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700',
        icon: Minus,
        iconColor: 'text-amber-500',
        titleColor: 'text-amber-900',
        messageColor: 'text-amber-700',
        issueColor: 'text-amber-600',
        label: 'พอใช้',
    },
    red: {
        bg: 'bg-gradient-to-r from-red-50 to-rose-50',
        border: 'border-red-200',
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-700',
        icon: TrendingDown,
        iconColor: 'text-red-500',
        titleColor: 'text-red-900',
        messageColor: 'text-red-700',
        issueColor: 'text-red-600',
        label: 'ต้องดูแล',
    },
};

export function SparkPulse() {
    const { leads, customers, tasks, deals, goals, activities } = useAppStore();
    const pulse = computePulse(leads, customers, tasks, deals, goals, activities);
    const cfg = STATUS_CONFIG[pulse.status];
    const Icon = cfg.icon;

    return (
        <div className={`rounded-2xl border-2 ${cfg.bg} ${cfg.border} px-5 py-4 shadow-md`}>
            <div className="flex items-center gap-4">
                {/* Pulse dot + status */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="relative flex items-center justify-center w-11 h-11">
                        {/* Pulsing ring */}
                        <span className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-25 animate-ping`} />
                        <span className={`relative inline-flex rounded-full w-5 h-5 ${cfg.dot} shadow-sm`} />
                    </div>
                    <Activity className={`w-4 h-4 ${cfg.iconColor}`} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold ${cfg.titleColor}`}>{pulse.title}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cfg.badge} uppercase tracking-wider`}>
                            <Icon className="w-2.5 h-2.5" />
                            Spark Pulse · {cfg.label}
                        </span>
                    </div>
                    <p className={`text-xs mt-1 ${cfg.messageColor}`}>{pulse.message}</p>
                </div>

                {/* Issues count (if any) */}
                {pulse.issues.length > 1 && (
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        {pulse.issues.slice(0, 2).map((issue, i) => (
                            <span key={i} className={`text-[10px] ${cfg.issueColor} font-medium`}>
                                · {issue}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
