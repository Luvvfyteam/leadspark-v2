'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, ICON_MAP } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Zap, Languages } from 'lucide-react';

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar, documents, tasks } = useAppStore();
    const { lang, setLang, t } = useLanguage();

    // Count overdue invoices for payments badge
    const overdueCount = documents.filter(
        (d) => d.type === 'invoice' && (d.status === 'overdue' || d.status === 'sent')
    ).length;

    // Count overdue/pending tasks (use current date)
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdueTaskCount = tasks.filter((tk) => !tk.is_completed && tk.due_date < todayStr).length;

    const getBadge = (href: string): number => {
        if (href === '/payments') return overdueCount;
        if (href === '/tasks') return overdueTaskCount;
        return 0;
    };

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col bg-white border-r border-slate-100 h-screen sticky top-0 transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'w-[64px]' : 'w-[220px]'
            )}
        >
            {/* ── Logo / brand header ─────────────────────────────────────── */}
            <div className={cn(
                'flex items-center h-14 border-b border-slate-100 shrink-0',
                sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
            )}>
                {!sidebarCollapsed && (
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-[15px] text-slate-900 tracking-tight">LeadSpark</span>
                    </Link>
                )}
                {sidebarCollapsed && (
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                )}

                {/* Collapse toggle — only visible when expanded */}
                {!sidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Collapse sidebar"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ── Navigation ──────────────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
                {NAV_SECTIONS.map((section, sectionIdx) => (
                    <div key={section.title}>
                        {/* Divider + section label for "TOOLS" group */}
                        {section.showLabel && (
                            <div className={cn(
                                'mt-2 mb-1',
                                sidebarCollapsed ? 'mx-2 border-t border-slate-100' : 'mx-1'
                            )}>
                                {!sidebarCollapsed && (
                                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 px-2.5 py-1">
                                        {t(section.i18nKey)}
                                    </p>
                                )}
                                {sidebarCollapsed && (
                                    <div className="border-t border-slate-100 mt-1" />
                                )}
                            </div>
                        )}

                        {/* Items */}
                        {section.items.map((item) => {
                            const Icon = ICON_MAP[item.icon];
                            const isActive =
                                item.href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(item.href);
                            const badge = getBadge(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={sidebarCollapsed ? t(item.i18nKey) : undefined}
                                    className={cn(
                                        'relative flex items-center gap-2.5 rounded-lg transition-all duration-150 group/item',
                                        sidebarCollapsed
                                            ? 'justify-center w-10 h-10 mx-auto'
                                            : 'px-3 py-2 mx-0',
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-normal'
                                    )}
                                >
                                    {/* Active left accent */}
                                    {isActive && !sidebarCollapsed && (
                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-indigo-500 rounded-r-full" />
                                    )}

                                    {/* Icon */}
                                    {Icon && (
                                        <Icon
                                            className={cn(
                                                'shrink-0 transition-colors',
                                                sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]',
                                                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/item:text-slate-600'
                                            )}
                                        />
                                    )}

                                    {/* Label */}
                                    {!sidebarCollapsed && (
                                        <span className="text-[13.5px] leading-none">{t(item.i18nKey)}</span>
                                    )}

                                    {/* Badge — expanded */}
                                    {badge > 0 && !sidebarCollapsed && (
                                        <span className={cn(
                                            'ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1',
                                            isActive ? 'bg-indigo-200 text-indigo-700' : 'bg-red-100 text-red-500'
                                        )}>
                                            {badge}
                                        </span>
                                    )}

                                    {/* Badge dot — collapsed */}
                                    {badge > 0 && sidebarCollapsed && (
                                        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                    )}

                                    {/* Tooltip for collapsed */}
                                    {sidebarCollapsed && (
                                        <span className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                            {t(item.i18nKey)}
                                            {badge > 0 && (
                                                <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5">{badge}</span>
                                            )}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* ── Bottom: Language Switcher + Collapse toggle (when collapsed) ── */}
            <div className={cn(
                'shrink-0 border-t border-slate-100',
                sidebarCollapsed ? 'py-3 flex flex-col items-center gap-2' : 'px-3 py-3'
            )}>
                {/* Collapsed: expand button */}
                {sidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Expand sidebar"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* Language Switcher — expanded */}
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 mb-1">
                        <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
                            <button
                                onClick={() => setLang('th')}
                                className={cn(
                                    'text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all duration-200',
                                    lang === 'th'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                TH
                            </button>
                            <button
                                onClick={() => setLang('en')}
                                className={cn(
                                    'text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all duration-200',
                                    lang === 'en'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                EN
                            </button>
                        </div>
                    </div>
                )}

                {/* Language Switcher — collapsed (TH/EN dot) */}
                {sidebarCollapsed && (
                    <div className="flex flex-col gap-0.5 items-center group/lang relative">
                        <button
                            onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-[10px] font-bold"
                            aria-label="Toggle language"
                        >
                            {lang.toUpperCase()}
                        </button>
                        <span className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/lang:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                            {lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็น ภาษาไทย'}
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
}
