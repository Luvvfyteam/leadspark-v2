'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/lib/usePermissions';
import { CheckboxActionBar } from '@/components/shared/CheckboxActionBar';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { Task, TaskCategory, TaskComment } from '@/types';
import Link from 'next/link';
import {
    Plus, Calendar, User, Building2, List,
    AlertTriangle, Clock, ChevronDown, ChevronRight, ChevronUp, X, MessageSquare,
    CheckCircle2, Undo2, Send, Trash2, Save,
} from 'lucide-react';

// ── Types & Configs ──────────────────────────────────────────────────────────

type ViewMode = 'byDate' | 'byPerson' | 'byCustomer' | 'all' | 'completed';

const VIEW_TABS: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'byDate', label: 'ตามวัน', icon: Calendar },
    { id: 'byPerson', label: 'ตามคน', icon: User },
    { id: 'byCustomer', label: 'ตามลูกค้า', icon: Building2 },
    { id: 'all', label: 'ทั้งหมด', icon: List },
    { id: 'completed', label: '✅ เสร็จแล้ว', icon: CheckCircle2 },
];

const TASK_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    sales: { label: 'การขาย', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    delivery: { label: 'ส่งงาน', color: 'bg-green-50 text-green-700 border-green-200' },
    finance: { label: 'การเงิน', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    meeting: { label: 'ประชุม', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    other: { label: 'อื่นๆ', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
    { value: 'sales', label: 'การขาย' },
    { value: 'delivery', label: 'ส่งงาน' },
    { value: 'finance', label: 'การเงิน' },
    { value: 'meeting', label: 'ประชุม' },
    { value: 'other', label: 'อื่นๆ' },
];

const TODAY = '2026-02-17';

const DATE_SECTIONS = [
    { key: 'overdue', label: 'เลยกำหนด', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: AlertTriangle },
    { key: 'today', label: 'วันนี้', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: Clock },
    { key: 'tomorrow', label: 'พรุ่งนี้', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', icon: Calendar },
    { key: 'thisWeek', label: 'สัปดาห์นี้', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: Calendar },
    { key: 'later', label: 'ภายหลัง', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-100', icon: Calendar },
];

const COMPLETED_SECTIONS = [
    { key: 'today', label: 'วันนี้', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    { key: 'yesterday', label: 'เมื่อวาน', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    { key: 'thisWeek', label: 'สัปดาห์นี้', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
    { key: 'older', label: 'ก่อนหน้า', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
    if (dateStr < TODAY) return 'overdue';
    if (dateStr === TODAY) return 'today';
    const t = new Date(TODAY);
    const d = new Date(dateStr);
    const diffDays = Math.floor((d.getTime() - t.getTime()) / 86400000);
    if (diffDays === 1) return 'tomorrow';
    if (diffDays <= 7 - t.getDay()) return 'thisWeek';
    return 'later';
}

function getSectionDate(sectionKey: string): string {
    if (sectionKey === 'overdue' || sectionKey === 'today') return TODAY;
    const d = new Date(TODAY);
    if (sectionKey === 'tomorrow') { d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
    if (sectionKey === 'thisWeek') { d.setDate(d.getDate() + (6 - d.getDay())); return d.toISOString().slice(0, 10); }
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
}

function getCompletedSection(dateStr: string | null): string {
    if (!dateStr) return 'older';
    const d = dateStr.slice(0, 10);
    if (d === TODAY) return 'today';
    const yesterday = new Date(new Date(TODAY).getTime() - 86400000).toISOString().slice(0, 10);
    if (d === yesterday) return 'yesterday';
    const startOfWeek = new Date(TODAY);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    if (d >= startOfWeek.toISOString().slice(0, 10)) return 'thisWeek';
    return 'older';
}

// ── QuickAddInput (P1-7) ─────────────────────────────────────────────────────

function QuickAddInput({ onSubmit, onCancel }: { onSubmit: (title: string) => void; onCancel: () => void }) {
    const [value, setValue] = useState('');
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-dashed border-blue-200 bg-blue-50/40">
            <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
                ref={ref}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && value.trim()) { onSubmit(value.trim()); }
                    if (e.key === 'Escape') onCancel();
                }}
                placeholder="พิมพ์ชื่องาน แล้วกด Enter..."
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800"
            />
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ── TaskRow with CheckboxActionBar (P1-5) ────────────────────────────────────

function TaskRow({ task, customers, users, commentCount, onClickName, onConfirm }: {
    task: Task;
    customers: { id: string; business_name: string }[];
    users: { id: string; name: string }[];
    commentCount: number;
    onClickName: () => void;
    onConfirm: (note?: string) => void;
}) {
    const customer = customers.find((c) => c.id === task.customer_id);
    const user = users.find((u) => u.id === task.assigned_to);
    const cat = TASK_CATEGORY_CONFIG[task.category] || TASK_CATEGORY_CONFIG.other;
    const isOverdue = !task.is_completed && task.due_date < TODAY;

    return (
        <CheckboxActionBar checked={task.is_completed} onConfirm={onConfirm} onCancel={() => {}}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={onClickName}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left truncate"
                        >
                            {task.title}
                        </button>
                        {isOverdue && (
                            <span className="text-[10px] text-red-500 shrink-0 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> เกินกำหนด
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {customer && (
                            <Link
                                href={`/customers/${customer.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-blue-500 hover:underline"
                            >
                                {customer.business_name}
                            </Link>
                        )}
                        <Badge className={`text-[10px] px-1.5 py-0 leading-4 ${cat.color}`}>{cat.label}</Badge>
                        {commentCount > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <MessageSquare className="w-3 h-3" />{commentCount}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {user?.name.charAt(0) || '?'}
                    </div>
                    <span className="text-xs text-gray-400 hidden md:inline">
                        {new Date(task.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </div>
        </CheckboxActionBar>
    );
}

// ── CompletedTaskRow (static, used inside completed sub-sections) ─────────────

function CompletedTaskRow({ task, customers, onClickName, onUndo }: {
    task: Task;
    customers: { id: string; business_name: string }[];
    onClickName: () => void;
    onUndo: () => void;
}) {
    const customer = customers.find((c) => c.id === task.customer_id);
    const cat = TASK_CATEGORY_CONFIG[task.category] || TASK_CATEGORY_CONFIG.other;
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 opacity-70">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
                <button onClick={onClickName} className="text-left w-full">
                    <p className="text-sm line-through text-gray-400 truncate hover:text-blue-500">{task.title}</p>
                </button>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {customer && <span className="text-xs text-gray-400">{customer.business_name}</span>}
                    <Badge className={`text-[10px] px-1.5 py-0 leading-4 ${cat.color}`}>{cat.label}</Badge>
                </div>
            </div>
            <button onClick={onUndo} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5 shrink-0">
                <Undo2 className="w-3 h-3" />
            </button>
        </div>
    );
}

// ── TaskDetailPanel using SlideOverPanel (P1-6) ──────────────────────────────

function TaskDetailPanel({ task, isOpen, onClose, customers, users }: {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    customers: { id: string; business_name: string }[];
    users: { id: string; name: string }[];
}) {
    const { updateTask, toggleTask, deleteTask, comments, addComment, currentUser } = useAppStore();
    const { isAdmin } = usePermissions();
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<TaskCategory>('other');
    const [assignee, setAssignee] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [newComment, setNewComment] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setCategory(task.category);
            setAssignee(task.assigned_to);
            setDueDate(task.due_date);
            setNotes(task.description);
            setConfirmDelete(false);
            setNewComment('');
        }
    }, [task?.id]);

    const taskComments = useMemo(() =>
        task ? comments.filter((c) => c.task_id === task.id).sort((a, b) => a.created_at.localeCompare(b.created_at)) : [],
        [comments, task?.id],
    );

    const customer = customers.find((c) => c.id === task?.customer_id);
    const creator = users.find((u) => u.id === task?.created_by);
    const completedByUser = users.find((u) => u.id === task?.completed_by);
    const isOverdue = task ? (!task.is_completed && task.due_date < TODAY) : false;

    const handleSave = () => {
        if (!task) return;
        updateTask(task.id, { title, category, assigned_to: assignee, due_date: dueDate, description: notes });
        showToast('บันทึกแล้ว ✓');
    };

    const handleAddComment = () => {
        if (!newComment.trim() || !task) return;
        const comment: TaskComment = {
            id: `tc-${Date.now()}`,
            task_id: task.id,
            content: newComment.trim(),
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
        };
        addComment(comment);
        setNewComment('');
    };

    const handleDelete = () => {
        if (!task) return;
        deleteTask(task.id);
        showToast('ลบงานแล้ว');
        onClose();
    };

    return (
        <SlideOverPanel
            isOpen={isOpen}
            onClose={onClose}
            title={title || 'รายละเอียดงาน'}
            width="lg"
            footer={
                <div className="flex items-center gap-2">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-1.5 flex-1">
                        <Save className="w-4 h-4" /> บันทึก
                    </Button>
                    {isAdmin && task && (
                        confirmDelete ? (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="destructive" onClick={handleDelete}>ลบ</Button>
                                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
                            </div>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )
                    )}
                </div>
            }
        >
            {task && (
                <div className="space-y-5">
                    {/* Status toggle */}
                    <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${task.is_completed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                    >
                        <CheckCircle2 className={`w-5 h-5 ${task.is_completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="text-sm font-medium">{task.is_completed ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ'}</span>
                        {task.is_completed && completedByUser && (
                            <span className="text-xs ml-auto">
                                โดย {completedByUser.name} · {task.completed_at && new Date(task.completed_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                        )}
                        {isOverdue && (
                            <span className="text-xs text-red-500 ml-auto flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> เกินกำหนด
                            </span>
                        )}
                    </button>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ชื่องาน</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-medium" />
                    </div>

                    {/* Customer */}
                    {customer && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">ลูกค้า</label>
                            <Link href={`/customers/${customer.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />{customer.business_name}
                            </Link>
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">หมวดหมู่</label>
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORY_OPTIONS.map((opt) => {
                                const cfg = TASK_CATEGORY_CONFIG[opt.value];
                                return (
                                    <button key={opt.value} onClick={() => setCategory(opt.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === opt.value ? `${cfg.color} ring-2 ring-offset-1 ring-blue-300` : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                    >{opt.label}</button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Assignee + Due Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">ผู้รับผิดชอบ</label>
                            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">วันครบกำหนด</label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">โน้ต</label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
                    </div>

                    {/* Meta */}
                    <div className="text-xs text-gray-400 space-y-1 p-3 bg-gray-50 rounded-lg">
                        <p>สร้างโดย {creator?.name || '?'} · {new Date(task.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        {task.is_completed && task.completed_at && (
                            <p>เสร็จโดย {completedByUser?.name || '?'} · {new Date(task.completed_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} {new Date(task.completed_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Comments */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" /> ความคิดเห็น ({taskComments.length})
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {taskComments.map((c) => {
                                const cUser = users.find((u) => u.id === c.created_by);
                                return (
                                    <div key={c.id} className="flex gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                                            {cUser?.name.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-700">{cUser?.name}</span>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(c.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} {new Date(c.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {taskComments.length === 0 && <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีความคิดเห็น</p>}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="เพิ่มความคิดเห็น..."
                                className="text-sm"
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                            />
                            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()} className="bg-blue-600 hover:bg-blue-700 px-3">
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </SlideOverPanel>
    );
}

// ── AddTaskPanel using SlideOverPanel (P1-7) ─────────────────────────────────

function AddTaskPanel({ isOpen, onClose, customers, users, onAdd }: {
    isOpen: boolean;
    onClose: () => void;
    customers: { id: string; business_name: string }[];
    users: { id: string; name: string }[];
    onAdd: (task: Omit<Task, 'id' | 'team_id' | 'created_at'>) => void;
}) {
    const [title, setTitle] = useState('');
    const [custSearch, setCustSearch] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [assignee, setAssignee] = useState('user-001');
    const [dueDate, setDueDate] = useState(TODAY);
    const [category, setCategory] = useState<TaskCategory>('sales');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setTitle(''); setCustSearch(''); setCustomerId('');
            setAssignee('user-001'); setDueDate(TODAY);
            setCategory('sales'); setNotes('');
        }
    }, [isOpen]);

    const filteredCusts = custSearch
        ? customers.filter((c) => c.business_name.toLowerCase().includes(custSearch.toLowerCase()))
        : customers;

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd({
            customer_id: customerId || null,
            deal_id: null,
            title: title.trim(),
            description: notes,
            assigned_to: assignee,
            due_date: dueDate,
            category,
            is_completed: false,
            completed_at: null,
            completed_by: null,
            created_by: 'user-001',
        });
        onClose();
    };

    return (
        <SlideOverPanel
            isOpen={isOpen}
            onClose={onClose}
            title="เพิ่มงานใหม่"
            width="md"
            footer={
                <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={!title.trim()} className="bg-blue-600 hover:bg-blue-700 flex-1">
                        <Plus className="w-4 h-4 mr-1" /> เพิ่มงาน
                    </Button>
                    <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่องาน *</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น: ส่งใบเสนอราคา..." autoFocus />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า (ไม่บังคับ)</label>
                    <Input
                        value={custSearch}
                        onChange={(e) => { setCustSearch(e.target.value); setCustomerId(''); }}
                        placeholder="ค้นหาลูกค้า..."
                        className="mb-1"
                    />
                    {custSearch && (
                        <div className="max-h-32 overflow-y-auto border rounded-md">
                            {filteredCusts.slice(0, 5).map((c) => (
                                <button key={c.id} onClick={() => { setCustomerId(c.id); setCustSearch(c.business_name); }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                                >{c.business_name}</button>
                            ))}
                        </div>
                    )}
                    {customerId && !custSearch && (
                        <p className="text-xs text-blue-500">{customers.find((c) => c.id === customerId)?.business_name}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับผิดชอบ</label>
                        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันครบกำหนด</label>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORY_OPTIONS.map((opt) => {
                            const cfg = TASK_CATEGORY_CONFIG[opt.value];
                            return (
                                <button key={opt.value} onClick={() => setCategory(opt.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === opt.value ? `${cfg.color} ring-2 ring-offset-1 ring-blue-300` : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                >{opt.label}</button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">โน้ต</label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
                </div>
            </div>
        </SlideOverPanel>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
    const { tasks, customers, addTask, toggleTask, comments, addComment, currentUser } = useAppStore();
    const { showToast } = useToast();

    const users = [
        { id: 'user-001', name: 'Asia' },
        { id: 'user-002', name: 'Som' },
    ];

    const [view, setView] = useState<ViewMode>('byDate');
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [quickAddSection, setQuickAddSection] = useState<string | null>(null);

    const activeTasks = useMemo(() => tasks.filter((t) => !t.is_completed), [tasks]);
    const completedTasks = useMemo(() =>
        tasks.filter((t) => t.is_completed).sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || '')),
        [tasks],
    );

    const selectedTask = useMemo(() =>
        selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null,
        [tasks, selectedTaskId],
    );

    const commentCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        comments.forEach((c) => { counts[c.task_id] = (counts[c.task_id] || 0) + 1; });
        return counts;
    }, [comments]);

    const custList = customers.map((c) => ({ id: c.id, business_name: c.business_name }));

    const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

    // Completed sub-sections default to collapsed (true); use !== false pattern
    const isDoneCollapsed = (key: string) => collapsed[`done-${key}`] !== false;

    const makeConfirmHandler = (task: Task) => (note?: string) => {
        toggleTask(task.id);
        if (note) {
            const comment: TaskComment = {
                id: `tc-${Date.now()}`,
                task_id: task.id,
                content: note,
                created_by: currentUser.id,
                created_at: new Date().toISOString(),
            };
            addComment(comment);
        }
        const msg = note ? `"${task.title}" เสร็จแล้ว ✓ · ${note}` : `"${task.title}" เสร็จแล้ว ✓`;
        showToast(msg, () => toggleTask(task.id));
    };

    const handleQuickAdd = (title: string, sectionKey: string) => {
        const task: Task = {
            id: `task-${Date.now()}`,
            team_id: 'team-001',
            customer_id: null,
            deal_id: null,
            title,
            description: '',
            assigned_to: currentUser.id,
            due_date: getSectionDate(sectionKey),
            category: 'other',
            is_completed: false,
            completed_at: null,
            completed_by: null,
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
        };
        addTask(task);
        showToast(`เพิ่มงาน "${title}" แล้ว`);
        setQuickAddSection(null);
    };

    const handleAdd = (partial: Omit<Task, 'id' | 'team_id' | 'created_at'>) => {
        const task: Task = {
            id: `task-${Date.now()}`,
            team_id: 'team-001',
            created_at: new Date().toISOString(),
            ...partial,
        };
        addTask(task);
        showToast(`เพิ่มงาน "${task.title}" แล้ว`);
    };

    // ── renderByDate (P1-5 + P1-7) ─────────────────────────────────────────

    const renderByDate = () => {
        const grouped: Record<string, { active: Task[]; completed: Task[] }> = {
            overdue: { active: [], completed: [] },
            today: { active: [], completed: [] },
            tomorrow: { active: [], completed: [] },
            thisWeek: { active: [], completed: [] },
            later: { active: [], completed: [] },
        };

        tasks.forEach((t) => {
            const bucket = getDateLabel(t.due_date);
            if (t.is_completed) {
                grouped[bucket].completed.push(t);
            } else {
                grouped[bucket].active.push(t);
            }
        });

        return DATE_SECTIONS.map((section) => {
            const { active, completed } = grouped[section.key];
            if (active.length === 0 && completed.length === 0) return null;
            const isCollapsed = collapsed[section.key];

            return (
                <div key={section.key} className="mb-4">
                    {/* Section header */}
                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${section.bgColor} transition-colors`}>
                        <button
                            onClick={() => toggle(section.key)}
                            className="flex items-center gap-2 flex-1 min-w-0"
                        >
                            <section.icon className={`w-4 h-4 ${section.color} shrink-0`} />
                            <span className={`text-sm font-semibold ${section.color}`}>{section.label}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5">{active.length}</Badge>
                            {completed.length > 0 && (
                                <span className="text-[10px] text-gray-400">· {completed.length} เสร็จ</span>
                            )}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                            {/* P1-7: Quick add button */}
                            <button
                                onClick={() => setQuickAddSection(quickAddSection === section.key ? null : section.key)}
                                className="p-1 rounded hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
                                title="เพิ่มงานด่วน"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                            {isCollapsed
                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                : <ChevronUp className="w-4 h-4 text-gray-400" />}
                        </div>
                    </div>

                    {!isCollapsed && (
                        <Card className="mt-1 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {/* P1-7: Inline quick add input */}
                                {quickAddSection === section.key && (
                                    <QuickAddInput
                                        onSubmit={(title) => handleQuickAdd(title, section.key)}
                                        onCancel={() => setQuickAddSection(null)}
                                    />
                                )}

                                {/* Active task rows */}
                                {active.map((t) => (
                                    <TaskRow
                                        key={t.id}
                                        task={t}
                                        customers={custList}
                                        users={users}
                                        commentCount={commentCounts[t.id] || 0}
                                        onClickName={() => setSelectedTaskId(t.id)}
                                        onConfirm={makeConfirmHandler(t)}
                                    />
                                ))}

                                {/* P1-5: Completed sub-section */}
                                {completed.length > 0 && (
                                    <div className="border-t border-gray-100">
                                        <button
                                            onClick={() => toggle(`done-${section.key}`)}
                                            className="flex items-center gap-1.5 px-4 py-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {isDoneCollapsed(section.key)
                                                ? <ChevronRight className="w-3 h-3" />
                                                : <ChevronDown className="w-3 h-3" />}
                                            เสร็จแล้ว ({completed.length})
                                        </button>
                                        {!isDoneCollapsed(section.key) && (
                                            <div>
                                                {completed.map((t) => (
                                                    <CompletedTaskRow
                                                        key={t.id}
                                                        task={t}
                                                        customers={custList}
                                                        onClickName={() => setSelectedTaskId(t.id)}
                                                        onUndo={() => {
                                                            toggleTask(t.id);
                                                            showToast(`"${t.title}" ยกเลิกแล้ว`, () => toggleTask(t.id));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        });
    };

    // ── renderByPerson ──────────────────────────────────────────────────────

    const renderByPerson = () => {
        const grouped: Record<string, Task[]> = {};
        activeTasks.forEach((t) => {
            if (!grouped[t.assigned_to]) grouped[t.assigned_to] = [];
            grouped[t.assigned_to].push(t);
        });
        return Object.entries(grouped).map(([userId, userTasks]) => {
            const user = users.find((u) => u.id === userId);
            const isCollapsed = collapsed[userId];
            return (
                <div key={userId} className="mb-4">
                    <button onClick={() => toggle(userId)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-gray-50 border-gray-200">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {user?.name.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{user?.name || userId}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5">{userTasks.length} งาน</Badge>
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                    </button>
                    {!isCollapsed && (
                        <Card className="mt-1 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {userTasks.map((t) => (
                                    <TaskRow key={t.id} task={t} customers={custList} users={users} commentCount={commentCounts[t.id] || 0} onClickName={() => setSelectedTaskId(t.id)} onConfirm={makeConfirmHandler(t)} />
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        });
    };

    // ── renderByCustomer ────────────────────────────────────────────────────

    const renderByCustomer = () => {
        const grouped: Record<string, Task[]> = { _noCustomer: [] };
        activeTasks.forEach((t) => {
            const key = t.customer_id || '_noCustomer';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
        });
        return Object.entries(grouped).map(([custId, custTasks]) => {
            if (custTasks.length === 0) return null;
            const cust = custList.find((c) => c.id === custId);
            const label = cust ? cust.business_name : 'ไม่ระบุลูกค้า';
            const isCollapsed = collapsed[custId];
            return (
                <div key={custId} className="mb-4">
                    <button onClick={() => toggle(custId)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-gray-50 border-gray-200">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">{label}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5">{custTasks.length}</Badge>
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                    </button>
                    {!isCollapsed && (
                        <Card className="mt-1 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {custTasks.map((t) => (
                                    <TaskRow key={t.id} task={t} customers={custList} users={users} commentCount={commentCounts[t.id] || 0} onClickName={() => setSelectedTaskId(t.id)} onConfirm={makeConfirmHandler(t)} />
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        });
    };

    // ── renderAll ───────────────────────────────────────────────────────────

    const renderAll = () => (
        <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
                {activeTasks.map((t) => (
                    <TaskRow key={t.id} task={t} customers={custList} users={users} commentCount={commentCounts[t.id] || 0} onClickName={() => setSelectedTaskId(t.id)} onConfirm={makeConfirmHandler(t)} />
                ))}
            </CardContent>
        </Card>
    );

    // ── renderCompleted ─────────────────────────────────────────────────────

    const renderCompleted = () => {
        const grouped: Record<string, Task[]> = { today: [], yesterday: [], thisWeek: [], older: [] };
        completedTasks.forEach((t) => { grouped[getCompletedSection(t.completed_at)].push(t); });

        return COMPLETED_SECTIONS.map((section) => {
            const sectionTasks = grouped[section.key] || [];
            if (sectionTasks.length === 0) return null;
            const isCollapsed = collapsed[`c-${section.key}`];
            return (
                <div key={section.key} className="mb-4">
                    <button
                        onClick={() => toggle(`c-${section.key}`)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border ${section.bgColor} transition-colors`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4 h-4 ${section.color}`} />
                            <span className={`text-sm font-semibold ${section.color}`}>{section.label}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5">{sectionTasks.length}</Badge>
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                    </button>
                    {!isCollapsed && (
                        <Card className="mt-1 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {sectionTasks.map((t) => {
                                    const cUser = users.find((u) => u.id === t.completed_by);
                                    const cust = custList.find((c) => c.id === t.customer_id);
                                    const cat = TASK_CATEGORY_CONFIG[t.category] || TASK_CATEGORY_CONFIG.other;
                                    return (
                                        <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 opacity-75">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <button onClick={() => setSelectedTaskId(t.id)} className="text-left w-full">
                                                    <p className="text-sm font-medium line-through text-gray-400 truncate hover:text-blue-500">{t.title}</p>
                                                </button>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    {cust && <Link href={`/customers/${cust.id}`} className="text-xs text-blue-500 hover:underline">{cust.business_name}</Link>}
                                                    <span className="text-[10px] text-gray-400">
                                                        เสร็จโดย {cUser?.name || '?'} · {t.completed_at && new Date(t.completed_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} {t.completed_at && new Date(t.completed_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge className={`text-[10px] px-2 py-0.5 ${cat.color} flex-shrink-0`}>{cat.label}</Badge>
                                            <button onClick={() => { toggleTask(t.id); showToast(`"${t.title}" ยกเลิกแล้ว`); }} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5 flex-shrink-0">
                                                <Undo2 className="w-3 h-3" /> ยกเลิก
                                            </button>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        });
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">งาน</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {activeTasks.length} งานค้างอยู่ · {completedTasks.length} เสร็จแล้ว
                    </p>
                </div>
                <Button onClick={() => setShowAddPanel(true)} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                    <Plus className="w-4 h-4" /> เพิ่มงาน
                </Button>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {VIEW_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors flex-1 justify-center ${view === tab.id ? 'bg-white text-blue-600 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
                {view === 'completed' ? (
                    completedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <span className="text-4xl mb-3">📋</span>
                            <p className="text-base font-medium">ยังไม่มีงานที่เสร็จแล้ว</p>
                        </div>
                    ) : renderCompleted()
                ) : activeTasks.length === 0 && view !== 'all' && view !== 'byDate' ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <span className="text-4xl mb-3">🎉</span>
                        <p className="text-base font-medium">ไม่มีงานค้างอยู่</p>
                    </div>
                ) : (
                    <>
                        {view === 'byDate' && renderByDate()}
                        {view === 'byPerson' && renderByPerson()}
                        {view === 'byCustomer' && renderByCustomer()}
                        {view === 'all' && renderAll()}
                    </>
                )}
            </div>

            {/* Add Task Panel (P1-7) */}
            <AddTaskPanel
                isOpen={showAddPanel}
                onClose={() => setShowAddPanel(false)}
                customers={custList}
                users={users}
                onAdd={handleAdd}
            />

            {/* Task Detail Panel (P1-6) */}
            <TaskDetailPanel
                task={selectedTask}
                isOpen={!!selectedTaskId}
                onClose={() => setSelectedTaskId(null)}
                customers={custList}
                users={users}
            />
        </div>
    );
}
