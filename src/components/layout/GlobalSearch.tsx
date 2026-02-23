'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Search, X, Users, Target, CheckSquare, FileText } from 'lucide-react';

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

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] bg-black/50" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ค้นหาลูกค้า, ลีด, งาน, เอกสาร..."
                        className="flex-1 text-sm outline-none bg-transparent"
                    />
                    <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {query.trim() && (
                    <div className="max-h-[60vh] overflow-y-auto py-2">
                        {!hasResults && (
                            <p className="text-sm text-gray-500 text-center py-6">ไม่พบผลลัพธ์</p>
                        )}
                        {results.customers.length > 0 && (
                            <div>
                                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">👥 ลูกค้า</p>
                                {results.customers.map((c) => (
                                    <button key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                        <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-900">{c.business_name}</span>
                                        <span className="text-xs text-gray-500 ml-auto">{c.industry}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {results.leads.length > 0 && (
                            <div>
                                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">🎯 ลีด</p>
                                {results.leads.map((l) => (
                                    <button key={l.id} onClick={() => navigate(`/board`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                        <Target className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-900">{l.business_name}</span>
                                        <span className="text-xs text-gray-500 ml-auto">Score {l.ai_score}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {results.tasks.length > 0 && (
                            <div>
                                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">✅ งาน</p>
                                {results.tasks.map((t) => (
                                    <button key={t.id} onClick={() => navigate('/tasks')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                        <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-900">{t.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {results.documents.length > 0 && (
                            <div>
                                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">📄 เอกสาร</p>
                                {results.documents.map((d) => (
                                    <button key={d.id} onClick={() => navigate('/documents')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                        <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-900">{d.document_number}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {!query.trim() && (
                    <div className="py-6 text-center text-sm text-gray-400">
                        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">⌘K</kbd> พิมพ์เพื่อค้นหา...
                    </div>
                )}
            </div>
        </div>
    );
}
