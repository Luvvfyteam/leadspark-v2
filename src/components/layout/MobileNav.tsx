'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, ICON_MAP } from '@/lib/constants';
import { useAppStore } from '@/stores/app-store';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Zap } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();
    const { mobileNavOpen, setMobileNavOpen, currentUser } = useAppStore();

    return (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-72 p-0 bg-[#F8FAFC]">
                <SheetHeader className="h-14 flex flex-row items-center gap-2 px-4 border-b border-gray-200">
                    <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <SheetTitle className="font-bold text-base">LeadSpark</SheetTitle>
                </SheetHeader>

                <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
                    {NAV_SECTIONS.map((section, sectionIdx) => (
                        <div key={section.title}>
                            {sectionIdx > 0 && (
                                <div className="mx-2 my-2 border-t border-gray-200" />
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 mb-0.5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    {section.title}
                                </p>
                                {section.isMarketplace && (
                                    <span className="text-[9px] font-semibold bg-blue-100 text-blue-600 rounded px-1 py-0.5 uppercase tracking-wide">New</span>
                                )}
                            </div>
                            {section.items.map((item) => {
                                const Icon = ICON_MAP[item.icon];
                                const isActive =
                                    item.href === '/'
                                        ? pathname === '/'
                                        : pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileNavOpen(false)}
                                        className={cn(
                                            'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5',
                                            isActive
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                        )}
                                    >
                                        {isActive && (
                                            <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-r-full" />
                                        )}
                                        {Icon && (
                                            <Icon
                                                className={cn(
                                                    'w-[18px] h-[18px]',
                                                    isActive ? 'text-blue-600' : 'text-gray-400'
                                                )}
                                            />
                                        )}
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="mt-auto p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <UserAvatar name={currentUser.name} className="w-9 h-9 border-2 border-blue-50 shadow-sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทีม'}</p>
                        </div>
                        <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

import { UserAvatar } from '@/components/shared/UserAvatar';
import { Settings } from 'lucide-react';
