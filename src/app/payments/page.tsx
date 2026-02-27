'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/lib/usePermissions';
import { useToast } from '@/components/ui/toast';
import { Payment, PaymentMethod } from '@/types';
import {
    DollarSign, TrendingUp, AlertTriangle, CheckCircle, X,
    CreditCard, Receipt, Clock, Plus, FileWarning, Download,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Area, AreaChart } from 'recharts';

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'transfer', label: 'โอนเงิน' },
    { value: 'promptpay', label: 'PromptPay' },
    { value: 'cash', label: 'เงินสด' },
];

export default function PaymentsPage() {
    const router = useRouter();
    const { documents, payments, customers, addPayment, updateDocument, addTask } = useAppStore();
    const { canExport, canRecordPayment } = usePermissions();
    const { showToast } = useToast();
    const [showPayModal, setShowPayModal] = useState(false);
    const [payDocId, setPayDocId] = useState('');
    const [payAmount, setPayAmount] = useState(0);
    const [payDate, setPayDate] = useState('2026-02-17');
    const [payMethod, setPayMethod] = useState<PaymentMethod>('transfer');
    const [payNotes, setPayNotes] = useState('');

    const today = '2026-02-17';

    // Compute summary
    const invoices = documents.filter((d) => d.type === 'invoice');
    const totalRevenue = invoices.reduce((sum, d) => sum + d.total, 0);
    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = totalRevenue - totalReceived;

    const overdueInvoices = invoices.filter((d) => d.status === 'overdue' || (d.due_date && d.due_date < today && d.status !== 'paid'));
    const overdueAmount = overdueInvoices.reduce((sum, d) => {
        const paid = payments.filter((p) => p.document_id === d.id).reduce((s, p) => s + p.amount, 0);
        return sum + (d.total - paid);
    }, 0);

    // Outstanding invoices (unpaid / overdue only)
    const outstandingInvoices = useMemo(() => {
        return invoices
            .filter((d) => d.status !== 'paid')
            .map((d) => {
                const paid = payments.filter((p) => p.document_id === d.id).reduce((s, p) => s + p.amount, 0);
                const remaining = d.total - paid;
                const daysOverdue = d.due_date ? Math.floor((new Date('2026-02-17').getTime() - new Date(d.due_date).getTime()) / 86400000) : 0;
                const cust = customers.find((c) => c.id === d.customer_id);
                return { ...d, paid, remaining, daysOverdue, customerName: cust?.business_name || '-' };
            })
            .filter((d) => d.remaining > 0)
            .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
    }, [invoices, payments, customers]);

    // Recent payments
    const recentPayments = useMemo(() => {
        return [...payments]
            .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
            .slice(0, 10)
            .map((p) => {
                const doc = documents.find((d) => d.id === p.document_id);
                const cust = customers.find((c) => c.id === p.customer_id);
                return { ...p, docNumber: doc?.document_number || '-', customerName: cust?.business_name || '-' };
            });
    }, [payments, documents, customers]);

    // Revenue chart data (last 6 months)
    const chartData = useMemo(() => {
        const months: { month: string; revenue: number; goal: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date('2026-02-17');
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().slice(0, 7);
            const monthLabel = d.toLocaleDateString('th-TH', { month: 'short' });
            const monthPayments = payments.filter((p) => p.payment_date.startsWith(monthStr));
            const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
            months.push({ month: monthLabel, revenue, goal: 500000 });
        }
        return months;
    }, [payments]);

    const openPayModal = (docId: string, remaining: number) => {
        setPayDocId(docId);
        setPayAmount(remaining);
        setPayDate(new Date().toISOString().split('T')[0]);
        setPayMethod('transfer');
        setPayNotes('');
        setShowPayModal(true);
    };

    const handleRecordPayment = () => {
        if (!payDocId || payAmount <= 0) return;
        const payment: Payment = {
            id: `pay-${Date.now()}`,
            team_id: 'team-001',
            document_id: payDocId,
            customer_id: documents.find((d) => d.id === payDocId)?.customer_id || '',
            amount: payAmount,
            payment_date: payDate,
            method: payMethod,
            notes: payNotes,
            created_by: 'user-001',
            created_at: new Date().toISOString(),
        };
        addPayment(payment);

        // Check if fully paid
        const doc = documents.find((d) => d.id === payDocId);
        if (doc) {
            const totalPaid = payments.filter((p) => p.document_id === payDocId).reduce((s, p) => s + p.amount, 0) + payAmount;
            if (totalPaid >= doc.total) {
                updateDocument(payDocId, { status: 'paid' });
            }
        }
        showToast('บันทึกรับเงินเรียบร้อย ✓');
        setShowPayModal(false);
    };

    const exportCSV = () => {
        const headers = ['ลูกค้า', 'เลขที่', 'จำนวนเงิน', 'วันที่', 'ช่องทาง', 'หมายเหตุ'];
        const rows = payments.map((p) => [
            customers.find((c) => c.id === p.customer_id)?.business_name || '',
            documents.find((d) => d.id === p.document_id)?.document_number || '',
            p.amount.toString(), p.payment_date,
            PAYMENT_METHODS.find((m) => m.value === p.method)?.label || '', p.notes,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
        URL.revokeObjectURL(url);
        showToast('ดาวน์โหลด CSV แล้ว');
    };

    const handleCreateFollowUp = (doc: typeof outstandingInvoices[0]) => {
        showToast(`สร้างงานทวงถามเรียบร้อย`);
        addTask({
            id: `task-${Date.now()}`,
            team_id: 'team-001',
            customer_id: doc.customer_id,
            deal_id: doc.deal_id,
            title: `ทวงถามชำระเงิน ${doc.document_number} - ${doc.customerName}`,
            description: `ค้างชำระ ${formatCurrency(doc.remaining)}`,
            assigned_to: 'user-001',
            due_date: new Date().toISOString().split('T')[0],
            category: 'finance',
            is_completed: false,
            completed_at: null,
            completed_by: null,
            created_by: 'user-001',
            created_at: new Date().toISOString(),
        });
    };

    const summaryCards = [
        { label: 'รายได้รวม', value: totalRevenue, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'รับแล้ว', value: totalReceived, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'ค้างชำระ', value: outstanding, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'เกินกำหนด', value: overdueAmount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-gray-900">การชำระเงิน</h1>
                        {canExport && (
                            <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl">
                                <Download className="w-4 h-4 mr-1" /> CSV
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">ติดตามรายรับและการชำระเงิน</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <Card key={card.label} className="shadow-sm border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 font-medium">{card.label}</span>
                                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                                    <card.icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                            </div>
                            <p className={`text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Chart */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        รายรับ 6 เดือนย้อนหลัง
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value) => [formatCurrency(Number(value || 0)), 'รายรับ']} />
                                <ReferenceLine y={500000} stroke="#f59e0b" strokeDasharray="6 4" label={{ value: 'เป้าหมาย', position: 'right', fill: '#f59e0b', fontSize: 11 }} />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Outstanding Invoices */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileWarning className="w-4 h-4 text-amber-500" />
                        ใบแจ้งหนี้ค้างชำระ ({outstandingInvoices.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {outstandingInvoices.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">ไม่มีใบแจ้งหนี้ค้างชำระ 🎉</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b text-[10px] font-medium text-gray-500 uppercase">
                                <div className="col-span-2">เลขที่</div>
                                <div className="col-span-2">ลูกค้า</div>
                                <div className="col-span-1 text-right">ยอด</div>
                                <div className="col-span-1 text-right">ค้าง</div>
                                <div className="col-span-1">ครบกำหนด</div>
                                <div className="col-span-1 text-center">เกิน</div>
                                <div className="col-span-4 text-center">การดำเนินการ</div>
                            </div>
                            {outstandingInvoices.map((inv) => (
                                <div key={inv.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 items-center text-sm">
                                    <div className="col-span-2 font-mono text-gray-700">{inv.document_number}</div>
                                    <div className="col-span-2 truncate"><button onClick={() => router.push(`/customers/${inv.customer_id}`)} className="text-blue-600 hover:underline text-left">{inv.customerName}</button></div>
                                    <div className="col-span-1 text-right text-gray-500">{formatCurrency(inv.total)}</div>
                                    <div className="col-span-1 text-right font-semibold text-amber-600">{formatCurrency(inv.remaining)}</div>
                                    <div className="col-span-1">
                                        <span className="text-xs text-gray-400">
                                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        {inv.daysOverdue > 0 ? (
                                            <Badge variant="destructive" className="text-[10px] px-1.5">{inv.daysOverdue} วัน</Badge>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-4 flex justify-center gap-2">
                                        <Button size="sm" onClick={() => openPayModal(inv.id, inv.remaining)}
                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 gap-1">
                                            <CreditCard className="w-3 h-3" /> บันทึกรับเงิน
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleCreateFollowUp(inv)}
                                            className="h-7 text-xs gap-1">
                                            <Receipt className="w-3 h-3" /> สร้างงานทวง
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        การชำระเงินล่าสุด
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {recentPayments.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">ยังไม่มีการชำระเงิน</div>
                    ) : (
                        recentPayments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{p.customerName}</p>
                                        <p className="text-xs text-gray-400">{p.docNumber} · {PAYMENT_METHODS.find((m) => m.value === p.method)?.label}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">+{formatCurrency(p.amount)}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(p.payment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Record Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPayModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">บันทึกรับเงิน</h2>
                            <button onClick={() => setShowPayModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-500">ใบแจ้งหนี้: {documents.find((d) => d.id === payDocId)?.document_number}</p>
                            <p className="text-xs text-blue-500">ลูกค้า: {customers.find((c) => c.id === documents.find((d) => d.id === payDocId)?.customer_id)?.business_name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน</label>
                            <Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} min={0} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ชำระ</label>
                                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทาง</label>
                                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                                    className="w-full border rounded-md px-3 py-2 text-sm">
                                    {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">โน้ต</label>
                            <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม..." />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowPayModal(false)}>ยกเลิก</Button>
                            <Button onClick={handleRecordPayment} disabled={payAmount <= 0} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" /> บันทึก
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
