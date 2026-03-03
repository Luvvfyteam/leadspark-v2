'use client';

import { useState } from 'react';
import { MY_RFQS } from '@/lib/mock-marketplace';
import { RFQ } from '@/types';
import {
    Plus,
    Clock,
    Users,
    ChevronRight,
    FileText,
    CheckCircle2,
    XCircle,
    Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'open' | 'closed';

function StatusBadge({ status }: { status: RFQ['status'] }) {
    const configs = {
        open: { label: 'เปิดรับ', color: 'bg-green-50 text-green-700 border-green-200', icon: Circle },
        in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
        closed: { label: 'ปิดแล้ว', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle },
        cancelled: { label: 'ยกเลิก', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
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

function formatBudget(min: number, max: number) {
    const fmt = (n: number) => n >= 1000 ? `฿${(n / 1000).toFixed(0)}k` : `฿${n}`;
    return `${fmt(min)} – ${fmt(max)}`;
}

function daysLeft(expiresAt: string) {
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'หมดอายุแล้ว';
    if (diff === 0) return 'หมดอายุวันนี้';
    return `${diff} วันที่เหลือ`;
}

function RFQRow({ rfq }: { rfq: RFQ }) {
    return (
        <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors group cursor-pointer">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">{rfq.title}</p>
                    <StatusBadge status={rfq.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{rfq.category}</span>
                    <span>·</span>
                    <span>{formatBudget(rfq.budgetMin, rfq.budgetMax)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {rfq.proposalCount} ข้อเสนอ
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {daysLeft(rfq.expiresAt)}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
        </div>
    );
}

export default function RFQPage() {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [showNewRFQ, setShowNewRFQ] = useState(false);

    const filtered = MY_RFQS.filter(rfq => {
        if (activeTab === 'open') return rfq.status === 'open';
        if (activeTab === 'closed') return rfq.status === 'closed' || rfq.status === 'cancelled';
        return true;
    });

    const openCount = MY_RFQS.filter(r => r.status === 'open').length;
    const totalProposals = MY_RFQS.reduce((s, r) => s + r.proposalCount, 0);

    return (
        <div className="max-w-3xl mx-auto py-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">RFQ ของฉัน</h1>
                        <p className="text-sm text-gray-500">คำขอใบเสนอราคาที่คุณโพสต์ไว้ในตลาด</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewRFQ(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    สร้าง RFQ ใหม่
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'RFQ ที่เปิดอยู่', value: openCount, color: 'text-green-600' },
                    { label: 'ข้อเสนอที่ได้รับ', value: totalProposals, color: 'text-blue-600' },
                    { label: 'RFQ ทั้งหมด', value: MY_RFQS.length, color: 'text-gray-900' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
                {([['all', 'ทั้งหมด'], ['open', 'เปิดอยู่'], ['closed', 'ปิดแล้ว']] as [TabType, string][]).map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                            activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* RFQ List */}
            <div className="bg-white border border-gray-200 rounded-xl px-5">
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-base font-semibold text-gray-600">ยังไม่มี RFQ</p>
                        <p className="text-sm text-gray-400 mt-1">สร้าง RFQ เพื่อรับใบเสนอราคาจากผู้ขายในตลาด</p>
                        <button
                            onClick={() => setShowNewRFQ(true)}
                            className="mt-4 flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            สร้าง RFQ แรก
                        </button>
                    </div>
                ) : (
                    filtered.map(rfq => <RFQRow key={rfq.id} rfq={rfq} />)
                )}
            </div>

            {/* New RFQ Modal (simplified) */}
            {showNewRFQ && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-base font-semibold text-gray-900">สร้าง RFQ ใหม่</h2>
                            <button onClick={() => setShowNewRFQ(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {[
                                { label: 'ชื่อ RFQ / สิ่งที่ต้องการ', placeholder: 'เช่น ต้องการเว็บไซต์ธุรกิจ', type: 'text' },
                                { label: 'หมวดหมู่', placeholder: 'เช่น ไอที/เว็บไซต์', type: 'text' },
                                { label: 'งบประมาณต่ำสุด (฿)', placeholder: '10000', type: 'number' },
                                { label: 'งบประมาณสูงสุด (฿)', placeholder: '50000', type: 'number' },
                            ].map(field => (
                                <div key={field.label}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">รายละเอียดความต้องการ</label>
                                <textarea
                                    rows={3}
                                    placeholder="อธิบายสิ่งที่ต้องการ ความต้องการพิเศษ เงื่อนไข..."
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowNewRFQ(false)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={() => setShowNewRFQ(false)} className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                                เผยแพร่ RFQ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
