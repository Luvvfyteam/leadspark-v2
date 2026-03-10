'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { TASK_CATEGORY_CONFIG, CUSTOMER_STATUS_CONFIG, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { getDaysOverdue, getRelativeTime, formatDate } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { useToast } from '@/components/ui/toast';
import {
    AlertCircle, ChevronDown, ChevronRight,
    Calendar, User, Building2, Tag, CheckCircle2,
    CheckSquare, Clock, Flame, CalendarDays
} from 'lucide-react';

const TODAY = '2026-02-17';

// ── Task Row (clean linear-inspired row) ──────────────────────────────────
function TaskRow({
    task,
    customer,
    userName,
    isOverdue,
    daysOver,
    onComplete,
    onOpenTask,
    onOpenCustomer,
}: {
    task: any;
    customer: any;
    userName: string;
    isOverdue: boolean;
    daysOver: number;
    onComplete: () => void;
    onOpenTask: () => void;
    onOpenCustomer: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const catConfig = TASK_CATEGORY_CONFIG[task.category];

    return (
        <div
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-150
                ${isOverdue ? 'hover:bg-red-50/60' : 'hover:bg-gray-50/80'}
                group
            `}
        >
            {/* Completion button — clean circle */}
            <button
                onClick={onComplete}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onMouseDown={() => setPressed(true)}
                onMouseUp={() => setPressed(false)}
                className={`
                    shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    transition-all duration-150
                    ${isOverdue
                        ? 'border-red-300 hover:border-red-500 hover:bg-red-50'
                        : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                    }
                    ${pressed ? 'scale-90' : hovered ? 'scale-110' : 'scale-100'}
                `}
                title="ทำเสร็จแล้ว"
            >
                {hovered && (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-400' : 'text-green-500'}`} />
                )}
            </button>

            {/* Task content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={onOpenTask}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left truncate max-w-[200px]"
                    >
                        {task.title}
                    </button>
                    {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {daysOver}วันเกิน
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {customer && (
                        <button
                            onClick={onOpenCustomer}
                            className="text-[11px] text-blue-600 hover:underline truncate max-w-[120px]"
                        >
                            {customer.business_name}
                        </button>
                    )}
                    {catConfig && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${catConfig.color}`}>
                            {catConfig.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Avatar + due date */}
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-400 hidden sm:block">
                    {isOverdue ? formatDate(task.due_date) : 'วันนี้'}
                </span>
                <UserAvatar name={userName} className="w-5 h-5 text-[9px]" />
            </div>
        </div>
    );
}

// ── Priority Section Header ────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label, count, color }: {
    icon: React.ElementType;
    label: string;
    count: number;
    color: string;
}) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 ${color} rounded-lg mb-1`}>
            <Icon className="w-3 h-3" />
            <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
            <span className="text-[10px] font-medium opacity-70">({count})</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────
export function TodayTasks() {
    const router = useRouter();
    const { tasks, customers, activities, toggleTask } = useAppStore();
    const { showToast } = useToast();

    const [taskPanelId, setTaskPanelId] = useState<string | null>(null);
    const [customerPanelId, setCustomerPanelId] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);

    const overdueTasks = tasks
        .filter((t) => !t.is_completed && t.due_date < TODAY)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
    const todayTasks = tasks.filter((t) => !t.is_completed && t.due_date === TODAY);
    const completedToday = tasks.filter(
        (t) => t.is_completed && t.completed_at && t.completed_at.startsWith(TODAY),
    );

    const getCustomer = (id: string | null) => id ? customers.find((c) => c.id === id) ?? null : null;
    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';

    const getCustomerLastActivity = (customerId: string) => {
        const acts = activities
            .filter((a) => a.customer_id === customerId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return acts[0] ?? null;
    };

    const handleComplete = (taskId: string, taskTitle: string) => {
        toggleTask(taskId);
        showToast(`"${taskTitle}" เสร็จแล้ว ✓`, () => toggleTask(taskId));
    };

    const activeTask = taskPanelId ? tasks.find((t) => t.id === taskPanelId) ?? null : null;
    const activeCustomer = customerPanelId ? customers.find((c) => c.id === customerPanelId) ?? null : null;
    const totalActive = overdueTasks.length + todayTasks.length;

    return (
        <>
            <Card className="shadow-sm border-gray-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                            งานวันนี้
                            {totalActive > 0 && (
                                <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold w-5 h-5">
                                    {totalActive}
                                </span>
                            )}
                        </div>
                        {completedToday.length > 0 && (
                            <span className="text-[11px] font-normal text-green-600">
                                ✓ เสร็จ {completedToday.length}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                    {/* Empty state */}
                    {totalActive === 0 && completedToday.length === 0 && (
                        <p className="text-sm text-gray-500 py-6 text-center">🎉 ไม่มีงานวันนี้ เยี่ยม!</p>
                    )}

                    {/* ── 🔴 OVERDUE section ── */}
                    {overdueTasks.length > 0 && (
                        <div>
                            <SectionLabel
                                icon={Flame}
                                label="เร่งด่วน — เลยกำหนด"
                                count={overdueTasks.length}
                                color="text-red-500 bg-red-50"
                            />
                            <div className="border-l-2 border-red-200 ml-1.5 pl-2 space-y-0.5">
                                {overdueTasks.map((task) => {
                                    const daysOver = getDaysOverdue(task.due_date);
                                    const customer = getCustomer(task.customer_id);
                                    return (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            customer={customer}
                                            userName={getUserName(task.assigned_to)}
                                            isOverdue={true}
                                            daysOver={daysOver}
                                            onComplete={() => handleComplete(task.id, task.title)}
                                            onOpenTask={() => setTaskPanelId(task.id)}
                                            onOpenCustomer={() => customer && setCustomerPanelId(customer.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── 🟡 TODAY section ── */}
                    {todayTasks.length > 0 && (
                        <div>
                            <SectionLabel
                                icon={CalendarDays}
                                label="วันนี้"
                                count={todayTasks.length}
                                color="text-blue-600 bg-blue-50"
                            />
                            <div className="border-l-2 border-blue-200 ml-1.5 pl-2 space-y-0.5">
                                {todayTasks.map((task) => {
                                    const customer = getCustomer(task.customer_id);
                                    return (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            customer={customer}
                                            userName={getUserName(task.assigned_to)}
                                            isOverdue={false}
                                            daysOver={0}
                                            onComplete={() => handleComplete(task.id, task.title)}
                                            onOpenTask={() => setTaskPanelId(task.id)}
                                            onOpenCustomer={() => customer && setCustomerPanelId(customer.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── ✓ Completed today — collapsible ── */}
                    {completedToday.length > 0 && (
                        <div className="border-t border-gray-100 pt-2">
                            <button
                                onClick={() => setShowCompleted((v) => !v)}
                                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors w-full py-1"
                            >
                                {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                เสร็จแล้ววันนี้ ({completedToday.length})
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-out ${showCompleted ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="mt-1 space-y-0.5">
                                    {completedToday.map((task) => (
                                        <div key={task.id} className="flex items-center gap-3 px-3 py-2 opacity-40">
                                            <div className="w-5 h-5 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                            </div>
                                            <span className="text-[12px] text-gray-500 line-through truncate">{task.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
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
