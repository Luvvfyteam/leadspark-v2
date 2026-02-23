'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sparkles, Send, BarChart3, DollarSign, Users, Target,
    CheckSquare, Flame, Loader2, Bot,
} from 'lucide-react';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isTable?: boolean;
    tableData?: { headers: string[]; rows: string[][] };
};

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

const QUICK_ACTIONS = [
    { id: 'summary', icon: '📊', label: 'สรุปเดือนนี้' },
    { id: 'outstanding', icon: '💰', label: 'ค้างรับทั้งหมด' },
    { id: 'team', icon: '👤', label: 'ผลงานทีม' },
    { id: 'goal', icon: '🎯', label: 'เป้า vs จริง' },
    { id: 'today', icon: '📋', label: 'งานวันนี้' },
    { id: 'hotleads', icon: '🔥', label: 'ลีดที่ควรติดต่อ' },
];

export default function SparkPage() {
    const { tasks, documents, payments, customers, leads, deals, goals } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    const today = '2026-02-17';
    const thisMonth = '2026-02';

    const generateResponse = (actionId: string): Message => {
        const id = `msg-${Date.now()}`;

        if (actionId === 'summary') {
            const monthPayments = payments.filter((p) => p.payment_date.startsWith(thisMonth));
            const monthRevenue = monthPayments.reduce((s, p) => s + p.amount, 0);
            const newCustomers = customers.filter((c) => c.created_at.startsWith(thisMonth)).length;
            const completedTasks = tasks.filter((t) => t.is_completed && t.completed_at?.startsWith(thisMonth)).length;
            const pendingTasks = tasks.filter((t) => !t.is_completed).length;
            const activeDeals = deals.filter((d) => d.status === 'proposal' || d.status === 'in_progress').length;
            const goal = goals.find((g) => g.month === thisMonth);
            const pct = goal ? Math.round((monthRevenue / goal.revenue_target) * 100) : 0;

            return {
                id, role: 'assistant',
                content: `📊 **สรุปเดือนนี้**\n\n💰 รายรับ: **${formatCurrency(monthRevenue)}** ${goal ? `(${pct}% ของเป้า ${formatCurrency(goal.revenue_target)})` : ''}\n👥 ลูกค้าใหม่: **${newCustomers}** ราย\n📋 งานเสร็จ: **${completedTasks}** งาน · ค้างอยู่: **${pendingTasks}** งาน\n🤝 ดีลที่กำลังดำเนินการ: **${activeDeals}** ดีล\n\n💡 _แนะนำ: เน้นปิดดีลที่อยู่ในขั้น negotiation ก่อนสิ้นเดือน_`,
            };
        }

        if (actionId === 'outstanding') {
            const invoices = documents.filter((d) => d.type === 'invoice' && d.status !== 'paid');
            const outstandingList = invoices.map((inv) => {
                const paid = payments.filter((p) => p.document_id === inv.id).reduce((s, p) => s + p.amount, 0);
                const remaining = inv.total - paid;
                const cust = customers.find((c) => c.id === inv.customer_id);
                const isOverdue = inv.due_date && inv.due_date < today;
                return { inv, remaining, custName: cust?.business_name || '-', isOverdue };
            }).filter((i) => i.remaining > 0);

            const total = outstandingList.reduce((s, i) => s + i.remaining, 0);
            const overdueCount = outstandingList.filter((i) => i.isOverdue).length;

            let content = `💰 **ค้างรับทั้งหมด: ${formatCurrency(total)}**\n\n`;
            content += `📄 ${outstandingList.length} ใบแจ้งหนี้ค้างชำระ`;
            if (overdueCount > 0) content += ` · ⚠️ ${overdueCount} ใบเกินกำหนด`;
            content += '\n\n';
            outstandingList.forEach((i) => {
                content += `${i.isOverdue ? '🔴' : '🟡'} **${i.inv.document_number}** — ${i.custName}: **${formatCurrency(i.remaining)}**${i.isOverdue ? ' _(เกินกำหนด)_' : ''}\n`;
            });
            if (overdueCount > 0) content += `\n💡 _แนะนำ: ติดต่อทวงถามใบที่เกินกำหนดก่อน_`;
            return { id, role: 'assistant', content };
        }

        if (actionId === 'team') {
            const users = [
                { id: 'user-001', name: 'Asia' },
                { id: 'user-002', name: 'Som' },
            ];
            let content = `👤 **ผลงานทีม**\n\n`;
            const headers = ['สมาชิก', 'งานเสร็จ', 'งานค้าง', 'ดีลชนะ', 'ลูกค้าดูแล'];
            const rows: string[][] = [];
            users.forEach((u) => {
                const done = tasks.filter((t) => t.assigned_to === u.id && t.is_completed).length;
                const pending = tasks.filter((t) => t.assigned_to === u.id && !t.is_completed).length;
                const won = deals.filter((d) => d.assigned_to === u.id && d.status === 'completed').length;
                const custCount = customers.filter((c) => c.assigned_to === u.id).length;
                rows.push([u.name, String(done), String(pending), String(won), String(custCount)]);
            });
            return { id, role: 'assistant', content, isTable: true, tableData: { headers, rows } };
        }

        if (actionId === 'goal') {
            const goal = goals.find((g) => g.month === thisMonth);
            if (!goal) return { id, role: 'assistant', content: '⚠️ ยังไม่ได้ตั้งเป้าหมายเดือนนี้ ไปตั้งค่าได้ที่ ตั้งค่า > เป้าหมาย' };

            const monthRevenue = payments.filter((p) => p.payment_date.startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);
            const wonDeals = deals.filter((d) => d.status === 'completed' && d.created_at.startsWith(thisMonth)).length;
            const newLeads = leads.filter((l) => l.created_at.startsWith(thisMonth)).length;

            const revPct = Math.round((monthRevenue / goal.revenue_target) * 100);
            const dealPct = Math.round((wonDeals / goal.deals_target) * 100);
            const leadPct = Math.round((newLeads / goal.leads_target) * 100);

            const bar = (pct: number) => {
                const filled = Math.min(Math.round(pct / 10), 10);
                return '█'.repeat(filled) + '░'.repeat(10 - filled);
            };

            return {
                id, role: 'assistant',
                content: `🎯 **เป้า vs จริง (เดือนนี้)**\n\n💰 รายรับ\n${bar(revPct)} **${revPct}%** (${formatCurrency(monthRevenue)} / ${formatCurrency(goal.revenue_target)})\n\n🤝 ดีลปิด\n${bar(dealPct)} **${dealPct}%** (${wonDeals} / ${goal.deals_target})\n\n🧲 ลีดใหม่\n${bar(leadPct)} **${leadPct}%** (${newLeads} / ${goal.leads_target})\n\n${revPct >= 80 ? '🎉 _ใกล้ถึงเป้าแล้ว! เร่งปิดอีกนิดเดียว_' : '💡 _เน้นหาลีดเพิ่มและปิดดีลที่ค้างอยู่_'}`,
            };
        }

        if (actionId === 'today') {
            const todayTasks = tasks.filter((t) => t.due_date === today && !t.is_completed);
            const overdue = tasks.filter((t) => t.due_date < today && !t.is_completed);

            let content = `📋 **งานวันนี้** (${todayTasks.length} งาน)\n\n`;
            if (overdue.length > 0) content += `⚠️ งานเลยกำหนด: **${overdue.length}** งาน\n\n`;

            todayTasks.forEach((t) => {
                const cust = customers.find((c) => c.id === t.customer_id);
                content += `☐ **${t.title}** — ${cust?.business_name || ''}\n`;
            });

            if (todayTasks.length === 0) content += '✅ _ไม่มีงานวันนี้!_\n';
            if (overdue.length > 0) {
                content += '\n📌 **เลยกำหนด:**\n';
                overdue.slice(0, 5).forEach((t) => {
                    content += `🔴 ${t.title}\n`;
                });
            }
            return { id, role: 'assistant', content };
        }

        if (actionId === 'hotleads') {
            const boardLeads = leads
                .filter((l) => l.board_status && l.board_status !== 'won' && l.board_status !== 'lost')
                .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
                .slice(0, 5);

            let content = `🔥 **ลีดที่ควรติดต่อ** (Top 5 AI Score)\n\n`;
            boardLeads.forEach((l, idx) => {
                content += `${idx + 1}. **${l.business_name}** — AI Score: **${l.ai_score}** · ${l.industry || 'ไม่ระบุ'}\n`;
            });
            content += '\n💡 _ติดต่อลีดที่มี AI Score สูงก่อน เพื่อเพิ่มอัตราปิดการขาย_';
            return { id, role: 'assistant', content };
        }

        return { id, role: 'assistant', content: 'ไม่พบข้อมูล' };
    };

    const handleQuickAction = async (actionId: string) => {
        const label = QUICK_ACTIONS.find((a) => a.id === actionId)?.label || '';
        setMessages((prev) => [...prev, { id: `msg-u-${Date.now()}`, role: 'user', content: label }]);
        setThinking(true);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
        const resp = generateResponse(actionId);
        setMessages((prev) => [...prev, resp]);
        setThinking(false);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { id: `msg-u-${Date.now()}`, role: 'user', content: userMsg }]);
        setThinking(true);
        await new Promise((r) => setTimeout(r, 1500));
        setMessages((prev) => [
            ...prev,
            { id: `msg-a-${Date.now()}`, role: 'assistant', content: 'ขอโทษครับ ฟีเจอร์ AI Chat กำลังพัฒนาอยู่ ใช้ Quick Actions ด้านบนได้เลยครับ' },
        ]);
        setThinking(false);
    };

    const renderContent = (msg: Message) => {
        if (msg.isTable && msg.tableData) {
            return (
                <div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/\n/g, '<br/>') }} />
                    <table className="w-full mt-3 text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                {msg.tableData.headers.map((h) => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {msg.tableData.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-3 py-2 border text-gray-700">{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return (
            <div
                className="whitespace-pre-wrap text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                    __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/_(.*?)_/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>'),
                }}
            />
        );
    };

    return (
        <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-80px)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Spark AI</h1>
                    <p className="text-xs text-gray-400">ถามข้อมูลธุรกิจของคุณได้ทันที</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        disabled={thinking}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                    >
                        <span>{action.icon}</span> {action.label}
                    </button>
                ))}
            </div>

            {/* Chat Area */}
            <Card className="flex-1 overflow-y-auto shadow-sm p-4 space-y-4 min-h-0">
                {messages.length === 0 && !thinking && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-violet-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">สวัสดีครับ! 👋</h2>
                        <p className="text-sm text-gray-500 max-w-sm">
                            เลือก Quick Action ด้านบน หรือพิมพ์คำถามเกี่ยวกับธุรกิจของคุณ
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                            Spark ตอบได้เฉพาะข้อมูลในระบบของคุณ
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-50 text-gray-800 rounded-bl-md border border-gray-100'
                                }`}
                        >
                            {renderContent(msg)}
                        </div>
                    </div>
                ))}

                {thinking && (
                    <div className="flex items-start">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                            <span className="text-sm text-gray-500">กำลังคิด...</span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </Card>

            {/* Input */}
            <div className="mt-3 flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="ถามอะไรก็ได้เกี่ยวกับธุรกิจ..."
                    disabled={thinking}
                    className="flex-1"
                />
                <Button onClick={handleSend} disabled={thinking || !input.trim()} className="bg-blue-600 hover:bg-blue-700 px-4">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-1.5">
                Spark ตอบได้เฉพาะข้อมูลในระบบของคุณ
            </p>
        </div>
    );
}
