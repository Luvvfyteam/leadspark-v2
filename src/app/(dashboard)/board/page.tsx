'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { mockUsers } from '@/lib/mock-data';
import { getRelativeTime, formatCurrency } from '@/lib/utils';
import { BoardStatus, ActivityType, Lead, BoardColumn, Activity } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import {
    Search, Star, GripVertical, CalendarDays, User, Users,
    ArrowRight, Plus, MoreHorizontal, Edit2, Trash2,
    Phone, Mail, Globe, Facebook, MessageCircle, MapPin, ExternalLink,
    Clock, CheckCircle2, X, Kanban, Filter, BarChart3, Sparkles, FilePlus
} from 'lucide-react';

function getScoreColor(score: number) {
    if (score >= 80) return 'bg-red-500 text-white';
    if (score >= 50) return 'bg-amber-500 text-white';
    return 'bg-blue-500 text-white';
}

function getContactUrgency(dateStr: string): { label: string; className: string } {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days > 21) return { label: `${days}d ago`, className: 'text-red-600 bg-red-50' };
    if (days >= 14) return { label: `${days}d ago`, className: 'text-amber-600 bg-amber-50' };
    return { label: `${days}d ago`, className: 'text-gray-500 bg-gray-100' };
}

interface MoveModalState {
    open: boolean;
    lead: Lead | null;
    fromColumn: string | null;
    toColumn: string | null;
}

// ── Lead Card Component ───────────────────────────────────────────────────

