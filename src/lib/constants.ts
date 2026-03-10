import {
    LayoutDashboard,
    UserPlus,
    Kanban,
    Users,
    CheckSquare,
    FileText,
    CreditCard,
    Sparkles,
    BarChart3,
    Settings,
} from 'lucide-react';

// ==================== NAVIGATION ====================

export const NAV_SECTIONS = [
    {
        title: 'SALES',
        i18nKey: 'nav.group.sales',
        isMarketplace: false,
        showLabel: false,
        items: [
            { label: 'หน้าหลัก', i18nKey: 'nav.home', href: '/', icon: 'LayoutDashboard' },
            { label: 'Pipeline', i18nKey: 'nav.pipeline', href: '/board', icon: 'Kanban' },
            { label: 'ลูกค้า', i18nKey: 'nav.customers', href: '/customers', icon: 'Users' },
            { label: 'เพิ่มลีด', i18nKey: 'nav.addLead', href: '/search', icon: 'UserPlus' },
            { label: 'งาน', i18nKey: 'nav.tasks', href: '/tasks', icon: 'CheckSquare' },
        ],
    },
    {
        title: 'TOOLS',
        i18nKey: 'nav.group.tools',
        isMarketplace: false,
        showLabel: true,
        items: [
            { label: 'เอกสาร', i18nKey: 'nav.documents', href: '/documents', icon: 'FileText' },
            { label: 'การเงิน', i18nKey: 'nav.finance', href: '/payments', icon: 'CreditCard' },
            { label: 'Spark AI', i18nKey: 'nav.sparkAI', href: '/spark', icon: 'Sparkles' },
            { label: 'รายงาน', i18nKey: 'nav.reports', href: '/reports', icon: 'BarChart3' },
            { label: 'ตั้งค่า', i18nKey: 'nav.settings', href: '/settings', icon: 'Settings' },
        ],
    },
];

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    UserPlus,
    Kanban,
    Users,
    CheckSquare,
    FileText,
    CreditCard,
    Sparkles,
    BarChart3,
    Settings,
};

// ==================== STATUS LABELS & COLORS ====================

export const CUSTOMER_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: 'เปิดใช้งาน', color: 'text-green-600', dot: 'bg-green-500' },
    pending_delivery: { label: 'รอส่งมอบ', color: 'text-yellow-600', dot: 'bg-yellow-500' },
    overdue_payment: { label: 'เกินกำหนดชำระ', color: 'text-red-600', dot: 'bg-red-500' },
    inactive: { label: 'ไม่เปิดใช้งาน', color: 'text-gray-500', dot: 'bg-gray-400' },
};

export const DEAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    proposal: { label: 'เสนอราคา', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'กำลังดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600' },
};

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    unpaid: { label: 'ยังไม่ชำระ', color: 'bg-red-100 text-red-700' },
    partial: { label: 'ชำระบางส่วน', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700' },
};

export const TASK_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    sales: { label: 'การขาย', color: 'bg-blue-100 text-blue-700' },
    delivery: { label: 'ส่งงาน', color: 'bg-green-100 text-green-700' },
    finance: { label: 'การเงิน', color: 'bg-amber-100 text-amber-700' },
    meeting: { label: 'ประชุม', color: 'bg-purple-100 text-purple-700' },
    other: { label: 'อื่นๆ', color: 'bg-gray-100 text-gray-600' },
};

export const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    call: { label: 'โทร', icon: 'Phone', color: 'text-blue-500' },
    line: { label: 'LINE', icon: 'MessageCircle', color: 'text-green-500' },
    email: { label: 'อีเมล', icon: 'Mail', color: 'text-purple-500' },
    meeting: { label: 'ประชุม', icon: 'CalendarCheck', color: 'text-orange-500' },
    note: { label: 'บันทึก', icon: 'StickyNote', color: 'text-gray-500' },
    status_change: { label: 'เปลี่ยนสถานะ', icon: 'ArrowRightLeft', color: 'text-indigo-500' },
    payment: { label: 'ชำระเงิน', icon: 'Banknote', color: 'text-green-600' },
    task_completed: { label: 'งานเสร็จ', icon: 'CheckCircle', color: 'text-emerald-500' },
};

export const DOCUMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: 'แบบร่าง', color: 'bg-gray-100 text-gray-600' },
    sent: { label: 'ส่งแล้ว', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'ยอมรับ', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-700' },
    paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700' },
    overdue: { label: 'เกินกำหนด', color: 'bg-red-100 text-red-700' },
};

// ==================== OPTIONS ====================

export const INDUSTRY_OPTIONS = [
    'ร้านอาหาร/คาเฟ่',
    'คลินิก/สปา',
    'โรงแรม',
    'ฟิตเนส',
    'ค้าปลีก',
    'การศึกษา',
    'สำนักงาน',
    'โรงงาน/ผลิต',
    'ก่อสร้าง/อสังหา',
    'ไอที/เทคโนโลยี',
    'ขนส่ง/โลจิสติกส์',
    'การเงิน/ประกัน',
    'อื่นๆ',
];

export const BOARD_STATUS_OPTIONS = [
    { value: 'new', label: 'ใหม่' },
    { value: 'contacted', label: 'ติดต่อแล้ว' },
    { value: 'interested', label: 'สนใจ' },
    { value: 'won', label: 'ชนะ' },
    { value: 'lost', label: 'แพ้' },
];

export const AREAS = [
    'สุขุมวิท',
    'สีลม',
    'รัชดา',
    'สาทร',
    'ทองหล่อ',
    'อารีย์',
    'ลาดพร้าว',
    'เอกมัย',
    'พระราม 9',
    'บางนา',
];

export const BOARD_COLUMNS: { id: string; title: string; color: string }[] = [
    { id: 'new', title: 'ใหม่', color: 'bg-blue-500' },
    { id: 'contacted', title: 'ติดต่อแล้ว', color: 'bg-yellow-500' },
    { id: 'interested', title: 'สนใจ', color: 'bg-purple-500' },
    { id: 'won', title: 'ปิดได้', color: 'bg-green-500' },
];

export const PROVINCES = [
    'กรุงเทพมหานคร',
    'นนทบุรี',
    'ปทุมธานี',
    'สมุทรปราการ',
    'เชียงใหม่',
    'ภูเก็ต',
    'ชลบุรี',
    'ขอนแก่น',
    'นครราชสีมา',
    'สงขลา',
];

export const BUSINESS_SIZE_OPTIONS = [
    { value: 'small', label: 'เล็ก (1-10 คน)' },
    { value: 'medium', label: 'กลาง (11-50 คน)' },
    { value: 'large', label: 'ใหญ่ (50+ คน)' },
];
