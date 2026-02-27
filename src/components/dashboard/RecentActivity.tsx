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
        <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-blue-500" />
                    กิจกรรมล่าสุด
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-100" />

                    <div className="space-y-0.5">
                        {recentActivities.map((activity, index) => {
                            const config = ACTIVITY_TYPE_CONFIG[activity.type];
                            const IconComponent = config
                                ? ACTIVITY_ICONS[config.icon]
                                : null;
                            const customerName = getCustomerName(activity.customer_id);
                            const userName = getUserName(activity.created_by);

                            // Map type to dot color
                            const dotColor = config?.color?.includes('blue') ? 'bg-blue-400'
                                : config?.color?.includes('green') ? 'bg-green-400'
                                    : config?.color?.includes('amber') ? 'bg-amber-400'
                                        : config?.color?.includes('purple') ? 'bg-purple-400'
                                            : config?.color?.includes('red') ? 'bg-red-400'
                                                : 'bg-gray-300';

                            return (
                                <div
                                    key={activity.id}
                                    className="relative flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/customers/${activity.customer_id}`)}
                                >
                                    {/* Timeline dot */}
                                    <div className="relative z-10 mt-1.5 shrink-0">
                                        <div className={`w-[7px] h-[7px] rounded-full ${dotColor} ring-2 ring-white`} />
                                    </div>

                                    <div className="flex-1 min-w-0 ml-1">
                                        <p className="text-sm text-gray-900 truncate font-medium">
                                            {activity.content}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-semibold text-gray-700">{customerName}</span>
                                            <span className="text-[10px] text-gray-300">•</span>
                                            {config && (
                                                <>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 ${config.color || 'text-gray-500'}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-[10px] text-gray-300">•</span>
                                                </>
                                            )}
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                                                {getRelativeTime(activity.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <UserAvatar name={userName} className="w-6 h-6 text-[10px] shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
