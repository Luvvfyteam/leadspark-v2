'use client';

import { useAppStore } from '@/stores/app-store';

export function usePermissions() {
    const currentUser = useAppStore((s) => s.currentUser);
    const isAdmin = currentUser.role === 'admin';

    return {
        isAdmin,
        canDelete: isAdmin,
        canEditPrice: isAdmin,
        canExport: isAdmin,
        canManageTeam: isAdmin,
        canRecordPayment: isAdmin,
        canSetGoals: isAdmin,
        canEditCompanySettings: isAdmin,
        canAssignOthers: isAdmin,
        currentUserId: currentUser.id,
    };
}
