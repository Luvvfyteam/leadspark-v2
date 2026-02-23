'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, CheckSquare, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

export function SummaryCards() {
    const router = useRouter();
    const { customers, tasks, leads, deals, goals } = useAppStore();

    const totalLeads = leads.length;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const todayTasks = tasks.filter(
        (t) => !t.is_completed && t.due_date <= '2026-02-17'
    );
    const overdueTasks = tasks.filter(
        (t) => !t.is_completed && t.due_date < '2026-02-17'
    );
    const completedDeals = deals.filter(
        (d) => d.status === 'completed' && d.created_at >= '2026-01-01'
    );
    const totalRevenue = completedDeals.reduce((sum, d) => sum + d.value, 0);
    const currentGoal = goals.find((g) => g.month === '2026-02');
    const revenuePercent = currentGoal
        ? Math.round((totalRevenue / currentGoal.revenue_target) * 100)
        : 0;

    const cards = [
        {
            title: 'ลีดทั้งหมด',
            value: totalLeads.toString(),
            subtitle: 'เดือนนี้',
            icon: Users,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            href: '/search',
        },
        {
            title: 'ลูกค้าเปิดใช้งาน',
            value: activeCustomers.toString(),
            subtitle: 'ราย',
            icon: UserCheck,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            href: '/customers',
        },
        {
            title: 'งานวันนี้',
            value: todayTasks.length.toString(),
            subtitle: overdueTasks.length > 0 ? `${overdueTasks.length} เกินกำหนด` : 'ไม่มีเกินกำหนด',
            subtitleColor: overdueTasks.length > 0 ? 'text-red-600' : 'text-gray-500',
            icon: CheckSquare,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            href: '/tasks',
        },
        {
            title: 'รายได้เดือนนี้',
            value: formatCurrency(totalRevenue),
            subtitle: `${revenuePercent}% ของเป้า`,
            icon: TrendingUp,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            href: '/reports',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <Card
                    key={card.title}
                    className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(card.href)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                                <p className={`text-xs mt-1 ${card.subtitleColor || 'text-gray-500'}`}>
                                    {card.subtitle}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
