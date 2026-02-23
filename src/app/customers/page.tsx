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
import { PinButton } from '@/components/shared/PinButton';
import { CUSTOMER_STATUS_CONFIG, INDUSTRY_OPTIONS } from '@/lib/constants';
import { formatCurrency, getRelativeTime } from '@/lib/utils';
import { mockUsers } from '@/lib/mock-data';
import { mockDeals } from '@/lib/mock-data-extra';
import { Search, Plus, Star, Download, X } from 'lucide-react';
import { CustomerStatus, Customer } from '@/types';

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
    const { customers, togglePin, addCustomer, deals } = useAppStore();
    const { isAdmin, canExport } = usePermissions();
    const { showToast } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [industryFilter, setIndustryFilter] = useState<string>('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIndustry, setNewIndustry] = useState('ร้านอาหาร/คาเฟ่');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const filtered = useMemo(() => {
        let list = [...customers];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((c) => c.business_name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
        }
        if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
        if (industryFilter !== 'all') list = list.filter((c) => c.industry === industryFilter);
        // Pinned first
        list.sort((a, b) => (a.is_pinned === b.is_pinned ? 0 : a.is_pinned ? -1 : 1));
        return list;
    }, [customers, search, statusFilter, industryFilter]);

    const getDeals = (custId: string) =>
        deals.filter((d) => d.customer_id === custId);

    const getUserName = (id: string) =>
        mockUsers.find((u) => u.id === id)?.name || '';

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

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="ค้นหาลูกค้า..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">ทุกสถานะ</option>
                    <option value="active">เปิดใช้งาน</option>
                    <option value="pending_delivery">รอส่งมอบ</option>
                    <option value="overdue_payment">เกินกำหนดชำระ</option>
                    <option value="inactive">ไม่เปิดใช้งาน</option>
                </select>
                <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">ทุกอุตสาหกรรม</option>
                    {INDUSTRY_OPTIONS.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                    ))}
                </select>
                {canExport && (
                    <Button variant="outline" size="sm" onClick={() => { exportCSV(filtered); showToast('ดาวน์โหลด CSV แล้ว'); }}>
                        <Download className="w-4 h-4 mr-1" /> Export CSV
                    </Button>
                )}
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-1" /> เพิ่มลูกค้า
                </Button>
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
                <Card className="shadow-md border-blue-200">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">เพิ่มลูกค้าใหม่</h3>
                            <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input placeholder="ชื่อธุรกิจ *" value={newName} onChange={(e) => setNewName(e.target.value)} />
                            <select value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                            <Input placeholder="โทรศัพท์" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                            <Input placeholder="อีเมล" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                        </div>
                        <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>บันทึก</Button>
                    </CardContent>
                </Card>
            )}

            {/* Customer list */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-3">👥</div>
                    <p className="text-gray-600 font-medium">ยังไม่มีลูกค้า เริ่มเพิ่มคนแรกเลย!</p>
                    <Button size="sm" className="mt-3" onClick={() => setShowAddForm(true)}>
                        <Plus className="w-4 h-4 mr-1" /> เพิ่มลูกค้า
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((customer) => {
                        const custDeals = getDeals(customer.id);
                        const totalValue = custDeals.reduce((sum, d) => sum + d.value, 0);
                        const statusConfig = CUSTOMER_STATUS_CONFIG[customer.status];

                        return (
                            <Card
                                key={customer.id}
                                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/customers/${customer.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleTogglePin(customer.id, customer.business_name); }}
                                            className="mt-0.5"
                                        >
                                            <Star className={`w-4 h-4 ${customer.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-gray-900">{customer.business_name}</h3>
                                                <Badge variant="secondary" className={`text-[10px] ${statusConfig?.color || ''}`}>
                                                    {statusConfig?.label || customer.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{customer.industry} • {customer.address?.slice(0, 40)}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                {customer.phone && (
                                                    <a href={`tel:${customer.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline">📞 {customer.phone}</a>
                                                )}
                                                {customer.email && (
                                                    <a href={`mailto:${customer.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline">✉️ {customer.email}</a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
                                            <p className="text-xs text-gray-500">{custDeals.length} ดีล</p>
                                            <p className="text-xs text-gray-400 mt-1">{getUserName(customer.assigned_to)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
