'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { CheckboxActionBar } from '@/components/shared/CheckboxActionBar';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { TASK_CATEGORY_CONFIG, CUSTOMER_STATUS_CONFIG, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { getDaysOverdue, getRelativeTime, formatDate } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { useToast } from '@/components/ui/toast';
import { AlertCircle, Clock, ChevronDown, ChevronRight, Calendar, User, Building2, Tag } from 'lucide-react';

const TODAY = '2026-02-17';

export function TodayTasks() {
    const router = useRouter();
    const { tasks, customers, activities, toggleTask } = useAppStore();
    const { showToast } = useToast();

    const [taskPanelId, setTaskPanelId] = useState<string | null>(null);
    const [customerPanelId, setCustomerPanelId] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);

    const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date < TODAY)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
    const todayTasks = tasks.filter((t) => !t.is_completed && t.due_date === TODAY);
    const completedToday = tasks.filter(
        (t) => t.is_completed && t.completed_at && t.completed_at.startsWith(TODAY),
    );
    const allActive = [...overdueTasks, ...todayTasks];

    const getCustomer = (id: string | null) => id ? customers.find((c) => c.id === id) ?? null : null;
    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';

    const getCustomerLastActivity = (customerId: string) => {
        const acts = activities
            .filter((a) => a.customer_id === customerId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return acts[0] ?? null;
    };

    const handleConfirm = (taskId: string, taskTitle: string, note?: string) => {
        toggleTask(taskId);
        const msg = note ? `"${taskTitle}" เสร็จแล้ว ✓ · ${note}` : `"${taskTitle}" เสร็จแล้ว ✓`;
        showToast(msg, () => toggleTask(taskId));
    };

    // Derived panel data
    const activeTask = taskPanelId ? tasks.find((t) => t.id === taskPanelId) ?? null : null;
    const activeCustomer = customerPanelId ? customers.find((c) => c.id === customerPanelId) ?? null : null;

    return (
        <>
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        งานวันนี้
                        <Badge variant="secondary" className="ml-1 text-xs">
                            {allActive.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                    {allActive.length === 0 && completedToday.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">🎉 ไม่มีงานวันนี้ เยี่ยม!</p>
                    ) : (
                        <>
                            {/* Active tasks */}
                            {allActive.map((task) => {
                                const isOverdue = task.due_date < TODAY;
                                const daysOver = isOverdue ? getDaysOverdue(task.due_date) : 0;
                                const catConfig = TASK_CATEGORY_CONFIG[task.category];
                                const customer = getCustomer(task.customer_id);
                                const userName = getUserName(task.assigned_to);

                                return (
                                    <CheckboxActionBar
                                        key={task.id}
                                        checked={task.is_completed}
                                        onConfirm={(note) => handleConfirm(task.id, task.title, note)}
                                        onCancel={() => {}}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Task name → opens panel */}
                                                    <button
                                                        onClick={() => setTaskPanelId(task.id)}
                                                        className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline text-left truncate"
                                                    >
                                                        {task.title}
                                                    </button>
                                                    {isOverdue && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-red-600 whitespace-nowrap shrink-0">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {daysOver} วันเกิน
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    {/* Customer name → opens customer panel */}
                                                    {customer && (
                                                        <button
                                                            onClick={() => setCustomerPanelId(customer.id)}
                                                            className="text-xs text-blue-600 hover:underline truncate"
                                                        >
                                                            {customer.business_name}
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
                                            <UserAvatar name={userName} className="w-6 h-6 shrink-0 text-[10px]" />
                                        </div>
                                    </CheckboxActionBar>
                                );
                            })}

                            {/* Completed today — collapsible */}
                            {completedToday.length > 0 && (
                                <div className="mt-2 border-t border-gray-100 pt-2">
                                    <button
                                        onClick={() => setShowCompleted((v) => !v)}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
                                    >
                                        {showCompleted
                                            ? <ChevronDown className="w-3 h-3" />
                                            : <ChevronRight className="w-3 h-3" />}
                                        เสร็จแล้ววันนี้ ({completedToday.length})
                                    </button>
                                    {showCompleted && (
                                        <div className="mt-1.5 space-y-1">
                                            {completedToday.map((task) => (
                                                <div key={task.id} className="flex items-center gap-3 px-2.5 py-1.5 opacity-60">
                                                    <input type="checkbox" checked readOnly className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                                                    <span className="text-sm text-gray-500 line-through truncate">{task.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Task Detail Panel ────────────────────────────────── */}
            <SlideOverPanel
                isOpen={!!activeTask}
                onClose={() => setTaskPanelId(null)}
                title={activeTask?.title ?? ''}
                footer={
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (activeTask) {
                                    toggleTask(activeTask.id);
                                    showToast(`"${activeTask.title}" เสร็จแล้ว ✓`, () => toggleTask(activeTask.id));
                                    setTaskPanelId(null);
                                }
                            }}
                            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            ✓ ทำเสร็จ
                        </button>
                        <button
                            onClick={() => setTaskPanelId(null)}
                            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            ปิด
                        </button>
                    </div>
                }
            >
                {activeTask && (() => {
                    const cat = TASK_CATEGORY_CONFIG[activeTask.category];
                    const customer = getCustomer(activeTask.customer_id);
                    const assignee = getUserName(activeTask.assigned_to);
                    const isOverdue = activeTask.due_date < TODAY;
                    return (
                        <div className="space-y-4">
                            {/* Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {isOverdue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                        <AlertCircle className="w-3 h-3" />
                                        เกินกำหนด {getDaysOverdue(activeTask.due_date)} วัน
                                    </span>
                                )}
                                {cat && (
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cat.color}`}>
                                        {cat.label}
                                    </span>
                                )}
                            </div>

                            {/* Fields */}
                            <div className="space-y-3">
                                {customer && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">ลูกค้า</p>
                                            <button
                                                onClick={() => {
                                                    setTaskPanelId(null);
                                                    setCustomerPanelId(customer.id);
                                                }}
                                                className="text-sm text-blue-600 hover:underline font-medium"
                                            >
                                                {customer.business_name}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">ผู้รับผิดชอบ</p>
                                        <p className="text-sm text-gray-800">{assignee}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">กำหนดส่ง</p>
                                        <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
                                            {formatDate(activeTask.due_date)}
                                        </p>
                                    </div>
                                </div>
                                {activeTask.description && (
                                    <div className="flex items-start gap-3">
                                        <Tag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">รายละเอียด</p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{activeTask.description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </SlideOverPanel>

            {/* ── Customer Mini Profile Panel ──────────────────────── */}
            <SlideOverPanel
                isOpen={!!activeCustomer}
                onClose={() => setCustomerPanelId(null)}
                title={activeCustomer?.business_name ?? ''}
                footer={
                    <button
                        onClick={() => {
                            if (activeCustomer) {
                                router.push(`/customers/${activeCustomer.id}`);
                            }
                        }}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        ดูข้อมูลเต็ม →
                    </button>
                }
            >
                {activeCustomer && (() => {
                    const statusCfg = CUSTOMER_STATUS_CONFIG[activeCustomer.status];
                    const lastAct = getCustomerLastActivity(activeCustomer.id);
                    const recentActs = activities
                        .filter((a) => a.customer_id === activeCustomer.id)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 3);

                    return (
                        <div className="space-y-4">
                            {/* Status + industry */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 ${statusCfg?.color || 'text-gray-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot || 'bg-gray-400'}`} />
                                    {statusCfg?.label || activeCustomer.status}
                                </span>
                                <span className="text-xs text-gray-500">{activeCustomer.industry}</span>
                            </div>

                            {/* Contact info */}
                            <div className="space-y-2">
                                {activeCustomer.phone && (
                                    <a href={`tel:${activeCustomer.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                        📞 {activeCustomer.phone}
                                    </a>
                                )}
                                {activeCustomer.email && (
                                    <a href={`mailto:${activeCustomer.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                        ✉️ {activeCustomer.email}
                                    </a>
                                )}
                                {activeCustomer.assigned_to && (
                                    <p className="text-sm text-gray-600">
                                        👤 ผู้ดูแล: {getUserName(activeCustomer.assigned_to)}
                                    </p>
                                )}
                            </div>

                            {/* Recent activities */}
                            {recentActs.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">กิจกรรมล่าสุด</p>
                                    <div className="space-y-2">
                                        {recentActs.map((act) => {
                                            const cfg = ACTIVITY_TYPE_CONFIG[act.type];
                                            return (
                                                <div key={act.id} className="flex items-start gap-2">
                                                    <span className={`text-xs font-medium shrink-0 ${cfg?.color || 'text-gray-400'}`}>
                                                        {cfg?.label || act.type}
                                                    </span>
                                                    <p className="text-xs text-gray-600 flex-1 truncate">{act.content}</p>
                                                    <span className="text-xs text-gray-400 shrink-0">{getRelativeTime(act.created_at)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!lastAct && (
                                <p className="text-sm text-gray-400">ยังไม่มีกิจกรรม</p>
                            )}
                        </div>
                    );
                })()}
            </SlideOverPanel>
        </>
    );
}
