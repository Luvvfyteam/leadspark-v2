'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { usePermissions } from '@/lib/usePermissions';
import { useToast } from '@/components/ui/toast';
import { SmartFilterBar, type FilterConfig } from '@/components/shared/SmartFilterBar';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { CUSTOMER_STATUS_CONFIG, INDUSTRY_OPTIONS, ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { formatCurrency, getRelativeTime, formatDate } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { Plus, Star, Download, X, Users, LayoutGrid, List, ArrowUpDown, Upload, Phone, Mail, MapPin, ExternalLink, Calendar, User, History } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { CustomerStatus, Customer } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CUSTOMER_FILTERS: FilterConfig[] = [
    {
        key: 'status',
        label: 'สถานะ',
        type: 'select',
        options: Object.entries(CUSTOMER_STATUS_CONFIG).map(([value, cfg]) => ({
            value,
            label: cfg.label,
        })),
    },
    {
        key: 'industry',
        label: 'อุตสาหกรรม',
        type: 'select',
        options: INDUSTRY_OPTIONS.map((ind) => ({ value: ind, label: ind })),
    },
    {
        key: 'assigned_to',
        label: 'ผู้ดูแล',
        type: 'select',
        options: mockUsers.map((u) => ({ value: u.id, label: u.name })),
    },
];

function exportCSV(customers: Customer[]) {
    const headers = ['ชื่อธุรกิจ', 'อุตสาหกรรม', 'โทรศัพท์', 'อีเมล', 'สถานะ', 'ผู้ดูแล', 'สร้างเมื่อ'];
    const rows = customers.map((c) => [
        c.business_name, c.industry, c.phone, c.email,
        CUSTOMER_STATUS_CONFIG[c.status]?.label || c.status,
        mockUsers.find((u) => u.id === c.assigned_to)?.name || '',
        new Date(c.created_at).toLocaleDateString('th-TH'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
}

export default function CustomersPage() {
    const router = useRouter();
    const { customers, togglePin, addCustomer, deals, activities } = useAppStore();
    const { isAdmin, canExport } = usePermissions();
    const { showToast } = useToast();

    // ── States ──────────────────────────────────────────────────────────────
    const [view, setView] = useState<'table' | 'card'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // New customer form state
    const [newName, setNewName] = useState('');
    const [newIndustry, setNewIndustry] = useState('ร้านอาหาร/คาเฟ่');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');

    // ── Computed ────────────────────────────────────────────────────────────
    const filteredAndSorted = useMemo(() => {
        let list = [...customers];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((c) =>
                c.business_name.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.email.toLowerCase().includes(q),
            );
        }

        // Filters
        if (activeFilters.status) list = list.filter((c) => c.status === activeFilters.status);
        if (activeFilters.industry) list = list.filter((c) => c.industry === activeFilters.industry);
        if (activeFilters.assigned_to) list = list.filter((c) => c.assigned_to === activeFilters.assigned_to);

        // Sorting
        if (sortConfig) {
            list.sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof Customer];
                let valB: any = b[sortConfig.key as keyof Customer];

                // Special handling for computed columns in table
                if (sortConfig.key === 'totalValue') {
                    valA = deals.filter(d => d.customer_id === a.id).reduce((sum, d) => sum + d.value, 0);
                    valB = deals.filter(d => d.customer_id === b.id).reduce((sum, d) => sum + d.value, 0);
                } else if (sortConfig.key === 'lastContact') {
                    const lastA = activities.filter(act => act.customer_id === a.id).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
                    const lastB = activities.filter(act => act.customer_id === b.id).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
                    valA = lastA ? lastA.created_at : '';
                    valB = lastB ? lastB.created_at : '';
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort: Pin first, then recent
            list.sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                return b.created_at.localeCompare(a.created_at);
            });
        }

        return list;
    }, [customers, searchQuery, activeFilters, sortConfig, deals, activities]);

    const getCustomerDeals = (custId: string) => deals.filter((d) => d.customer_id === custId);
    const getCustomerActivities = (custId: string) =>
        activities.filter((a) => a.customer_id === custId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const getUserName = (id: string) => mockUsers.find((u) => u.id === id)?.name || '';

    const selectedCustomer = useMemo(() =>
        selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId) ?? null) : null
        , [selectedCustomerId, customers]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleFilterChange = (key: string, value: string | string[] | null) => {
        setActiveFilters((prev) => {
            if (value === null) {
                const next = { ...prev };
                delete next[key];
                return next;
            }
            return { ...prev, [key]: value };
        });
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                if (prev.direction === 'asc') return { key, direction: 'desc' };
                return null;
            }
            return { key, direction: 'asc' };
        });
    };

    const handleAdd = () => {
        if (!newName.trim()) return;
        const cust: Customer = {
            id: `cust-${Date.now()}`,
            team_id: 'team-001',
            business_name: newName,
            industry: newIndustry,
            address: '',
            phone: newPhone,
            email: newEmail,
            line_id: '',
            website_url: '',
            facebook_url: '',
            google_maps_url: '',
            google_rating: 0,
            google_review_count: 0,
            contact_person_name: '',
            contact_person_position: '',
            contact_person_phone: '',
            contact_person_email: '',
            secondary_contact_name: '',
            secondary_contact_phone: '',
            important_notes: '',
            status: 'active',
            is_pinned: false,
            assigned_to: 'user-001',
            source: 'manual',
            tags: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        addCustomer(cust);
        showToast(`เพิ่มลูกค้า "${newName}" แล้ว`);
        setShowAddForm(false);
        setNewName(''); setNewPhone(''); setNewEmail('');
    };

    const handleTogglePin = (id: string, name: string) => {
        togglePin(id);
        const wasPinned = customers.find((c) => c.id === id)?.is_pinned;
        showToast(wasPinned ? `เลิกปักหมุด "${name}"` : `ปักหมุด "${name}" แล้ว`, () => togglePin(id));
    };

    const handleImport = () => {
        // Mock import logic
        showToast('กำลังนำเข้าข้อมูล...');
        setTimeout(() => {
            showToast('สำเร็จ! นำเข้าลูกค้า 5 ราย');
            setShowImportModal(false);
        }, 1500);
    };

    // ── Render Helpers ──────────────────────────────────────────────────────
    const SortButton = ({ column, label }: { column: string, label: string }) => (
        <button
            onClick={() => handleSort(column)}
            className="group flex items-center gap-1.5 hover:text-blue-600 transition-colors"
        >
            {label}
            <ArrowUpDown className={`w-3.5 h-3.5 ${sortConfig?.key === column ? 'text-blue-600' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">ฐานลูกค้า</h1>
                            <p className="text-sm text-gray-500 mt-0.5">บริหารจัดการข้อมูลผู้มุ่งหวังและลูกค้าทั้งหมด <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">{filteredAndSorted.length} ราย</Badge></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="rounded-xl">
                            <Upload className="w-4 h-4 mr-2" /> นำเข้า
                        </Button>
                        {canExport && (
                            <Button variant="outline" size="sm" onClick={() => { exportCSV(filteredAndSorted); showToast('ดาวน์โหลด CSV แล้ว'); }} className="rounded-xl">
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                        )}
                        <Button size="sm" onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> เพิ่มลูกค้า
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="w-full md:flex-1">
                        <SmartFilterBar
                            filters={CUSTOMER_FILTERS}
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                            onSearch={setSearchQuery}
                            searchPlaceholder="ค้นหาชื่อธุรกิจ, เบอร์โทร, อีเมล..."
                            searchValue={searchQuery}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                        <button
                            onClick={() => setView('table')}
                            className={`p-2 rounded-lg transition-all duration-200 ${view === 'table' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('card')}
                            className={`p-2 rounded-lg transition-all duration-200 ${view === 'card' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* List/Table Content */}
            {filteredAndSorted.length === 0 ? (
                <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    title={customers.length === 0 ? 'ยังไม่มีลูกค้าในระบบ' : 'ไม่พบลูกค้าที่ตรงเงื่อนไข'}
                    description={customers.length === 0 ? 'เริ่มต้นด้วยการเพิ่มลูกค้าใหม่หรือนำเข้าจากไฟล์ Excel/CSV' : 'ลองปรับเปลี่ยนตัวกรองหรือคำค้นหาของคุณ'}
                    actionLabel={customers.length === 0 ? 'เพิ่มลูกค้าคนแรก' : 'ล้างตัวกรองทั้งหมด'}
                    onAction={customers.length === 0 ? () => setShowAddForm(true) : () => { setActiveFilters({}); setSearchQuery(''); }}
                />
            ) : view === 'table' ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200">
                                <th className="px-4 py-3.5 w-10"></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"><SortButton column="business_name" label="ชื่อธุรกิจ" /></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"><SortButton column="industry" label="อุตสาหกรรม" /></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"><SortButton column="status" label="สถานะ" /></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider"><SortButton column="assigned_to" label="ผู้ดูแล" /></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right"><SortButton column="totalValue" label="มูลค่า Deal" /></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right"><SortButton column="lastContact" label="ติดต่อล่าสุด" /></th>
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right"><SortButton column="created_at" label="เพิ่มเมื่อ" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAndSorted.map((c) => {
                                const deals = getCustomerDeals(c.id);
                                const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
                                const statusCfg = CUSTOMER_STATUS_CONFIG[c.status];
                                const lastAct = getCustomerActivities(c.id)[0];

                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => setSelectedCustomerId(c.id)}
                                        className="hover:bg-blue-50/40 transition-all duration-150 cursor-pointer group"
                                    >
                                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleTogglePin(c.id, c.business_name)} className="hover:scale-110 transition-transform">
                                                <Star className={`w-4 h-4 ${c.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 group-hover:text-gray-400'} transition-colors`} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.business_name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-400">{c.phone || c.email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-gray-600">{c.industry}</td>
                                        <td className="px-4 py-3.5">
                                            <Badge variant="secondary" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg?.color || ''}`}>
                                                {statusCfg?.label || c.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                    {getUserName(c.assigned_to).charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">{getUserName(c.assigned_to)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right">{formatCurrency(totalValue)}</td>
                                        <td className="px-4 py-3.5 text-sm text-gray-500 text-right">
                                            {lastAct ? getRelativeTime(lastAct.created_at) : '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-gray-400 text-right">
                                            {formatDate(c.created_at)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSorted.map((customer) => {
                        const custDeals = getCustomerDeals(customer.id);
                        const totalValue = custDeals.reduce((sum, d) => sum + d.value, 0);
                        const statusConfig = CUSTOMER_STATUS_CONFIG[customer.status];
                        const lastAct = getCustomerActivities(customer.id)[0];

                        return (
                            <Card
                                key={customer.id}
                                className="shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border-gray-100 rounded-xl"
                                onClick={() => setSelectedCustomerId(customer.id)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTogglePin(customer.id, customer.business_name); }}
                                                className="mt-0.5 hover:scale-110 transition-transform"
                                            >
                                                <Star className={`w-4 h-4 ${customer.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 group-hover:text-yellow-400'} transition-colors`} />
                                            </button>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {customer.business_name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{customer.industry}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={`text-[10px] font-bold shrink-0 rounded-full px-2.5 ${statusConfig?.color || ''}`}>
                                            {statusConfig?.label || customer.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50/50 rounded-lg p-3">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">ยอดรวมดีล</p>
                                            <p className="text-sm font-black text-gray-900">{formatCurrency(totalValue)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">ติดต่อล่าสุด</p>
                                            <p className="text-sm font-medium text-gray-600">{lastAct ? getRelativeTime(lastAct.created_at) : 'ยังไม่มี'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                {getUserName(customer.assigned_to).charAt(0)}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">{getUserName(customer.assigned_to)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {customer.phone && (
                                                <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                    <Phone className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            {customer.email && (
                                                <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                    <Mail className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── SlideOverPanel: Customer Detail ──────────────────────────────── */}
            <SlideOverPanel
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomerId(null)}
                title={selectedCustomer?.business_name || ''}
                width="lg"
                footer={
                    <div className="flex gap-2 w-full">
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => router.push(`/customers/${selectedCustomer?.id}`)}
                        >
                            ดูข้อมูลเต็ม <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedCustomerId(null)}>
                            ปิด
                        </Button>
                    </div>
                }
            >
                {selectedCustomer && (() => {
                    const statusCfg = CUSTOMER_STATUS_CONFIG[selectedCustomer.status];
                    const custDeals = getCustomerDeals(selectedCustomer.id);
                    const totalValue = custDeals.reduce((sum, d) => sum + d.value, 0);
                    const recentActs = getCustomerActivities(selectedCustomer.id).slice(0, 5);

                    return (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={`text-xs font-bold rounded-full px-2.5 ${statusCfg?.color || ''}`}>
                                            {statusCfg?.label}
                                        </Badge>
                                        <span className="text-xs text-gray-500 font-medium">{selectedCustomer.industry}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">เพิ่มเมื่อ {formatDate(selectedCustomer.created_at)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">มูลค่ารวม</p>
                                    <p className="text-2xl font-black text-gray-900">{formatCurrency(totalValue)}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลติดต่อ</h4>
                                    <div className="space-y-2">
                                        {selectedCustomer.phone && (
                                            <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                                                <Phone className="w-4 h-4 text-gray-400" /> {selectedCustomer.phone}
                                            </a>
                                        )}
                                        {selectedCustomer.email && (
                                            <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                                                <Mail className="w-4 h-4 text-gray-400" /> {selectedCustomer.email}
                                            </a>
                                        )}
                                        {selectedCustomer.address && (
                                            <div className="flex items-start gap-2.5 text-sm text-gray-700">
                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /> {selectedCustomer.address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">การดูแล</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">ผู้ดูแล</p>
                                                <p className="font-medium">{getUserName(selectedCustomer.assigned_to)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">ติดต่อล่าสุด</p>
                                                <p className="font-medium">{recentActs[0] ? getRelativeTime(recentActs[0].created_at) : '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">กิจกรรมล่าสุด</h4>
                                    <button className="text-xs text-blue-600 hover:underline">เพิ่มกิจกรรม</button>
                                </div>
                                <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
                                    {recentActs.length > 0 ? recentActs.map((act) => {
                                        const cfg = ACTIVITY_TYPE_CONFIG[act.type];
                                        return (
                                            <div key={act.id} className="flex gap-3 hover:bg-white/60 rounded-lg p-1.5 -m-1.5 transition-colors">
                                                <div className="shrink-0 mt-1">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[10px] font-bold uppercase ${cfg?.color || 'text-gray-400'}`}>
                                                            {cfg?.label || act.type}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">{getRelativeTime(act.created_at)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{act.content}</p>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-sm text-gray-400 text-center py-4 italic">ยังไม่มีกิจกรรม</p>
                                    )}
                                </div>
                            </div>

                            {/* Important Notes */}
                            {selectedCustomer.important_notes && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">บันทึกสำคัญ</h4>
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-900 leading-relaxed italic">
                                        "{selectedCustomer.important_notes}"
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </SlideOverPanel>

            {/* ── Modals ───────────────────────────────────────────────────────── */}

            {/* Add Customer Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700">ชื่อธุรกิจ *</label>
                            <Input placeholder="เช่น: บริษัท ก้าวหน้า จำกัด" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700">อุตสาหกรรม</label>
                            <select
                                value={newIndustry}
                                onChange={(e) => setNewIndustry(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">โทรศัพท์</label>
                                <Input placeholder="08x-xxx-xxxx" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">อีเมล</label>
                                <Input placeholder="example@mail.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>ยกเลิก</Button>
                        <Button onClick={handleAdd} disabled={!newName.trim()} className="bg-blue-600 hover:bg-blue-700">
                            บันทึกข้อมูล
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import CSV Dialog */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>นำเข้าข้อมูลลูกค้า</DialogTitle>
                    </DialogHeader>
                    <div className="py-8">
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Upload className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</p>
                                <p className="text-xs text-gray-400 mt-1">รองรับไฟล์ .csv, .xlsx เท่านั้น (สูงสุด 10MB)</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" accept=".csv,.xlsx" onChange={handleImport} />
                        </div>
                        <div className="mt-6 space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">คำแนะนำ</p>
                            <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
                                <li>ควรมีหัวข้อคอลัมน์ "ชื่อธุรกิจ" เป็นอย่างน้อย</li>
                                <li>ข้อมูลที่ซ้ำซ้อนกันจะถูกข้ามอัตโนมัติ</li>
                                <li>ดาวน์โหลด <button className="text-blue-600 hover:underline">ไฟล์เทมเพลตตัวอย่าง</button></li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImportModal(false)} className="w-full">ปิดหน้าต่าง</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
