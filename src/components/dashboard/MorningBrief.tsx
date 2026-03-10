'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Sparkles } from 'lucide-react';

const TODAY = '2026-02-17';
const THIS_MONTH = '2026-02';
const NO_CONTACT_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'สวัสดีตอนเช้า';
    if (h < 14) return 'สวัสดีตอนสาย';
    if (h < 18) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
}

export function MorningBrief() {
    const router = useRouter();
    const { tasks, customers, activities, goals, deals } = useAppStore();

    const todayTaskCount = tasks.filter((t) => !t.is_completed && t.due_date <= TODAY).length;

    const now = new Date(TODAY).getTime();
    const followUpCount = customers.filter((c) => {
        if (c.status === 'inactive') return false;
        const lastAct = activities
            .filter((a) => a.customer_id === c.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        if (!lastAct) return true;
        const daysSince = (now - new Date(lastAct.created_at).getTime()) / MS_PER_DAY;
        return daysSince >= NO_CONTACT_DAYS;
    }).length;

    const goal = goals.find((g) => g.month === THIS_MONTH);
    const revenue = deals
        .filter((d) => d.status === 'completed' && d.created_at >= `${THIS_MONTH}-01`)
        .reduce((sum, d) => sum + d.value, 0);
    const revenuePercent = goal && goal.revenue_target > 0
        ? Math.round((revenue / goal.revenue_target) * 100)
        : null;

    const userName = 'Asia';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 shadow-lg shadow-indigo-300/30">
            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-violet-400/10 rounded-full blur-xl" />

            <div className="relative flex items-start gap-4">
                {/* Avatar / Icon */}
                <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shrink-0 shadow-inner">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-white">
                        {getGreeting()} {userName} 👋
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
                        วันนี้มี{' '}
                        <button
                            onClick={() => router.push('/tasks')}
                            className="font-bold text-white hover:underline underline-offset-2"
                        >
                            {todayTaskCount} งาน
                        </button>
                        {' '}·{' '}
                        <button
                            onClick={() => router.push('/customers')}
                            className="font-bold text-white hover:underline underline-offset-2"
                        >
                            {followUpCount} ลูกค้าต้อง follow up
                        </button>
                        {revenuePercent !== null && (
                            <>
                                {' '}·{' ยอดขายเดือนนี้ '}
                                <button
                                    onClick={() => router.push('/reports')}
                                    className="font-bold text-white hover:underline underline-offset-2"
                                >
                                    {revenuePercent}% ของเป้า
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
