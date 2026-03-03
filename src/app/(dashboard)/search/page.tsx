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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import {
    Search, MapPin, Phone, Star, Loader2, UserPlus, ChevronDown, ChevronUp, Filter, X, Plus,
    Sparkles, Save, Trash2, Download, Tag, CheckSquare, Square
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
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
            <button
                type="button"
                onClick={() => { setOpen(!open); setQuery(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-sm transition-all ${value ? 'border-blue-200 bg-blue-50/30 text-blue-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
                <span className={value ? 'font-semibold' : 'text-gray-400'}>{value || placeholder || 'ทั้งหมด'}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${value ? 'text-blue-400' : 'text-gray-400'}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-gray-50">
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="พิมพ์เพื่อค้นหา..."
                            className="w-full px-3 py-1.5 text-sm bg-gray-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48 scrollbar-hide">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 font-medium"
                        >ล้างค่า</button>
                        {filtered.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { onChange(opt); setOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${value === opt ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'}`}
                            >{opt}</button>
                        ))}
                        {filtered.length === 0 && <p className="px-3 py-3 text-xs text-gray-400 text-center">ไม่พบผลลัพธ์</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Score badge ──────────────────────────────────────────── */
function ScoreBadge({ score, fit, need, potential }: { score: number, fit: number, need: number, potential: number }) {
    const color = score >= 80 ? 'bg-red-500' : score >= 50 ? 'bg-amber-500' : 'bg-blue-500';
    const label = score >= 80 ? 'Hot' : score >= 50 ? 'Warm' : 'Cool';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button className={`${color} text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-sm hover:scale-105 transition-transform`}>
                        <Sparkles className="w-3 h-3" />
                        {score} {label}
                    </button>
                </TooltipTrigger>
                <TooltipContent className="p-3 bg-gray-900 text-white border-none rounded-xl shadow-2xl w-56">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">AI Score Breakdown</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">Fit (ความเหมาะสม)</span>
                            <span className="font-bold">{fit}/40</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">Need (ความต้องการ)</span>
                            <span className="font-bold">{need}/30</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">Potential (โอกาสเติบโต)</span>
                            <span className="font-bold">{potential}/30</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 italic text-[10px] text-blue-300">
                        "{score >= 80 ? 'ลีดนี้มีศักยภาพสูงมาก แนะนำให้ติดต่อทันที' : 'ลีดที่มีความเหมาะสม ควรตรวจสอบข้อมูลเพิ่มเติม'}"
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/* ── Main page ───────────────────────────────────────────── */
interface SavedSearch {
    id: string;
    name: string;
    filters: any;
}

export default function LeadSearchPage() {
    const { leads, updateLead } = useAppStore();
    const { showToast } = useToast();

    // Filters state
    const [globalSearch, setGlobalSearch] = useState('');
    const [industry, setIndustry] = useState('');
    const [province, setProvince] = useState('');
    const [area, setArea] = useState('');
    const [minRating, setMinRating] = useState('');
    const [size, setSize] = useState<string[]>([]);
    const [onlineStatus, setOnlineStatus] = useState<string[]>([]);
    const [resultCount, setResultCount] = useState('20');

    // UI state
    const [showExtra, setShowExtra] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    // Load saved searches
    useEffect(() => {
        const saved = localStorage.getItem('ls_saved_searches');
        if (saved) setSavedSearches(JSON.parse(saved));
    }, []);

    const saveSearch = () => {
        const name = prompt('ตั้งชื่อการค้นหานี้:');
        if (!name) return;
        const newSearch: SavedSearch = {
            id: `ss-${Date.now()}`,
            name,
            filters: { globalSearch, industry, province, area, minRating, size, onlineStatus, resultCount }
        };
        const updated = [...savedSearches, newSearch];
        setSavedSearches(updated);
        localStorage.setItem('ls_saved_searches', JSON.stringify(updated));
        showToast(`บันทึกการค้นหา "${name}" แล้ว`);
    };

    const applySavedSearch = (ss: SavedSearch) => {
        const f = ss.filters;
        setGlobalSearch(f.globalSearch);
        setIndustry(f.industry);
        setProvince(f.province);
        setArea(f.area);
        setMinRating(f.minRating);
        setSize(f.size);
        setOnlineStatus(f.onlineStatus);
        setResultCount(f.resultCount);
        handleSearch();
    };

    const removeSavedSearch = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = savedSearches.filter(s => s.id !== id);
        setSavedSearches(updated);
        localStorage.setItem('ls_saved_searches', JSON.stringify(updated));
    };

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
        setSelectedLeads(new Set());
        setTimeout(() => { setIsSearching(false); setHasSearched(true); }, 1200);
    }, []);

    const clearFilters = () => {
        setGlobalSearch(''); setIndustry(''); setProvince(''); setArea('');
        setMinRating(''); setSize([]); setOnlineStatus([]); setResultCount('20'); setHasSearched(false);
        setSelectedLeads(new Set());
    };

    // Bulk Actions
    const toggleSelectLead = (id: string) => {
        const next = new Set(selectedLeads);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedLeads(next);
    };

    const toggleSelectAll = () => {
        if (selectedLeads.size === results.length) setSelectedLeads(new Set());
        else setSelectedLeads(new Set(results.map(r => r.id)));
    };

    const handleBulkAddToBoard = () => {
        selectedLeads.forEach(id => updateLead(id, { board_status: 'new' }));
        showToast(`เพิ่ม ${selectedLeads.size} ลีดเข้า Pipeline แล้ว`);
        setSelectedLeads(new Set());
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">ค้นหาลีด</h1>
                        <p className="text-sm text-gray-500 mt-0.5">ค้นหาธุรกิจที่ตรงกับกลุ่มเป้าหมายของคุณด้วยขุมพลัง AI</p>
                    </div>
                </div>
                {hasSearched && (
                    <Button variant="outline" size="sm" onClick={saveSearch} className="gap-2 rounded-xl">
                        <Save className="w-4 h-4" /> บันทึกการค้นหา
                    </Button>
                )}
            </div>

            {/* Saved Searches Chips */}
            {savedSearches.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in duration-500">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 mr-1">บันทึกไว้:</p>
                    {savedSearches.map(ss => (
                        <button
                            key={ss.id}
                            onClick={() => applySavedSearch(ss)}
                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                        >
                            {ss.name}
                            <X onClick={(e) => removeSavedSearch(e, ss.id)} className="w-3 h-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                    ))}
                </div>
            )}

            {/* Filter card */}
            <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6 space-y-6">
                    {/* ── Global search bar ──────────────── */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="ค้นหาชื่อธุรกิจ, ประเภท, ย่าน หรือแท็กที่คุณต้องการ..."
                            className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium placeholder-gray-400"
                        />
                        {globalSearch && (
                            <button onClick={() => setGlobalSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* ── Primary filters (2-layer design) ──── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SearchableDropdown label="อุตสาหกรรม" options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} placeholder="เลือกประเภทธุรกิจ" />
                        <SearchableDropdown label="จังหวัด" options={PROVINCES} value={province} onChange={setProvince} placeholder="เลือกพื้นที่" />
                        <SearchableDropdown label="เขต / ย่าน" options={AREAS} value={area} onChange={setArea} placeholder="เลือกย่านที่ต้องการ" />
                    </div>

                    {/* ── Collapsible extra filters ─────── */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowExtra(!showExtra)}
                            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${showExtra ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            ตัวกรองขั้นสูง {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showExtra && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 pb-2 mt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                                {/* Rating and Count */}
                                <div className="space-y-6">
                                    <SearchableDropdown label="คะแนน Google Rating" options={['3.5', '4.0', '4.5']} value={minRating} onChange={setMinRating} placeholder="ขั้นต่ำ" />
                                    <SearchableDropdown label="แสดงจำนวนผลลัพธ์" options={['10', '20', '50', '100']} value={resultCount} onChange={setResultCount} />
                                </div>

                                {/* Size checkboxes */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">ขนาดธุรกิจ (รีวิว)</label>
                                    <div className="space-y-2">
                                        {BUSINESS_SIZE_OPTIONS.map(s => (
                                            <label key={s.value} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${size.includes(s.value) ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                                                <span className="text-sm font-semibold">{s.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={size.includes(s.value)}
                                                    onChange={() => setSize(prev => prev.includes(s.value) ? prev.filter(v => v !== s.value) : [...prev, s.value])}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Online Presence */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">การปรากฏตัวบนออนไลน์</label>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'website', label: 'เว็บไซต์ทางการ', icon: '🌐' },
                                            { value: 'facebook', label: 'Facebook Page', icon: '📘' },
                                        ].map(opt => (
                                            <label key={opt.value} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${onlineStatus.includes(opt.value) ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                                                <span className="text-sm font-semibold">{opt.icon} {opt.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={onlineStatus.includes(opt.value)}
                                                    onChange={() => setOnlineStatus(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Action buttons ────────────────── */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-xl text-base font-bold shadow-lg shadow-blue-200"
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                            เริ่มการค้นหา
                        </Button>

                        <Button variant="ghost" onClick={clearFilters} className="px-4 h-12 text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider text-[10px]">
                            ล้างตัวกรอง
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {isSearching && (
                <div className="flex justify-center py-24">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-pulse" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 tracking-wider uppercase">AI กำลังประมวลผลลีดที่ดีที่สุด...</p>
                    </div>
                </div>
            )}

            {!isSearching && hasSearched && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-gray-900">ผลการค้นหา ({results.length})</h2>
                            {results.length > 0 && (
                                <button onClick={toggleSelectAll} className="text-xs font-bold text-blue-600 hover:underline">
                                    {selectedLeads.size === results.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <p>เรียงตาม: <span className="font-bold text-gray-700">AI Match Score</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {results.map(lead => (
                            <LeadCard
                                key={lead.id}
                                lead={lead}
                                onAssign={handleAssign}
                                onAddToBoard={handleAddToBoard}
                                isSelected={selectedLeads.has(lead.id)}
                                onSelect={() => toggleSelectLead(lead.id)}
                            />
                        ))}
                    </div>

                    {results.length === 0 && (
                        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Search className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="text-lg font-bold text-gray-400">ไม่พบผลลัพธ์ที่ต้องการ</p>
                            <p className="text-sm text-gray-400 mt-1">ลองล้างตัวกรองหรือขยายพื้นที่การค้นหาของคุณ</p>
                            <Button variant="outline" className="mt-6" onClick={clearFilters}>ล้างตัวกรองทั้งหมด</Button>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedLeads.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-gray-900 text-white rounded-2xl shadow-2xl shadow-black/40 px-6 py-4 flex items-center gap-6 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-2 pr-6 border-r border-white/10">
                            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-black">
                                {selectedLeads.size}
                            </div>
                            <p className="text-sm font-bold whitespace-nowrap">เลือกอยู่ {selectedLeads.size} ราย</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button onClick={handleBulkAddToBoard} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2 font-bold px-5">
                                <Plus className="w-4 h-4" /> เพิ่มเข้า Pipeline
                            </Button>
                            <Button variant="ghost" className="h-10 text-gray-400 hover:text-white hover:bg-white/10 gap-2">
                                <Download className="w-4 h-4" /> Export CSV
                            </Button>
                            <Button variant="ghost" className="h-10 text-gray-400 hover:text-white hover:bg-white/10 gap-2">
                                <Tag className="w-4 h-4" /> ติดแท็ก
                            </Button>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button onClick={() => setSelectedLeads(new Set())} className="text-gray-400 hover:text-white p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Lead result card ────────────────────────────────────── */
function LeadCard({ lead, onAssign, onAddToBoard, isSelected, onSelect }: {
    lead: Lead; onAssign: (id: string, uid: string) => void; onAddToBoard: (id: string) => void;
    isSelected: boolean; onSelect: () => void;
}) {
    const isOnBoard = lead.board_status !== null && lead.board_status !== 'lost';
    const { updateLead } = useAppStore();

    return (
        <Card className={`relative shadow-sm hover:shadow-xl transition-all border-2 group overflow-hidden ${isSelected ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
            {/* Multi-select check */}
            <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className={`absolute top-3 left-3 z-10 p-1.5 rounded-lg transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white/80 backdrop-blur-sm text-gray-300 opacity-0 group-hover:opacity-100 border border-gray-200 shadow-sm'}`}
            >
                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>

            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1 pl-8">
                        <h3 className="text-base font-bold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">{lead.business_name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{lead.industry}</p>
                    </div>
                    <div className="flex-shrink-0">
                        <ScoreBadge score={lead.ai_score} fit={lead.ai_score_fit} need={lead.ai_score_need} potential={lead.ai_score_potential} />
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-2.5 text-sm text-gray-600 mb-5">
                    <div className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span className="text-xs leading-relaxed text-gray-500 font-medium">{lead.address}</span>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-bold text-gray-700">{lead.phone || '—'}</span>
                        </div>
                        {lead.google_rating > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                                <span className="font-black text-gray-900">{lead.google_rating}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">({lead.google_review_count})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {lead.ai_tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-50/50 text-gray-500 border-gray-200/60 lowercase tracking-tight">#{tag}</Badge>
                    ))}
                    {lead.has_website && <Badge className="bg-blue-50 text-blue-600 text-[10px] border-none font-bold">🌐 Website</Badge>}
                    {lead.fb_active && <Badge className="bg-indigo-50 text-indigo-600 text-[10px] border-none font-bold">📘 Facebook</Badge>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-auto">
                    <Button
                        size="sm"
                        variant={isOnBoard ? 'secondary' : 'default'}
                        disabled={isOnBoard}
                        onClick={() => onAddToBoard(lead.id)}
                        className={`flex-1 h-9 font-bold rounded-lg text-xs ${isOnBoard ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                    >
                        {isOnBoard ? <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                        {isOnBoard ? 'อยู่ใน Board แล้ว' : 'เพิ่มเข้า Board'}
                    </Button>

                    <div className="relative group/user">
                        <select
                            value={lead.assigned_to}
                            onChange={e => onAssign(lead.id, e.target.value)}
                            className="appearance-none h-9 pl-3 pr-8 text-[11px] font-bold border-2 border-gray-100 rounded-lg text-gray-500 bg-white hover:border-blue-200 hover:text-blue-600 transition-all cursor-pointer outline-none"
                        >
                            <option value="">มอบหมาย</option>
                            {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none group-hover/user:text-blue-400" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
