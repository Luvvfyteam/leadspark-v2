'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import {
    BarChart3, TrendingUp, Users, Target, PieChart as PieIcon,
    Zap,
} from 'lucide-react';

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

function AIInsight({ icon, text, type = 'neutral' }: { icon: string; text: string; type?: 'positive' | 'warning' | 'neutral' }) {
    const bg = type === 'positive' ? 'bg-green-50 border-green-100' : type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-violet-50 border-violet-100';
    return (
        <div className={`mt-4 flex items-start gap-2.5 p-3 rounded-lg border ${bg}`}>
            <span className="text-base flex-shrink-0">{icon}</span>
            <div>
                <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> AI Insight
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
            </div>
        </div>
    );
}

const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e'];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function ReportsPage() {
    const { payments, leads, deals, customers, tasks, goals } = useAppStore();

    const thisMonth = '2026-02';

    // Revenue chart (6 months)
    const revenueData = useMemo(() => {
        const months: { month: string; revenue: number; goal: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date('2026-02-17');
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().slice(0, 7);
            const label = d.toLocaleDateString('th-TH', { month: 'short' });
            const revenue = payments.filter((p) => p.payment_date.startsWith(monthStr)).reduce((s, p) => s + p.amount, 0);
            months.push({ month: label, revenue, goal: 500000 });
        }
        return months;
    }, [payments]);

    // Revenue insight
    const revenueInsight = useMemo(() => {
        const thisMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
        const lastMonthRevenue = revenueData[revenueData.length - 2]?.revenue || 0;
        const goal = 500000;
        const pct = Math.round((thisMonthRevenue / goal) * 100);
        if (lastMonthRevenue > 0) {
            const change = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
            if (change > 0) return { icon: '📈', text: `รายรับเดือนนี้ ${formatCurrency(thisMonthRevenue)} เพิ่มขึ้น ${change}% จากเดือนที่แล้ว · อยู่ที่ ${pct}% ของเป้า ฿500,000`, type: 'positive' as const };
            return { icon: '📉', text: `รายรับเดือนนี้ ${formatCurrency(thisMonthRevenue)} ลดลง ${Math.abs(change)}% จากเดือนที่แล้ว · ต้องเร่งปิดดีลเพื่อให้ถึงเป้า ฿500,000`, type: 'warning' as const };
        }
        return { icon: '💰', text: `รายรับเดือนนี้ ${formatCurrency(thisMonthRevenue)} คิดเป็น ${pct}% ของเป้าหมาย`, type: 'neutral' as const };
    }, [revenueData]);

    // Conversion Funnel
    const funnelData = useMemo(() => {
        const total = leads.length;
        const contacted = leads.filter((l) => l.board_status && l.board_status !== 'new').length;
        const interested = leads.filter((l) => l.board_status === 'interested' || l.board_status === 'won').length;
        const won = leads.filter((l) => l.board_status === 'won').length;
        return [
            { stage: 'Lead', count: total, pct: 100 },
            { stage: 'Contacted', count: contacted, pct: total ? Math.round((contacted / total) * 100) : 0 },
            { stage: 'Interested', count: interested, pct: total ? Math.round((interested / total) * 100) : 0 },
            { stage: 'Won', count: won, pct: total ? Math.round((won / total) * 100) : 0 },
        ];
    }, [leads]);

    // Funnel insight — biggest drop-off
    const funnelInsight = useMemo(() => {
        let biggestDrop = { from: '', to: '', drop: 0 };
        for (let i = 1; i < funnelData.length; i++) {
            const drop = funnelData[i - 1].pct - funnelData[i].pct;
            if (drop > biggestDrop.drop) biggestDrop = { from: funnelData[i - 1].stage, to: funnelData[i].stage, drop };
        }
        const dropOff = 100 - funnelData[1].pct;
        return {
            icon: '⚠️',
            text: `จุดรั่วใหญ่สุด: ${biggestDrop.from} → ${biggestDrop.to} (ลดลง ${biggestDrop.drop}%) · ลีด ${dropOff}% ยังไม่ถูกติดต่อ ควรตั้งงานติดตามให้ครบทุกลีด`,
            type: 'warning' as const,
        };
    }, [funnelData]);

    // Team Performance
    const teamData = useMemo(() => {
        const users = [
            { id: 'user-001', name: 'Asia' },
            { id: 'user-002', name: 'Som' },
        ];
        return users.map((u) => ({
            name: u.name,
            tasksDone: tasks.filter((t) => t.assigned_to === u.id && t.is_completed).length,
            tasksPending: tasks.filter((t) => t.assigned_to === u.id && !t.is_completed).length,
            dealsWon: deals.filter((d) => d.assigned_to === u.id && d.status === 'completed').length,
            revenue: deals.filter((d) => d.assigned_to === u.id && d.status === 'completed').reduce((s, d) => s + d.value, 0),
            customers: customers.filter((c) => c.assigned_to === u.id).length,
        }));
    }, [tasks, deals, customers]);

    // Team insight
    const teamInsight = useMemo(() => {
        if (teamData.length < 2) return null;
        const [a, b] = teamData;
        const moreDeals = a.dealsWon >= b.dealsWon ? a : b;
        const moreTasks = a.tasksDone >= b.tasksDone ? a : b;
        return {
            icon: '👥',
            text: `${moreDeals.name} ปิดดีลได้ ${moreDeals.dealsWon} ดีล · ${moreTasks.name} เสร็จงานมากกว่า ${moreTasks.tasksDone} งาน · ทั้งคู่ดูแลลูกค้า ${a.customers + b.customers} ราย`,
            type: 'neutral' as const,
        };
    }, [teamData]);

    // Revenue by Industry
    const industryData = useMemo(() => {
        const map: Record<string, number> = {};
        deals.filter((d) => d.status === 'completed').forEach((d) => {
            const cust = customers.find((c) => c.id === d.customer_id);
            const industry = cust?.industry || 'ไม่ระบุ';
            map[industry] = (map[industry] || 0) + d.value;
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }));
    }, [deals, customers]);

    // Industry insight
    const industryInsight = useMemo(() => {
        if (industryData.length === 0) return null;
        const top = industryData[0];
        const total = industryData.reduce((s, i) => s + i.value, 0);
        const pct = Math.round((top.value / total) * 100);
        return {
            icon: '🏆',
            text: `อุตสาหกรรมที่ทำรายได้สูงสุด: ${top.name} (${formatCurrency(top.value)} · ${pct}% ของรายรับทั้งหมด) ควรโฟกัสกลุ่มลีดอุตสาหกรรมนี้เพิ่มขึ้น`,
            type: 'positive' as const,
        };
    }, [industryData]);

    // Goal Tracking
    const goalTracking = useMemo(() => {
        const goal = goals.find((g) => g.month === thisMonth);
        if (!goal) return null;
        const revenue = payments.filter((p) => p.payment_date.startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);
        const wonDeals = deals.filter((d) => d.status === 'completed' && d.created_at.startsWith(thisMonth)).length;
        const newLeads = leads.filter((l) => l.created_at.startsWith(thisMonth)).length;
        return {
            revenue: { current: revenue, target: goal.revenue_target, pct: Math.min(Math.round((revenue / goal.revenue_target) * 100), 100) },
            deals: { current: wonDeals, target: goal.deals_target, pct: Math.min(Math.round((wonDeals / goal.deals_target) * 100), 100) },
            leads: { current: newLeads, target: goal.leads_target, pct: Math.min(Math.round((newLeads / goal.leads_target) * 100), 100) },
        };
    }, [goals, payments, deals, leads, thisMonth]);

    // Goal projection insight
    const goalInsight = useMemo(() => {
        if (!goalTracking) return null;
        const { revenue } = goalTracking;
        const remaining = revenue.target - revenue.current;
        if (revenue.pct >= 80) return { icon: '🎉', text: `ถึงเป้า ${revenue.pct}% แล้ว! ต้องการอีก ${formatCurrency(remaining)} เพื่อปิดเป้าเดือนนี้ — ปิดดีล 1-2 ดีลก็พอ`, type: 'positive' as const };
        if (revenue.pct >= 50) return { icon: '💡', text: `ถึงเป้า ${revenue.pct}% ต้องการอีก ${formatCurrency(remaining)} — เน้นติดตาม 3 ดีลที่ใกล้ปิดที่สุด`, type: 'neutral' as const };
        return { icon: '🚨', text: `ถึงเป้าเพียง ${revenue.pct}% ต้องหาลีดเพิ่มและเร่งกระบวนการขาย — พิจารณาปรับ pipeline ด่วน`, type: 'warning' as const };
    }, [goalTracking]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
                <p className="text-sm text-gray-500 mt-0.5">ภาพรวมผลงานและข้อมูลเชิงลึก</p>
            </div>

            {/* Revenue Overview */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        รายรับ vs เป้าหมาย (6 เดือน)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value) => [formatCurrency(Number(value || 0))]} />
                                <Bar dataKey="goal" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="เป้าหมาย" />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="รายรับจริง" />
                                <Legend />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <AIInsight {...revenueInsight} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            Conversion Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {funnelData.map((item, idx) => (
                            <div key={item.stage}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{item.stage}</span>
                                    <span className="text-gray-500">{item.count} ({item.pct}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-6">
                                    <div
                                        className="h-6 rounded-full transition-all flex items-center justify-end pr-2"
                                        style={{ width: `${Math.max(item.pct, 8)}%`, backgroundColor: FUNNEL_COLORS[idx] }}
                                    >
                                        <span className="text-[11px] font-medium text-white">{item.pct}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <AIInsight {...funnelInsight} />
                    </CardContent>
                </Card>

                {/* Revenue by Industry */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-purple-500" />
                            รายรับตามอุตสาหกรรม
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={industryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {industryData.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [formatCurrency(Number(value || 0))]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                            {industryData.map((item, idx) => (
                                <div key={item.name} className="flex items-center gap-1 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                    <span className="text-gray-600">{item.name}</span>
                                </div>
                            ))}
                        </div>
                        {industryInsight && <AIInsight {...industryInsight} />}
                    </CardContent>
                </Card>
            </div>

            {/* Team Performance */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        ผลงานทีม
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
                                <th className="px-4 py-3 text-left">สมาชิก</th>
                                <th className="px-4 py-3 text-center">งานเสร็จ</th>
                                <th className="px-4 py-3 text-center">งานค้าง</th>
                                <th className="px-4 py-3 text-center">ดีลชนะ</th>
                                <th className="px-4 py-3 text-right">รายรับ</th>
                                <th className="px-4 py-3 text-center">ลูกค้าดูแล</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamData.map((m) => (
                                <tr key={m.name} className="border-b border-gray-100 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                {m.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-sm text-gray-900">{m.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{m.tasksDone}</td>
                                    <td className="px-4 py-3 text-center text-sm text-amber-600 font-medium">{m.tasksPending}</td>
                                    <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{m.dealsWon}</td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(m.revenue)}</td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600">{m.customers}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {teamInsight && (
                        <div className="px-4 pb-4">
                            <AIInsight {...teamInsight} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Goal Tracking */}
            {goalTracking && (
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            เป้าหมายเดือนนี้
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {[
                            { label: 'รายรับ', ...goalTracking.revenue, format: (v: number) => formatCurrency(v), color: 'bg-blue-500' },
                            { label: 'ดีลปิด', ...goalTracking.deals, format: (v: number) => `${v} ดีล`, color: 'bg-green-500' },
                            { label: 'ลีดใหม่', ...goalTracking.leads, format: (v: number) => `${v} ลีด`, color: 'bg-purple-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="text-gray-500">{item.format(item.current)} / {item.format(item.target)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${item.color}`}
                                        style={{ width: `${item.pct}%` }}
                                    />
                                </div>
                                <p className="text-right text-xs text-gray-400 mt-0.5">{item.pct}%</p>
                            </div>
                        ))}
                        {goalInsight && <AIInsight {...goalInsight} />}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
