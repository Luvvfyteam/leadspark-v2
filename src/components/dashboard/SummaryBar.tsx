'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { formatCurrency } from '@/lib/utils';

const TODAY = '2026-02-17';
const THIS_MONTH_START = '2026-02-01';

export function SummaryBar() {
    const router = useRouter();
    const { customers, tasks, leads, deals, goals } = useAppStore();

    const newLeads = leads.filter((l) => l.board_status === 'new').length;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const todayTasksCount = tasks.filter((t) => !t.is_completed && t.due_date <= TODAY).length;
    const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date < TODAY).length;

    // Revenue this month
    const completedDeals = deals.filter(
        (d) => d.status === 'completed' && d.created_at >= THIS_MONTH_START,
    );
    const totalRevenue = completedDeals.reduce((sum, d) => sum + d.value, 0);
    const currentGoal = goals.find((g) => g.month === '2026-02');
    const revenuePercent = currentGoal
        ? Math.round((totalRevenue / currentGoal.revenue_target) * 100)
        : 0;

    // Win rate — completed deals / (completed + lost) 
    const wonDeals = deals.filter((d) => d.status === 'completed').length;
    const lostDeals = deals.filter((d) => d.status === 'cancelled').length;
    const winRate = wonDeals + lostDeals > 0
        ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100)
        : 0;

    const stats = [
        {
            label: 'ลีดใหม่',
            value: newLeads.toString(),
            sub: 'รายการ',
            color: 'text-indigo-600',
            href: '/board',
        },
        {
            label: 'ลูกค้า',
            value: activeCustomers.toString(),
            sub: 'ราย active',
            color: 'text-green-600',
            href: '/customers',
        },
        {
            label: 'งานวันนี้',
            value: todayTasksCount.toString(),
            sub: overdueTasks > 0 ? `${overdueTasks} เกินกำหนด` : 'ไม่มีค้าง',
            color: overdueTasks > 0 ? 'text-red-600' : 'text-orange-500',
            subColor: overdueTasks > 0 ? 'text-red-500 font-semibold' : undefined,
            href: '/tasks',
        },
        {
            label: 'Win Rate',
            value: `${winRate}%`,
            sub: `${wonDeals} ดีลปิดสำเร็จ`,
            color: winRate >= 50 ? 'text-emerald-600' : winRate >= 30 ? 'text-amber-600' : 'text-red-600',
            href: '/reports',
        },
        {
            label: 'ยอดขาย',
            value: formatCurrency(totalRevenue),
            sub: `${revenuePercent}% ของเป้า`,
            color: 'text-emerald-600',
            href: '/payments',
        },
    ];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100">
                {stats.map((stat, i) => (
                    <button
                        key={i}
                        onClick={() => router.push(stat.href)}
                        className="flex flex-col items-start px-5 py-4 hover:bg-slate-50/70 transition-colors text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500">
                            {stat.label}
                        </span>
                        <span className={`text-xl font-black mt-1 ${stat.color}`}>
                            {stat.value}
                        </span>
                        <span className={`text-[10px] mt-0.5 ${stat.subColor || 'text-gray-400'}`}>
                            {stat.sub}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
