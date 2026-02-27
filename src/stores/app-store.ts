'use client';

import { create } from 'zustand';
import { Customer, Activity, Task, User, Lead, BoardStatus, Document as Doc, Payment, Deal, Service, Goal, Notification, TaskComment, BoardColumn } from '@/types';
import { mockCustomers, mockUsers, mockTeam } from '@/lib/mock-data';
import { mockTasks, mockDeals, mockComments } from '@/lib/mock-data-extra';
import { mockActivities } from '@/lib/mock-activities';
import { mockLeads, mockDocuments, mockPayments, mockServices } from '@/lib/mock-docs';
import { mockLeadsExtra } from '@/lib/mock-leads';

const allLeads = [...mockLeads, ...mockLeadsExtra];

const CURRENT_MONTH = '2026-02';

const defaultBoardColumns: BoardColumn[] = [
    { id: 'new', title: 'ใหม่', color: 'bg-blue-500', order: 0 },
    { id: 'contacted', title: 'ติดต่อแล้ว', color: 'bg-yellow-500', order: 1 },
    { id: 'interested', title: 'สนใจ', color: 'bg-purple-500', order: 2 },
    { id: 'won', title: 'ปิดได้', color: 'bg-green-500', order: 3 },
    { id: 'lost', title: 'ไม่สำเร็จ', color: 'bg-gray-500', order: 4 },
];

const defaultNotifications: Notification[] = [
    { id: 'n1', message: 'Som มอบหมายงานใหม่: ส่งเว็บร้าน GHI', type: 'task', link: '/tasks', is_read: false, created_at: '2026-02-17T09:00:00Z' },
    { id: 'n2', message: '⚠️ ร้าน Brew House เลยกำหนดจ่าย 6 วัน', type: 'payment', link: '/payments', is_read: false, created_at: '2026-02-17T08:00:00Z' },
    { id: 'n3', message: 'ลีดใหม่ 5 ราย จาก search ล่าสุด', type: 'lead', link: '/search', is_read: false, created_at: '2026-02-16T14:00:00Z' },
    { id: 'n4', message: '✅ Som ทำงาน "ส่ง logo" เสร็จแล้ว', type: 'task', link: '/tasks', is_read: false, created_at: '2026-02-16T10:00:00Z' },
    { id: 'n5', message: 'สำนักงานบัญชี AAA เกินกำหนดชำระ', type: 'payment', link: '/payments', is_read: true, created_at: '2026-02-15T09:00:00Z' },
];

const defaultGoals: Goal[] = [
    {
        id: 'goal-2026-02',
        team_id: 'team-001',
        month: '2026-02',
        revenue_target: 500000,
        deals_target: 15,
        leads_target: 50,
        contacts_target: 100,
        collection_target: 200000,
        person_goals: [
            { user_id: 'user-001', revenue_target: 300000, deals_target: 9, contacts_target: 60 },
            { user_id: 'user-002', revenue_target: 200000, deals_target: 6, contacts_target: 40 },
        ],
        created_at: '2026-02-01T00:00:00Z',
    },
    {
        id: 'goal-2026-01',
        team_id: 'team-001',
        month: '2026-01',
        revenue_target: 400000,
        deals_target: 12,
        leads_target: 40,
        contacts_target: 80,
        collection_target: 150000,
        person_goals: [
            { user_id: 'user-001', revenue_target: 250000, deals_target: 7, contacts_target: 50 },
            { user_id: 'user-002', revenue_target: 150000, deals_target: 5, contacts_target: 30 },
        ],
        created_at: '2026-01-01T00:00:00Z',
    },
];

interface AppState {
    // Sidebar
    sidebarCollapsed: boolean;
    mobileNavOpen: boolean;
    toggleSidebar: () => void;
    setMobileNavOpen: (open: boolean) => void;

    // Current user
    currentUser: User;
    setCurrentUser: (user: User) => void;

    // Customers
    customers: Customer[];
    togglePin: (id: string) => void;
    updateCustomer: (id: string, data: Partial<Customer>) => void;
    addCustomer: (customer: Customer) => void;
    deleteCustomer: (id: string) => void;

