'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, ICON_MAP } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Zap, Settings, Languages } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();
    const { mobileNavOpen, setMobileNavOpen, currentUser, documents, tasks } = useAppStore();
    const { lang, setLang, t } = useLanguage();

    const overdueCount = documents.filter(
        (d) => d.type === 'invoice' && (d.status === 'overdue' || d.status === 'sent')
    ).length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdueTaskCount = tasks.filter((tk) => !tk.is_completed && tk.due_date < todayStr).length;
    const getBadge = (href: string): number => {
        if (href === '/payments') return overdueCount;
        if (href === '/tasks') return overdueTaskCount;
        return 0;
    };

    return (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-72 p-0 bg-white flex flex-col">
                {/* Header */}
                <SheetHeader className="h-14 flex flex-row items-center gap-2.5 px-4 border-b border-gray-100 shrink-0">
                    <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <SheetTitle className="font-bold text-[15px] text-slate-900 tracking-tight">LeadSpark</SheetTitle>
                </SheetHeader>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.title}>
                            {/* Section label for TOOLS group */}
                            {section.showLabel && (
                                <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 px-3 pt-3 pb-1">
                                    {t(section.i18nKey)}
                                </p>
                            )}

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
                                        onClick={() => setMobileNavOpen(false)}
                                        className={cn(
                                            'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-all duration-150 mb-0.5',
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        )}
                                    >
                                        {isActive && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-indigo-500 rounded-r-full" />
                                        )}
                                        {Icon && (
                                            <Icon className={cn(
                                                'w-[16px] h-[16px] shrink-0',
                                                isActive ? 'text-indigo-600' : 'text-slate-400'
                                            )} />
                                        )}
                                        <span>{t(item.i18nKey)}</span>
                                        {badge > 0 && (
                                            <span className={cn(
                                                'ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1',
                                                isActive ? 'bg-indigo-200 text-indigo-700' : 'bg-red-100 text-red-500'
                                            )}>
                                                {badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer: Language Switcher + User profile */}
                <div className="shrink-0 border-t border-slate-100">
                    {/* Language switcher */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                        <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-400 font-medium">{t('lang.label')}</span>
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 ml-auto">
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

                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 pt-2 pb-4">
                        <UserAvatar name={currentUser.name} className="w-9 h-9 border-2 border-indigo-50 shadow-sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {currentUser.role === 'admin' ? t('user.admin') : t('user.member')}
                            </p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
