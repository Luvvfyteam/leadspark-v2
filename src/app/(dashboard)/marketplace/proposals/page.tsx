'use client';

import { useState } from 'react';
import { PROPOSALS, RFQS } from '@/lib/mock-marketplace';
import { Proposal } from '@/types';
import {
    Send,
    Inbox,
    ChevronRight,
    Star,
    Clock,
    Zap,
    BadgeCheck,
    CheckCircle2,
    Eye,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'sent' | 'received';

function StatusBadge({ status }: { status: Proposal['status'] }) {
    const configs: Record<Proposal['status'], { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
        sent: { label: 'ส่งแล้ว', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Send },
        viewed: { label: 'เปิดดูแล้ว', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Eye },
        shortlisted: { label: 'คัดเลือกแล้ว', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: CheckCircle2 },
        accepted: { label: 'ยอมรับแล้ว', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
        rejected: { label: 'ไม่ผ่าน', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;

    return (
        <span className={cn('inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 border', config.color)}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
}

function MatchBadge({ score }: { score: number }) {
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-gray-500';
    return (
        <span className={cn('flex items-center gap-0.5 text-xs font-semibold', color)}>
            <Zap className="w-3 h-3" />
            {score}%
        </span>
    );
}

function getRFQTitle(rfqId: string): string {
    const rfq = RFQS.find(r => r.id === rfqId);
    return rfq?.title ?? 'RFQ ที่สิ้นสุดแล้ว';
}

function ProposalCard({ proposal, mode }: { proposal: Proposal; mode: 'sent' | 'received' }) {
    const rfqTitle = getRFQTitle(proposal.rfqId);

    return (
        <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors group cursor-pointer">
            {/* Avatar */}
            <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold',
                mode === 'sent' ? 'bg-blue-500' : 'bg-purple-500'
            )}>
                {mode === 'sent'
                    ? proposal.sellerName.charAt(0)
                    : proposal.sellerName.charAt(0)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {mode === 'sent' ? rfqTitle : proposal.sellerName}
                    </p>
                    <StatusBadge status={proposal.status} />
                    {proposal.sellerTrustLevel >= 3 && (
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    {mode === 'received' && <span className="truncate">{rfqTitle}</span>}
                    {mode === 'received' && <span>·</span>}
                    <span className="text-gray-700 font-medium text-xs">฿{proposal.price.toLocaleString()} / {proposal.unit}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {proposal.leadTime}
                    </span>
                    {mode === 'received' && (
                        <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-400" />
                                {proposal.sellerRating}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <MatchBadge score={proposal.matchScore} />
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
        </div>
    );
}

export default function ProposalsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('sent');

    const sentProposals = PROPOSALS.filter(p => p.sellerId === 'bp-my');
    const receivedProposals = PROPOSALS.filter(p => p.sellerId !== 'bp-my');

    const displayed = activeTab === 'sent' ? sentProposals : receivedProposals;

    const sentStats = {
        total: sentProposals.length,
        shortlisted: sentProposals.filter(p => p.status === 'shortlisted').length,
        avgMatch: Math.round(sentProposals.reduce((s, p) => s + p.matchScore, 0) / sentProposals.length || 0),
    };
    const receivedStats = {
        total: receivedProposals.length,
        toReview: receivedProposals.filter(p => p.status === 'sent').length,
        shortlisted: receivedProposals.filter(p => p.status === 'shortlisted').length,
    };

    return (
        <div className="max-w-3xl mx-auto py-2">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">ข้อเสนอ</h1>
                    <p className="text-sm text-gray-500">ติดตามข้อเสนอที่ส่งออกและรับเข้า</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
                <button
                    onClick={() => setActiveTab('sent')}
                    className={cn(
                        'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                        activeTab === 'sent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                >
                    <Send className="w-3.5 h-3.5" />
                    ข้อเสนอที่ฉันส่ง ({sentProposals.length})
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={cn(
                        'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                        activeTab === 'received' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                >
                    <Inbox className="w-3.5 h-3.5" />
                    ข้อเสนอที่ได้รับ ({receivedProposals.length})
                    {receivedStats.toReview > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                            {receivedStats.toReview}
                        </span>
                    )}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                {activeTab === 'sent' ? (
                    <>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-blue-600">{sentStats.total}</p>
                            <p className="text-xs text-gray-400 mt-0.5">ส่งทั้งหมด</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-purple-600">{sentStats.shortlisted}</p>
                            <p className="text-xs text-gray-400 mt-0.5">ถูกคัดเลือก</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-green-600">{sentStats.avgMatch}%</p>
                            <p className="text-xs text-gray-400 mt-0.5">Match เฉลี่ย</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-blue-600">{receivedStats.total}</p>
                            <p className="text-xs text-gray-400 mt-0.5">รับทั้งหมด</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-amber-600">{receivedStats.toReview}</p>
                            <p className="text-xs text-gray-400 mt-0.5">รอตรวจสอบ</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-2xl font-bold text-purple-600">{receivedStats.shortlisted}</p>
                            <p className="text-xs text-gray-400 mt-0.5">คัดเลือกแล้ว</p>
                        </div>
                    </>
                )}
            </div>

            {/* List */}
            <div className="bg-white border border-gray-200 rounded-xl px-5">
                {displayed.length === 0 ? (
                    <div className="text-center py-16">
                        {activeTab === 'sent'
                            ? <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            : <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        }
                        <p className="text-base font-semibold text-gray-600">
                            {activeTab === 'sent' ? 'ยังไม่มีข้อเสนอที่ส่ง' : 'ยังไม่มีข้อเสนอที่ได้รับ'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {activeTab === 'sent' ? 'ไปที่ Deal Feed เพื่อส่งข้อเสนอ' : 'สร้าง RFQ เพื่อรับข้อเสนอจากผู้ขาย'}
                        </p>
                    </div>
                ) : (
                    displayed.map(proposal => (
                        <ProposalCard key={proposal.id} proposal={proposal} mode={activeTab} />
                    ))
                )}
            </div>
        </div>
    );
}
