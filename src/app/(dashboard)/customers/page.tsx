'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { usePermissions } from '@/lib/usePermissions';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartFilterBar, type FilterConfig } from '@/components/shared/SmartFilterBar';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { CUSTOMER_STATUS_CONFIG, INDUSTRY_OPTIONS, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { formatCurrency, getRelativeTime, formatDate } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import {
    Plus, Star, Download, Users, LayoutGrid, List, ArrowUpDown,
    Upload, Phone, Mail, Globe, MessageSquare, ExternalLink,
    Calendar, User, Zap, FileText, CheckSquare, AlertTriangle,
    TrendingUp, Clock, ChevronRight, Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { CustomerStatus, Customer, Activity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────────────────
type PulseLevel = 'green' | 'amber' | 'red';
type TabKey = 'all' | 'watchlist' | 'pinned';
type QuickActionMode = 'call' | 'note' | null;

interface PulseResult {
    level: PulseLevel;
    reason: string;
    daysSinceContact: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysBetween(isoDate: string): number {
    return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

function getCustomerPulse(
    customerId: string,
    activities: Activity[],
    payments: any[],
    t: (k: string) => string,
): PulseResult {
    const custActs = activities.filter(a => a.customer_id === customerId);
    const lastAct = custActs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const days = lastAct ? daysBetween(lastAct.created_at) : null;

    const hasHeavyOverdue = payments.some(p => p.customer_id === customerId && p.notes?.includes('ค้าง'));

    if (days === null || days > 30 || hasHeavyOverdue) {
        const reason = days === null
            ? t('custList.never')
            : `${t('custList.pulse.reason.noContact')} ${days} ${t('custList.pulse.reason.days')}`;
        return { level: 'red', reason, daysSinceContact: days };
    }
    if (days > 14) {
        return { level: 'amber', reason: `${t('custList.pulse.reason.noContact')} ${days} ${t('custList.pulse.reason.days')}`, daysSinceContact: days };
    }
    return { level: 'green', reason: t('custList.pulse.reason.all_good'), daysSinceContact: days };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PULSE_DOT: Record<PulseLevel, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-500',
};

const PULSE_BG: Record<PulseLevel, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
};

const PULSE_BORDER: Record<PulseLevel, string> = {
    green: 'border-l-emerald-400',
    amber: 'border-l-amber-400',
    red: 'border-l-red-500',
};

const CUSTOMER_FILTERS: FilterConfig[] = [
    { key: 'status', label: 'สถานะ', type: 'select', options: Object.entries(CUSTOMER_STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label })) },
    { key: 'industry', label: 'อุตสาหกรรม', type: 'select', options: INDUSTRY_OPTIONS.map(i => ({ value: i, label: i })) },
    { key: 'assigned_to', label: 'ผู้ดูแล', type: 'select', options: mockUsers.map(u => ({ value: u.id, label: u.name })) },
];

// AI Summary templates by pulse level
const AI_TEMPLATES: Record<PulseLevel, (name: string) => string> = {
    green: (n) => `${n} เป็นลูกค้าที่มีความสัมพันธ์ดี มีการติดต่อสม่ำเสมอและไม่มีปัญหาค้างชำระ ควรรักษาความสัมพันธ์และหาโอกาส upsell บริการเพิ่มเติม`,
    amber: (n) => `${n} อยู่ในช่วงที่ต้องติดตาม ระยะเวลาการติดต่อเริ่มห่างขึ้น แนะนำให้โทรหรือส่งข้อความเพื่อรักษาความสัมพันธ์ก่อนที่จะเย็นชาลง`,
    red: (n) => `⚠️ ${n} ต้องการความสนใจด่วน ไม่ได้มีการติดต่อมาเป็นเวลานาน มีความเสี่ยงที่จะสูญเสียลูกค้ารายนี้ ควรติดต่อโดยเร็ว`,
};

