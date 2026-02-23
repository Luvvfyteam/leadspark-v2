'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { BOARD_COLUMNS } from '@/lib/constants';
import { mockUsers } from '@/lib/mock-data';
import { getRelativeTime } from '@/lib/utils';
import { BoardStatus, ActivityType, Lead } from '@/types';
import {
    Search, Filter, Star, GripVertical, CalendarDays, User,
    ArrowRight,
} from 'lucide-react';

function getScoreColor(score: number) {
    if (score >= 80) return 'bg-red-500 text-white';
    if (score >= 50) return 'bg-amber-500 text-white';
    return 'bg-blue-500 text-white';
}

interface MoveModalState {
    open: boolean;
    lead: Lead | null;
    fromColumn: BoardStatus | null;
    toColumn: BoardStatus | null;
}

export default function LeadBoardPage() {
    const router = useRouter();
    const { leads, moveLeadToColumn, addActivity, updateLead } = useAppStore();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [moveModal, setMoveModal] = useState<MoveModalState>({
        open: false, lead: null, fromColumn: null, toColumn: null,
    });
    const [modalNote, setModalNote] = useState('');
    const [modalActivityType, setModalActivityType] = useState<ActivityType>('note');
    const [modalFollowup, setModalFollowup] = useState('');
    const [modalAssignee, setModalAssignee] = useState('');

    const currentUserId = 'user-001';

    // Filter leads for board (exclude lost/won that are converted)
    const boardLeads = useMemo(() => {
        let filtered = leads.filter(
            (l) => l.board_status !== 'lost'
        );
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

    // Group leads by column
    const columnLeads = useMemo(() => {
        const grouped: Record<string, Lead[]> = {};
        BOARD_COLUMNS.forEach((col) => {
            grouped[col.id] = boardLeads
                .filter((l) => l.board_status === col.id)
                .sort((a, b) => b.ai_score - a.ai_score);
        });
        return grouped;
    }, [boardLeads]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const lead = leads.find((l) => l.id === draggableId);
        if (!lead) return;

        const fromCol = source.droppableId as BoardStatus;
        const toCol = destination.droppableId as BoardStatus;

        if (fromCol !== toCol) {
            // Open modal for column change
            setMoveModal({ open: true, lead, fromColumn: fromCol, toColumn: toCol });
            setModalNote('');
            setModalActivityType('note');
            setModalFollowup('');
            setModalAssignee(lead.assigned_to);
        }
    }, [leads]);

    const handleConfirmMove = () => {
        if (!moveModal.lead || !moveModal.toColumn) return;

        // Move the lead
        moveLeadToColumn(moveModal.lead.id, moveModal.toColumn);

        // Update assignee if changed
        if (modalAssignee && modalAssignee !== moveModal.lead.assigned_to) {
            updateLead(moveModal.lead.id, { assigned_to: modalAssignee });
        }

        // Update follow-up date
        if (modalFollowup) {
            updateLead(moveModal.lead.id, { next_followup_date: modalFollowup });
        }

        // Add activity
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

        // Always add a status_change activity
        const fromLabel = BOARD_COLUMNS.find((c) => c.id === moveModal.fromColumn)?.title;
        const toLabel = BOARD_COLUMNS.find((c) => c.id === moveModal.toColumn)?.title;
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

        const leadName = moveModal.lead.business_name;
        const fromCol = moveModal.fromColumn;
        const leadId = moveModal.lead.id;
        setMoveModal({ open: false, lead: null, fromColumn: null, toColumn: null });

        showToast(
            `ย้าย "${leadName}" → ${toLabel}`,
            fromCol ? () => moveLeadToColumn(leadId, fromCol) : undefined
        );
    };

    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';

    return (
        <div className="max-w-[1400px] mx-auto space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="ค้นหาชื่อธุรกิจ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <button
                    onClick={() => setShowOnlyMine(!showOnlyMine)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${showOnlyMine
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <User className="w-4 h-4" />
                    แสดงเฉพาะของฉัน
                </button>
            </div>

            {/* Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {BOARD_COLUMNS.map((column) => (
                        <div key={column.id} className="flex flex-col min-h-[500px]">
                            {/* Column Header */}
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
                                <Badge variant="secondary" className="text-xs ml-auto">
                                    {columnLeads[column.id]?.length || 0}
                                </Badge>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 rounded-lg p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-200' : 'bg-gray-50'
                                            }`}
                                    >
                                        {columnLeads[column.id]?.map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`group ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`}
                                                    >
                                                        <Card
                                                            className="shadow-sm cursor-pointer hover:shadow-md transition-all"
                                                            onClick={() => router.push(`/board/${lead.id}`)}
                                                        >
                                                            <CardContent className="p-3">
                                                                <div className="flex items-start justify-between">
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="mt-0.5 mr-1.5 text-gray-300 cursor-grab active:cursor-grabbing"
                                                                    >
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                            {lead.business_name}
                                                                        </h4>
                                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                                            {lead.industry}
                                                                        </p>
                                                                    </div>
                                                                    <Badge className={`text-[10px] font-bold ml-1.5 flex-shrink-0 ${getScoreColor(lead.ai_score)}`}>
                                                                        {lead.ai_score}
                                                                    </Badge>
                                                                </div>

                                                                {/* Tags */}
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {lead.ai_tags.slice(0, 2).map((tag) => (
                                                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                {/* Footer */}
                                                                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                                                                    <UserAvatar
                                                                        name={getUserName(lead.assigned_to)}
                                                                        className="w-5 h-5 text-[9px]"
                                                                    />
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {getRelativeTime(lead.updated_at)}
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Move Modal */}
            <Dialog open={moveModal.open} onOpenChange={(open) => {
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
                                {BOARD_COLUMNS.find((c) => c.id === moveModal.fromColumn)?.title}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <Badge className="bg-blue-100 text-blue-700">
                                {BOARD_COLUMNS.find((c) => c.id === moveModal.toColumn)?.title}
                            </Badge>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทกิจกรรม</label>
                            <select
                                value={modalActivityType}
                                onChange={(e) => setModalActivityType(e.target.value as ActivityType)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="note">บันทึก</option>
                                <option value="call">โทร</option>
                                <option value="line">LINE</option>
                                <option value="email">อีเมล</option>
                                <option value="meeting">ประชุม</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">บันทึก</label>
                            <Textarea
                                value={modalNote}
                                onChange={(e) => setModalNote(e.target.value)}
                                placeholder="เพิ่มบันทึกเกี่ยวกับการเปลี่ยนสถานะ..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">วันติดตามถัดไป</label>
                            <Input
                                type="date"
                                value={modalFollowup}
                                onChange={(e) => setModalFollowup(e.target.value)}
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
            </Dialog>
        </div>
    );
}
