'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/lib/usePermissions';
import { Service } from '@/types';
import {
    Building2, User, Package, Target, Bell, Users,
    Save, CheckCircle, Plus, Trash2, Edit2, X, UserPlus,
    Mail, Phone, CreditCard, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';

const tabs = [
    { id: 'company', label: 'บริษัท', icon: Building2 },
    { id: 'profile', label: 'โปรไฟล์ธุรกิจ', icon: Target },
    { id: 'services', label: 'บริการ', icon: Package },
    { id: 'team', label: 'ทีม', icon: Users },
    { id: 'goals', label: 'เป้าหมาย', icon: Target },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
];

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

export default function SettingsPage() {
    const { services, addService, updateService, deleteService, goals, updateGoal, addGoal } = useAppStore();
    const { showToast } = useToast();
    const { canSetGoals, canManageTeam } = usePermissions();
    const [activeTab, setActiveTab] = useState('company');
    const [saved, setSaved] = useState(false);

    // Company fields
    const [companyName, setCompanyName] = useState('LeadSpark Co., Ltd.');
    const [companyAddress, setCompanyAddress] = useState('123 ถนนสาทร แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120');
    const [companyPhone, setCompanyPhone] = useState('02-xxx-xxxx');
    const [companyEmail, setCompanyEmail] = useState('contact@leadspark.co');
    const [taxId, setTaxId] = useState('0-1234-56789-01-2');
    const [bankAccount, setBankAccount] = useState('กสิกรไทย 012-3-45678-9');

    // Business Profile fields
    const [businessName, setBusinessName] = useState('');
    const [products, setProducts] = useState('');
    const [idealCustomer, setIdealCustomer] = useState('');

    // Services form
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editServiceId, setEditServiceId] = useState<string | null>(null);
    const [svcName, setSvcName] = useState('');
    const [svcDesc, setSvcDesc] = useState('');
    const [svcPrice, setSvcPrice] = useState(0);

    // Goals
    const thisMonth = '2026-02';
    const currentGoal = goals.find((g) => g.month === thisMonth);
    const [revTarget, setRevTarget] = useState(currentGoal?.revenue_target || 500000);
    const [dealsTarget, setDealsTarget] = useState(currentGoal?.deals_target || 15);
    const [leadsTarget, setLeadsTarget] = useState(currentGoal?.leads_target || 50);

    const handleSave = () => {
        setSaved(true);
        showToast('บันทึกเรียบร้อย ✓');
        setTimeout(() => setSaved(false), 2000);
    };

    const openAddService = () => {
        setEditServiceId(null);
        setSvcName('');
        setSvcDesc('');
        setSvcPrice(0);
        setShowServiceForm(true);
    };

    const openEditService = (svc: Service) => {
        setEditServiceId(svc.id);
        setSvcName(svc.name);
        setSvcDesc(svc.description);
        setSvcPrice(svc.price);
        setShowServiceForm(true);
    };

    const handleSaveService = () => {
        if (!svcName.trim()) return;
        if (editServiceId) {
            updateService(editServiceId, { name: svcName, description: svcDesc, price: svcPrice });
            showToast('อัปเดตบริการแล้ว');
        } else {
            addService({
                id: `svc-${Date.now()}`,
                team_id: 'team-001',
                name: svcName,
                description: svcDesc,
                price: svcPrice,
                is_active: true,
                created_at: new Date().toISOString(),
            });
            showToast(`เพิ่มบริการ "${svcName}" แล้ว`);
        }
        setShowServiceForm(false);
    };

    const handleSaveGoals = () => {
        updateGoal(thisMonth, { revenue_target: revTarget, deals_target: dealsTarget, leads_target: leadsTarget });
        handleSave();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar tabs */}
                <div className="md:w-56 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">

                    {/* company */}
                    {activeTab === 'company' && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    ข้อมูลบริษัท
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Logo placeholder */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border-2 border-dashed border-blue-200">
                                        <Building2 className="w-8 h-8 text-blue-300" />
                                    </div>
                                    <div>
                                        <Button variant="outline" size="sm" className="text-xs">อัปโหลดโลโก้</Button>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG ไม่เกิน 2MB</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท</label>
                                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Phone className="w-3.5 h-3.5 inline mr-1" />โทรศัพท์
                                        </label>
                                        <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Mail className="w-3.5 h-3.5 inline mr-1" />อีเมล
                                        </label>
                                        <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <FileText className="w-3.5 h-3.5 inline mr-1" />เลขผู้เสียภาษี
                                        </label>
                                        <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                                    <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={2} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <CreditCard className="w-3.5 h-3.5 inline mr-1" />บัญชีธนาคาร
                                    </label>
                                    <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                                    <p className="text-xs text-gray-400 mt-1">จะแสดงในใบแจ้งหนี้</p>
                                </div>

                                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saved ? 'บันทึกแล้ว' : 'บันทึก'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Business Profile */}
                    {activeTab === 'profile' && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    โปรไฟล์ธุรกิจ
                                </CardTitle>
                                <p className="text-xs text-gray-400 mt-1">
                                    ข้อมูลนี้ใช้สำหรับ AI Score และ AI Insights ที่เหมาะกับธุรกิจของคุณ
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        <Building2 className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                        ธุรกิจของคุณ
                                    </label>
                                    <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="เช่น: บริษัทรับทำเว็บ, ร้านวัสดุก่อสร้าง, สำนักงานบัญชี..." />
                                    <p className="text-xs text-gray-400 mt-1">ประเภทธุรกิจของคุณ เพื่อให้ AI เข้าใจบริบท</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        <Package className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                        สินค้า/บริการที่ขาย
                                    </label>
                                    <Input value={products} onChange={(e) => setProducts(e.target.value)}
                                        placeholder="เช่น: ออกแบบเว็บ, วัสดุก่อสร้าง, จัดทำบัญชี, ประกันชีวิต..." />
                                    <p className="text-xs text-gray-400 mt-1">AI จะใช้ข้อมูลนี้เพื่อคำนวณความเกี่ยวข้องของลีด</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        <Target className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                        ลูกค้าในอุดมคติ
                                    </label>
                                    <Textarea value={idealCustomer} onChange={(e) => setIdealCustomer(e.target.value)}
                                        placeholder="บรรยายลูกค้าที่คุณต้องการ เช่น: ร้านอาหารขนาดกลาง-ใหญ่ ในกรุงเทพ ที่ยังไม่มีระบบ POS..."
                                        rows={4} />
                                    <p className="text-xs text-gray-400 mt-1">ยิ่งเฉพาะเจาะจง AI จะยิ่งให้คะแนน Fit ที่แม่นยำ</p>
                                </div>

                                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saved ? 'บันทึกแล้ว' : 'บันทึก'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Services */}
                    {activeTab === 'services' && (
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    บริการ ({services.length})
                                </CardTitle>
                                <Button size="sm" onClick={openAddService} className="bg-blue-600 hover:bg-blue-700 gap-1">
                                    <Plus className="w-3.5 h-3.5" /> เพิ่มบริการ
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
                                    <div className="col-span-4">ชื่อบริการ</div>
                                    <div className="col-span-4">รายละเอียด</div>
                                    <div className="col-span-2 text-right">ราคา</div>
                                    <div className="col-span-2 text-center">จัดการ</div>
                                </div>
                                {services.length === 0 ? (
                                    <div className="py-8 text-center text-gray-400 text-sm">ยังไม่มีบริการ</div>
                                ) : (
                                    services.map((svc) => (
                                        <div key={svc.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 items-center text-sm hover:bg-gray-50/50 transition-colors">
                                            <div className="col-span-4 font-medium text-gray-900">{svc.name}</div>
                                            <div className="col-span-4 text-gray-500 truncate">{svc.description}</div>
                                            <div className="col-span-2 text-right font-semibold text-gray-900">{formatCurrency(svc.price)}</div>
                                            <div className="col-span-2 flex justify-center gap-1">
                                                <button onClick={() => openEditService(svc)} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => deleteService(svc.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Team */}
                    {activeTab === 'team' && (
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    ทีม
                                </CardTitle>
                                <Button size="sm" variant="outline" className="gap-1">
                                    <UserPlus className="w-3.5 h-3.5" /> เชิญสมาชิก
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { name: 'Asia', email: 'asia@leadspark.co', role: 'Admin', color: 'from-blue-400 to-blue-600' },
                                    { name: 'Som', email: 'som@leadspark.co', role: 'Member', color: 'from-green-400 to-green-600' },
                                ].map((m) => (
                                    <div key={m.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-sm font-bold`}>
                                                {m.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                                <p className="text-xs text-gray-400">{m.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant={m.role === 'Admin' ? 'default' : 'secondary'} className="text-xs">
                                            {m.role}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Goals */}
                    {activeTab === 'goals' && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Target className="w-4 h-4 text-amber-500" />
                                    เป้าหมายรายเดือน
                                </CardTitle>
                                <p className="text-xs text-gray-400 mt-1">
                                    เดือน: กุมภาพันธ์ 2569
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Team Targets */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-4">
                                    <h3 className="text-sm font-semibold text-blue-800">🏢 เป้าหมายทีม</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">💰 เป้ารายรับ (บาท)</label>
                                            <Input type="number" value={revTarget} onChange={(e) => setRevTarget(Number(e.target.value))} disabled={!canSetGoals} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">🤝 เป้าดีลปิด</label>
                                            <Input type="number" value={dealsTarget} onChange={(e) => setDealsTarget(Number(e.target.value))} disabled={!canSetGoals} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">🧲 เป้าลีดใหม่</label>
                                            <Input type="number" value={leadsTarget} onChange={(e) => setLeadsTarget(Number(e.target.value))} disabled={!canSetGoals} />
                                        </div>
                                    </div>
                                </div>

                                {/* Per-person targets */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-green-800">👤 เป้าหมายรายบุคคล</h3>
                                    {[{ name: 'Asia', id: 'user-001' }, { name: 'Som', id: 'user-002' }].map((user) => (
                                        <div key={user.id} className="bg-white rounded-lg p-3 border border-green-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-gray-400 mb-0.5">รายรับ</label>
                                                    <Input type="number" defaultValue={250000} className="h-8 text-xs" disabled={!canSetGoals} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-400 mb-0.5">ดีลปิด</label>
                                                    <Input type="number" defaultValue={7} className="h-8 text-xs" disabled={!canSetGoals} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-400 mb-0.5">ลีดใหม่</label>
                                                    <Input type="number" defaultValue={25} className="h-8 text-xs" disabled={!canSetGoals} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {canSetGoals && (
                                    <Button onClick={handleSaveGoals} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'บันทึกแล้ว' : 'บันทึกเป้าหมาย'}
                                    </Button>
                                )}
                                {!canSetGoals && (
                                    <p className="text-xs text-gray-400 italic">เฉพาะ Admin เท่านั้นที่สามารถแก้ไขเป้าหมาย</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-blue-600" />
                                    การแจ้งเตือน
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: 'ลีดใหม่เข้าระบบ', desc: 'แจ้งเตือนเมื่อมีลีดใหม่จากการค้นหา', default: true },
                                    { label: 'ติดตามลีด', desc: 'แจ้งเตือนเมื่อถึงวันติดตาม', default: true },
                                    { label: 'การชำระเงิน', desc: 'แจ้งเตือนเมื่อมีการชำระเงินใหม่', default: false },
                                    { label: 'งานใกล้ครบกำหนด', desc: 'แจ้งเมื่อมีงานที่ครบกำหนดภายใน 2 วัน', default: true },
                                    { label: 'ใบแจ้งหนี้เกินกำหนด', desc: 'แจ้งเตือนเมื่อมีใบแจ้งหนี้เลยกำหนดชำระ', default: true },
                                    { label: 'สรุปรายวัน', desc: 'ส่งสรุปงานประจำวันทุกเช้า 8:00 น.', default: false },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                            <p className="text-xs text-gray-400">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                                            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Service Add/Edit Modal */}
            {showServiceForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowServiceForm(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{editServiceId ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
                            <button onClick={() => setShowServiceForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริการ *</label>
                            <Input value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="เช่น: ออกแบบเว็บไซต์" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                            <Textarea value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} placeholder="รายละเอียดบริการ..." rows={3} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                            <Input type="number" value={svcPrice} onChange={(e) => setSvcPrice(Number(e.target.value))} min={0} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowServiceForm(false)}>ยกเลิก</Button>
                            <Button onClick={handleSaveService} disabled={!svcName.trim()} className="bg-blue-600 hover:bg-blue-700">
                                {editServiceId ? 'บันทึก' : <><Plus className="w-4 h-4 mr-1" /> เพิ่ม</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