function exportCSV(customers: Customer[]) {
    const headers = ['ชื่อธุรกิจ', 'อุตสาหกรรม', 'โทรศัพท์', 'อีเมล', 'สถานะ', 'ผู้ดูแล', 'สร้างเมื่อ'];
    const rows = customers.map(c => [
        c.business_name, c.industry, c.phone, c.email,
        CUSTOMER_STATUS_CONFIG[c.status]?.label || c.status,
        mockUsers.find(u => u.id === c.assigned_to)?.name || '',
        new Date(c.created_at).toLocaleDateString('th-TH'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomersPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { customers, togglePin, addCustomer, deals, activities, payments, addActivity, addTask } = useAppStore();
    const { isAdmin, canExport } = usePermissions();
    const { showToast } = useToast();

    // ── State ────────────────────────────────────────────────────────────────
    const [view, setView] = useState<'table' | 'card'>('table');
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    // Add form
    const [newName, setNewName] = useState('');
    const [newIndustry, setNewIndustry] = useState('ร้านอาหาร/คาเฟ่');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    // SlideOver quick actions
    const [qaMode, setQaMode] = useState<QuickActionMode>(null);
    const [qaCallDir, setQaCallDir] = useState<'out' | 'in'>('out');
    const [qaText, setQaText] = useState('');
    const [qaTaskTitle, setQaTaskTitle] = useState('');
    const [qaTaskDue, setQaTaskDue] = useState('');
    const [showTaskForm, setShowTaskForm] = useState(false);
    // Tooltips
    const [hoveredPulse, setHoveredPulse] = useState<string | null>(null);

    // ── Computed ─────────────────────────────────────────────────────────────
    const getPulse = useCallback((custId: string) => getCustomerPulse(custId, activities, payments, t), [activities, payments, t]);
    const getDeals = (custId: string) => deals.filter(d => d.customer_id === custId);
    const getActivities = (custId: string) => activities.filter(a => a.customer_id === custId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const getUserName = (id: string) => mockUsers.find(u => u.id === id)?.name || '';

    const filteredAndSorted = useMemo(() => {
        let list = [...customers];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c =>
                c.business_name.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.email.toLowerCase().includes(q),
            );
        }

        // Filters
        if (activeFilters.status) list = list.filter(c => c.status === activeFilters.status);
        if (activeFilters.industry) list = list.filter(c => c.industry === activeFilters.industry);
        if (activeFilters.assigned_to) list = list.filter(c => c.assigned_to === activeFilters.assigned_to);

        // Tab
        if (activeTab === 'pinned') {
            list = list.filter(c => c.is_pinned);
        } else if (activeTab === 'watchlist') {
            list = list.filter(c => {
                const p = getPulse(c.id);
                return p.level === 'red' || p.level === 'amber';
            });
        }

        // Sort
        if (sortConfig) {
            list.sort((a, b) => {
                let va: any = a[sortConfig.key as keyof Customer];
                let vb: any = b[sortConfig.key as keyof Customer];
                if (sortConfig.key === 'totalValue') {
                    va = getDeals(a.id).reduce((s, d) => s + d.value, 0);
                    vb = getDeals(b.id).reduce((s, d) => s + d.value, 0);
                } else if (sortConfig.key === 'lastContact') {
                    const la = getActivities(a.id)[0];
                    const lb = getActivities(b.id)[0];
                    va = la?.created_at || '';
                    vb = lb?.created_at || '';
                } else if (sortConfig.key === 'pulse') {
                    const order = { red: 0, amber: 1, green: 2 };
                    va = order[getPulse(a.id).level];
                    vb = order[getPulse(b.id).level];
                }
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default: pinned first, then by risk (red > amber > green), then recent
            const order = { red: 0, amber: 1, green: 2 };
            list.sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                const pa = order[getPulse(a.id).level];
                const pb = order[getPulse(b.id).level];
                if (pa !== pb) return pa - pb;
                return b.created_at.localeCompare(a.created_at);
            });
        }
        return list;
    }, [customers, searchQuery, activeFilters, sortConfig, activeTab, activities, payments]);

    const watchlistCount = useMemo(() =>
        customers.filter(c => { const p = getPulse(c.id); return p.level !== 'green'; }).length,
        [customers, activities, payments]);

    const pinnedCount = customers.filter(c => c.is_pinned).length;

    const selectedCustomer = useMemo(() =>
        selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) ?? null : null,
        [selectedCustomerId, customers]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleFilterChange = (key: string, value: string | string[] | null) => {
        setActiveFilters(prev => {
            if (value === null) { const n = { ...prev }; delete n[key]; return n; }
            return { ...prev, [key]: value };
        });
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                if (prev.direction === 'asc') return { key, direction: 'desc' };
                return null;
            }
            return { key, direction: 'asc' };
        });
    };

    const handleAdd = () => {
        if (!newName.trim()) return;
        const cust: Customer = {
            id: `cust-${Date.now()}`, team_id: 'team-001',
            business_name: newName, industry: newIndustry,
            address: '', phone: newPhone, email: newEmail,
            line_id: '', website_url: '', facebook_url: '',
            google_maps_url: '', google_rating: 0, google_review_count: 0,
            contact_person_name: '', contact_person_position: '',
            contact_person_phone: '', contact_person_email: '',
            secondary_contact_name: '', secondary_contact_phone: '',
            important_notes: '', status: 'active', is_pinned: false,
            assigned_to: 'user-001', source: 'manual', tags: [],
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        addCustomer(cust);
        showToast(`เพิ่ม "${newName}" แล้ว`);
        setShowAddForm(false);
        setNewName(''); setNewPhone(''); setNewEmail('');
    };

    const handleTogglePin = (id: string, name: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const wasPinned = customers.find(c => c.id === id)?.is_pinned;
        togglePin(id);
        showToast(wasPinned ? `${t('custList.unpinToast')} "${name}"` : `${t('custList.pinToast')} "${name}"`,
            () => togglePin(id));
    };

    const handleSaveQA = () => {
        if (!selectedCustomer || !qaText.trim()) return;
        const type = qaMode === 'call' ? (qaCallDir === 'out' ? 'call_out' : 'call_in') : 'note';
        const act: Activity = {
            id: `act-${Date.now()}`, customer_id: selectedCustomer.id,
            lead_id: null, team_id: 'team-001',
            type: type as any, content: qaText,
            followup_date: null, created_by: 'user-001',
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        addActivity(act);
        showToast(t('custList.action.saved'));
        setQaText(''); setQaMode(null);
    };

    const handleCreateTask = () => {
        if (!selectedCustomer || !qaTaskTitle.trim()) return;
        addTask({
            id: `task-${Date.now()}`, team_id: 'team-001',
            customer_id: selectedCustomer.id, deal_id: null,
            title: qaTaskTitle, description: '',
            assigned_to: 'user-001', due_date: qaTaskDue || new Date().toISOString().split('T')[0],
            category: 'other', is_completed: false,
            completed_at: null, completed_by: null,
            created_by: 'user-001', created_at: new Date().toISOString(),
        });
        showToast(`สร้างงาน "${qaTaskTitle}" แล้ว`);
        setQaTaskTitle(''); setQaTaskDue(''); setShowTaskForm(false);
    };

    // ── Sub-components ────────────────────────────────────────────────────────
    const SortBtn = ({ col, label }: { col: string; label: string }) => (
        <button onClick={() => handleSort(col)} className="group flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
            {label}
            <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === col ? 'text-indigo-600' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
        </button>
    );

    // ── Last Contact Cell ─────────────────────────────────────────────────────
    const LastContactCell = ({ custId }: { custId: string }) => {
        const lastAct = getActivities(custId)[0];
        if (!lastAct) return <span className="text-gray-300 text-sm">—</span>;
        const days = daysBetween(lastAct.created_at);
        const cls = days > 21 ? 'text-red-500 font-semibold' : days > 14 ? 'text-amber-500 font-semibold' : 'text-gray-500';
        const icon = days > 21 ? '🔴' : days > 14 ? '⚠️' : null;
        return (
            <span className={`text-sm flex items-center gap-1 justify-end ${cls}`}>
                {icon} {getRelativeTime(lastAct.created_at)}
            </span>
        );
    };

    // ── Pulse Dot ─────────────────────────────────────────────────────────────
    const PulseDot = ({ custId }: { custId: string }) => {
        const pulse = getPulse(custId);
        return (
            <div className="relative" onMouseEnter={() => setHoveredPulse(custId)} onMouseLeave={() => setHoveredPulse(null)}>
                <div className={`w-2.5 h-2.5 rounded-full ${PULSE_DOT[pulse.level]} ${pulse.level === 'red' ? 'animate-pulse' : ''}`} />
                {hoveredPulse === custId && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xl ${PULSE_BG[pulse.level]}`}>
                        {pulse.level === 'green' && t('custList.pulse.green')}
                        {pulse.level === 'amber' && t('custList.pulse.amber')}
                        {pulse.level === 'red' && t('custList.pulse.red')}
                        {' — '}{pulse.reason}
                    </div>
                )}
            </div>
        );
    };

    // ── SlideOver Content ─────────────────────────────────────────────────────
    const SlideOverContent = () => {
        if (!selectedCustomer) return null;
        const pulse = getPulse(selectedCustomer.id);
        const statusCfg = CUSTOMER_STATUS_CONFIG[selectedCustomer.status];
        const custDeals = getDeals(selectedCustomer.id);
        const activeDeals = custDeals.filter(d => d.status !== 'completed' && d.status !== 'cancelled');
        const totalValue = custDeals.reduce((s, d) => s + d.value, 0);
        const recentActs = getActivities(selectedCustomer.id).slice(0, 5);
        const aiText = AI_TEMPLATES[pulse.level](selectedCustomer.business_name);

        return (
            <div className="space-y-5">
                {/* Header row */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${PULSE_BG[pulse.level]}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${PULSE_DOT[pulse.level]}`} />
                                {pulse.level === 'green' && t('custList.pulse.green')}
                                {pulse.level === 'amber' && t('custList.pulse.amber')}
                                {pulse.level === 'red' && t('custList.pulse.red')}
                            </div>
                            <Badge variant="secondary" className={`text-xs font-bold rounded-full px-2.5 ${statusCfg?.color || ''}`}>
                                {statusCfg?.label}
                            </Badge>
                            <span className="text-xs text-gray-400">{selectedCustomer.industry}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t('custList.col.assigned')}: <span className="font-medium text-gray-700">{getUserName(selectedCustomer.assigned_to)}</span>
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{t('custList.totalValue')}</p>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(totalValue)}</p>
                    </div>
                </div>

                {/* AI Summary */}
                <div className="rounded-xl overflow-hidden border border-indigo-100">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-white text-xs font-bold">{t('custList.slideOver.aiSummary')}</span>
                    </div>
                    <div className="bg-indigo-50/50 px-4 py-3">
                        <p className="text-sm text-gray-700 leading-relaxed">{aiText}</p>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('custList.slideOver.contact')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {selectedCustomer.phone && (
                            <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 transition-colors group">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
                                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <span className="truncate">{selectedCustomer.phone}</span>
                            </a>
                        )}
                        {selectedCustomer.email && (
                            <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 transition-colors group">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
                                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <span className="truncate">{selectedCustomer.email}</span>
                            </a>
                        )}
                        {selectedCustomer.line_id && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                                </div>
                                <span className="truncate">{selectedCustomer.line_id}</span>
                            </div>
                        )}
                        {selectedCustomer.website_url && (
                            <a href={selectedCustomer.website_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 transition-colors group">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
                                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <span className="truncate">Website</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Active Deals */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('custList.slideOver.activeDeals')}</h4>
                    {activeDeals.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">{t('custList.slideOver.noDeals')}</p>
                    ) : (
                        <div className="space-y-2">
                            {activeDeals.slice(0, 3).map(d => (
                                <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="text-sm text-gray-700 font-medium truncate">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 shrink-0 ml-2">{formatCurrency(d.value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activities */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('custList.slideOver.recentActivity')}</h4>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                        {recentActs.length > 0 ? recentActs.map(act => {
                            const cfg = ACTIVITY_TYPE_CONFIG[act.type];
                            return (
                                <div key={act.id} className="flex gap-2.5 hover:bg-white/60 rounded-lg p-1.5 -m-1.5 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[10px] font-bold uppercase ${cfg?.color || 'text-gray-400'}`}>{cfg?.label || act.type}</span>
                                            <span className="text-[10px] text-gray-400 shrink-0">{getRelativeTime(act.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed line-clamp-2">{act.content}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-sm text-gray-400 text-center py-3 italic">{t('custList.slideOver.noActivity')}</p>
                        )}
                    </div>
                </div>

                {/* Important Notes */}
                {selectedCustomer.important_notes && (
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('custList.slideOver.notes')}</h4>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 leading-relaxed">{selectedCustomer.important_notes}</p>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('custList.slideOver.quickActions')}</h4>
                    {!qaMode && !showTaskForm && (
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setQaMode('call')}
                                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl px-4 py-3 text-sm font-semibold transition-all">
                                <Phone className="w-4 h-4" /> {t('custList.action.logCall')}
                            </button>
                            <button onClick={() => setQaMode('note')}
                                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold transition-all">
                                <FileText className="w-4 h-4" /> {t('custList.action.addNote')}
                            </button>
                            <button onClick={() => router.push('/documents')}
                                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold transition-all">
                                <FileText className="w-4 h-4" /> {t('custList.action.createQuote')}
                            </button>
                            <button onClick={() => setShowTaskForm(true)}
                                className="flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl px-4 py-3 text-sm font-semibold transition-all">
                                <CheckSquare className="w-4 h-4" /> {t('custList.action.createTask')}
                            </button>
                        </div>
                    )}

                    {/* Log Call / Note Inline Form */}
                    {qaMode && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-2.5">
                            {qaMode === 'call' && (
                                <div className="flex gap-2">
                                    {(['out', 'in'] as const).map(dir => (
                                        <button key={dir} onClick={() => setQaCallDir(dir)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${qaCallDir === dir ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}>
                                            {dir === 'out' ? t('custList.action.callOut') : t('custList.action.callIn')}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <textarea
                                autoFocus
                                value={qaText}
                                onChange={e => setQaText(e.target.value)}
                                placeholder={qaMode === 'call' ? t('custList.action.callPlaceholder') : t('custList.action.notePlaceholder')}
                                className="w-full h-20 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveQA} disabled={!qaText.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                                    {t('custList.action.save')}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setQaMode(null); setQaText(''); }} className="h-8 text-xs">
                                    {t('custList.action.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Task Form */}
                    {showTaskForm && (
                        <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-3 space-y-2.5">
                            <Input autoFocus placeholder={t('cust.taskTitle')} value={qaTaskTitle} onChange={e => setQaTaskTitle(e.target.value)} className="h-8 text-sm" />
                            <Input type="date" value={qaTaskDue} onChange={e => setQaTaskDue(e.target.value)} className="h-8 text-sm" />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleCreateTask} disabled={!qaTaskTitle.trim()} className="flex-1 bg-violet-600 hover:bg-violet-700 h-8 text-xs">
                                    {t('cust.taskCreate')}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setShowTaskForm(false); setQaTaskTitle(''); }} className="h-8 text-xs">
                                    {t('custList.action.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ── Table Row ─────────────────────────────────────────────────────────────
    const TableRow = ({ c }: { c: Customer }) => {
        const custDeals = getDeals(c.id);
        const totalValue = custDeals.reduce((s, d) => s + d.value, 0);
        const statusCfg = CUSTOMER_STATUS_CONFIG[c.status];
        const pulse = getPulse(c.id);
        return (
            <tr onClick={() => setSelectedCustomerId(c.id)}
                className="hover:bg-indigo-50/30 transition-all duration-150 cursor-pointer group border-b border-gray-50 last:border-0">
                {/* Pulse */}
                <td className="px-3 py-3.5 w-8">
                    <PulseDot custId={c.id} />
                </td>
                {/* Pin */}
                <td className="px-2 py-3.5 w-8" onClick={e => e.stopPropagation()}>
                    <button onClick={e => handleTogglePin(c.id, c.business_name, e)} className="hover:scale-110 transition-transform">
                        <Star className={`w-3.5 h-3.5 ${c.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 group-hover:text-gray-300'} transition-colors`} />
                    </button>
                </td>
                {/* Name */}
                <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.business_name}</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">{c.phone || c.email || '—'}</div>
                </td>
                {/* Industry */}
                <td className="px-4 py-3.5 text-sm text-gray-500">{c.industry}</td>
                {/* Status */}
                <td className="px-4 py-3.5">
                    <Badge variant="secondary" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg?.color || ''}`}>
                        {statusCfg?.label || c.status}
                    </Badge>
                </td>
                {/* Assigned */}
                <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {getUserName(c.assigned_to).charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{getUserName(c.assigned_to)}</span>
                    </div>
                </td>
                {/* Deal value */}
                <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right">{formatCurrency(totalValue)}</td>
                {/* Last contact */}
                <td className="px-4 py-3.5 text-right">
                    <LastContactCell custId={c.id} />
                </td>
                {/* Chevron */}
                <td className="px-3 py-3.5 w-8">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </td>
            </tr>
        );
    };

    // ── Card Item ─────────────────────────────────────────────────────────────
    const CardItem = ({ c }: { c: Customer }) => {
        const custDeals = getDeals(c.id);
        const totalValue = custDeals.reduce((s, d) => s + d.value, 0);
        const statusCfg = CUSTOMER_STATUS_CONFIG[c.status];
        const pulse = getPulse(c.id);
        const lastAct = getActivities(c.id)[0];
        return (
            <Card onClick={() => setSelectedCustomerId(c.id)}
                className={cn(
                    'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border border-gray-100 rounded-xl overflow-hidden border-l-4',
                    PULSE_BORDER[pulse.level],
                )}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2 min-w-0">
                            <button onClick={e => handleTogglePin(c.id, c.business_name, e)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                                <Star className={`w-3.5 h-3.5 ${c.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 group-hover:text-yellow-300'} transition-colors`} />
                            </button>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors text-sm">{c.business_name}</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">{c.industry}</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${PULSE_BG[pulse.level]}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${PULSE_DOT[pulse.level]}`} />
                            {pulse.level === 'green' && t('custList.pulse.green')}
                            {pulse.level === 'amber' && t('custList.pulse.amber')}
                            {pulse.level === 'red' && t('custList.pulse.red')}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/60 rounded-lg p-2.5 mb-3">
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{t('custList.col.dealValue')}</p>
                            <p className="text-sm font-black text-gray-900">{formatCurrency(totalValue)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{t('custList.col.lastContact')}</p>
                            {lastAct ? (
                                <p className={`text-xs font-medium ${daysBetween(lastAct.created_at) > 21 ? 'text-red-500' : daysBetween(lastAct.created_at) > 14 ? 'text-amber-500' : 'text-gray-600'}`}>
                                    {getRelativeTime(lastAct.created_at)}
                                </p>
                            ) : <p className="text-xs text-gray-300">{t('custList.never')}</p>}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white">
                                {getUserName(c.assigned_to).charAt(0)}
                            </div>
                            <span className="text-xs text-gray-600">{getUserName(c.assigned_to)}</span>
                        </div>
                        <Badge variant="secondary" className={`text-[9px] font-bold rounded-full px-2 ${statusCfg?.color || ''}`}>
                            {statusCfg?.label}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const TABS: { key: TabKey; label: string; count?: number }[] = [
        { key: 'all', label: t('custList.tab.all'), count: customers.length },
        { key: 'watchlist', label: t('custList.tab.watchlist'), count: watchlistCount },
        { key: 'pinned', label: t('custList.tab.pinned'), count: pinnedCount },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">{t('custList.title')}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{t('custList.subtitle')} ·{' '}
                            <span className="font-semibold text-gray-600">{filteredAndSorted.length} {t('custList.count')}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="rounded-xl h-9">
                        <Upload className="w-3.5 h-3.5 mr-1.5" />{t('custList.import')}
                    </Button>
                    {canExport && (
                        <Button variant="outline" size="sm" onClick={() => { exportCSV(filteredAndSorted); showToast('ดาวน์โหลด CSV แล้ว'); }} className="rounded-xl h-9">
                            <Download className="w-3.5 h-3.5 mr-1.5" />{t('custList.export')}
                        </Button>
                    )}
                    <Button size="sm" onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-9 shadow-sm">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />{t('custList.addCustomer')}
                    </Button>
                </div>
            </div>

            {/* Tabs + Filter + View Toggle */}
            <div className="flex flex-col gap-3">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
                                activeTab === tab.key ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700',
                            )}>
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={cn(
                                    'text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center',
                                    activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' :
                                        tab.key === 'watchlist' && tab.count > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600',
                                )}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search + Filters + View Toggle */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    <div className="w-full md:flex-1">
                        <SmartFilterBar
                            filters={CUSTOMER_FILTERS}
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                            onSearch={setSearchQuery}
                            searchPlaceholder={t('custList.search')}
                            searchValue={searchQuery}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                        <button onClick={() => setView('table')}
                            className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                            <List className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('card')}
                            className={`p-2 rounded-lg transition-all ${view === 'card' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredAndSorted.length === 0 ? (
                <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    title={customers.length === 0 ? t('custList.empty.title') : t('custList.empty.filtered')}
                    description={customers.length === 0 ? 'เริ่มต้นด้วยการเพิ่มลูกค้าใหม่หรือนำเข้าข้อมูล' : 'ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา'}
                    actionLabel={customers.length === 0 ? t('custList.empty.action') : t('custList.empty.clearFilters')}
                    onAction={customers.length === 0 ? () => setShowAddForm(true) : () => { setActiveFilters({}); setSearchQuery(''); setActiveTab('all'); }}
                />
            ) : view === 'table' ? (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[980px]">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-3 py-3 w-8" title="Pulse"><Zap className="w-3.5 h-3.5 text-gray-300" /></th>
                                <th className="px-2 py-3 w-8" />
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider"><SortBtn col="business_name" label={t('custList.col.name')} /></th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider"><SortBtn col="industry" label={t('custList.col.industry')} /></th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider"><SortBtn col="status" label={t('custList.col.status')} /></th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider"><SortBtn col="assigned_to" label={t('custList.col.assigned')} /></th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right"><SortBtn col="totalValue" label={t('custList.col.dealValue')} /></th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right"><SortBtn col="lastContact" label={t('custList.col.lastContact')} /></th>
                                <th className="px-3 py-3 w-8" />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSorted.map(c => <TableRow key={c.id} c={c} />)}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSorted.map(c => <CardItem key={c.id} c={c} />)}
                </div>
            )}

            {/* SlideOver */}
            <SlideOverPanel
                isOpen={!!selectedCustomer}
                onClose={() => { setSelectedCustomerId(null); setQaMode(null); setQaText(''); setShowTaskForm(false); }}
                title={selectedCustomer?.business_name || ''}
                width="lg"
                footer={
                    <div className="flex gap-2 w-full">
                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => router.push(`/customers/${selectedCustomer?.id}`)}>
                            {t('custList.slideOver.viewFull')} <ExternalLink className="w-3.5 h-3.5 ml-2" />
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedCustomerId(null)}>ปิด</Button>
                    </div>
                }
            >
                <SlideOverContent />
            </SlideOverPanel>

            {/* Add Customer Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{t('custList.addForm.title')}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700">{t('custList.addForm.name')}</label>
                            <Input placeholder="เช่น: บริษัท ก้าวหน้า จำกัด" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700">{t('custList.addForm.industry')}</label>
                            <select value={newIndustry} onChange={e => setNewIndustry(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                {INDUSTRY_OPTIONS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">{t('custList.addForm.phone')}</label>
                                <Input placeholder="08x-xxx-xxxx" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">{t('custList.addForm.email')}</label>
                                <Input placeholder="example@mail.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>{t('custList.addForm.cancel')}</Button>
                        <Button onClick={handleAdd} disabled={!newName.trim()} className="bg-indigo-600 hover:bg-indigo-700">{t('custList.addForm.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader><DialogTitle>{t('custList.import.title')}</DialogTitle></DialogHeader>
                    <div className="py-6">
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center gap-3 hover:bg-gray-50 hover:border-indigo-300 transition-all cursor-pointer group"
                            onClick={() => document.getElementById('csv-upload')?.click()}>
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                <Upload className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">{t('custList.import.hint')}</p>
                                <p className="text-xs text-gray-400 mt-1">{t('custList.import.format')}</p>
                            </div>
                            <input id="csv-upload" type="file" className="hidden" accept=".csv,.xlsx" onChange={() => { showToast('นำเข้าข้อมูลสำเร็จ!'); setShowImportModal(false); }} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImportModal(false)} className="w-full">{t('custList.import.close')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