    // Activities
    activities: Activity[];
    addActivity: (activity: Activity) => void;
    updateActivity: (id: string, data: Partial<Activity>) => void;
    deleteActivity: (id: string) => void;
    restoreActivity: (activity: Activity) => void;

    // Tasks
    tasks: Task[];
    toggleTask: (id: string) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, data: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    // Comments
    comments: TaskComment[];
    addComment: (comment: TaskComment) => void;

    // Leads
    leads: Lead[];
    updateLead: (id: string, data: Partial<Lead>) => void;
    addLeadToBoard: (lead: Lead) => void;
    moveLeadToColumn: (id: string, status: BoardStatus) => void;
    convertLeadToCustomer: (leadId: string) => string | null;

    // Deals
    deals: Deal[];
    addDeal: (deal: Deal) => void;
    updateDeal: (id: string, data: Partial<Deal>) => void;
    deleteDeal: (id: string) => void;

    // Documents
    documents: Doc[];
    addDocument: (doc: Doc) => void;
    updateDocument: (id: string, data: Partial<Doc>) => void;
    deleteDocument: (id: string) => void;

    // Payments
    payments: Payment[];
    addPayment: (payment: Payment) => void;
    removePayment: (id: string) => void;

    // Services
    services: Service[];
    addService: (service: Service) => void;
    updateService: (id: string, data: Partial<Service>) => void;
    deleteService: (id: string) => void;

    // Board
    boardColumns: BoardColumn[];
    addBoardColumn: (column: BoardColumn) => void;
    updateBoardColumn: (id: string, data: Partial<BoardColumn>) => void;
    removeBoardColumn: (id: string) => void;
    reorderBoardColumns: (columns: BoardColumn[]) => void;

    // Goals
    goals: Goal[];
    updateGoal: (month: string, data: Partial<Goal>) => void;
    addGoal: (goal: Goal) => void;

    // Notifications
    notifications: Notification[];
    markAllRead: () => void;
    markNotificationRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Sidebar
    sidebarCollapsed: false,
    mobileNavOpen: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

    // Current user
    currentUser: mockUsers[0],
    setCurrentUser: (user) => set({ currentUser: user }),

