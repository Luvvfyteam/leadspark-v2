'use client';

import { use, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';
import { PinButton } from '@/components/shared/PinButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { CUSTOMER_STATUS_CONFIG, DEAL_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, TASK_CATEGORY_CONFIG, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/utils';
import { mockDeals } from '@/lib/mock-data-extra';
import { mockUsers } from '@/lib/mock-data';
import { mockDocuments } from '@/lib/mock-docs';
import {
    ArrowLeft, Phone, Mail, Globe, Facebook, MapPin, Star as StarIcon,
    MessageCircle, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
    CalendarCheck, StickyNote, ArrowRightLeft, Banknote, CheckCircle, X, Tag,
} from 'lucide-react';
import { ActivityType } from '@/types';

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Phone, MessageCircle, Mail, CalendarCheck, StickyNote, ArrowRightLeft, Banknote, CheckCircle,
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { customers, togglePin, updateCustomer, activities, addActivity, updateActivity, deleteActivity, tasks, toggleTask } = useAppStore();
    const customer = customers.find((c) => c.id === id);

    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState('');
    const [notesSaved, setNotesSaved] = useState(false);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [activityType, setActivityType] = useState<ActivityType>('note');
    const [activityContent, setActivityContent] = useState('');
    const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
    const [showCompletedTasks, setShowCompletedTasks] = useState(false);

    const deals = useMemo(() => mockDeals.filter((d) => d.customer_id === id), [id]);
    const customerActivities = useMemo(
        () => activities.filter((a) => a.customer_id === id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [activities, id]
    );
    const customerTasks = useMemo(() => tasks.filter((t) => t.customer_id === id), [tasks, id]);
    const customerDocs = useMemo(() => mockDocuments.filter((d) => d.customer_id === id), [id]);
    const openTasks = customerTasks.filter((t) => !t.is_completed);
    const completedTasks = customerTasks.filter((t) => t.is_completed);

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500">ไม่พบลูกค้า</p>
                <Button variant="outline" onClick={() => router.push('/customers')} className="mt-4">
                    กลับไปหน้าลูกค้า
                </Button>
            </div>
        );
    }

    const statusConfig = CUSTOMER_STATUS_CONFIG[customer.status];
    const getUserName = (uid: string) => mockUsers.find((u) => u.id === uid)?.name || '';

    const handleSaveNotes = () => {
        updateCustomer(customer.id, { important_notes: notesValue });
        setEditingNotes(false);
    };

    // Auto-save notes with 3s debounce
    const handleNotesChange = useCallback((val: string) => {
        setNotesValue(val);
        setNotesSaved(false);
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            if (customer) {
                updateCustomer(customer.id, { important_notes: val });
                setNotesSaved(true);
                setTimeout(() => setNotesSaved(false), 2000);
            }
        }, 3000);
    }, [customer, updateCustomer]);

    useEffect(() => {
        return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    }, []);

    const handleAddActivity = () => {
        if (!activityContent.trim()) return;
        addActivity({
            id: `act-${Date.now()}`,
            customer_id: customer.id,
            lead_id: null,
            team_id: 'team-001',
            type: activityType,
            content: activityContent,
            followup_date: null,
            created_by: 'user-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        setActivityContent('');
        setShowAddActivity(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs items={[
                { label: 'ลูกค้า', href: '/customers' },
                { label: customer.business_name },
            ]} />

            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Business Info */}
                    <Card className="shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{customer.business_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs">{customer.industry}</Badge>
                                        <StatusBadge status={customer.status} dotColor={statusConfig?.dot || ''} label={statusConfig?.label || ''} className={statusConfig?.color} />
                                    </div>
                                </div>
                                <PinButton isPinned={customer.is_pinned} onClick={() => togglePin(customer.id)} />
                            </div>

                            <div className="space-y-2.5 text-sm text-gray-600">
                                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" /><span>{customer.address}</span></div>
                                {customer.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">{customer.phone}</a></div>}
                                {customer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a></div>}
                                {customer.line_id && <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-gray-400" /><span>{customer.line_id}</span></div>}
                                {customer.website_url && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" /><a href={customer.website_url} target="_blank" className="text-blue-600 hover:underline truncate">{customer.website_url}</a></div>}
                                {customer.facebook_url && <div className="flex items-center gap-2"><Facebook className="w-4 h-4 text-gray-400" /><a href={customer.facebook_url} target="_blank" className="text-blue-600 hover:underline truncate">Facebook</a></div>}
                                {customer.google_rating > 0 && (
                                    <div className="flex items-center gap-2">
                                        <StarIcon className="w-4 h-4 text-amber-400" fill="currentColor" />
                                        <span>{customer.google_rating} ({customer.google_review_count} รีวิว)</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>ผู้ดูแล:</span>
                                    <UserAvatar name={getUserName(customer.assigned_to)} className="w-5 h-5 text-[9px]" />
                                    <span>{getUserName(customer.assigned_to)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacts */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">ผู้ติดต่อ</CardTitle></CardHeader>
                        <CardContent className="pt-0 text-sm space-y-3">
                            <div>
                                <p className="font-medium text-gray-900">{customer.contact_person_name}</p>
                                <p className="text-gray-500 text-xs">{customer.contact_person_position}</p>
                                {customer.contact_person_phone && <p className="text-xs"><a href={`tel:${customer.contact_person_phone}`} className="text-blue-600">{customer.contact_person_phone}</a></p>}
                                {customer.contact_person_email && <p className="text-xs"><a href={`mailto:${customer.contact_person_email}`} className="text-blue-600">{customer.contact_person_email}</a></p>}
                            </div>
                            {customer.secondary_contact_name && (
                                <div className="pt-2 border-t">
                                    <p className="font-medium text-gray-900">{customer.secondary_contact_name}</p>
                                    {customer.secondary_contact_phone && <p className="text-xs"><a href={`tel:${customer.secondary_contact_phone}`} className="text-blue-600">{customer.secondary_contact_phone}</a></p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Important Notes */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">บันทึกสำคัญ</CardTitle>
                            {!editingNotes && (
                                <Button variant="ghost" size="sm" onClick={() => { setNotesValue(customer.important_notes); setEditingNotes(true); }}>
                                    <Pencil className="w-3 h-3" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            {editingNotes ? (
                                <div className="space-y-2">
                                    <Textarea value={notesValue} onChange={(e) => handleNotesChange(e.target.value)} rows={4} placeholder="พิมพ์บันทึก... (บันทึกอัตโนมัติ)" />
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={handleSaveNotes} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>ยกเลิก</Button>
                                        {notesSaved && <span className="text-xs text-green-600 animate-pulse">บันทึกแล้ว ✓</span>}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.important_notes || 'ไม่มีบันทึก'}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tags — editable */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-gray-400" /> แท็ก
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {customer.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs group pl-2 pr-1 gap-1">
                                        {tag}
                                        <button
                                            onClick={() => updateCustomer(customer.id, { tags: customer.tags.filter(t => t !== tag) })}
                                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {customer.tags.length === 0 && <span className="text-xs text-gray-400">ไม่มีแท็ก</span>}
                            </div>
                            <CustomerTagInput customerId={customer.id} existingTags={customer.tags} />
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Deals */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">ดีล / โปรเจค ({deals.length})</CardTitle>
                            <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> สร้างดีลใหม่</Button>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {deals.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4 text-center">ยังไม่มีดีล</p>
                            ) : (
                                <div className="space-y-2">
                                    {deals.map((deal) => {
                                        const ds = DEAL_STATUS_CONFIG[deal.status];
                                        const ps = PAYMENT_STATUS_CONFIG[deal.payment_status];
                                        const isExpanded = expandedDeals.has(deal.id);
                                        return (
                                            <div key={deal.id} className="border rounded-lg p-3">
                                                <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                                                    const next = new Set(expandedDeals);
                                                    isExpanded ? next.delete(deal.id) : next.add(deal.id);
                                                    setExpandedDeals(next);
                                                }}>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value)}</span>
                                                            <Badge className={`text-[10px] ${ds?.color || ''}`}>{ds?.label}</Badge>
                                                            <Badge className={`text-[10px] ${ps?.color || ''}`}>{ps?.label}</Badge>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>
                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
                                                        <p>เริ่ม: {formatDate(deal.start_date)}</p>
                                                        {deal.end_date && <p>สิ้นสุด: {formatDate(deal.end_date)}</p>}
                                                        <p>ผู้ดูแล: {getUserName(deal.assigned_to)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">งาน ({openTasks.length} เปิด)</CardTitle>
                            <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> เพิ่มงาน</Button>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-1">
                                {openTasks.map((task) => {
                                    const catConfig = TASK_CATEGORY_CONFIG[task.category];
                                    return (
                                        <div key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                            <input type="checkbox" checked={task.is_completed} onChange={() => toggleTask(task.id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer" />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-gray-900">{task.title}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>
                                                    <Badge className={`text-[10px] px-1.5 py-0 ${catConfig?.color}`}>{catConfig?.label}</Badge>
                                                </div>
                                            </div>
                                            <UserAvatar name={getUserName(task.assigned_to)} className="w-5 h-5 text-[9px]" />
                                        </div>
                                    );
                                })}
                            </div>
                            {completedTasks.length > 0 && (
                                <button onClick={() => setShowCompletedTasks(!showCompletedTasks)} className="text-xs text-gray-400 mt-2 hover:text-gray-600">
                                    {showCompletedTasks ? 'ซ่อน' : 'แสดง'} {completedTasks.length} งานที่เสร็จแล้ว
                                </button>
                            )}
                            {showCompletedTasks && completedTasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-3 p-2 opacity-50">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded" />
                                    <span className="text-sm text-gray-500 line-through">{task.title}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold">เอกสาร ({customerDocs.length})</CardTitle>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline">สร้างใบเสนอราคา</Button>
                                <Button size="sm" variant="outline">สร้างใบแจ้งหนี้</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {customerDocs.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4 text-center">ยังไม่มีเอกสาร</p>
                            ) : (
                                <div className="space-y-2">
                                    {customerDocs.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{doc.document_number}</p>
                                                <p className="text-xs text-gray-500">{doc.type === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'} • {formatDate(doc.created_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">{formatCurrency(doc.total)}</p>
                                                <Badge className={`text-[10px] ${doc.status === 'paid' ? 'bg-green-100 text-green-700' : doc.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {doc.status === 'draft' ? 'แบบร่าง' : doc.status === 'sent' ? 'ส่งแล้ว' : doc.status === 'accepted' ? 'ยอมรับ' : doc.status === 'paid' ? 'ชำระแล้ว' : doc.status === 'overdue' ? 'เกินกำหนด' : doc.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* TIMELINE (full width) */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">ไทม์ไลน์</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setShowAddActivity(!showAddActivity)}>
                        <Plus className="w-3 h-3 mr-1" /> เพิ่มกิจกรรม
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    {showAddActivity && (
                        <div className="mb-4 p-3 border rounded-lg bg-gray-50 space-y-3">
                            <select value={activityType} onChange={(e) => setActivityType(e.target.value as ActivityType)} className="w-full p-2 border rounded-md text-sm">
                                <option value="note">บันทึก</option>
                                <option value="call">โทร</option>
                                <option value="line">LINE</option>
                                <option value="email">อีเมล</option>
                                <option value="meeting">ประชุม</option>
                            </select>
                            <Textarea value={activityContent} onChange={(e) => setActivityContent(e.target.value)} placeholder="รายละเอียด..." rows={3} />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleAddActivity} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
                                <Button size="sm" variant="outline" onClick={() => setShowAddActivity(false)}>ยกเลิก</Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        {customerActivities.map((activity) => {
                            const config = ACTIVITY_TYPE_CONFIG[activity.type];
                            const IconComp = config ? ACTIVITY_ICONS[config.icon] : StickyNote;
                            return (
                                <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 group">
                                    <div className="mt-0.5">
                                        {IconComp && <IconComp className={`w-4 h-4 ${config?.color || 'text-gray-400'}`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">{activity.content}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-400">{getRelativeTime(activity.created_at)}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">{getUserName(activity.created_by)}</span>
                                            {config && <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <button onClick={() => { /* edit */ }} className="p-1 hover:bg-gray-200 rounded"><Pencil className="w-3 h-3 text-gray-400" /></button>
                                        <button onClick={() => deleteActivity(activity.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CustomerTagInput({ customerId, existingTags }: { customerId: string; existingTags: string[] }) {
    const [tag, setTag] = useState('');
    const { updateCustomer } = useAppStore();
    const handleAdd = () => {
        if (!tag.trim() || existingTags.includes(tag.trim())) { setTag(''); return; }
        updateCustomer(customerId, { tags: [...existingTags, tag.trim()] });
        setTag('');
    };
    return (
        <div className="flex items-center gap-2 mt-1">
            <input
                value={tag}
                onChange={e => setTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="เพิ่มแท็ก..."
                className="px-2.5 py-1.5 text-xs border rounded-md flex-1 max-w-[180px] focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <Button size="sm" variant="ghost" onClick={handleAdd} disabled={!tag.trim()} className="h-7 px-2">
                <Plus className="w-3.5 h-3.5" />
            </Button>
        </div>
    );
}
