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
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setMobileNavOpen(true)}
                    className="md:hidden p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Search */}
                <button onClick={openSearch} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Cmd+K">
                    <Search className="w-5 h-5" />
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-900">การแจ้งเตือน</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">อ่านทั้งหมด</button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => { markNotificationRead(n.id); router.push(n.link); setShowNotifications(false); }}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <p className="text-sm text-gray-900">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>
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
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <UserAvatar name={currentUser.name} />
                        <span className="hidden sm:block text-sm font-medium text-gray-700">{currentUser.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                    </button>
                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-xs text-gray-400">สลับผู้ใช้</p>
                            </div>
                            {mockUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => { setCurrentUser(user); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                                >
                                    <UserAvatar name={user.name} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Admin' : 'Member'}</p>
                                    </div>
                                    {currentUser.id === user.id && (
                                        <Check className="w-4 h-4 text-blue-600" />
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
