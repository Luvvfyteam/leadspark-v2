'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { CUSTOMER_STATUS_CONFIG, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { getRelativeTime, formatCurrency } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { AlertTriangle, BellRing } from 'lucide-react';
import { useState } from 'react';

const TODAY = '2026-02-17';
const NO_ACTIVITY_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const now = new Date(TODAY).getTime();

type AttentionReason = 'overdue_payment' | 'no_activity' | 'unpaid_deal';

interface AttentionItem {
    customerId: string;
    reasons: AttentionReason[];
    daysSinceActivity: number | null;
    unpaidDeals: { name: string; value: number }[];
}

export function CustomerAttention() {
    const router = useRouter();
    const { customers, activities, deals } = useAppStore();
    const [panelId, setPanelId] = useState<string | null>(null);

    // Build attention list
    const items: AttentionItem[] = [];

    for (const c of customers) {
        if (c.status === 'inactive') continue;

        const reasons: AttentionReason[] = [];

        // Reason 1: overdue payment status
        if (c.status === 'overdue_payment') {
            reasons.push('overdue_payment');
        }

        // Reason 2: no activity in 14+ days
        const custActs = activities
            .filter((a) => a.customer_id === c.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastAct = custActs[0] ?? null;
        const daysSinceActivity = lastAct
            ? (now - new Date(lastAct.created_at).getTime()) / MS_PER_DAY
            : null;
        if (daysSinceActivity === null || daysSinceActivity >= NO_ACTIVITY_DAYS) {
            reasons.push('no_activity');
        }

        // Reason 3: unpaid deals past end_date
        const unpaidDeals = deals.filter(
            (d) =>
                d.customer_id === c.id &&
                d.status !== 'cancelled' &&
                d.payment_status !== 'paid' &&
                d.end_date !== null &&
                d.end_date < TODAY,
        ).map((d) => ({ name: d.name, value: d.value }));
        if (unpaidDeals.length > 0) {
            reasons.push('unpaid_deal');
        }

        if (reasons.length > 0) {
            items.push({ customerId: c.id, reasons, daysSinceActivity, unpaidDeals });
        }
    }

    // Sort: overdue_payment first, then most reasons, then oldest activity
    items.sort((a, b) => {
        const aOver = a.reasons.includes('overdue_payment') ? 1 : 0;
        const bOver = b.reasons.includes('overdue_payment') ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        if (b.reasons.length !== a.reasons.length) return b.reasons.length - a.reasons.length;
        const aDay = a.daysSinceActivity ?? 9999;
        const bDay = b.daysSinceActivity ?? 9999;
        return bDay - aDay;
    });

    const topItems = items.slice(0, 5);

    const getCustomer = (id: string) => customers.find((c) => c.id === id)!;
    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';

    const activeCustomer = panelId ? getCustomer(panelId) : null;
    const activeItem = panelId ? items.find((i) => i.customerId === panelId) ?? null : null;

    if (topItems.length === 0) return null;

    return (
        <>
            <Card className="shadow-sm border-amber-100/60">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-amber-500" />
                        ลูกค้าที่ต้องดูแล
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold w-6 h-6 ml-1">
                            {topItems.length}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                    {topItems.map((item) => {
                        const c = getCustomer(item.customerId);
                        const statusCfg = CUSTOMER_STATUS_CONFIG[c.status];
                        return (
                            <button
                                key={c.id}
                                onClick={() => setPanelId(c.id)}
                                className="w-full flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-amber-50/30 transition-colors text-left"
                            >
                                {/* Alert icon */}
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${item.reasons.includes('overdue_payment') ? 'bg-red-50' : 'bg-amber-50'}`}>
                                    <AlertTriangle className={`w-3.5 h-3.5 ${item.reasons.includes('overdue_payment') ? 'text-red-500' : 'text-amber-500'}`} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{c.business_name}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {item.reasons.includes('overdue_payment') && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">ค้างชำระ</span>
                                        )}
                                        {item.reasons.includes('unpaid_deal') && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                                ยังไม่จ่าย {item.unpaidDeals.length} ดีล
                                            </span>
                                        )}
                                        {item.reasons.includes('no_activity') && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                {item.daysSinceActivity !== null
                                                    ? `ไม่มีกิจกรรม ${Math.floor(item.daysSinceActivity)} วัน`
                                                    : 'ยังไม่เคยติดต่อ'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-gray-100 ${statusCfg?.color || 'text-gray-600'}`}>
                                    {statusCfg?.label || c.status}
                                </span>
                            </button>
                        );
                    })}
                </CardContent>
            </Card>

            {/* ── Customer Detail Panel ── */}
            <SlideOverPanel
                isOpen={!!activeCustomer}
                onClose={() => setPanelId(null)}
                title={activeCustomer?.business_name ?? ''}
                footer={
                    <button
                        onClick={() => {
                            if (activeCustomer) router.push(`/customers/${activeCustomer.id}`);
                        }}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        ดูข้อมูลเต็ม →
                    </button>
                }
            >
                {activeCustomer && activeItem && (() => {
                    const statusCfg = CUSTOMER_STATUS_CONFIG[activeCustomer.status];
                    const recentActs = activities
                        .filter((a) => a.customer_id === activeCustomer.id)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 3);

                    return (
                        <div className="space-y-4">
                            {/* Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 ${statusCfg?.color || 'text-gray-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot || 'bg-gray-400'}`} />
                                    {statusCfg?.label || activeCustomer.status}
                                </span>
                                <span className="text-xs text-gray-500">{activeCustomer.industry}</span>
                            </div>

                            {/* Attention reasons */}
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1.5">
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">สาเหตุที่ต้องดูแล</p>
                                {activeItem.reasons.includes('overdue_payment') && (
                                    <p className="text-sm text-red-700">· สถานะค้างชำระ</p>
                                )}
                                {activeItem.reasons.includes('unpaid_deal') && (
                                    <div>
                                        <p className="text-sm text-orange-700">· ดีลที่ยังไม่ชำระ ({activeItem.unpaidDeals.length} รายการ)</p>
                                        {activeItem.unpaidDeals.map((d, i) => (
                                            <p key={i} className="text-xs text-gray-600 ml-3">– {d.name} ({formatCurrency(d.value)})</p>
                                        ))}
                                    </div>
                                )}
                                {activeItem.reasons.includes('no_activity') && (
                                    <p className="text-sm text-amber-700">
                                        · {activeItem.daysSinceActivity !== null
                                            ? `ไม่มีกิจกรรม ${Math.floor(activeItem.daysSinceActivity)} วัน`
                                            : 'ยังไม่เคยมีกิจกรรม'}
                                    </p>
                                )}
                            </div>

                            {/* Contact info */}
                            <div className="space-y-2">
                                {activeCustomer.phone && (
                                    <a href={`tel:${activeCustomer.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                        📞 {activeCustomer.phone}
                                    </a>
                                )}
                                {activeCustomer.email && (
                                    <a href={`mailto:${activeCustomer.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                        ✉️ {activeCustomer.email}
                                    </a>
                                )}
                                {activeCustomer.assigned_to && (
                                    <p className="text-sm text-gray-600">
                                        👤 ผู้ดูแล: {getUserName(activeCustomer.assigned_to)}
                                    </p>
                                )}
                            </div>

                            {/* Recent activities */}
                            {recentActs.length > 0 ? (
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">กิจกรรมล่าสุด</p>
                                    <div className="space-y-2">
                                        {recentActs.map((act) => {
                                            const cfg = ACTIVITY_TYPE_CONFIG[act.type];
                                            return (
                                                <div key={act.id} className="flex items-start gap-2">
                                                    <span className={`text-xs font-medium shrink-0 ${cfg?.color || 'text-gray-400'}`}>
                                                        {cfg?.label || act.type}
                                                    </span>
                                                    <p className="text-xs text-gray-600 flex-1 truncate">{act.content}</p>
                                                    <span className="text-xs text-gray-400 shrink-0">{getRelativeTime(act.created_at)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">ยังไม่มีกิจกรรม</p>
                            )}
                        </div>
                    );
                })()}
            </SlideOverPanel>
        </>
    );
}
