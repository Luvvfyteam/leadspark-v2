'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { TASK_CATEGORY_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { getDaysOverdue } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { useToast } from '@/components/ui/toast';
import { AlertCircle, Clock } from 'lucide-react';

export function TodayTasks() {
    const router = useRouter();
    const { tasks, customers, toggleTask } = useAppStore();
    const { showToast } = useToast();
    const today = '2026-02-17';

    const overdueTasks = tasks
        .filter((t) => !t.is_completed && t.due_date < today)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));

    const todayTasks = tasks.filter((t) => !t.is_completed && t.due_date === today);

    const allTasks = [...overdueTasks, ...todayTasks];

    const getCustomerName = (id: string | null) =>
        id ? customers.find((c) => c.id === id)?.business_name : null;

    const getUserName = (id: string) =>
        mockUsers.find((u) => u.id === id)?.name || '';

    const handleToggle = (taskId: string, taskTitle: string) => {
        toggleTask(taskId);
        showToast(`"${taskTitle}" เสร็จแล้ว ✓`, () => toggleTask(taskId));
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    งานวันนี้
                    <Badge variant="secondary" className="ml-1 text-xs">
                        {allTasks.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {allTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                        🎉 ไม่มีงานวันนี้ เยี่ยม!
                    </p>
                ) : (
                    <div className="space-y-2">
                        {allTasks.map((task) => {
                            const isOverdue = task.due_date < today;
                            const daysOver = isOverdue ? getDaysOverdue(task.due_date) : 0;
                            const catConfig = TASK_CATEGORY_CONFIG[task.category];
                            const customerName = getCustomerName(task.customer_id);
                            const userName = getUserName(task.assigned_to);

                            return (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 group cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.is_completed}
                                        onChange={(e) => { e.stopPropagation(); handleToggle(task.id, task.title); }}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0" onClick={() => router.push('/tasks')}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {task.title}
                                            </span>
                                            {isOverdue && (
                                                <span className="inline-flex items-center gap-1 text-xs text-red-600 whitespace-nowrap">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {daysOver} วันเกินกำหนด
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {customerName && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/customers/${task.customer_id}`); }}
                                                    className="text-xs text-blue-600 hover:underline truncate"
                                                >
                                                    {customerName}
                                                </button>
                                            )}
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] px-1.5 py-0 ${catConfig?.color || ''}`}
                                            >
                                                {catConfig?.label || task.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <UserAvatar name={userName} className="w-6 h-6 text-[10px]" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
