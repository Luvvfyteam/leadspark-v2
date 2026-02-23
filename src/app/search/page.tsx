'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { INDUSTRY_OPTIONS, AREAS, PROVINCES, BUSINESS_SIZE_OPTIONS } from '@/lib/constants';
import { mockUsers } from '@/lib/mock-data';
import { Lead } from '@/types';
import {
    Search, MapPin, Phone, Star, Loader2, UserPlus, ChevronDown, ChevronUp, Filter, X, Plus
} from 'lucide-react';

/* ── Searchable dropdown ─────────────────────────────────── */
function SearchableDropdown({ label, options, value, onChange, placeholder }: {
    label: string; options: string[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
    return (
        <div ref={ref} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <button
                type="button"
                onClick={() => { setOpen(!open); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder || 'ทั้งหมด'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="พิมพ์เพื่อค้นหา..."
                            className="w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
                        >ทั้งหมด</button>
                        {filtered.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { onChange(opt); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${value === opt ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >{opt}</button>
                        ))}
                        {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">ไม่พบผลลัพธ์</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Score badge ──────────────────────────────────────────── */
function ScoreBadge({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-red-500' : score >= 50 ? 'bg-amber-500' : 'bg-blue-500';
    const label = score >= 80 ? 'Hot' : score >= 50 ? 'Warm' : 'Cool';
    return <span className={`${color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>{score} {label}</span>;
}

/* ── Main page ───────────────────────────────────────────── */
export default function LeadSearchPage() {
    const { leads, updateLead } = useAppStore();
    const [globalSearch, setGlobalSearch] = useState('');
    const [industry, setIndustry] = useState('');
    const [province, setProvince] = useState('');
    const [area, setArea] = useState('');
    const [minRating, setMinRating] = useState('');
    const [size, setSize] = useState<string[]>([]);
    const [onlineStatus, setOnlineStatus] = useState<string[]>([]);
    const [resultCount, setResultCount] = useState('20');
    const [showExtra, setShowExtra] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const results = useMemo(() => {
        if (!hasSearched) return [];
        let filtered = [...leads];
        if (globalSearch) {
            const q = globalSearch.toLowerCase();
            filtered = filtered.filter(l =>
                l.business_name.toLowerCase().includes(q) ||
                l.industry.toLowerCase().includes(q) ||
                l.address.toLowerCase().includes(q) ||
                l.ai_tags.some(t => t.toLowerCase().includes(q))
            );
        }
        if (industry) filtered = filtered.filter(l => l.industry === industry);
        if (province) filtered = filtered.filter(l => l.address.includes(province.replace('มหานคร', 'ฯ')));
        if (area) filtered = filtered.filter(l => l.address.toLowerCase().includes(area.toLowerCase()));
        if (minRating) filtered = filtered.filter(l => l.google_rating >= parseFloat(minRating));
        if (size.length > 0) {
            filtered = filtered.filter(l => {
                const cnt = l.google_review_count;
                return size.some(s => {
                    if (s === 'small') return cnt < 50;
                    if (s === 'medium') return cnt >= 50 && cnt < 200;
                    return cnt >= 200;
                });
            });
        }
        if (onlineStatus.includes('website')) filtered = filtered.filter(l => l.has_website);
        if (onlineStatus.includes('facebook')) filtered = filtered.filter(l => l.fb_active);
        filtered.sort((a, b) => b.ai_score - a.ai_score);
        return filtered.slice(0, parseInt(resultCount));
    }, [hasSearched, leads, globalSearch, industry, province, area, minRating, size, onlineStatus, resultCount]);

    const handleSearch = useCallback(() => {
        setIsSearching(true);
        setTimeout(() => { setIsSearching(false); setHasSearched(true); }, 1500);
    }, []);

    const clearFilters = () => {
        setGlobalSearch(''); setIndustry(''); setProvince(''); setArea('');
        setMinRating(''); setSize([]); setOnlineStatus([]); setResultCount('20'); setHasSearched(false);
    };

    const handleAssign = (leadId: string, userId: string) => updateLead(leadId, { assigned_to: userId });
    const handleAddToBoard = (leadId: string) => updateLead(leadId, { board_status: 'new' as const });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">ค้นหาลีด</h1>

            {/* Filter card */}
            <Card className="shadow-sm">
                <CardContent className="p-6 space-y-5">
                    {/* ── Global search bar ──────────────── */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="ค้นหาธุรกิจ... พิมพ์ชื่อ, ประเภท, หรือพื้นที่"
                            className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        />
                        {globalSearch && (
                            <button onClick={() => setGlobalSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* ── Primary filters (3 columns) ──── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SearchableDropdown label="ประเภทธุรกิจ" options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} />
                        <SearchableDropdown label="จังหวัด" options={PROVINCES} value={province} onChange={setProvince} />
                        <SearchableDropdown label="พื้นที่" options={AREAS} value={area} onChange={setArea} placeholder="เลือกย่าน / เขต" />
                    </div>

                    {/* ── Collapsible extra filters ─────── */}
                    <button
                        type="button"
                        onClick={() => setShowExtra(!showExtra)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        ตัวกรองเพิ่มเติม
                        {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showExtra && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 pb-2 border-t border-dashed border-gray-200">
                            {/* Min rating */}
                            <SearchableDropdown
                                label="คะแนนรีวิวขั้นต่ำ"
                                options={['3.0', '3.5', '4.0', '4.5']}
                                value={minRating}
                                onChange={setMinRating}
                                placeholder="ไม่ระบุ"
                            />

                            {/* Size checkboxes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ขนาดธุรกิจ</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {BUSINESS_SIZE_OPTIONS.map(s => (
                                        <label key={s.value} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${size.includes(s.value) ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input
                                                type="checkbox"
                                                checked={size.includes(s.value)}
                                                onChange={() => setSize(prev => prev.includes(s.value) ? prev.filter(v => v !== s.value) : [...prev, s.value])}
                                                className="sr-only"
                                            />
                                            {s.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Online Status checkboxes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะออนไลน์</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {[
                                        { value: 'website', label: '🌐 มีเว็บไซต์' },
                                        { value: 'facebook', label: '📘 Facebook ใช้งานอยู่' },
                                    ].map(opt => (
                                        <label key={opt.value} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${onlineStatus.includes(opt.value) ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input
                                                type="checkbox"
                                                checked={onlineStatus.includes(opt.value)}
                                                onChange={() => setOnlineStatus(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
                                                className="sr-only"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Result count */}
                            <SearchableDropdown
                                label="จำนวนผลลัพธ์"
                                options={['10', '20', '30', '50']}
                                value={`${resultCount} รายการ`}
                                onChange={v => setResultCount(v.replace(' รายการ', ''))}
                                placeholder="20 รายการ"
                            />
                        </div>
                    )}

                    {/* ── Action buttons ────────────────── */}
                    <div className="flex items-center gap-3 pt-1">
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                            เริ่มค้นหา
                        </Button>

                        <Button variant="outline" onClick={clearFilters} className="px-4">
                            ล้างตัวกรอง
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {isSearching && (
                <div className="flex justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-gray-500">กำลังค้นหา...</p>
                    </div>
                </div>
            )}

            {!isSearching && hasSearched && (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">พบ {results.length} ราย</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {results.map(lead => (
                            <LeadCard key={lead.id} lead={lead} onAssign={handleAssign} onAddToBoard={handleAddToBoard} />
                        ))}
                    </div>

                    {results.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p>ไม่พบผลลัพธ์ — ลองปรับตัวกรอง</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Lead result card ────────────────────────────────────── */
function LeadCard({ lead, onAssign, onAddToBoard }: {
    lead: Lead; onAssign: (id: string, uid: string) => void; onAddToBoard: (id: string) => void;
}) {
    const isOnBoard = lead.board_status !== null && lead.board_status !== 'lost';
    const [newTag, setNewTag] = useState('');
    const { updateLead } = useAppStore();

    const handleAddTag = () => {
        if (!newTag.trim()) return;
        updateLead(lead.id, { ai_tags: [...lead.ai_tags, newTag.trim()] });
        setNewTag('');
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1 mr-3">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{lead.business_name}</h3>
                        <Badge variant="secondary" className="text-[11px] mt-1">{lead.industry}</Badge>
                    </div>
                    <ScoreBadge score={lead.ai_score} />
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                    <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span className="truncate">{lead.address}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{lead.phone}</span></div>
                    {lead.google_rating > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                            <span className="text-amber-600 font-medium">{lead.google_rating}</span>
                            <span className="text-gray-400">({lead.google_review_count} รีวิว)</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {lead.ai_tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[11px] bg-gray-50 text-gray-600 border-gray-200">{tag}</Badge>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                        size="sm"
                        variant={isOnBoard ? 'secondary' : 'default'}
                        disabled={isOnBoard}
                        onClick={() => onAddToBoard(lead.id)}
                        className={isOnBoard ? 'text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                    >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        {isOnBoard ? 'อยู่ใน Board แล้ว' : 'เพิ่มเข้า Board'}
                    </Button>

                    <select
                        value={lead.assigned_to}
                        onChange={e => onAssign(lead.id, e.target.value)}
                        className="ml-auto text-xs border rounded-md px-2 py-1.5 text-gray-600 bg-white"
                    >
                        <option value="">มอบหมาย</option>
                        {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </CardContent>
        </Card>
    );
}
