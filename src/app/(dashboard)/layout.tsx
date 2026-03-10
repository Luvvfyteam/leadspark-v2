'use client';

import { AppShell } from '@/components/layout/AppShell';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LanguageProvider>
            <AppShell>{children}</AppShell>
        </LanguageProvider>
    );
}
