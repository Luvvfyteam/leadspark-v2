'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import {
    BarChart3, TrendingUp, Users, Target, PieChart as PieIcon,
    Zap, Calendar, ArrowUpRight, ArrowDownRight, Briefcase, DollarSign,
    UserCheck, UserPlus, Filter, ChevronDown, Check, Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';

// ── Components ────────────────────────────────────────────────────────────

function AIInsight({ icon, text, type = 'neutral' }: { icon: string; text: string; type?: 'positive' | 'warning' | 'neutral' }) {
    const bg = type === 'positive' ? 'bg-green-50 border-green-100' : type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100';
    return (
        <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl border ${bg} shadow-sm`}>
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${type === 'positive' ? 'text-green-600' : type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                    <Zap className="w-3 h-3" /> AI Insight
                </p>
                <p className="text-sm text-gray-800 leading-relaxed font-medium">{text}</p>
            </div>
        </div>
    );
}

function Scorecard({ title, value, change, isPositive, icon: Icon }: { title: string; value: string; change: string; isPositive: boolean; icon: any }) {
    return (
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                        <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {change}
                            <span className="text-gray-400 font-normal ml-1">เทียมกับเดือนก่อน</span>
                        </div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                        <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e'];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const router = useRouter();
    const { payments, leads, deals, customers, tasks, goals, updateGoal } = useAppStore();

    // ── Local States ──────────────────────────────────────────────────────
    const [dateRange, setDateRange] = useState<'thisWeek' | 'thisMonth' | 'thisQuarter'>('thisMonth');
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [revenueTarget, setRevenueTarget] = useState(500000);
    const [dealsTarget, setDealsTarget] = useState(15);
    const [leadsTarget, setLeadsTarget] = useState(50);

    const [drillDownData, setDrillDownData] = useState<{ title: string; type: 'revenue' | 'industry'; key: string } | null>(null);

    const thisMonth = '2026-02';
    const lastMonth = '2026-01';

    // ── Data Processing ────────────────────────────────────────────────────

    // Revenue Data
    const revenueData = useMemo(() => {
        const months: { month: string; revenue: number; goal: number; raw: string }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date('2026-02-17');
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().slice(0, 7);
            const label = d.toLocaleDateString('th-TH', { month: 'short' });
            const revenue = payments.filter((p) => p.payment_date.startsWith(monthStr)).reduce((s, p) => s + p.amount, 0);
            months.push({ month: label, revenue, goal: 500000, raw: monthStr });
        }
        return months;
    }, [payments]);

    const scorecardData = useMemo(() => {
        const currentRevenue = payments.filter(p => p.payment_date.startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);
        const prevRevenue = payments.filter(p => p.payment_date.startsWith(lastMonth)).reduce((s, p) => s + p.amount, 0);

        const currentDeals = deals.filter(d => d.status === 'completed' && d.created_at.startsWith(thisMonth)).length;
        const prevDeals = deals.filter(d => d.status === 'completed' && d.created_at.startsWith(lastMonth)).length;

        const currentLeads = leads.filter(l => l.created_at.startsWith(thisMonth)).length;
        const prevLeads = leads.filter(l => l.created_at.startsWith(lastMonth)).length;

        const totalValue = deals.filter(d => d.status === 'completed' && d.created_at.startsWith(thisMonth)).reduce((s, d) => s + d.value, 0);
        const avgDeal = currentDeals > 0 ? totalValue / currentDeals : 0;

        return {
            revenue: { val: formatCurrency(currentRevenue), change: `${Math.abs(Math.round((currentRevenue - prevRevenue) / (prevRevenue || 1) * 100))}%`, pos: currentRevenue >= prevRevenue },
            deals: { val: currentDeals.toString(), change: `${currentDeals - prevDeals} ดีล`, pos: currentDeals >= prevDeals },
            leads: { val: currentLeads.toString(), change: `${currentLeads - prevLeads} ลีด`, pos: currentLeads >= prevLeads },
            avgDeal: { val: formatCurrency(avgDeal), change: '—', pos: true }
        };
    }, [payments, deals, leads, thisMonth, lastMonth]);

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

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleGoalUpdate = () => {
        updateGoal(thisMonth, { revenue_target: revenueTarget, deals_target: dealsTarget, leads_target: leadsTarget });
        setShowGoalForm(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header + Date Range */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">สรุปผลการดำเนินงาน</h1>
                        <p className="text-sm text-gray-500 mt-0.5">วิเคราะห์ข้อมูลรายรับ และประสิทธิภาพของทีม</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl self-start">
                    {(['thisWeek', 'thisMonth', 'thisQuarter'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateRange === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {r === 'thisWeek' ? 'สัปดาห์นี้' : r === 'thisMonth' ? 'เดือนนี้' : 'ไตรมาสนี้'}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">
                        <Filter className="w-3.5 h-3.5" /> กำหนดเอง
                    </button>
                </div>
            </div>

            {/* Scorecard Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Scorecard title="รายรับทั้งหมด" value={scorecardData.revenue.val} change={scorecardData.revenue.change} isPositive={scorecardData.revenue.pos} icon={DollarSign} />
                <Scorecard title="ปิดดีลสำเร็จ" value={scorecardData.deals.val} change={scorecardData.deals.change} isPositive={scorecardData.deals.pos} icon={Briefcase} />
                <Scorecard title="ลีดใหม่เดือนนี้" value={scorecardData.leads.val} change={scorecardData.leads.change} isPositive={scorecardData.leads.pos} icon={UserPlus} />
                <Scorecard title="เฉลี่ยต่อดีล" value={scorecardData.avgDeal.val} change={scorecardData.avgDeal.change} isPositive={scorecardData.avgDeal.pos} icon={UserCheck} />
            </div>

            {/* Goal Tracker Inline */}
            <Card className="shadow-sm border-blue-100 bg-blue-50/30">
                <CardHeader className="pb-3 border-b border-blue-50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900">
                            <Target className="w-4 h-4 text-blue-600" />
                            ความคืบหน้าเป้าหมาย {dateRange === 'thisMonth' ? 'เดือนกุมภาพันธ์' : ''}
                        </CardTitle>
                        {!showGoalForm && (
                            <Button variant="ghost" size="sm" onClick={() => setShowGoalForm(true)} className="text-xs text-blue-600 hover:bg-blue-100">
                                ปรับเปลี่ยนเป้าหมาย
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-5">
                    {showGoalForm ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">เป้ารายได้ (บาท)</label>
                                <Input type="number" value={revenueTarget} onChange={e => setRevenueTarget(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">เป้าดีลปิด (ราย)</label>
                                <Input type="number" value={dealsTarget} onChange={e => setDealsTarget(Number(e.target.value))} />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button className="flex-1 bg-blue-600" onClick={handleGoalUpdate}>บันทึกเป้าหมาย</Button>
                                <Button variant="outline" onClick={() => setShowGoalForm(false)}>ยกเลิก</Button>
                            </div>
                        </div>
                    ) : goalTracking ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'รายรับ', ...goalTracking.revenue, format: (v: number) => formatCurrency(v), color: 'bg-blue-500' },
                                { label: 'ดีลปิด', ...goalTracking.deals, format: (v: number) => `${v} ดีล`, color: 'bg-green-500' },
                                { label: 'ลีดใหม่', ...goalTracking.leads, format: (v: number) => `${v} ลีด`, color: 'bg-purple-500' },
                            ].map((item) => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-600">{item.label}</span>
                                        <span className="text-xs font-bold text-gray-900">{item.pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200/50 rounded-full h-2">
                                        <div className={`h-2 rounded-full transition-all ${item.color}`} style={{ width: `${item.pct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">{item.format(item.current)} จาก {item.format(item.target)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4 text-center">
                            <p className="text-sm text-gray-500 mb-3">ยังไม่ได้ตั้งเป้าหมายสำหรับรอบนี้</p>
                            <Button onClick={() => setShowGoalForm(true)} size="sm" className="bg-blue-600">ตั้งเป้าหมายทันที</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            วิเคราะห์รายรับรายเดือน
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={revenueData}
                                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                                    onClick={(data: any) => {
                                        if (data && data.activePayload) {
                                            const item = data.activePayload[0].payload;
                                            setDrillDownData({ title: `รายรับเดือน ${item.month}`, type: 'revenue', key: item.raw });
                                        }
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white border shadow-xl rounded-lg p-3">
                                                        <p className="text-xs font-bold text-gray-500 mb-2">{payload[0].payload.month}</p>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-xs text-gray-600">เป้าหมาย:</span>
                                                                <span className="text-xs font-bold">{formatCurrency(Number(payload[0].payload.goal))}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-xs text-gray-600">รายรับจริง:</span>
                                                                <span className="text-xs font-bold text-blue-600">{formatCurrency(Number(payload[1].value))}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-blue-500 mt-2 font-bold animate-pulse">คลิกเพื่อดูรายละเอียด ➜</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="goal" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="เป้าหมาย" />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="รายรับจริง" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <AIInsight icon="💡" text="รายรับเดือนนี้มีแนวโน้มเข้าใกล้เป้าหมายมากกว่าเดือนที่แล้วถึง 15% แนะนำให้เน้นการเก็บเงินจากใบแจ้งหนี้ที่ใกล้ครบกำหนด" type="positive" />
                    </CardContent>
                </Card>

                {/* Industry Distribution */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-purple-500" />
                            สัดส่วนตามอุตสาหกรรม
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={industryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        onClick={(data) => {
                                            setDrillDownData({ title: `ลูกค้ากลุ่ม ${data.name}`, type: 'industry', key: data.name });
                                        }}
                                    >
                                        {industryData.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [formatCurrency(Number(value || 0)), 'รายได้']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-6">
                            {industryData.slice(0, 4).map((item, idx) => (
                                <div key={item.name} className="flex items-center justify-between group cursor-pointer" onClick={() => setDrillDownData({ title: `ลูกค้ากลุ่ม ${item.name}`, type: 'industry', key: item.name })}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                        <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{Math.round(item.value / industryData.reduce((s, x) => s + x.value, 0) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Drill Down SlideOverPanel */}
            <SlideOverPanel
                isOpen={!!drillDownData}
                onClose={() => setDrillDownData(null)}
                title={drillDownData?.title || ''}
                width="lg"
            >
                <div className="space-y-4">
                    {drillDownData?.type === 'revenue' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 mb-4">รายการจ่ายเงินในรอบเดือนที่เลือก</p>
                            {payments.filter(p => p.payment_date.startsWith(drillDownData.key)).map(p => {
                                const cust = customers.find(c => c.id === p.customer_id);
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900">{cust?.business_name || '—'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{formatDate(p.payment_date)} · {p.method}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-blue-600">{formatCurrency(p.amount)}</p>
                                            <Badge variant="secondary" className="text-[10px] mt-1">ชำระแล้ว</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                            {payments.filter(p => p.payment_date.startsWith(drillDownData.key)).length === 0 && (
                                <p className="text-center py-10 text-gray-400 italic">ไม่มีข้อมูลการชำระเงิน</p>
                            )}
                        </div>
                    )}

                    {drillDownData?.type === 'industry' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 mb-4">รายชื่อลูกค้าที่จัดอยู่ในกลุ่มอุตสาหกรรมนี้</p>
                            {customers.filter(c => c.industry === drillDownData.key).map(c => {
                                const custDeals = deals.filter(d => d.customer_id === c.id && d.status === 'completed');
                                const val = custDeals.reduce((s, d) => s + d.value, 0);
                                return (
                                    <div key={c.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                                        <div>
                                            <p className="font-bold text-gray-900">{c.business_name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{custDeals.length} ดีลสำเร็จ · {c.phone || c.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency(val)}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">รายได้รวม</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SlideOverPanel>
        </div>
    );
}