function LeadCard({ lead, provided, snapshot, onClick }: {
    lead: Lead;
    provided: any;
    snapshot: any;
    onClick: () => void;
}) {
    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';
    const urgency = getContactUrgency(lead.updated_at);

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`group ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`}
        >
            <Card
                className="shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mb-2 border-gray-100 rounded-xl"
                onClick={onClick}
            >
                <CardContent className="p-3.5">
                    <div className="flex items-start justify-between">
                        <div
                            {...provided.dragHandleProps}
                            className="mt-0.5 mr-1.5 text-gray-300 cursor-grab active:cursor-grabbing"
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {lead.business_name}
                            </h4>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {lead.industry}
                            </p>
                        </div>
                        <Badge className={`text-[10px] font-bold ml-1.5 flex-shrink-0 rounded-full px-2 shadow-sm ${getScoreColor(lead.ai_score)}`}>
                            {lead.ai_score}
                        </Badge>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                        {lead.ai_tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Deal Value */}
                    {lead.deal_value && (
                        <div className="mt-2">
                            <span className="text-[11px] font-semibold text-gray-500">
                                ฿{lead.deal_value.toLocaleString()}
                            </span>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                        {/* Avatar with tooltip */}
                        <div className="relative group/avatar">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-2 ring-white hover:ring-blue-200 transition-all cursor-default">
                                {getUserName(lead.assigned_to).charAt(0)}
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/avatar:block z-10">
                                <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                                    {getUserName(lead.assigned_to)}
                                </div>
                            </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${urgency.className}`}>
                            {urgency.label}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Column Header Component ───────────────────────────────────────────────

function ColumnHeader({
    column,
    count,
    value,
    quota,
    onUpdate,
    onDelete
}: {
    column: BoardColumn;
    count: number;
    value: number;
    quota: number;
    onUpdate: (title: string) => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(column.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const handleSave = () => {
        if (title.trim() && title !== column.title) {
            onUpdate(title.trim());
        }
        setIsEditing(false);
    };

    // Progress bar for column quota
    const progressPct = quota > 0 ? Math.min(Math.round((value / quota) * 100), 100) : 0;
    const progressColor = progressPct >= 80 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-amber-400' : 'bg-red-400';
    const progressBg = progressPct >= 80 ? 'bg-emerald-100' : progressPct >= 50 ? 'bg-amber-100' : 'bg-red-100';

    return (
        <div className="flex flex-col mb-3 px-1 group/header">
            <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full ${column.color} shadow-sm`} />
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="text-sm font-bold bg-white border border-blue-300 rounded-lg px-2 py-0.5 outline-none w-full"
                    />
                ) : (
                    <h3
                        className="text-sm font-bold text-gray-900 cursor-text flex-1"
                        onDoubleClick={() => setIsEditing(true)}
                    >
                        {column.title}
                    </h3>
                )}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">{count}</Badge>

                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit2 className="w-3 h-3" />
                    </button>
                    {column.id !== 'new' && column.id !== 'won' && (
                        <button onClick={onDelete} className="p-1 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-400 font-bold">
                    {value >= 1000 ? `฿${(value / 1000).toFixed(0)}K` : formatCurrency(value)}
                </span>
                {quota > 0 && (
                    <span className={`text-[10px] font-bold ${progressPct >= 80 ? 'text-emerald-600' : progressPct >= 50 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                        {progressPct}%
                    </span>
                )}
            </div>
            {/* Column progress bar — Fibery/Monday.com style */}
            {quota > 0 && (
                <div className={`h-1.5 w-full rounded-full ${progressBg} overflow-hidden mb-1`}>
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ── Inline Editable Fields (ManyChat-inspired) ────────────────────────────

function InlineField({ icon: Icon, label, value, field, type = 'text', onSave }: {
    icon: React.ElementType;
    label: string;
    value: string | number | null | undefined;
    field: string;
    type?: string;
    onSave: (field: string, value: string | number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value ?? ''));
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

    const handleSave = () => {
        const val = type === 'number' ? Number(draft) : draft;
        onSave(field, val);
        setEditing(false);
    };

    return (
        <div
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all cursor-default
                ${editing ? 'border-blue-300 bg-blue-50/40 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'}
                group`}
        >
            <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                {editing ? (
                    <input
                        ref={ref}
                        type={type}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                        className="w-full text-sm text-gray-900 bg-transparent outline-none border-b border-blue-400 pb-0.5 mt-0.5"
                    />
                ) : (
                    <p className="text-sm text-gray-800 truncate mt-0.5">
                        {value ? String(value) : <span className="text-gray-400 italic text-xs">คลิกเพื่อเพิ่ม</span>}
                    </p>
                )}
            </div>
            {!editing && (
                <button
                    onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-md"
                    title="แก้ไข"
                >
                    <Edit2 className="w-3 h-3 text-gray-400" />
                </button>
            )}
        </div>
    );
}

function InlineEditableFields({ lead, onSave }: {
    lead: Lead;
    onSave: (field: string, value: string | number) => void;
}) {
    return (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> ข้อมูลติดต่อ
                <span className="text-[10px] text-gray-400 normal-case font-normal">(คลิก → แก้ไขได้เลย)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InlineField icon={Phone} label="โทร" value={lead.phone} field="phone" onSave={onSave} />
                <InlineField icon={Mail} label="อีเมล" value={lead.email} field="email" onSave={onSave} />
                <InlineField icon={MessageCircle} label="Line ID" value={lead.line_id} field="line_id" onSave={onSave} />
                <InlineField icon={Globe} label="เว็บไซต์" value={lead.website_url} field="website_url" onSave={onSave} />
                <InlineField icon={BarChart3} label="มูลค่าดีล (฿)" value={lead.deal_value} field="deal_value" type="number" onSave={onSave} />
            </div>
            {lead.address && (
                <InlineField icon={MapPin} label="ที่อยู่" value={lead.address} field="address" onSave={onSave} />
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function LeadBoardPage() {
    const router = useRouter();
    const {
        leads, boardColumns, moveLeadToColumn, addActivity, updateLead,
        addBoardColumn, updateBoardColumn, removeBoardColumn, activities,
        tasks, toggleTask, convertLeadToCustomer
    } = useAppStore();

    const { showToast } = useToast();

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const [moveModal, setMoveModal] = useState<MoveModalState>({
        open: false, lead: null, fromColumn: null, toColumn: null,
    });
    const [modalNote, setModalNote] = useState('');
    const [modalActivityType, setModalActivityType] = useState<ActivityType>('note');
    const [modalFollowup, setModalFollowup] = useState('');
    const [modalAssignee, setModalAssignee] = useState('');

    // Quick Action modal states
    const [quickActionModal, setQuickActionModal] = useState<'call' | 'note' | null>(null);
    const [quickActionText, setQuickActionText] = useState('');
    const [quickCallType, setQuickCallType] = useState<'outbound' | 'inbound'>('outbound');

    const currentUserId = 'user-001';

    // Filter leads
    const boardLeads = useMemo(() => {
        let filtered = leads;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((l) =>
                l.business_name.toLowerCase().includes(q)
            );
        }
        if (showOnlyMine) {
            filtered = filtered.filter((l) => l.assigned_to === currentUserId);
        }
        return filtered;
    }, [leads, searchQuery, showOnlyMine, currentUserId]);

    // Group leads by column and calculate values
    const columnData = useMemo(() => {
        const data: Record<string, { leads: Lead[]; totalValue: number }> = {};
        boardColumns.forEach((col) => {
            const leadsInCol = boardLeads.filter((l) => l.board_status === col.id);
            const totalValue = leadsInCol.reduce((sum, l) => sum + (l.ai_score * 5000), 0);
            data[col.id] = {
                leads: leadsInCol.sort((a, b) => b.ai_score - a.ai_score),
                totalValue
            };
        });
        return data;
    }, [boardLeads, boardColumns]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const lead = leads.find((l) => l.id === draggableId);
        if (!lead) return;

        const fromCol = source.droppableId;
        const toCol = destination.droppableId;

        if (fromCol !== toCol) {
            setMoveModal({ open: true, lead, fromColumn: fromCol, toColumn: toCol });
            setModalNote('');
            setModalActivityType('note');
            setModalFollowup('');
            setModalAssignee(lead.assigned_to);
        }
    }, [leads]);

    const handleConfirmMove = () => {
        if (!moveModal.lead || !moveModal.toColumn) return;

        moveLeadToColumn(moveModal.lead.id, moveModal.toColumn);

        if (modalAssignee && modalAssignee !== moveModal.lead.assigned_to) {
            updateLead(moveModal.lead.id, { assigned_to: modalAssignee });
        }

        if (modalFollowup) {
            updateLead(moveModal.lead.id, { next_followup_date: modalFollowup });
        }

        if (modalNote.trim()) {
            addActivity({
                id: `act-${Date.now()}`,
                customer_id: '',
                lead_id: moveModal.lead.id,
                team_id: 'team-001',
                type: modalActivityType,
                content: modalNote,
                followup_date: modalFollowup || null,
                created_by: currentUserId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }

        const fromLabel = boardColumns.find((c) => c.id === moveModal.fromColumn)?.title;
        const toLabel = boardColumns.find((c) => c.id === moveModal.toColumn)?.title;

        addActivity({
            id: `act-${Date.now() + 1}`,
            customer_id: '',
            lead_id: moveModal.lead.id,
            team_id: 'team-001',
            type: 'status_change',
            content: `เปลี่ยนสถานะ ${moveModal.lead.business_name}: ${fromLabel} → ${toLabel}`,
            followup_date: null,
            created_by: currentUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        setMoveModal({ open: false, lead: null, fromColumn: null, toColumn: null });
        showToast(`ย้าย "${moveModal.lead.business_name}" → ${toLabel}`);
    };

    const handleAddColumn = () => {
        if (!newColumnTitle.trim()) return;
        const newCol: BoardColumn = {
            id: `custom-${Date.now()}`,
            title: newColumnTitle.trim(),
            color: 'bg-indigo-500',
            order: boardColumns.length
        };
        addBoardColumn(newCol);
        setNewColumnTitle('');
        setIsAddingColumn(false);
    };

    const selectedLead = useMemo(() =>
        selectedLeadId ? (leads.find(l => l.id === selectedLeadId) ?? null) : null
        , [selectedLeadId, leads]);

    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Kanban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Pipeline</h1>
                        <p className="text-sm text-gray-500 mt-0.5">จัดการลีดและสถานะการขาย</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 w-full">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="ค้นหาชื่อธุรกิจ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 rounded-xl"
                            />
                        </div>
                        <button
                            onClick={() => setShowOnlyMine(!showOnlyMine)}
                            className={`h-9 px-3 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 ${showOnlyMine
                                ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            เฉพาะของฉัน
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-9 rounded-xl">
                            <Filter className="w-3.5 h-3.5 mr-2" /> ตัวกรอง
                        </Button>
                        <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm">
                            <Plus className="w-3.5 h-3.5 mr-2" /> ลีดใหม่
                        </Button>
                    </div>
                </div>
            </div>

            {/* Board Content */}
            {boardLeads.length === 0 && (searchQuery || showOnlyMine) ? (
                <EmptyState
                    icon={<Kanban className="h-6 w-6" />}
                    title="ไม่พบลีดที่ตรงตามเงื่อนไข"
                    description="ลองปรับคำค้นหา หรือปิดโหมด 'เฉพาะของฉัน'"
                    actionLabel="ล้างการค้นหา"
                    onAction={() => { setSearchQuery(''); setShowOnlyMine(false); }}
                />
            ) : (
                <div className="relative overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 min-w-max pb-4">
                            {boardColumns.map((column) => {
                                // Per-column quota: assume 10 leads * avg deal ~80 score * 5000 = 4M per column
                                const columnQuota = column.id === 'won' ? 2000000 : column.id === 'interested' ? 3000000 : 1500000;
                                return (
                                    <div key={column.id} className="w-72 flex flex-col">
                                        <ColumnHeader
                                            column={column}
                                            count={columnData[column.id]?.leads.length || 0}
                                            value={columnData[column.id]?.totalValue || 0}
                                            quota={columnQuota}
                                            onUpdate={(title) => updateBoardColumn(column.id, { title })}
                                            onDelete={() => removeBoardColumn(column.id)}
                                        />

                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-1 rounded-xl p-2 min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 border-2 border-dashed border-blue-200' : 'bg-gray-100/50'
                                                        }`}
                                                >
                                                    {columnData[column.id]?.leads.map((lead, index) => (
                                                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                            {(p, s) => (
                                                                <LeadCard
                                                                    lead={lead}
                                                                    provided={p}
                                                                    snapshot={s}
                                                                    onClick={() => setSelectedLeadId(lead.id)}
                                                                />
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                );
                            })}

                            {/* Add Column Button */}
                            <div className="w-72 pt-12">
                                {isAddingColumn ? (
                                    <div className="bg-gray-100 rounded-xl p-3 border-2 border-blue-200">
                                        <Input
                                            value={newColumnTitle}
                                            onChange={(e) => setNewColumnTitle(e.target.value)}
                                            placeholder="ชื่อคอลัมน์..."
                                            className="mb-2 h-8 text-sm"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleAddColumn} className="flex-1 h-7 text-xs">เพิ่ม</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setIsAddingColumn(false)} className="h-7 text-xs">ยกเลิก</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingColumn(true)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-all text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        เพิ่มคอลัมน์
                                    </button>
                                )}
                            </div>
                        </div>
                    </DragDropContext>
                </div>
            )}

            {/* ── SlideOverPanel: Lead Detail ─────────────────────────────────── */}
            <SlideOverPanel
                isOpen={!!selectedLead}
                onClose={() => setSelectedLeadId(null)}
                title={selectedLead?.business_name || ''}
                width="lg"
                footer={
                    <div className="flex gap-2 w-full">
                        {selectedLead?.board_status === 'won' ? (
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    const custId = convertLeadToCustomer(selectedLead.id);
                                    if (custId) {
                                        showToast('แปลงเป็นลูกค้าแล้ว');
                                        router.push(`/customers/${custId}`);
                                    }
                                }}
                            >
                                <Users className="w-4 h-4 mr-2" /> ดูข้อมูลลูกค้า
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                        if (selectedLead) {
                                            const custId = convertLeadToCustomer(selectedLead.id);
                                            if (custId) {
                                                showToast('แปลงเป็นลูกค้าแล้ว! ');
                                                router.push(`/customers/${custId}`);
                                            }
                                        }
                                    }}
                                >
                                    <Users className="w-4 h-4 mr-2" /> แปลงเป็นลูกค้า
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                        if (selectedLead) {
                                            moveLeadToColumn(selectedLead.id, 'won');
                                            showToast('ย้ายไปปิดการขายแล้ว');
                                        }
                                    }}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> ปิดการขาย
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={() => setSelectedLeadId(null)}>
                            ปิด
                        </Button>
                    </div>
                }
            >
                {selectedLead && (() => {
                    const leadActivities = activities.filter(a => a.lead_id === selectedLead.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
                    const leadTasks = tasks.filter(t => t.customer_id === null && t.title.includes(selectedLead.business_name));

                    return (
                        <div className="space-y-6">
                            {/* AI Score Breakdown */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">AI Match Score</p>
                                        <h4 className="text-3xl font-bold mt-1">{selectedLead.ai_score}</h4>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                        <p className="text-[10px] text-blue-100 uppercase">Fit</p>
                                        <p className="text-sm font-bold">{selectedLead.ai_score_fit}/40</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                        <p className="text-[10px] text-blue-100 uppercase">Need</p>
                                        <p className="text-sm font-bold">{selectedLead.ai_score_need}/30</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                        <p className="text-[10px] text-blue-100 uppercase">Potential</p>
                                        <p className="text-sm font-bold">{selectedLead.ai_score_potential}/30</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info — Inline Editable (ManyChat-inspired) */}
                            <InlineEditableFields lead={selectedLead} onSave={(field: string, value: string | number) => updateLead(selectedLead.id, { [field]: value })} />

                            {/* Google Info */}
                            {

                                (selectedLead.google_rating > 0) && (
                                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="google" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900">Google Rating</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-bold">{selectedLead.google_rating}</span>
                                                    <span className="text-[10px] text-gray-400">({selectedLead.google_review_count} รีวิว)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-[10px] text-blue-600 font-medium hover:underline">ดูแผนที่</button>
                                    </div>
                                )
                            }

                            {/* Quick Actions */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการด่วน</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setQuickActionModal('call'); setQuickActionText(''); setQuickCallType('outbound'); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all"
                                    >
                                        <Phone className="w-4 h-4" /> บันทึกโทร
                                    </button>
                                    <button
                                        onClick={() => { setQuickActionModal('note'); setQuickActionText(''); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-amber-100 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-all"
                                    >
                                        <MessageCircle className="w-4 h-4" /> จดบันทึก
                                    </button>
                                </div>
                            </div>

                            {/* Activities Timeline */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">กิจกรรมล่าสุด</h4>
                                    <button className="text-xs text-blue-600 hover:underline">เพิ่มบันทึก</button>
                                </div>
                                <div className="space-y-3">
                                    {leadActivities.length > 0 ? leadActivities.map((act) => {
                                        const cfg = ACTIVITY_TYPE_CONFIG[act.type];
                                        return (
                                            <div key={act.id} className="flex gap-3 relative before:absolute before:left-2 before:top-6 before:bottom-0 before:w-px before:bg-gray-100 last:before:hidden">
                                                <div className="shrink-0 mt-1 relative z-10">
                                                    <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${cfg?.color.replace('text-', 'bg-') || 'bg-gray-400'}`}>
                                                        <Clock className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 pb-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-gray-700 uppercase">{cfg?.label || act.type}</span>
                                                        <span className="text-[10px] text-gray-400">{getRelativeTime(act.created_at)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{act.content}</p>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                            <p className="text-xs text-gray-400">ยังไม่มีกิจกรรมสำหรับลีดนี้</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </SlideOverPanel >

            {/* Quick Action: Log Call Modal */}
            < Dialog open={quickActionModal === 'call'} onOpenChange={(open) => !open && setQuickActionModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-600" />
                            บันทึกการโทร — {selectedLead?.business_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการโทร</label>
                            <select
                                value={quickCallType}
                                onChange={(e) => setQuickCallType(e.target.value as 'outbound' | 'inbound')}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="outbound">โทรออก (Outbound)</option>
                                <option value="inbound">โทรเข้า (Inbound)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">บันทึก</label>
                            <Textarea
                                value={quickActionText}
                                onChange={(e) => setQuickActionText(e.target.value)}
                                placeholder="สรุปการสนทนา..."
                                rows={3}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuickActionModal(null)}>ยกเลิก</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                                if (!selectedLead || !quickActionText.trim()) return;
                                addActivity({
                                    id: `act-${Date.now()}`,
                                    customer_id: '',
                                    lead_id: selectedLead.id,
                                    team_id: 'team-001',
                                    type: 'call',
                                    content: `[${quickCallType === 'outbound' ? 'โทรออก' : 'โทรเข้า'}] ${quickActionText}`,
                                    followup_date: null,
                                    created_by: 'user-001',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                });
                                setQuickActionModal(null);
                                showToast('บันทึกการโทรแล้ว');
                            }}
                        >
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Quick Action: Note Modal */}
            < Dialog open={quickActionModal === 'note'} onOpenChange={(open) => !open && setQuickActionModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-amber-600" />
                            จดบันทึก — {selectedLead?.business_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">บันทึก</label>
                            <Textarea
                                value={quickActionText}
                                onChange={(e) => setQuickActionText(e.target.value)}
                                placeholder="บันทึกข้อมูลสำคัญ..."
                                rows={4}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuickActionModal(null)}>ยกเลิก</Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => {
                                if (!selectedLead || !quickActionText.trim()) return;
                                addActivity({
                                    id: `act-${Date.now()}`,
                                    customer_id: '',
                                    lead_id: selectedLead.id,
                                    team_id: 'team-001',
                                    type: 'note',
                                    content: quickActionText,
                                    followup_date: null,
                                    created_by: 'user-001',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                });
                                setQuickActionModal(null);
                                showToast('บันทึกเสร็จแล้ว');
                            }}
                        >
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Move Modal */}
            < Dialog open={moveModal.open} onOpenChange={(open) => {

                if (!open) {
                    setMoveModal({ open: false, lead: null, fromColumn: null, toColumn: null });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                            ย้าย {moveModal.lead?.business_name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline">
                                {boardColumns.find((c) => c.id === moveModal.fromColumn)?.title}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <Badge className="bg-blue-100 text-blue-700">
                                {boardColumns.find((c) => c.id === moveModal.toColumn)?.title}
                            </Badge>
                        </div>

                        {moveModal.toColumn === 'won' && moveModal.lead?.converted_customer_id && (
                            <Button
                                variant="outline"
                                className="w-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center justify-center gap-2"
                                onClick={() => router.push(`/documents?customer_id=${moveModal.lead?.converted_customer_id}&type=quotation`)}
                            >
                                <FilePlus className="w-4 h-4" /> สร้างใบเสนอราคา
                            </Button>
                        )}

                        {moveModal.toColumn === 'lost' && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <p className="text-xs font-semibold text-red-700 mb-1">ทำไมดีลนี้ถึงไม่สำเร็จ? *</p>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-red-200"
                                    onChange={(e) => setModalNote(`[ไม่สำเร็จ] ${e.target.value}: ${modalNote}`)}
                                >
                                    <option value="">เลือกเหตุผล...</option>
                                    <option value="ราคาแพงไป">ราคาแพงไป</option>
                                    <option value="เลือกเจ้าอื่น">เลือกเจ้าอื่น</option>
                                    <option value="ไม่มีงบประมาณ">ไม่มีงบประมาณ</option>
                                    <option value="ติดต่อไม่ได้">ติดต่อไม่ได้</option>
                                    <option value="ไม่ตรงความต้องการ">ไม่ตรงความต้องการ</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">บันทึกเพิ่มเติม</label>
                            <Textarea
                                value={modalNote}
                                onChange={(e) => setModalNote(e.target.value)}
                                placeholder="รายละเอียดประกอบการย้ายสถานะ..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับผิดชอบ</label>
                            <select
                                value={modalAssignee}
                                onChange={(e) => setModalAssignee(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                {mockUsers.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setMoveModal({ open: false, lead: null, fromColumn: null, toColumn: null })}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleConfirmMove} className="bg-blue-600 hover:bg-blue-700">
                            ยืนยันการย้าย
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}
