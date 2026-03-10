'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Search, X, Users, Target, CheckSquare, FileText, ChevronRight } from 'lucide-react';

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const router = useRouter();
    const customers = useAppStore((s) => s.customers);
    const leads = useAppStore((s) => s.leads);
    const tasks = useAppStore((s) => s.tasks);
    const documents = useAppStore((s) => s.documents);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const results = useMemo(() => {
        if (!query.trim()) return { customers: [], leads: [], tasks: [], documents: [] };
        const q = query.toLowerCase();
        return {
            customers: customers.filter((c) => c.business_name.toLowerCase().includes(q)).slice(0, 5),
            leads: leads.filter((l) => l.business_name.toLowerCase().includes(q)).slice(0, 5),
            tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5),
            documents: documents.filter((d) => d.document_number.toLowerCase().includes(q)).slice(0, 5),
        };
    }, [query, customers, leads, tasks, documents]);

    const navigate = useCallback((path: string) => {
        router.push(path);
        setOpen(false);
        setQuery('');
    }, [router]);

    const hasResults = results.customers.length + results.leads.length + results.tasks.length + results.documents.length > 0;

    const quickActions = [
        { label: 'เพิ่มลีดใหม่', icon: Target, path: '/board', color: 'text-orange-500' },
        { label: 'เพิ่มงานใหม่', icon: CheckSquare, path: '/tasks', color: 'text-green-500' },
        { label: 'สร้างใบเสนอราคา', icon: FileText, path: '/documents?type=quotation', color: 'text-blue-500' },
        { label: 'เพิ่มลูกค้าใหม่', icon: Users, path: '/customers', color: 'text-indigo-500' },
    ];

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <Search className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ค้นหาสิ่งต่างๆ ใน LeadSpark..."
                        className="flex-1 text-base outline-none bg-transparent placeholder-gray-400 font-medium"
                    />
                    <div className="flex items-center gap-2">
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <span className="text-[10px] font-bold text-gray-300 border border-gray-200 px-1.5 py-0.5 rounded-md uppercase">Esc</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {query.trim() ? (
                        <div className="py-2">
                            {!hasResults && (
                                <div className="py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                                        <Search className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-500">ไม่พบผลลัพธ์ที่ตรงกับ "{query}"</p>
                                    <p className="text-xs text-gray-400 mt-1">ลองใช้คำค้นหาอื่น หรือลองดูคีย์เวิร์ดที่กว้างขึ้น</p>
                                </div>
                            )}

                            {results.customers.length > 0 && (
                                <div className="mb-2">
                                    <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">👥 ลูกค้า</p>
                                    {results.customers.map((c) => (
                                        <button key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="w-full flex items-center gap-4 px-5 py-2.5 hover:bg-blue-50/50 text-left group">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {c.business_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.business_name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">{c.industry}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Same structure for leads, tasks, documents with improved styling... */}
                            {results.leads.length > 0 && (
                                <div className="mb-2">
                                    <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">🎯 ลีด</p>
                                    {results.leads.map((l) => (
                                        <button key={l.id} onClick={() => navigate(`/board`)} className="w-full flex items-center gap-4 px-5 py-2.5 hover:bg-orange-50/50 text-left group">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                <Target className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{l.business_name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">AI Score: {l.ai_score}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.tasks.length > 0 && (
                                <div className="mb-2">
                                    <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">✅ งาน</p>
                                    {results.tasks.map((t) => (
                                        <button key={t.id} onClick={() => navigate('/tasks')} className="w-full flex items-center gap-4 px-5 py-2.5 hover:bg-green-50/50 text-left group">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{t.title}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">{t.due_date}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.documents.length > 0 && (
                                <div className="mb-2">
                                    <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">📄 เอกสาร</p>
                                    {results.documents.map((d) => (
                                        <button key={d.id} onClick={() => navigate('/documents')} className="w-full flex items-center gap-4 px-5 py-2.5 hover:bg-purple-50/50 text-left group">
                                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{d.document_number}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">{d.type === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-4">
                            <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">⚡ ทางลัดด่วน</p>
                            <div className="grid grid-cols-2 gap-2 p-2 px-3">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => navigate(action.path)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group text-left"
                                    >
                                        <div className={`w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                                            <action.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 px-5 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <p className="text-xs text-gray-400 font-medium italic">พิมพ์เพื่อค้นหาชื่อลูกค้า, ลีด, เลขที่เอกสาร หรือรายละเอียดงาน...</p>
                                <div className="flex items-center gap-1">
                                    <kbd className="bg-white border shadow-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-400">⌘</kbd>
                                    <kbd className="bg-white border shadow-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-400">K</kbd>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
