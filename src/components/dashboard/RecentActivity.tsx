'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { getRelativeTime } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import {
    Phone, MessageCircle, Mail, CalendarCheck, StickyNote,
    ArrowRightLeft, Banknote, CheckCircle, Activity as ActivityIcon,
} from 'lucide-react';

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Phone, MessageCircle, Mail, CalendarCheck, StickyNote,
    ArrowRightLeft, Banknote, CheckCircle,
};

export function RecentActivity() {
    const router = useRouter();
    const { activities, customers } = useAppStore();

    const recentActivities = [...activities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

    const getCustomerName = (id: string) =>
        customers.find((c) => c.id === id)?.business_name || '';

    const getUserName = (id: string) =>
        mockUsers.find((u) => u.id === id)?.name || '';

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-gray-500" />
                    กิจกรรมล่าสุด
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-1">
                    {recentActivities.map((activity) => {
                        const config = ACTIVITY_TYPE_CONFIG[activity.type];
                        const IconComponent = config
                            ? ACTIVITY_ICONS[config.icon]
                            : null;
                        const customerName = getCustomerName(activity.customer_id);
                        const userName = getUserName(activity.created_by);

                        return (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => router.push(`/customers/${activity.customer_id}`)}
                            >
                                <div className="mt-0.5">
                                    {IconComponent ? (
                                        <IconComponent className={`w-4 h-4 ${config?.color || 'text-gray-400'}`} />
                                    ) : (
                                        <StickyNote className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">
                                        {activity.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-blue-600 hover:underline">{customerName}</span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-400">
                                            {getRelativeTime(activity.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <UserAvatar name={userName} className="w-6 h-6 text-[10px]" />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
