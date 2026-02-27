'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';

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

    // งานวันนี้ (รวมเกินกำหนด)
    const todayTaskCount = tasks.filter((t) => !t.is_completed && t.due_date <= TODAY).length;

    // ลูกค้าที่ต้อง follow up (ไม่มี activity ใน 7+ วัน)
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

    // ยอดขาย % ของเป้า
    const goal = goals.find((g) => g.month === THIS_MONTH);
    const revenue = deals
        .filter((d) => d.status === 'completed' && d.created_at >= `${THIS_MONTH}-01`)
        .reduce((sum, d) => sum + d.value, 0);
    const revenuePercent = goal && goal.revenue_target > 0
        ? Math.round((revenue / goal.revenue_target) * 100)
        : null;

    // ชื่อ user (hardcoded เหมือนส่วนอื่น)
    const userName = 'Asia';

    return (
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 px-5 py-4">
            <p className="text-base font-semibold text-gray-900">
                {getGreeting()} {userName} 👋
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-gray-600">
                วันนี้มี{' '}
                <button
                    onClick={() => router.push('/tasks')}
                    className="font-semibold text-blue-700 hover:underline"
                >
                    {todayTaskCount} งาน
                </button>
                {' '}·{' '}
                <button
                    onClick={() => router.push('/customers')}
                    className="font-semibold text-blue-700 hover:underline"
                >
                    {followUpCount} ลูกค้าต้อง follow up
                </button>
                {revenuePercent !== null && (
                    <>
                        {' '}·{' ยอดขายเดือนนี้ '}
                        <button
                            onClick={() => router.push('/reports')}
                            className="font-semibold text-blue-700 hover:underline"
                        >
                            {revenuePercent}% ของเป้า
                        </button>
                    </>
                )}
            </p>
        </div>
    );
}
