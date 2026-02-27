'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, CheckSquare, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react';
import { formatCurrency, getRelativeTime } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { TASK_CATEGORY_CONFIG, CUSTOMER_STATUS_CONFIG } from '@/lib/constants';

const TODAY = '2026-02-17';
const THIS_MONTH_START = '2026-02-01';

export function SummaryCards() {
    const router = useRouter();
    const { customers, tasks, leads, deals, goals, activities } = useAppStore();
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // ── computed values ──────────────────────────────────────────
    const newLeadsThisMonth = leads.filter((l) => l.board_status === 'new').length;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const todayTasks = tasks.filter((t) => !t.is_completed && t.due_date <= TODAY);
    const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date < TODAY);
    const completedDeals = deals.filter(
        (d) => d.status === 'completed' && d.created_at >= THIS_MONTH_START,
    );
    const totalRevenue = completedDeals.reduce((sum, d) => sum + d.value, 0);
    const currentGoal = goals.find((g) => g.month === '2026-02');
    const revenuePercent = currentGoal
        ? Math.round((totalRevenue / currentGoal.revenue_target) * 100)
        : 0;

    // ── expand panel data ────────────────────────────────────────
    const topLeads = [...leads]
        .sort((a, b) => b.ai_score - a.ai_score)
        .slice(0, 5);

    const getLastActivity = (customerId: string) => {
        const acts = activities.filter((a) => a.customer_id === customerId);
        if (acts.length === 0) return null;
        return acts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    };
    const customersNeedingFollowUp = customers
        .filter((c) => c.status === 'active')
        .map((c) => ({ customer: c, lastAct: getLastActivity(c.id) }))
        .sort((a, b) => {
            const ta = a.lastAct ? new Date(a.lastAct.created_at).getTime() : 0;
            const tb = b.lastAct ? new Date(b.lastAct.created_at).getTime() : 0;
            return ta - tb;
        })
        .slice(0, 5);

    const topTasks = [...overdueTasks, ...todayTasks.filter((t) => t.due_date === TODAY)].slice(0, 5);
    const topDeals = [...completedDeals].sort((a, b) => b.value - a.value).slice(0, 3);

    // ── card config ──────────────────────────────────────────────
    const cards = [
        {
            key: 'leads',
            title: 'ลีดใหม่เดือนนี้',
            value: newLeadsThisMonth.toString(),
            subtitle: 'จากการค้นหา',
            icon: Users,
            iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            key: 'customers',
            title: 'ลูกค้าปัจจุบัน',
            value: activeCustomers.toString(),
            subtitle: 'ราย',
            icon: UserCheck,
            iconBg: 'bg-gradient-to-br from-green-50 to-emerald-100',
            iconColor: 'text-green-600',
        },
        {
            key: 'tasks',
            title: 'งานวันนี้',
            value: todayTasks.length.toString(),
            subtitle: overdueTasks.length > 0 ? `${overdueTasks.length} เกินกำหนด` : 'ไม่มีเกินกำหนด',
            subtitleColor: overdueTasks.length > 0 ? 'text-red-600 font-bold' : 'text-gray-400',
            icon: CheckSquare,
            iconBg: 'bg-gradient-to-br from-orange-50 to-amber-100',
            iconColor: 'text-orange-600',
        },
        {
            key: 'revenue',
            title: 'ยอดขายเดือนนี้',
            value: formatCurrency(totalRevenue),
            subtitle: `${revenuePercent}% ของเป้า`,
            icon: TrendingUp,
            iconBg: 'bg-gradient-to-br from-emerald-50 to-green-100',
            iconColor: 'text-emerald-600',
        },
    ];

    const handleCardClick = (key: string) => {
        setExpandedCard((prev) => (prev === key ? null : key));
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
                const isExpanded = expandedCard === card.key;
                return (
                    <div key={card.key} className="flex flex-col">
                        <Card
                            className="shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 select-none border-gray-100"
                            onClick={() => handleCardClick(card.key)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                                        <p className="text-3xl font-black text-gray-900 mt-2 truncate">
                                            {card.value}
                                        </p>
                                        <p className={`text-xs mt-1.5 ${card.subtitleColor || 'text-gray-400'}`}>
                                            {card.subtitle}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                                        </div>
                                        <div className="text-gray-300">
                                            {isExpanded
                                                ? <ChevronDown className="w-3.5 h-3.5" />
                                                : <ChevronRight className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Expand panel ── */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-96 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'
                                }`}
                        >
                            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-50">
                                    {card.key === 'leads' && (
                                        <>
                                            {topLeads.map((lead) => (
                                                <div
                                                    key={lead.id}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors"
                                                >
                                                    <span className="text-sm font-medium text-gray-800 truncate">{lead.business_name}</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2 ${lead.ai_score >= 80 ? 'bg-red-100 text-red-700' :
                                                            lead.ai_score >= 50 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {lead.ai_score}
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {card.key === 'customers' && (
                                        <>
                                            {customersNeedingFollowUp.map(({ customer, lastAct }) => (
                                                <div
                                                    key={customer.id}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/customers/${customer.id}`); }}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{customer.business_name}</p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {lastAct ? getRelativeTime(lastAct.created_at) : 'ยังไม่มีกิจกรรม'}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 bg-gray-100 ${CUSTOMER_STATUS_CONFIG[customer.status]?.color || 'text-gray-500'}`}>
                                                        {CUSTOMER_STATUS_CONFIG[customer.status]?.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {card.key === 'tasks' && (
                                        <>
                                            {topTasks.length === 0 ? (
                                                <p className="px-4 py-4 text-sm text-gray-400 text-center">🎉 ไม่มีงานวันนี้</p>
                                            ) : topTasks.map((task) => {
                                                const catConfig = TASK_CATEGORY_CONFIG[task.category];
                                                const isOverdue = task.due_date < TODAY;
                                                return (
                                                    <div key={task.id} className="flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50/80 transition-colors">
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                        <span className="text-sm font-medium text-gray-800 truncate flex-1">{task.title}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${catConfig?.color || 'bg-gray-100 text-gray-600'}`}>
                                                            {catConfig?.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}

                                    {card.key === 'revenue' && (
                                        <>
                                            {topDeals.length === 0 ? (
                                                <p className="px-4 py-4 text-sm text-gray-400 text-center">ยังไม่มีดีลปิดเดือนนี้</p>
                                            ) : topDeals.map((deal) => {
                                                const custName = customers.find((c) => c.id === deal.customer_id)?.business_name || '—';
                                                return (
                                                    <div key={deal.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors">
                                                        <span className="text-sm font-medium text-gray-800 truncate">{custName}</span>
                                                        <span className="text-sm font-bold text-emerald-700 shrink-0 ml-2">
                                                            {formatCurrency(deal.value)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-50 px-4 py-2.5">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const hrefs: Record<string, string> = {
                                                leads: '/board',
                                                customers: '/customers',
                                                tasks: '/tasks',
                                                revenue: '/payments',
                                            };
                                            router.push(hrefs[card.key]);
                                        }}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider"
                                    >
                                        ดูทั้งหมด →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
