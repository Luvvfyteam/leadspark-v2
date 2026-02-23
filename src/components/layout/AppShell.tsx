'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { GlobalSearch } from './GlobalSearch';
import { ToastProvider } from '@/components/ui/toast';

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <div className="flex min-h-screen">
                <Sidebar />
                <MobileNav />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header />
                    <main className="flex-1 p-4 md:p-6">{children}</main>
                </div>
            </div>
            <GlobalSearch />
        </ToastProvider>
    );
}
