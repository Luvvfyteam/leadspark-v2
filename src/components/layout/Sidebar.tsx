'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, ICON_MAP } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar, documents, tasks } = useAppStore();

    // Count overdue invoices for payments badge
    const overdueCount = documents.filter((d) => d.type === 'invoice' && (d.status === 'overdue' || d.status === 'sent')).length;
    // Count overdue tasks
    const today = '2026-02-20';
    const overdueTaskCount = tasks.filter((t) => !t.is_completed && t.due_date < today).length;

    const getBadge = (href: string): number => {
        if (href === '/payments') return overdueCount;
        if (href === '/tasks') return overdueTaskCount;
        return 0;
    };

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col bg-[#F8FAFC] border-r border-gray-200 h-screen sticky top-0 transition-all duration-300',
                sidebarCollapsed ? 'w-16' : 'w-60'
            )}
        >
            {/* Logo */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
                {!sidebarCollapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-base text-gray-900">LeadSpark</span>
                    </Link>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                {NAV_SECTIONS.map((section, sectionIdx) => (
                    <div key={section.title}>
                        {/* Section separator (except first) */}
                        {sectionIdx > 0 && !sidebarCollapsed && (
                            <div className="mx-2 my-2 border-t border-gray-200" />
                        )}

                        {/* Group header */}
                        {!sidebarCollapsed && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 mb-0.5",
                            )}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    {section.title}
                                </p>
                                {section.isMarketplace && (
                                    <span className="text-[9px] font-semibold bg-blue-100 text-blue-600 rounded px-1 py-0.5 uppercase tracking-wide">New</span>
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
                                    className={cn(
                                        'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5',
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-normal'
                                    )}
                                >
                                    {/* Active left border indicator */}
                                    {isActive && (
                                        <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-r-full" />
                                    )}

                                    {Icon && (
                                        <Icon
                                            className={cn(
                                                'w-[18px] h-[18px] flex-shrink-0',
                                                isActive ? 'text-blue-600' : 'text-gray-400'
                                            )}
                                        />
                                    )}
                                    {!sidebarCollapsed && <span>{item.label}</span>}
                                    {badge > 0 && !sidebarCollapsed && (
                                        <span className={cn(
                                            'ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1',
                                            isActive ? 'bg-blue-200 text-blue-700' : 'bg-red-100 text-red-600'
                                        )}>
                                            {badge}
                                        </span>
                                    )}
                                    {badge > 0 && sidebarCollapsed && (
                                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
