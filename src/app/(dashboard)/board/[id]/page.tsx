'use client';

import { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAppStore } from '@/stores/app-store';
import { BOARD_COLUMNS, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { mockUsers } from '@/lib/mock-data';
import { formatDate, getRelativeTime } from '@/lib/utils';
import { ActivityType } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import {
    ArrowLeft, Phone, Mail, Globe, Facebook, MessageCircle,
    Star, MapPin, CalendarDays, Plus, UserCheck,
    Sparkles, ArrowRightLeft, X, Tag,
} from 'lucide-react';

function getScoreColor(score: number) {
    if (score >= 80) return 'bg-red-500 text-white';
    if (score >= 50) return 'bg-amber-500 text-white';
    return 'bg-blue-500 text-white';
}

function getScoreLabel(score: number) {
    if (score >= 80) return 'Hot Lead';
    if (score >= 50) return 'Warm Lead';
    return 'Cool Lead';
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const {
        leads, activities, updateLead, moveLeadToColumn, addActivity,
        convertLeadToCustomer,
    } = useAppStore();

    const lead = leads.find((l) => l.id === id);
    const [newNote, setNewNote] = useState('');
    const [newNoteType, setNewNoteType] = useState<ActivityType>('note');
    const [newTag, setNewTag] = useState('');

    const leadActivities = useMemo(
        () => activities.filter((a) => a.lead_id === id).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        [activities, id]
    );

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <p className="text-lg font-medium">ไม่พบลีดนี้</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/board')}>
                    กลับหน้าบอร์ด
                </Button>
            </div>
        );
    }

    const assignedUser = mockUsers.find((u) => u.id === lead.assigned_to);
    const currentColumn = BOARD_COLUMNS.find((c) => c.id === lead.board_status);

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        addActivity({
            id: `act-${Date.now()}`,
            customer_id: '',
            lead_id: lead.id,
            team_id: 'team-001',
            type: newNoteType,
            content: newNote,
            followup_date: null,
            created_by: 'user-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        setNewNote('');
    };

    const handleConvert = () => {
        const customerId = convertLeadToCustomer(lead.id);
        if (customerId) {
            router.push(`/customers/${customerId}`);
        }
    };

    const handleStatusChange = (newStatus: string) => {
        moveLeadToColumn(lead.id, newStatus as any);
    };

    const handleAddTag = () => {
        if (!newTag.trim()) return;
        if (lead.ai_tags.includes(newTag.trim())) { setNewTag(''); return; }
        updateLead(lead.id, { ai_tags: [...lead.ai_tags, newTag.trim()] });
        setNewTag('');
    };

    const handleRemoveTag = (tag: string) => {
        updateLead(lead.id, { ai_tags: lead.ai_tags.filter(t => t !== tag) });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs items={[
                { label: 'บอร์ดลีด', href: '/board' },
                { label: lead.business_name },
            ]} />

            {/* Back + Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.push('/board')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    กลับบอร์ด
                </Button>
                <div className="flex items-center gap-2">
                    {lead.board_status === 'won' && !lead.converted_customer_id && (
                        <Button onClick={handleConvert} className="bg-green-600 hover:bg-green-700 gap-2">
                            <UserCheck className="w-4 h-4" />
                            แปลงเป็นลูกค้า
                        </Button>
                    )}
                    {lead.converted_customer_id && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/customers/${lead.converted_customer_id}`)}
                            className="gap-2 text-green-600 border-green-200"
                        >
                            <UserCheck className="w-4 h-4" />
                            ดูข้อมูลลูกค้า
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Business Info */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Header Card */}
                    <Card className="shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{lead.business_name}</h1>
                                    <Badge variant="secondary" className="mt-1">{lead.industry}</Badge>
                                </div>
                                <Badge className={`text-lg px-3 py-1 ${getScoreColor(lead.ai_score)}`}>
                                    {lead.ai_score}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {lead.address}
                                </div>
                                {lead.phone && (
                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {lead.phone}
                                    </a>
                                )}
                                {lead.email && (
                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {lead.email}
                                    </a>
                                )}
                                {lead.line_id && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MessageCircle className="w-4 h-4 text-green-500" />
                                        {lead.line_id}
                                    </div>
                                )}
                                {lead.website_url && (
                                    <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        {lead.website_url}
                                    </a>
                                )}
                                {lead.facebook_url && (
                                    <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                                        <Facebook className="w-4 h-4 text-blue-500" />
                                        Facebook
                                    </a>
                                )}
                            </div>

                            {/* Google Rating */}
                            {lead.google_rating > 0 && (
                                <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= Math.round(lead.google_rating) ? 'text-amber-400' : 'text-gray-200'}`}
                                                fill={star <= Math.round(lead.google_rating) ? 'currentColor' : 'none'}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {lead.google_rating} ({lead.google_review_count} รีวิว)
                                    </span>
                                </div>
                            )}

                            {/* Tags — editable */}
                            <div className="mt-4 pt-3 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-500">แท็ก</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {lead.ai_tags.map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs group pl-2 pr-1 gap-1">
                                            {tag}
                                            <button onClick={() => handleRemoveTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                        placeholder="เพิ่มแท็ก..."
                                        className="px-2.5 py-1.5 text-xs border rounded-md flex-1 max-w-[180px] focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <Button size="sm" variant="ghost" onClick={handleAddTag} disabled={!newTag.trim()} className="h-7 px-2">
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <Card className="shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">กิจกรรม</h3>

                            {/* Add Note */}
                            <div className="flex gap-2 mb-4">
                                <select
                                    value={newNoteType}
                                    onChange={(e) => setNewNoteType(e.target.value as ActivityType)}
                                    className="px-2 py-1.5 text-xs border rounded-md bg-white w-24"
                                >
                                    <option value="note">บันทึก</option>
                                    <option value="call">โทร</option>
                                    <option value="line">LINE</option>
                                    <option value="email">อีเมล</option>
                                    <option value="meeting">ประชุม</option>
                                </select>
                                <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="เพิ่มบันทึก..."
                                    rows={2}
                                    className="flex-1 text-sm"
                                />
                                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-3">
                                {leadActivities.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีกิจกรรม</p>
                                ) : (
                                    leadActivities.map((act) => {
                                        const config = ACTIVITY_TYPE_CONFIG[act.type];
                                        return (
                                            <div key={act.id} className="flex gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 flex-shrink-0 ${config?.color || ''}`}>
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800">{act.content}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {config?.label} · {getRelativeTime(act.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Score & Status */}
                <div className="space-y-4">
                    {/* AI Score Breakdown — Universal labels */}
                    <Card className="shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-900">AI Score Breakdown</h3>
                            </div>
                            <div className="text-center mb-4">
                                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(lead.ai_score)}`}>
                                    {lead.ai_score}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{getScoreLabel(lead.ai_score)}</p>
                            </div>
                            <div className="space-y-3">
                                <ScoreBar label="ความเกี่ยวข้อง" score={lead.ai_score_fit} max={40} />
                                <ScoreBar label="โอกาส" score={lead.ai_score_need} max={30} />
                                <ScoreBar label="ข้อมูล" score={lead.ai_score_potential} max={30} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                                ความเกี่ยวข้อง: ลีดเหมาะกับธุรกิจของคุณแค่ไหน · โอกาส: สัญญาณโอกาสทางธุรกิจ · ข้อมูล: ข้อมูลติดต่อที่มีครบถ้วนแค่ไหน
                            </p>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card className="shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">สถานะ</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500">คอลัมน์</label>
                                    <select
                                        value={lead.board_status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-white"
                                    >
                                        {BOARD_COLUMNS.map((col) => (
                                            <option key={col.id} value={col.id}>{col.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">ผู้รับผิดชอบ</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <UserAvatar name={assignedUser?.name || ''} className="w-6 h-6 text-[10px]" />
                                        <select
                                            value={lead.assigned_to}
                                            onChange={(e) => updateLead(lead.id, { assigned_to: e.target.value })}
                                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white"
                                        >
                                            {mockUsers.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {lead.next_followup_date && (
                                    <div>
                                        <label className="text-xs text-gray-500">ติดตามถัดไป</label>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                                            <CalendarDays className="w-4 h-4 text-gray-400" />
                                            {formatDate(lead.next_followup_date)}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-500">สร้างเมื่อ</label>
                                    <p className="text-sm text-gray-600 mt-0.5">{formatDate(lead.created_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
    const pct = Math.round((score / max) * 100);
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">{score}/{max}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
