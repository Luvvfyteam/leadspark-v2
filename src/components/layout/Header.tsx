'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, Search, ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { mockUsers } from '@/lib/mock-data';

const PAGE_TITLES: Record<string, string> = {
    '/': 'แดชบอร์ด',
    '/search': 'ค้นหาลีด',
    '/board': 'บอร์ดลีด',
    '/customers': 'ฐานลูกค้า',
    '/tasks': 'งาน',
    '/documents': 'เอกสาร',
    '/payments': 'การชำระเงิน',
    '/spark': 'Spark AI',
    '/reports': 'รายงาน',
    '/settings': 'ตั้งค่า',
};

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, setCurrentUser, notifications, markAllRead, markNotificationRead, setMobileNavOpen } = useAppStore();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const isCustomerDetail = pathname.startsWith('/customers/') && pathname !== '/customers';
    const isBoardDetail = pathname.startsWith('/board/') && pathname !== '/board';
    const title = isCustomerDetail
        ? 'รายละเอียดลูกค้า'
        : isBoardDetail
            ? 'รายละเอียดลีด'
            : PAGE_TITLES[pathname] || 'LeadSpark';

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Close dropdowns on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openSearch = () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    };

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white/90 backdrop-blur-sm border-b border-slate-100 supports-[backdrop-filter]:bg-white/80">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setMobileNavOpen(true)}
                    className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Search */}
                <button onClick={openSearch} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Cmd+K">
                    <Search className="w-4.5 h-4.5" />
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-indigo-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-slate-200/70 overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <span className="text-sm font-semibold text-slate-900">การแจ้งเตือน</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">อ่านทั้งหมด</button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => { markNotificationRead(n.id); router.push(n.link); setShowNotifications(false); }}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                                    >
                                        <p className="text-sm text-slate-800">{n.message}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Switcher */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <UserAvatar name={currentUser.name} />
                        <span className="hidden sm:block text-sm font-medium text-slate-700">{currentUser.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                    </button>
                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200/70 overflow-hidden z-50">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-xs text-slate-400">สลับผู้ใช้</p>
                            </div>
                            {mockUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => { setCurrentUser(user); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                                >
                                    <UserAvatar name={user.name} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Admin' : 'Member'}</p>
                                    </div>
                                    {currentUser.id === user.id && (
                                        <Check className="w-4 h-4 text-indigo-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
