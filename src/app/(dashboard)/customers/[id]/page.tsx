'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { Customer, Activity, Document as Doc, Payment, Task, Deal } from '@/types';
import { CUSTOMER_STATUS_CONFIG, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import {
    ArrowLeft, Phone, Mail, MessageSquare, MapPin, Globe, User, Users,
    FileText, CreditCard, CheckSquare, Sparkles, ClipboardList,
    PhoneCall, PhoneIncoming, StickyNote, FilePlus, Plus, Copy, Check,
    ChevronDown, ChevronUp, AlertTriangle, Clock, Zap,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function monthsSince(dateStr: string): number {
    const then = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

function formatCurr(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

function formatDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeShort(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDateGroupLabel(dateStr: string, t: (k: string) => string) {
    const date = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return t('cust.today');
    if (date.toDateString() === yesterday.toDateString()) return t('cust.yesterday');
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getUserName(id: string) {
    return mockUsers.find(u => u.id === id)?.name || id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Pulse
// ─────────────────────────────────────────────────────────────────────────────

function getPulse(customer: Customer): 'active' | 'warning' | 'danger' {
    if (customer.status === 'active') return 'active';
    if (customer.status === 'pending_delivery') return 'warning';
    return 'danger';
}

const PULSE_CONFIG = {
    active: { dot: 'bg-emerald-500', ring: 'ring-emerald-200', labelKey: 'cust.pulse.active', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
    warning: { dot: 'bg-amber-400', ring: 'ring-amber-200', labelKey: 'cust.pulse.warning', textColor: 'text-amber-700', bg: 'bg-amber-50' },
    danger: { dot: 'bg-red-500', ring: 'ring-red-200', labelKey: 'cust.pulse.danger', textColor: 'text-red-700', bg: 'bg-red-50' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Timeline event union
// ─────────────────────────────────────────────────────────────────────────────

type TLEvent =
    | { kind: 'activity'; data: Activity; ts: string }
    | { kind: 'document'; data: Doc; ts: string }
    | { kind: 'payment'; data: Payment; ts: string }
    | { kind: 'task'; data: Task; ts: string }
    | { kind: 'deal'; data: Deal; ts: string; phase: 'created' | 'completed' };

// ─────────────────────────────────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    const doCopy = () => {
        navigator.clipboard.writeText(value).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button
            onClick={doCopy}
            className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            title="คัดลอก"
        >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Summary Card
// ─────────────────────────────────────────────────────────────────────────────

function AISummaryCard({ customer, payments, t }: {
    customer: Customer; payments: Payment[]; t: (k: string) => string;
}) {
    const [expanded, setExpanded] = useState(true);
    const custPays = payments.filter(p => p.customer_id === customer.id);
    const total = custPays.reduce((s, p) => s + p.amount, 0);
    const months = monthsSince(customer.created_at);
    const sorted = [...custPays].sort((a, b) => b.payment_date.localeCompare(a.payment_date));
    const lastPay = sorted[0];
    const daysSince = lastPay
        ? Math.floor((Date.now() - new Date(lastPay.payment_date + 'T00:00:00').getTime()) / 86400000)
        : null;
    const isLate = daysSince !== null && daysSince > 60;

    const TOP: Record<string, string> = {
        'ร้านอาหาร/คาเฟ่': 'ระบบสั่งอาหาร', 'ยิม/ฟิตเนส': 'แอปสมาชิก',
        'คลินิก/สปา': 'ระบบนัดหมาย', 'โรงแรม/รีสอร์ท': 'ระบบจองห้อง',
        'การศึกษา/โรงเรียน': 'แพลตฟอร์มเรียน', 'ร้านค้าปลีก': 'ระบบ POS',
    };
    const topService = TOP[customer.industry] || 'Software Package';

    return (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-indigo-100">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">{t('cust.aiSummary')}</span>
                </div>
                <button onClick={() => setExpanded(e => !e)} className="text-white/70 hover:text-white transition-colors">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {expanded && (
                <div className="bg-white p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {t('cust.monthsAsCustomer')}
                            </p>
                            <p className="text-2xl font-black text-slate-900 leading-tight">{months}</p>
                            <p className="text-[10px] text-slate-400">{t('cust.monthsAsCustomer')}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                <CreditCard className="w-2.5 h-2.5" /> {t('cust.orders')}
                            </p>
                            <p className="text-2xl font-black text-slate-900 leading-tight">{custPays.length}</p>
                            <p className="text-[10px] text-slate-400">{t('cust.orders')}</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mb-1">{t('cust.totalRevenue')}</p>
                        <p className="text-xl font-black text-indigo-700">{formatCurr(total)}</p>
                    </div>

                    <div className={cn('rounded-xl p-3', isLate ? 'bg-red-50' : 'bg-slate-50')}>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('cust.lastOrder')}</p>
                        {lastPay ? (
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-700">{formatDateLabel(lastPay.payment_date)}</p>
                                {isLate && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 shrink-0">
                                        <AlertTriangle className="w-3 h-3" /> {t('cust.lateWarning')}
                                    </span>
                                )}
                            </div>
                        ) : <p className="text-sm text-slate-400 italic">—</p>}
                    </div>

                    <div className="bg-violet-50 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-violet-400 mb-1">⭐ {t('cust.topService')}</p>
                        <p className="text-sm font-bold text-violet-800">{topService}</p>
                    </div>

                    <p className="text-[9px] text-slate-300 text-center flex items-center justify-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> {t('cust.aiSummaryNote')}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Info
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, href, copy }: {
    icon: React.ReactNode; label: string; value?: string; href?: string; copy?: string;
}) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2.5 group/row py-1.5 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                {href ? (
                    <a href={href} className="text-sm text-indigo-600 hover:underline font-medium break-all"
                        target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                        {value}
                    </a>
                ) : (
                    <span className="text-sm text-slate-700 break-words">{value}</span>
                )}
            </div>
            {copy && <CopyBtn value={copy} />}
        </div>
    );
}

function QuickInfoPanel({ customer, t }: { customer: Customer; t: (k: string) => string }) {
    const [showSecondary, setShowSecondary] = useState(false);
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">{t('cust.contactInfo')}</p>
            <div className="space-y-0.5">
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="โทรศัพท์"
                    value={customer.phone} href={`tel:${customer.phone}`} copy={customer.phone} />
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="อีเมล"
                    value={customer.email} href={`mailto:${customer.email}`} copy={customer.email} />
                <InfoRow icon={<MessageSquare className="w-3.5 h-3.5" />} label="LINE ID"
                    value={customer.line_id} copy={customer.line_id} />
                <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="เว็บไซต์"
                    value={customer.website_url} href={customer.website_url} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="ที่อยู่"
                    value={customer.address} />

                {customer.contact_person_name && (
                    <div className="pt-3 mt-1 border-t border-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t('cust.contactPerson')}</p>
                        <InfoRow icon={<User className="w-3.5 h-3.5" />}
                            label={customer.contact_person_position || 'ผู้ติดต่อ'}
                            value={customer.contact_person_name}
                            copy={customer.contact_person_phone || customer.contact_person_email} />
                        <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="โทร (ผู้ติดต่อ)"
                            value={customer.contact_person_phone}
                            href={customer.contact_person_phone ? `tel:${customer.contact_person_phone}` : undefined}
                            copy={customer.contact_person_phone} />
                    </div>
                )}

                {customer.secondary_contact_name && (
                    <div className="pt-1">
                        <button onClick={() => setShowSecondary(s => !s)}
                            className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 py-1">
                            {showSecondary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            ผู้ติดต่อสำรอง
                        </button>
                        {showSecondary && (
                            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="ผู้ติดต่อสำรอง"
                                value={customer.secondary_contact_name} copy={customer.secondary_contact_phone} />
                        )}
                    </div>
                )}

                <div className="pt-3 mt-1 border-t border-slate-50">
                    <InfoRow icon={<Users className="w-3.5 h-3.5" />} label={t('cust.assignedTo')}
                        value={getUserName(customer.assigned_to)} />
                </div>

                {customer.important_notes && (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                            ⚠️ {t('cust.importantNotes')}
                        </p>
                        <p className="text-xs text-amber-800 leading-relaxed italic">{customer.important_notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions
// ─────────────────────────────────────────────────────────────────────────────

function QuickActions({ customer, onDone, t }: {
    customer: Customer; onDone: () => void; t: (k: string) => string;
}) {
    const { addActivity, addTask, currentUser } = useAppStore();
    const [panel, setPanel] = useState<'call' | 'note' | null>(null);
    const [callType, setCallType] = useState<'out' | 'in'>('out');
    const [callText, setCallText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDue, setTaskDue] = useState(new Date().toISOString().slice(0, 10));
    const [taskCat, setTaskCat] = useState<'sales' | 'delivery' | 'finance' | 'meeting' | 'other'>('sales');
    const [taskModal, setTaskModal] = useState(false);

    const submitCall = () => {
        if (!callText.trim()) return;
        addActivity({
            id: `act-${Date.now()}`, customer_id: customer.id, lead_id: null, team_id: 'team-001',
            type: 'call',
            content: `[${callType === 'out' ? t('cust.callOut') : t('cust.callIn')}] ${callText}`,
            followup_date: null, created_by: currentUser.id,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
        setCallText(''); setPanel(null); onDone();
    };

    const submitNote = () => {
        if (!noteText.trim()) return;
        addActivity({
            id: `act-${Date.now()}`, customer_id: customer.id, lead_id: null, team_id: 'team-001',
            type: 'note', content: noteText, followup_date: null, created_by: currentUser.id,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
        setNoteText(''); setPanel(null); onDone();
    };

    const submitTask = () => {
        if (!taskTitle.trim()) return;
        addTask({
            id: `task-${Date.now()}`, team_id: 'team-001', customer_id: customer.id, deal_id: null,
            title: taskTitle, description: '', assigned_to: currentUser.id, due_date: taskDue,
            category: taskCat, is_completed: false, completed_at: null, completed_by: null,
            created_by: currentUser.id, created_at: new Date().toISOString(),
        });
        setTaskTitle(''); setTaskModal(false); onDone();
    };

    const ActionBtn = ({ icon, label, panelId, onClick }: {
        icon: React.ReactNode; label: string; panelId?: 'call' | 'note'; onClick?: () => void;
    }) => (
        <button
            onClick={onClick ?? (() => setPanel(panel === panelId ? null : panelId!))}
            className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold w-full transition-all',
                panelId && panel === panelId
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
            )}
        >
            <span className="text-slate-500">{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('cust.quickActions')}</p>
            <div className="grid grid-cols-2 gap-2">
                <ActionBtn icon={<PhoneCall className="w-4 h-4" />} label={t('cust.logCall')} panelId="call" />
                <ActionBtn icon={<StickyNote className="w-4 h-4" />} label={t('cust.addNote')} panelId="note" />
                <ActionBtn icon={<FilePlus className="w-4 h-4" />} label={t('cust.createQuote')}
                    onClick={() => window.open(`/documents?customer_id=${customer.id}&type=quotation`, '_self')} />
                <ActionBtn icon={<Plus className="w-4 h-4" />} label={t('cust.createTask')}
                    onClick={() => setTaskModal(true)} />
            </div>

            {panel === 'call' && (
                <div className="space-y-2 pt-1">
                    <div className="flex gap-1.5">
                        {(['out', 'in'] as const).map(ct => (
                            <button key={ct} onClick={() => setCallType(ct)}
                                className={cn('flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1',
                                    callType === ct ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                                {ct === 'out' ? <><PhoneCall className="w-3 h-3" />{t('cust.callOut')}</> : <><PhoneIncoming className="w-3 h-3" />{t('cust.callIn')}</>}
                            </button>
                        ))}
                    </div>
                    <textarea rows={3} value={callText} onChange={e => setCallText(e.target.value)}
                        placeholder={t('cust.callContent')}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 placeholder:text-slate-300" />
                    <div className="flex gap-2">
                        <button onClick={submitCall} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">{t('cust.submit')}</button>
                        <button onClick={() => setPanel(null)} className="px-3 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">{t('cust.cancel')}</button>
                    </div>
                </div>
            )}

            {panel === 'note' && (
                <div className="space-y-2 pt-1">
                    <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder={t('cust.noteContent')}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 placeholder:text-slate-300" />
                    <div className="flex gap-2">
                        <button onClick={submitNote} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">{t('cust.submit')}</button>
                        <button onClick={() => setPanel(null)} className="px-3 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg">{t('cust.cancel')}</button>
                    </div>
                </div>
            )}

            <Dialog open={taskModal} onOpenChange={setTaskModal}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                            {t('cust.createTask')} — {customer.business_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">{t('cust.taskTitle')} *</label>
                            <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} autoFocus
                                placeholder="เช่น: ส่ง Proposal, โทรติดตาม..."
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">{t('cust.taskDue')}</label>
                                <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">{t('cust.taskCategory')}</label>
                                <select value={taskCat} onChange={e => setTaskCat(e.target.value as typeof taskCat)}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                                    <option value="sales">ขาย</option>
                                    <option value="delivery">ส่งมอบ</option>
                                    <option value="finance">การเงิน</option>
                                    <option value="meeting">ประชุม</option>
                                    <option value="other">อื่นๆ</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskModal(false)}>{t('cust.cancel')}</Button>
                        <Button onClick={submitTask} disabled={!taskTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                            {t('cust.taskCreate')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline card per event type
// ─────────────────────────────────────────────────────────────────────────────

const ACT_ICON_CFG: Record<string, { emoji: string; bg: string; labelColor: string }> = {
    call: { emoji: '📞', bg: 'bg-blue-50', labelColor: 'text-blue-700' },
    note: { emoji: '📝', bg: 'bg-amber-50', labelColor: 'text-amber-700' },
    line: { emoji: '💬', bg: 'bg-green-50', labelColor: 'text-green-700' },
    email: { emoji: '✉️', bg: 'bg-indigo-50', labelColor: 'text-indigo-700' },
    meeting: { emoji: '🤝', bg: 'bg-purple-50', labelColor: 'text-purple-700' },
    task_completed: { emoji: '✅', bg: 'bg-emerald-50', labelColor: 'text-emerald-700' },
    status_change: { emoji: '🔄', bg: 'bg-slate-50', labelColor: 'text-slate-600' },
    payment: { emoji: '💰', bg: 'bg-emerald-50', labelColor: 'text-emerald-800' },
};

const METHOD_LABELS: Record<string, string> = {
    transfer: 'โอนเงิน', promptpay: 'PromptPay', cash: 'เงินสด', other: 'อื่นๆ',
};

const DOC_STATUS: Record<string, { label: string; cls: string }> = {
    draft: { label: 'ร่าง', cls: 'bg-slate-100 text-slate-600' },
    sent: { label: 'ส่งแล้ว', cls: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'ยอมรับ', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'ปฏิเสธ', cls: 'bg-red-100 text-red-600' },
    paid: { label: 'ชำระแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
    overdue: { label: 'เกินกำหนด', cls: 'bg-red-100 text-red-700' },
};

function TLCard({ ev }: { ev: TLEvent }) {
    const connector = <div className="w-px flex-1 bg-slate-100 mt-1" />;

    if (ev.kind === 'activity') {
        const act = ev.data;
        const c = ACT_ICON_CFG[act.type] ?? { emoji: '•', bg: 'bg-slate-50', labelColor: 'text-slate-500' };
        const cfg = ACTIVITY_TYPE_CONFIG[act.type];
        return (
            <div className="flex gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-white', c.bg)}>{c.emoji}</div>
                    {connector}
                </div>
                <div className="flex-1 pb-4">
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={cn('text-[10px] font-bold uppercase tracking-wider', c.labelColor)}>{cfg?.label || act.type}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                                <span>{getUserName(act.created_by)}</span>
                                <span>·</span>
                                <span>{formatTimeShort(act.created_at)}</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{act.content}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (ev.kind === 'document') {
        const doc = ev.data;
        const ds = DOC_STATUS[doc.status] ?? { label: doc.status, cls: 'bg-slate-100 text-slate-500' };
        return (
            <div className="flex gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-white bg-slate-50">🧾</div>
                    {connector}
                </div>
                <div className="flex-1 pb-4">
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {doc.type === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatTimeShort(doc.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{doc.document_number}</p>
                                <p className="text-xs text-slate-500">{formatCurr(doc.total)}</p>
                            </div>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', ds.cls)}>{ds.label}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (ev.kind === 'payment') {
        const p = ev.data;
        return (
            <div className="flex gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-white bg-emerald-50">💰</div>
                    {connector}
                </div>
                <div className="flex-1 pb-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">รับเงิน</span>
                            <span className="text-[10px] text-slate-400">{formatDateLabel(p.payment_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-black text-emerald-700">{formatCurr(p.amount)}</p>
                            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                                {METHOD_LABELS[p.method] || p.method}
                            </span>
                        </div>
                        {p.notes && <p className="text-xs text-emerald-600 mt-1 italic">{p.notes}</p>}
                    </div>
                </div>
            </div>
        );
    }

    if (ev.kind === 'task') {
        const tk = ev.data;
        return (
            <div className="flex gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-white bg-emerald-50">✅</div>
                    {connector}
                </div>
                <div className="flex-1 pb-4">
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">Task เสร็จแล้ว</span>
                        <p className="text-sm font-semibold text-slate-600 line-through opacity-70">{tk.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">โดย {getUserName(tk.completed_by || tk.assigned_to)}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (ev.kind === 'deal') {
        const deal = ev.data;
        const isCompleted = ev.phase === 'completed';
        const DEAL_STATUS: Record<string, { label: string; cls: string }> = {
            proposal: { label: 'เสนอราคา', cls: 'bg-blue-100 text-blue-700' },
            in_progress: { label: 'กำลังดำเนินการ', cls: 'bg-yellow-100 text-yellow-700' },
            completed: { label: 'เสร็จสิ้น', cls: 'bg-green-100 text-green-700' },
            cancelled: { label: 'ยกเลิก', cls: 'bg-gray-100 text-gray-600' },
        };
        const ds = DEAL_STATUS[deal.status];
        return (
            <div className="flex gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-white', isCompleted ? 'bg-green-50' : 'bg-blue-50')}>
                        {isCompleted ? '🎉' : '📋'}
                    </div>
                    {connector}
                </div>
                <div className="flex-1 pb-4">
                    <div className={cn('border rounded-xl p-3 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all', isCompleted ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100')}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={cn('text-[10px] font-bold uppercase tracking-wider', isCompleted ? 'text-green-700' : 'text-blue-700')}>
                                {isCompleted ? 'ดีลเสร็จสิ้น' : 'สร้างดีลใหม่'}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatDateLabel(ev.ts)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{deal.name}</p>
                                <p className="text-xs text-slate-500">{formatCurr(deal.value)}</p>
                            </div>
                            {ds && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', ds.cls)}>{ds.label}</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────────────────────

function CustomerTimeline({ events, t }: { events: TLEvent[]; t: (k: string) => string }) {
    const grouped = useMemo(() => {
        const map = new Map<string, TLEvent[]>();
        events.forEach(ev => {
            const day = ev.ts.slice(0, 10);
            if (!map.has(day)) map.set(day, []);
            map.get(day)!.push(ev);
        });
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [events]);

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">{t('cust.noActivity')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {grouped.map(([day, evs]) => (
                <div key={day}>
                    <div className="flex items-center gap-3 py-2 sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                            {getDateGroupLabel(day, t)}
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="mt-2">
                        {evs.map((ev, i) => <TLCard key={`${ev.kind}-${i}`} ev={ev} />)}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { customers, activities, documents, payments, tasks, deals } = useAppStore();
    const [tick, setTick] = useState(0);

    const customerId = params.id as string;
    const customer = customers.find(c => c.id === customerId);

    const timelineEvents = useMemo((): TLEvent[] => {
        const acts = activities.filter(a => a.customer_id === customerId)
            .map(a => ({ kind: 'activity' as const, data: a, ts: a.created_at }));
        const docs = documents.filter(d => d.customer_id === customerId)
            .map(d => ({ kind: 'document' as const, data: d, ts: d.created_at }));
        const pays = payments.filter(p => p.customer_id === customerId)
            .map(p => ({ kind: 'payment' as const, data: p, ts: p.payment_date + 'T12:00:00' }));
        const tks = tasks.filter(tk => tk.customer_id === customerId && tk.is_completed && tk.completed_at)
            .map(tk => ({ kind: 'task' as const, data: tk, ts: tk.completed_at! }));
        const dealEvs = deals.filter(d => d.customer_id === customerId).flatMap(d => {
            const evs: TLEvent[] = [{ kind: 'deal' as const, data: d, ts: d.created_at, phase: 'created' }];
            if (d.status === 'completed' && d.end_date) {
                evs.push({ kind: 'deal' as const, data: d, ts: d.end_date + 'T18:00:00', phase: 'completed' });
            }
            return evs;
        });
        return [...acts, ...docs, ...pays, ...tks, ...dealEvs].sort((a, b) => b.ts.localeCompare(a.ts));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, activities, documents, payments, tasks, deals, tick]);

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
                <Users className="w-16 h-16 opacity-30" />
                <p className="text-lg font-medium">ไม่พบข้อมูลลูกค้า</p>
                <Link href="/customers" className="text-sm text-indigo-600 hover:underline">{t('cust.backToList')}</Link>
            </div>
        );
    }

    const pulse = getPulse(customer);
    const pulseCfg = PULSE_CONFIG[pulse];
    const statusCfg = CUSTOMER_STATUS_CONFIG[customer.status];
    const custPays = payments.filter(p => p.customer_id === customerId);

    return (
        <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 min-h-screen bg-slate-50">
            {/* ── Sticky Header ─────────────────────────────────────────── */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={() => router.push('/customers')}
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('cust.backToList')}</span>
                        </button>
                        <span className="text-slate-200 hidden sm:inline">|</span>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                            {customer.business_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="font-black text-slate-900 text-lg leading-tight truncate max-w-xs">
                                    {customer.business_name}
                                </h1>
                                <span className={cn(
                                    'flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 shrink-0',
                                    pulseCfg.bg, pulseCfg.textColor, pulseCfg.ring
                                )}>
                                    <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', pulseCfg.dot)} />
                                    {t(pulseCfg.labelKey)}
                                </span>
                                <Badge variant="secondary" className="text-[10px] font-medium hidden md:inline-flex">
                                    {customer.industry}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {customer.phone && (
                            <a href={`tel:${customer.phone}`}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors">
                                <Phone className="w-3.5 h-3.5" /> {customer.phone}
                            </a>
                        )}
                        {customer.line_id && (
                            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-medium">
                                <MessageSquare className="w-3.5 h-3.5" /> {customer.line_id}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="px-4 sm:px-6 py-6">
                <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
                    {/* LEFT */}
                    <div className="xl:w-80 shrink-0 space-y-4">
                        <AISummaryCard customer={customer} payments={custPays} t={t} />
                        <QuickInfoPanel customer={customer} t={t} />
                        <QuickActions customer={customer} onDone={() => setTick(k => k + 1)} t={t} />
                    </div>

                    {/* RIGHT — Timeline */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <ClipboardList className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-900">{t('cust.timeline')}</h2>
                                        <p className="text-[10px] text-slate-400">{timelineEvents.length} รายการ</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className={cn('text-xs font-bold rounded-full px-3', statusCfg?.color || '')}>
                                    {statusCfg?.label || customer.status}
                                </Badge>
                            </div>
                            <CustomerTimeline events={timelineEvents} t={t} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
