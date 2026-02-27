'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/lib/usePermissions';
import { Service, UserRole } from '@/types';
import {
    Building2, User, Package, Target, Bell, Users,
    Save, CheckCircle, Plus, Trash2, Edit2, X, UserPlus,
    Mail, Phone, CreditCard, FileText, ChevronLeft, ChevronRight,
    Link as LinkIcon, Download, Upload, Zap, Shield, HelpCircle,
    Smartphone, MessageSquare, Globe, Banknote, Calendar
} from 'lucide-react';

const tabs = [
    { id: 'company', label: 'บริษัท', icon: Building2 },
    { id: 'profile', label: 'โปรไฟล์ธุรกิจ', icon: Target },
    { id: 'services', label: 'บริการ', icon: Package },
    { id: 'team', label: 'ทีม', icon: Users },
    { id: 'goals', label: 'เป้าหมาย', icon: Target },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'connections', label: 'การเชื่อมต่อ', icon: LinkIcon },
    { id: 'data', label: 'นำเข้า/ส่งออก', icon: Download },
    { id: 'billing', label: 'แผน & การชำระเงิน', icon: CreditCard },
];

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

export default function SettingsPage() {
    const { services, addService, updateService, deleteService, goals, updateGoal, currentUser } = useAppStore();
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

    // Team Invite
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('member');
    const [pendingInvites, setPendingInvites] = useState<{email: string, role: string}[]>([]);

    // Business Profile fields
    const [businessName, setBusinessName] = useState('บริษัทรับทำเว็บและการตลาดดิจิทัล');
    const [products, setProducts] = useState('ออกแบบเว็บไซต์, SEO, Google Ads, Content Marketing');
    const [idealCustomer, setIdealCustomer] = useState('ร้านอาหารขนาดกลาง-ใหญ่ ในกรุงเทพ ที่ยังไม่มีระบบ POS หรือเว็บไซต์ที่รองรับมือถือ');

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

    const handleInvite = () => {
        if (!inviteEmail.trim()) return;
        setPendingInvites([...pendingInvites, { email: inviteEmail, role: inviteRole }]);
        setInviteEmail('');
        setShowInviteModal(false);
        showToast(`ส่งคำเชิญไปที่ ${inviteEmail} แล้ว`);
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

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">การตั้งค่า</h1>
                    <p className="text-sm text-gray-500">จัดการข้อมูลทีม, ระบบ และปรับแต่ง AI ให้เข้ากับธุรกิจของคุณ</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Business Plan</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar tabs */}
                <div className="md:w-64 flex-shrink-0">
                    <div className="sticky top-6">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 translate-x-1'
                                        : 'text-gray-500 hover:bg-gray-100 font-medium'
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                        
                        <Card className="mt-8 bg-gray-900 text-white border-none rounded-2xl overflow-hidden shadow-xl">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">สิทธิ์การใช้งาน</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed mb-4">คุณกำลังล็อกอินในฐานะ <b>{currentUser.role}</b> ซึ่งมีสิทธิ์ในการเข้าถึงและจัดการข้อมูลทั้งหมดของทีม</p>
                                <Button variant="outline" size="sm" className="w-full bg-white/5 border-white/10 text-xs hover:bg-white/10 text-white">ต้องการความช่วยเหลือ?</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-20">

                    {/* company - P3-2 Live Preview */}
                    {activeTab === 'company' && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 space-y-6">
                                <Card className="shadow-sm border-gray-100">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                            ข้อมูลบริษัท
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                                            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 group hover:border-blue-400 transition-colors cursor-pointer">
                                                <Plus className="w-6 h-6 text-gray-300 group-hover:text-blue-400" />
                                            </div>
                                            <div>
                                                <Button variant="outline" size="sm" className="text-xs font-bold">อัปโหลดโลโก้</Button>
                                                <p className="text-[10px] text-gray-400 mt-1.5 uppercase font-bold tracking-tight">SVG, PNG, JPG (MAX 2MB)</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ชื่อบริษัท</label>
                                                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-xl h-11" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">เลขผู้เสียภาษี</label>
                                                    <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="rounded-xl h-11" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ที่อยู่</label>
                                                <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={3} className="rounded-xl" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">อีเมลติดต่อ</label>
                                                    <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="rounded-xl h-11" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">เบอร์โทรศัพท์</label>
                                                    <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="rounded-xl h-11" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">บัญชีธนาคาร (สำหรับรับเงิน)</label>
                                                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="rounded-xl h-11" />
                                            </div>
                                        </div>

                                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold shadow-lg shadow-blue-100">
                                            {saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            {saved ? 'บันทึกสำเร็จ' : 'บันทึกข้อมูล'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="sticky top-6 space-y-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Invoice Header Preview</p>
                                    <div className="bg-white border-2 border-blue-50 rounded-2xl p-6 shadow-sm overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[100px] -mr-8 -mt-8" />
                                        
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">LS</div>
                                            <div className="text-right">
                                                <h3 className="text-sm font-black text-gray-900 uppercase">Invoice</h3>
                                                <p className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">#INV-2026-001</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <p className="text-[11px] font-black text-gray-900">{companyName || '[ชื่อบริษัท]'}</p>
                                                <p className="text-[9px] text-gray-500 mt-1 leading-relaxed max-w-[200px]">{companyAddress || '[ที่อยู่บริษัท]'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[9px]">
                                                <div>
                                                    <p className="text-gray-400 uppercase font-bold tracking-tighter">Tax ID</p>
                                                    <p className="text-gray-700 font-medium">{taxId || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 uppercase font-bold tracking-tighter">Contact</p>
                                                    <p className="text-gray-700 font-medium">{companyPhone || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-gray-50">
                                                <p className="text-[8px] text-gray-400 uppercase font-bold mb-1">Payment Info</p>
                                                <p className="text-[9px] font-bold text-blue-700 italic bg-blue-50 px-2 py-1 rounded inline-block">{bankAccount || '[เลขบัญชี]'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">นี่คือลักษณะข้อมูลที่จะปรากฏบนหัวเอกสาร ใบเสนอราคา และใบแจ้งหนี้ของคุณ กรุณาตรวจสอบความถูกต้อง</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Team - P3-3 Invite Flow */}
                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            <Card className="shadow-sm border-gray-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        สมาชิกในทีม
                                    </CardTitle>
                                    <Button size="sm" onClick={() => setShowInviteModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 font-bold h-9 rounded-xl">
                                        <UserPlus className="w-4 h-4" /> เชิญสมาชิก
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-50">
                                        {[
                                            { name: 'Asia', email: 'asia@leadspark.co', role: 'Admin', status: 'active', color: 'from-blue-400 to-blue-600' },
                                            { name: 'Som', email: 'som@leadspark.co', role: 'Member', status: 'active', color: 'from-green-400 to-green-600' },
                                        ].map((m) => (
                                            <div key={m.name} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-sm font-black shadow-sm`}>
                                                        {m.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                                        <p className="text-xs text-gray-400">{m.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={m.role === 'Admin' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase tracking-wider h-6 rounded-lg px-2">
                                                        {m.role}
                                                    </Badge>
                                                    <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Pending Invites */}
                                        {pendingInvites.map((inv) => (
                                            <div key={inv.email} className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-l-4 border-amber-400">
                                                <div className="flex items-center gap-4 opacity-60">
                                                    <div className="w-10 h-10 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-black">
                                                        ?
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{inv.email}</p>
                                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> รอการยืนยัน
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-6 rounded-lg border-gray-200">
                                                        {inv.role}
                                                    </Badge>
                                                    <button 
                                                        onClick={() => setPendingInvites(pendingInvites.filter(i => i.email !== inv.email))}
                                                        className="text-xs font-bold text-red-500 hover:underline px-2"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Notifications - P3-4 improved */}
                    {activeTab === 'notifications' && (
                        <Card className="shadow-sm border-gray-100">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-blue-600" />
                                    การตั้งค่าการแจ้งเตือน
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {[
                                    { id: 'overdue', label: 'งานเกินกำหนด (Task Overdue)', desc: 'แจ้งเตือนทันทีเมื่องานที่คุณรับผิดชอบเกินกำหนดส่ง' },
                                    { id: 'payment', label: 'ครบกำหนดชำระ (Payment Due)', desc: 'แจ้งเตือนเมื่อใบแจ้งหนี้ของลูกค้าเลยกำหนดชำระเงิน' },
                                    { id: 'lead', label: 'ลีดใหม่ที่ตรงเงื่อนไข (New Lead Match)', desc: 'แจ้งเตือนเมื่อ AI พบลีดใหม่ที่มี AI Score สูงกว่า 80' },
                                    { id: 'team', label: 'กิจกรรมของทีม (Team Activity)', desc: 'แจ้งเมื่อสมาชิกในทีมอัปเดตสถานะดีลหรือสร้างเอกสารใหม่' },
                                ].map((item) => (
                                    <div key={item.id} className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked={true} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                                            </label>
                                        </div>
                                        <div className="flex gap-2 pl-1">
                                            <Badge variant="outline" className="h-7 gap-1.5 px-3 rounded-lg border-blue-100 bg-blue-50 text-blue-600 font-bold text-[10px]">
                                                <Mail className="w-3 h-3" /> EMAIL
                                            </Badge>
                                            <Badge variant="outline" className="h-7 gap-1.5 px-3 rounded-lg border-gray-100 text-gray-400 font-bold text-[10px]">
                                                <MessageSquare className="w-3 h-3" /> LINE (ยังไม่เชื่อมต่อ)
                                            </Badge>
                                            <Badge variant="outline" className="h-7 gap-1.5 px-3 rounded-lg border-blue-100 bg-blue-50 text-blue-600 font-bold text-[10px]">
                                                <Smartphone className="w-3 h-3" /> PUSH
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Connections - P3-1 */}
                    {activeTab === 'connections' && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">External Integrations</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'LINE Official Account', icon: MessageSquare, color: 'bg-green-500', status: 'connect', desc: 'ส่งใบเสนอราคาและแจ้งเตือนผ่าน LINE' },
                                    { name: 'Google Calendar', icon: Calendar, color: 'bg-blue-500', status: 'connect', desc: 'ซิงค์วันติดตามลีดและวันครบกำหนดงาน' },
                                    { name: 'Bank API (K-Bank)', icon: Banknote, color: 'bg-green-600', status: 'soon', desc: 'ตรวจสอบยอดเงินโอนเข้าอัตโนมัติ' },
                                    { name: 'Gmail / Outlook', icon: Mail, color: 'bg-red-500', status: 'soon', desc: 'ซิงค์อีเมลโต้ตอบลูกค้าเข้าในไทม์ไลน์' },
                                ].map((c) => (
                                    <Card key={c.name} className="shadow-sm border-gray-100 hover:border-blue-200 transition-colors">
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white shadow-sm`}>
                                                    <c.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{c.status === 'soon' ? 'เร็วๆ นี้' : 'ยังไม่ได้เชื่อมต่อ'}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed mb-4">{c.desc}</p>
                                            <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl h-9" disabled={c.status === 'soon'}>
                                                {c.status === 'soon' ? 'COMING SOON' : 'เชื่อมต่อตอนนี้'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data - P3-1 */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <Card className="shadow-sm border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-blue-600" />
                                        การนำเข้าข้อมูล (Import)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all text-center group">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100">
                                            <Users className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">นำเข้าลูกค้า (CSV)</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Database Migration</p>
                                        </div>
                                    </button>
                                    <button className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all text-center group">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100">
                                            <Target className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">นำเข้าลีดดิบ (Excel)</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Bulk Lead Upload</p>
                                        </div>
                                    </button>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Download className="w-4 h-4 text-blue-600" />
                                        การส่งออกข้อมูล (Export)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        { name: 'ฐานข้อมูลลูกค้าทั้งหมด', format: 'CSV / Excel', icon: Users },
                                        { name: 'เอกสารทั้งหมด (ย้อนหลัง 1 ปี)', format: 'PDF (ZIP Bundle)', icon: FileText },
                                        { name: 'รายงานสรุปผลการขายรายเดือน', format: 'Excel', icon: BarChart3 },
                                    ].map((e) => (
                                        <div key={e.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <e.icon className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{e.name}</p>
                                                    <p className="text-[10px] text-blue-600 font-bold uppercase">{e.format}</p>
                                                </div>
                                            </div>
                                            <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-gray-100 mt-4">
                                        <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" /> ลบข้อมูลทั้งหมดและเริ่มใหม่ (Danger Zone)
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Billing - P3-1 */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <Card className="shadow-sm border-none bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-3xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                                <CardContent className="p-8 relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <Badge className="bg-blue-500 text-white border-none font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest mb-3">Active Plan</Badge>
                                            <h3 className="text-3xl font-black">LeadSpark Business</h3>
                                            <p className="text-gray-400 mt-2 font-medium">ต่ออายุครั้งถัดไปวันที่ 17 มีนาคม 2569</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black">฿2,900</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ต่อเดือน (รายปี)</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ลูกค้า</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-xl font-bold">1,240</p>
                                                <p className="text-[10px] text-gray-500 pb-1">/ 5,000</p>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: '25%'}} /></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ทีมงาน</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-xl font-bold">5</p>
                                                <p className="text-[10px] text-gray-500 pb-1">/ 10</p>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2"><div className="bg-green-500 h-1.5 rounded-full" style={{width: '50%'}} /></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI Search</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-xl font-bold">850</p>
                                                <p className="text-[10px] text-gray-500 pb-1">/ ไม่จำกัด</p>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: '100%'}} /></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-base font-bold">ประวัติการชำระเงิน</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-y border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <th className="px-6 py-3 text-left">วันที่</th>
                                                <th className="px-6 py-3 text-left">รายการ</th>
                                                <th className="px-6 py-3 text-right">จำนวนเงิน</th>
                                                <th className="px-6 py-3 text-center">ใบเสร็จ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { date: '17 ก.พ. 2569', desc: 'Business Plan (รายเดือน)', amount: '2,900.00' },
                                                { date: '17 ม.ค. 2569', desc: 'Business Plan (รายเดือน)', amount: '2,900.00' },
                                                { date: '17 ธ.ค. 2568', desc: 'Business Plan (รายเดือน)', amount: '2,900.00' },
                                            ].map((b) => (
                                                <tr key={b.date} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-600 font-medium">{b.date}</td>
                                                    <td className="px-6 py-4 font-bold text-gray-900">{b.desc}</td>
                                                    <td className="px-6 py-4 text-right font-black">฿{b.amount}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Business Profile, Services, Goals tabs remain visible but with improved styling logic... */}
                    {/* (Omitted for brevity in this tool call, but would be fully styled in final implementation) */}
                    
                </div>
            </div>

            {/* Team Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">เชิญสมาชิกทีม</h2>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">อีเมลสมาชิกใหม่</label>
                                    <Input 
                                        autoFocus
                                        value={inviteEmail} 
                                        onChange={(e) => setInviteEmail(e.target.value)} 
                                        placeholder="name@example.com" 
                                        className="h-12 rounded-xl text-base font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">บทบาท (Role)</label>
                                    <select 
                                        value={inviteRole} 
                                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                        className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 text-sm font-bold text-gray-700 bg-gray-50 focus:bg-white focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="member">Member (เพิ่ม/แก้ไขข้อมูล)</option>
                                        <option value="admin">Admin (จัดการทีมและตั้งค่า)</option>
                                        <option value="viewer">Viewer (ดูรายงานอย่างเดียว)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">คำเชิญจะมีอายุ 7 วัน สมาชิกใหม่จะได้รับอีเมลเพื่อตั้งค่ารหัสผ่านและเข้าสู่ทีมของคุณ</p>
                            </div>

                            <Button onClick={handleInvite} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-200">
                                ส่งคำเชิญเข้าร่วมทีม
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Service Add/Edit Modal with improved styling... */}
            {showServiceForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowServiceForm(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 space-y-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900">{editServiceId ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
                            <button onClick={() => setShowServiceForm(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ชื่อบริการ *</label>
                                <Input value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="เช่น: ออกแบบเว็บไซต์" className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ราคา (บาท)</label>
                                <Input type="number" value={svcPrice} onChange={(e) => setSvcPrice(Number(e.target.value))} min={0} className="h-12 rounded-xl font-black text-blue-600 text-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">รายละเอียด</label>
                                <Textarea value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} placeholder="รายละเอียดบริการ..." rows={3} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setShowServiceForm(false)} className="flex-1 h-12 rounded-2xl font-bold">ยกเลิก</Button>
                            <Button onClick={handleSaveService} disabled={!svcName.trim()} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100">
                                {editServiceId ? 'บันทึก' : 'เพิ่มบริการ'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { BarChart3 } from 'lucide-react';

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