    // Customers
    customers: mockCustomers,
    togglePin: (id) =>
        set((state) => ({
            customers: state.customers.map((c) =>
                c.id === id ? { ...c, is_pinned: !c.is_pinned } : c
            ),
        })),
    updateCustomer: (id, data) =>
        set((state) => ({
            customers: state.customers.map((c) =>
                c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
            ),
        })),
    addCustomer: (customer) =>
        set((state) => ({ customers: [customer, ...state.customers] })),
    deleteCustomer: (id) =>
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),

    // Activities
    activities: mockActivities,
    addActivity: (activity) =>
        set((state) => ({ activities: [activity, ...state.activities] })),
    updateActivity: (id, data) =>
        set((state) => ({
            activities: state.activities.map((a) =>
                a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
            ),
        })),
    deleteActivity: (id) =>
        set((state) => ({
            activities: state.activities.filter((a) => a.id !== id),
        })),
    restoreActivity: (activity) =>
        set((state) => ({ activities: [activity, ...state.activities] })),

    // Tasks
    tasks: mockTasks,
    toggleTask: (id) =>
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id
                    ? {
                        ...t,
                        is_completed: !t.is_completed,
                        completed_at: !t.is_completed ? new Date().toISOString() : null,
                        completed_by: !t.is_completed ? state.currentUser.id : null,
                    }
                    : t
            ),
        })),
    addTask: (task) =>
        set((state) => ({ tasks: [task, ...state.tasks] })),
    updateTask: (id, data) =>
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, ...data } : t
            ),
        })),
    deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

    // Comments
    comments: mockComments,
    addComment: (comment) =>
        set((state) => ({ comments: [...state.comments, comment] })),

    // Leads
    leads: allLeads,
    updateLead: (id, data) =>
        set((state) => ({
            leads: state.leads.map((l) =>
                l.id === id ? { ...l, ...data, updated_at: new Date().toISOString() } : l
            ),
        })),
    addLeadToBoard: (lead) =>
        set((state) => {
            const exists = state.leads.find((l) => l.id === lead.id);
            if (exists) return state;
            return { leads: [lead, ...state.leads] };
        }),
    moveLeadToColumn: (id, status) =>
        set((state) => ({
            leads: state.leads.map((l) =>
                l.id === id ? { ...l, board_status: status, updated_at: new Date().toISOString() } : l
            ),
        })),
    convertLeadToCustomer: (leadId) => {
        const state = get();
        const lead = state.leads.find((l) => l.id === leadId);
        if (!lead) return null;

        const newCustomerId = `cust-${Date.now()}`;
        const newCustomer: Customer = {
            id: newCustomerId,
            team_id: lead.team_id,
            business_name: lead.business_name,
            industry: lead.industry,
            address: lead.address,
            phone: lead.phone,
            email: lead.email,
            line_id: lead.line_id,
            website_url: lead.website_url,
            facebook_url: lead.facebook_url,
            google_maps_url: lead.google_maps_url,
            google_rating: lead.google_rating,
            google_review_count: lead.google_review_count,
            contact_person_name: '',
            contact_person_position: '',
            contact_person_phone: lead.phone,
            contact_person_email: lead.email,
            secondary_contact_name: '',
            secondary_contact_phone: '',
            important_notes: `แปลงจากลีด: ${lead.business_name} (AI Score: ${lead.ai_score})`,
            status: 'active',
            is_pinned: false,
            assigned_to: lead.assigned_to,
            source: 'lead_search',
            tags: lead.ai_tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        set((state) => ({
            customers: [newCustomer, ...state.customers],
            leads: state.leads.map((l) =>
                l.id === leadId
                    ? { ...l, converted_customer_id: newCustomerId, board_status: 'won' as BoardStatus }
                    : l
            ),
        }));

        return newCustomerId;
    },

    // Deals
    deals: mockDeals,
    addDeal: (deal) =>
        set((state) => ({ deals: [deal, ...state.deals] })),
    updateDeal: (id, data) =>
        set((state) => ({
            deals: state.deals.map((d) =>
                d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d
            ),
        })),
    deleteDeal: (id) =>
        set((state) => ({ deals: state.deals.filter((d) => d.id !== id) })),

    // Documents
    documents: mockDocuments,
    addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
    updateDocument: (id, data) =>
        set((state) => ({
            documents: state.documents.map((d) =>
                d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d
            ),
        })),
    deleteDocument: (id) =>
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

    // Payments
    payments: mockPayments,
    addPayment: (payment) =>
        set((state) => ({ payments: [payment, ...state.payments] })),
    removePayment: (id) =>
        set((state) => ({ payments: state.payments.filter((p) => p.id !== id) })),

    // Services
    services: mockServices,
    addService: (service) =>
        set((state) => ({ services: [service, ...state.services] })),
    updateService: (id, data) =>
        set((state) => ({
            services: state.services.map((s) =>
                s.id === id ? { ...s, ...data } : s
            ),
        })),
    deleteService: (id) =>
        set((state) => ({
            services: state.services.filter((s) => s.id !== id),
        })),

    // Board
    boardColumns: defaultBoardColumns,
    addBoardColumn: (column) =>
        set((state) => ({ boardColumns: [...state.boardColumns, column] })),
    updateBoardColumn: (id, data) =>
        set((state) => ({
            boardColumns: state.boardColumns.map((c) =>
                c.id === id ? { ...c, ...data } : c
            ),
        })),
    removeBoardColumn: (id) =>
        set((state) => ({
            boardColumns: state.boardColumns.filter((c) => c.id !== id),
        })),
    reorderBoardColumns: (columns) =>
        set({ boardColumns: columns }),

    // Goals
    goals: defaultGoals,
    updateGoal: (month, data) =>
        set((state) => ({
            goals: state.goals.map((g) =>
                g.month === month ? { ...g, ...data } : g
            ),
        })),
    addGoal: (goal) =>
        set((state) => ({ goals: [...state.goals, goal] })),

    // Notifications
    notifications: defaultNotifications,
    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        })),
    markNotificationRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, is_read: true } : n
            ),
        })),
}));
