'use client';

import { useState } from 'react';
import { RFQS } from '@/lib/mock-marketplace';
import { MY_BUSINESS_PROFILE } from '@/lib/mock-marketplace';
import { RFQ } from '@/types';
import {
    Search,
    Filter,
    Clock,
    Users,
    MapPin,
    TrendingUp,
    ChevronRight,
    Zap,
    BadgeCheck,
    DollarSign,
    Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['ทั้งหมด', 'ไอที/เว็บไซต์', 'Digital Marketing', 'กราฟิก/ดีไซน์', 'สิ่งพิมพ์', 'ขนส่ง/โลจิสติกส์', 'อื่นๆ'];

// Compute match score for display
const getMatchScore = (rfq: RFQ): number => {
    const myCategories = [...MY_BUSINESS_PROFILE.categories, ...MY_BUSINESS_PROFILE.subCategories];
    const rfqCat = rfq.category.toLowerCase();
    if (rfqCat.includes('เว็บ') || rfqCat.includes('seo') || rfqCat.includes('digital') || rfqCat.includes('marketing')) return 90 + Math.floor(Math.random() * 8);
    if (myCategories.some(c => rfqCat.includes(c.toLowerCase()))) return 75 + Math.floor(Math.random() * 15);
    return 30 + Math.floor(Math.random() * 30);
};

const ALL_RFQS_WITH_SCORES = RFQS.map(rfq => ({ ...rfq, _score: getMatchScore(rfq) }));

function formatBudget(min: number, max: number) {
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
    return `฿${fmt(min)} – ฿${fmt(max)}`;
}

function daysLeft(expiresAt: string) {
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'หมดอายุแล้ว';
    if (diff === 0) return 'หมดอายุวันนี้';
    return `${diff} วัน`;
}

function MatchBadge({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-green-50 text-green-700 border-green-200'
        : score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-gray-50 text-gray-500 border-gray-200';
    return (
        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5 border', color)}>
            <Zap className="w-3 h-3" />
            Match {score}%
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="text-xs rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-600 font-medium border border-blue-100">
            {type === 'service' ? 'บริการ' : type === 'product' ? 'สินค้า' : 'สินค้า/บริการ'}
        </span>
    );
}

function RFQCard({ rfq, score }: { rfq: RFQ; score: number }) {
    const [sent, setSent] = useState(false);
    const isHighMatch = score >= 75;

    return (
        <div className={cn(
            'bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200 group',
            isHighMatch ? 'border-blue-200' : 'border-gray-200'
        )}>
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <MatchBadge score={score} />
                        <TypeBadge type={rfq.type} />
                        {rfq.visibility === 'verified_only' && (
                            <span className="text-xs rounded-full px-2.5 py-0.5 bg-purple-50 text-purple-600 font-medium border border-purple-100 flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" /> Verified Only
                            </span>
                        )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
                        {rfq.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{rfq.buyerName} · {rfq.area}</p>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <DollarSign className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700">{formatBudget(rfq.budgetMin, rfq.budgetMax)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>{daysLeft(rfq.expiresAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{rfq.proposalCount} ข้อเสนอ</span>
                </div>
            </div>

            {/* Requirements preview */}
            <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{rfq.requirements}</p>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setSent(true)}
                    disabled={sent}
                    className={cn(
                        'flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150',
                        sent
                            ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                >
                    <Send className="w-3.5 h-3.5" />
                    {sent ? 'ส่งแล้ว ✓' : 'ส่งข้อเสนอ'}
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {rfq.area}
                </div>
            </div>
        </div>
    );
}

export default function DealFeedPage() {
    const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
    const [sortBy, setSortBy] = useState<'match' | 'budget' | 'deadline'>('match');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = ALL_RFQS_WITH_SCORES
        .filter(rfq => {
            if (activeCategory !== 'ทั้งหมด' && !rfq.category.includes(activeCategory)) return false;
            if (searchQuery && !rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) && !rfq.requirements.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'match') return b._score - a._score;
            if (sortBy === 'budget') return b.budgetMax - a.budgetMax;
            return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        });

    const highMatchCount = ALL_RFQS_WITH_SCORES.filter(r => r._score >= 75).length;

    return (
        <div className="max-w-4xl mx-auto py-2">
            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Deal Feed</h1>
                <p className="text-sm text-gray-500">
                    งานที่ตรงกับโปรไฟล์ของคุณ ·&nbsp;
                    <span className="text-blue-600 font-medium">{highMatchCount} งาน Match สูง</span>
                    &nbsp;จาก {RFQS.length} งานทั้งหมด
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'งาน Match สูง (75%+)', value: highMatchCount, color: 'text-green-600', icon: TrendingUp },
                    { label: 'งานทั้งหมด', value: RFQS.length, color: 'text-blue-600', icon: Filter },
                    { label: 'มูลค่าเฉลี่ย', value: '฿32k', color: 'text-gray-900', icon: DollarSign },
                ].map(stat => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
                        <stat.icon className="w-5 h-5 text-gray-300 mb-2" />
                        <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ค้นหางาน เช่น เว็บไซต์, SEO, กราฟิก..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150',
                                activeCategory === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">เรียงโดย:</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as 'match' | 'budget' | 'deadline')}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none"
                        >
                            <option value="match">Match สูงสุด</option>
                            <option value="budget">มูลค่าสูงสุด</option>
                            <option value="deadline">ใกล้หมดอายุ</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* RFQ List */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-medium text-gray-600">ไม่พบงานที่ตรงกับการค้นหา</p>
                    <p className="text-sm mt-1">ลองเปลี่ยน Keyword หรือ Category</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(rfq => (
                        <RFQCard key={rfq.id} rfq={rfq} score={rfq._score} />
                    ))}
                </div>
            )}
        </div>
    );
}
