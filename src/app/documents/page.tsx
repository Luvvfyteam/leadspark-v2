'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DOCUMENT_STATUS_CONFIG } from '@/lib/constants';
import { usePermissions } from '@/lib/usePermissions';
import { useToast } from '@/components/ui/toast';
import { SlideOverPanel } from '@/components/shared/SlideOverPanel';
import { Document as Doc, DocumentItem, DocumentType, DiscountType, DocumentStatus } from '@/types';
import {
    FileText, FilePlus, Receipt, X, Plus, Trash2, Search, Download, Eye, Printer,
    ChevronRight, ChevronLeft, Check, Copy, RefreshCcw, Send, Building2, Calendar,
    CreditCard, Info
} from 'lucide-react';

type TabType = 'quotation' | 'invoice';

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

export default function DocumentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { documents, customers, services, addDocument, updateDocument } = useAppStore();
    const { canExport } = usePermissions();
    const { showToast } = useToast();

    // ── UI States ──────────────────────────────────────────────────────────
    const [tab, setTab] = useState<TabType>('quotation');
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);

    // ── Wizard Form State ──────────────────────────────────────────────────
    const [createType, setCreateType] = useState<DocumentType>('quotation');
    const [selectedCustId, setSelectedCustId] = useState('');
    const [custSearch, setCustSearch] = useState('');
    const [items, setItems] = useState<DocumentItem[]>([{ name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
    const [discountType, setDiscountType] = useState<DiscountType>('fixed');
    const [discountValue, setDiscountValue] = useState(0);
    const [terms, setTerms] = useState('ชำระเงินภายใน 30 วัน');
    const [validDays, setValidDays] = useState(30);
    const [dueDate, setDueDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('โอนเงินผ่านธนาคาร');

    // ── Entry Point Handling (P2-6) ────────────────────────────────────────
    useEffect(() => {
        const prefillCustId = searchParams.get('customer_id');
        const prefillType = searchParams.get('type') as DocumentType;
        if (prefillCustId) {
            setSelectedCustId(prefillCustId);
            if (prefillType) setCreateType(prefillType);
            setShowWizard(true);
            setWizardStep(2); // Start at customer confirmed or items
        }
    }, [searchParams]);

    // ── Computed ────────────────────────────────────────────────────────────
    const filtered = useMemo(() => 
        documents.filter((d) => d.type === tab).sort((a, b) => b.created_at.localeCompare(a.created_at))
    , [documents, tab]);

    const quotations = documents.filter((d) => d.type === 'quotation');
    const invoices = documents.filter((d) => d.type === 'invoice');

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue;
    const total = subtotal - discount;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const getNextNumber = (type: DocumentType) => {
        const prefix = type === 'quotation' ? 'QT' : 'INV';
        const existing = documents.filter((d) => d.type === type);
        const maxNum = existing.reduce((max, d) => {
            const parts = d.document_number.split('-');
            if (parts.length < 2) return max;
            const num = parseInt(parts[1], 10);
            return isNaN(num) ? max : (num > max ? num : max);
        }, 0);
        return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
    };

    const resetWizard = () => {
        setWizardStep(1);
        setSelectedCustId('');
        setCustSearch('');
        setItems([{ name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
        setDiscountType('fixed');
        setDiscountValue(0);
        setTerms('ชำระเงินภายใน 30 วัน');
        setDueDate('');
    };

    const handleCreate = (status: DocumentStatus = 'draft') => {
        if (!selectedCustId || items.length === 0 || !items[0].name) return;
        const doc: Doc = {
            id: `doc-${Date.now()}`,
            team_id: 'team-001',
            customer_id: selectedCustId,
            deal_id: null,
            type: createType,
            document_number: getNextNumber(createType),
            items: items.filter((i) => i.name),
            subtotal,
            discount_type: discountType,
            discount_value: discountValue,
            total,
            terms,
            valid_until: createType === 'quotation'
                ? new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0]
                : null,
            due_date: createType === 'invoice' && dueDate ? dueDate : null,
            payment_method: createType === 'invoice' ? paymentMethod : null,
            status,
            created_by: 'user-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        addDocument(doc);
        showToast(`${status === 'sent' ? 'ส่ง' : 'สร้าง'}เอกสาร ${doc.document_number} แล้ว`);
        setShowWizard(false);
        resetWizard();
    };

    const handleDuplicate = (doc: Doc) => {
        const newDoc: Doc = {
            ...doc,
            id: `doc-${Date.now()}`,
            document_number: getNextNumber(doc.type),
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        addDocument(newDoc);
        showToast(`คัดลอกเป็น ${newDoc.document_number} แล้ว`);
    };

    const handleConvert = (quote: Doc) => {
        setCreateType('invoice');
        setSelectedCustId(quote.customer_id);
        setItems([...quote.items]);
        setDiscountType(quote.discount_type);
        setDiscountValue(quote.discount_value);
        setTerms('ชำระเงินเมื่อได้รับสินค้า/บริการ');
        setWizardStep(4); // Go to terms/dates for invoice
        setShowWizard(true);
    };

    const handleSend = (id: string) => {
        updateDocument(id, { status: 'sent' });
        showToast('เปลี่ยนสถานะเป็น "ส่งแล้ว"');
    };

    // ── Render Helpers ──────────────────────────────────────────────────────
    const StepIndicator = () => (
        <div className="flex items-center justify-between px-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${wizardStep === s ? 'bg-blue-600 text-white shadow-md' : wizardStep > s ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {wizardStep > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    {s < 5 && <div className={`w-8 sm:w-12 h-0.5 mx-1 ${wizardStep > s ? 'bg-green-200' : 'bg-gray-100'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">การจัดการเอกสาร</h1>
                    <p className="text-sm text-gray-500 mt-0.5">ออกใบเสนอราคาและใบแจ้งหนี้ให้ลูกค้าได้ทันที</p>
                </div>
                <div className="flex items-center gap-2">
                    {canExport && (
                        <Button variant="outline" size="sm" onClick={() => showToast('Exporting...')}>
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    )}
                    <Button onClick={() => { resetWizard(); setShowWizard(true); }} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> สร้างเอกสารใหม่
                    </Button>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setTab('quotation')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'quotation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FileText className="w-4 h-4" /> ใบเสนอราคา ({quotations.length})
                </button>
                <button
                    onClick={() => setTab('invoice')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'invoice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Receipt className="w-4 h-4" /> ใบแจ้งหนี้ ({invoices.length})
                </button>
            </div>

            {/* List Table */}
            <Card className="shadow-sm overflow-hidden border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">เลขที่</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่ออก</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">จำนวนเงิน</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">ยังไม่มีเอกสารในหมวดนี้</td>
                                </tr>
                            ) : (
                                filtered.map((doc) => {
                                    const cust = customers.find((c) => c.id === doc.customer_id);
                                    const statusCfg = DOCUMENT_STATUS_CONFIG[doc.status] || DOCUMENT_STATUS_CONFIG.draft;
                                    return (
                                        <tr key={doc.id} className="hover:bg-blue-50/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-bold text-gray-900">{doc.document_number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{cust?.business_name || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString('th-TH')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-gray-900">{formatCurrency(doc.total)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className={`text-[10px] px-2 py-0.5 ${statusCfg.color}`}>{statusCfg.label}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setPreviewDoc(doc)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title="ดูตัวอย่าง">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDuplicate(doc)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title="ทำซ้ำ">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    {doc.type === 'quotation' && (doc.status === 'accepted' || doc.status === 'sent') && (
                                                        <button onClick={() => handleConvert(doc)} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded" title="แปลงเป็นใบแจ้งหนี้">
                                                            <RefreshCcw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {doc.status === 'draft' && (
                                                        <button onClick={() => handleSend(doc.id)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title="ส่ง">
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Document Creation Wizard ────────────────────────────────────── */}
            <SlideOverPanel
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                title={wizardStep === 1 ? 'เลือกประเภทเอกสาร' : `สร้าง${createType === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'} - ${getNextNumber(createType)}`}
                width="xl"
                footer={
                    <div className="flex justify-between w-full">
                        <Button 
                            variant="ghost" 
                            onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                            disabled={wizardStep === 1}
                            className="gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
                        </Button>
                        {wizardStep < 5 ? (
                            <Button 
                                onClick={() => setWizardStep(prev => prev + 1)}
                                disabled={(wizardStep === 2 && !selectedCustId) || (wizardStep === 3 && items[0].name === '')}
                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                ต่อไป <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleCreate('draft')}>บันทึกร่าง</Button>
                                <Button onClick={() => handleCreate('sent')} className="bg-blue-600 hover:bg-blue-700">บันทึกและส่ง</Button>
                            </div>
                        )}
                    </div>
                }
            >
                <StepIndicator />

                {/* Step 1: Type */}
                {wizardStep === 1 && (
                    <div className="grid grid-cols-2 gap-6 pt-10">
                        <button 
                            onClick={() => { setCreateType('quotation'); setWizardStep(2); }}
                            className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all ${createType === 'quotation' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${createType === 'quotation' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <FileText className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-900">ใบเสนอราคา</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">เสนอราคาและขอบเขตงานให้ลูกค้าพิจารณา</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => { setCreateType('invoice'); setWizardStep(2); }}
                            className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all ${createType === 'invoice' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${createType === 'invoice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <Receipt className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-900">ใบแจ้งหนี้</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">เรียกเก็บเงินเมื่อเริ่มงานหรือส่งมอบงานแล้ว</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Step 2: Customer */}
                {wizardStep === 2 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">ค้นหาลูกค้า</p>
                                <p className="text-xs text-blue-700 mt-0.5">ค้นหาชื่อธุรกิจที่ต้องการออกเอกสารให้</p>
                            </div>
                        </div>

                        {selectedCustId ? (
                            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                        {customers.find(c => c.id === selectedCustId)?.business_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{customers.find(c => c.id === selectedCustId)?.business_name}</p>
                                        <p className="text-xs text-gray-500">{customers.find(c => c.id === selectedCustId)?.industry}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustId('')} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input 
                                    value={custSearch} 
                                    onChange={(e) => setCustSearch(e.target.value)}
                                    placeholder="พิมพ์ชื่อลูกค้า..." 
                                    className="pl-12 h-12 text-base rounded-xl"
                                    autoFocus
                                />
                                {custSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10 animate-in fade-in-0 zoom-in-95">
                                        {customers.filter(c => c.business_name.toLowerCase().includes(custSearch.toLowerCase())).slice(0, 5).map(c => (
                                            <button 
                                                key={c.id} 
                                                onClick={() => { setSelectedCustId(c.id); setCustSearch(''); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                                                    {c.business_name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-gray-900">{c.business_name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.industry}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {!selectedCustId && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ลูกค้าล่าสุด</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {customers.slice(0, 4).map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => setSelectedCustId(c.id)}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 transition-all text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                {c.business_name.charAt(0)}
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 truncate">{c.business_name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Items */}
                {wizardStep === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900">รายการบริการ / สินค้า</h4>
                            <button 
                                onClick={() => setItems(prev => [...prev, { name: '', description: '', quantity: 1, unit_price: 0, total: 0 }])}
                                className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="group relative bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <button 
                                        onClick={() => items.length > 1 && setItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-12 sm:col-span-7">
                                            <Input 
                                                value={item.name} 
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx].name = e.target.value;
                                                    setItems(newItems);
                                                }}
                                                placeholder="ชื่อรายการสินค้าหรือบริการ..." 
                                                className="bg-white"
                                            />
                                            <Input 
                                                value={item.description} 
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx].description = e.target.value;
                                                    setItems(newItems);
                                                }}
                                                placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" 
                                                className="mt-2 text-xs bg-white/50"
                                            />
                                        </div>
                                        <div className="col-span-4 sm:col-span-2">
                                            <p className="text-[10px] text-gray-400 uppercase mb-1">จำนวน</p>
                                            <Input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx].quantity = Number(e.target.value);
                                                    newItems[idx].total = newItems[idx].quantity * newItems[idx].unit_price;
                                                    setItems(newItems);
                                                }}
                                                className="text-center bg-white"
                                            />
                                        </div>
                                        <div className="col-span-8 sm:col-span-3">
                                            <p className="text-[10px] text-gray-400 uppercase mb-1 text-right">ราคาต่อหน่วย</p>
                                            <Input 
                                                type="number" 
                                                value={item.unit_price} 
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx].unit_price = Number(e.target.value);
                                                    newItems[idx].total = newItems[idx].quantity * newItems[idx].unit_price;
                                                    setItems(newItems);
                                                }}
                                                className="text-right bg-white font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เลือกจากบริการแนะนำ</p>
                            <div className="flex flex-wrap gap-2">
                                {services.filter(s => s.is_active).map(s => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => {
                                            const newItem = { name: s.name, description: s.description, quantity: 1, unit_price: s.price, total: s.price };
                                            if (items.length === 1 && items[0].name === '') {
                                                setItems([newItem]);
                                            } else {
                                                setItems(prev => [...prev, newItem]);
                                            }
                                        }}
                                        className="text-xs px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3 h-3" /> {s.name} ({formatCurrency(s.price)})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Terms & Discount */}
                {wizardStep === 4 && (
                    <div className="space-y-8">
                        {/* Totals Summary */}
                        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                                <span className="text-gray-400">ราคารวม ({items.length} รายการ)</span>
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">ส่วนลด</span>
                                    <select 
                                        value={discountType} 
                                        onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                                        className="bg-white/10 border-none rounded text-xs px-2 py-1 outline-none"
                                    >
                                        <option value="fixed" className="text-black">฿</option>
                                        <option value="percentage" className="text-black">%</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                                        className="w-16 bg-transparent border-b border-white/20 text-right focus:border-blue-400 outline-none text-sm font-bold"
                                    />
                                </div>
                                <span className="text-red-400 font-medium">-{formatCurrency(discount)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium">ยอดรวมทั้งสิ้น</span>
                                <span className="text-3xl font-bold text-blue-400">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {createType === 'quotation' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> อายุเอกสาร (วัน)
                                        </label>
                                        <Input 
                                            type="number" 
                                            value={validDays} 
                                            onChange={(e) => setValidDays(Number(e.target.value))} 
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> วันครบกำหนดชำระ
                                        </label>
                                        <Input 
                                            type="date" 
                                            value={dueDate} 
                                            onChange={(e) => setDueDate(e.target.value)} 
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5" /> วิธีชำระเงิน
                                    </label>
                                    <select 
                                        value={paymentMethod} 
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="โอนเงินผ่านธนาคาร">โอนเงินผ่านธนาคาร</option>
                                        <option value="PromptPay">PromptPay</option>
                                        <option value="เงินสด">เงินสด</option>
                                        <option value="เช็คสั่งจ่าย">เช็คสั่งจ่าย</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5" /> เงื่อนไขเพิ่มเติม
                                </label>
                                <textarea 
                                    value={terms} 
                                    onChange={(e) => setTerms(e.target.value)}
                                    rows={3}
                                    className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="เช่น ชำระล่วงหน้า 50%..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Preview */}
                {wizardStep === 5 && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-700">
                            <Eye className="w-5 h-5 shrink-0" />
                            <p className="text-xs leading-relaxed">กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก คุณสามารถกลับไปแก้ไขได้ในทุกขั้นตอน</p>
                        </div>

                        {/* Mini Preview Box */}
                        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-bold text-gray-900">{getNextNumber(createType)}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] uppercase">{createType}</Badge>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">ลูกค้า</p>
                                        <p className="text-sm font-bold">{customers.find(c => c.id === selectedCustId)?.business_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">ยอดรวม</p>
                                        <p className="text-lg font-bold text-blue-600">{formatCurrency(total)}</p>
                                    </div>
                                </div>
                                <div className="space-y-1 pt-4 border-t border-gray-50">
                                    {items.filter(i => i.name).map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-gray-600">{item.name} x {item.quantity}</span>
                                            <span className="text-gray-900 font-medium">{formatCurrency(item.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </SlideOverPanel>

            {/* ── Document Full Preview Modal ──────────────────────────────────── */}
            {previewDoc && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-6 overflow-y-auto" onClick={() => setPreviewDoc(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 mb-10" id="doc-preview">
                        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-xl">
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1">
                                    <Printer className="w-3.5 h-3.5" /> พิมพ์เอกสาร
                                </Button>
                            </div>
                            <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-gray-200 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div id="doc-preview-content" className="p-10 space-y-8">
                            {/* Header */}
                            <div className="flex justify-between border-b-2 border-blue-600 pb-6">
                                <div>
                                    <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic">LEADSPARK.</h1>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">123 สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-bold text-gray-900">{previewDoc.type === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}</h2>
                                    <p className="text-sm font-mono text-blue-600 font-bold mt-1">{previewDoc.document_number}</p>
                                </div>
                            </div>
                            {/* Meta */}
                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ข้อมูลลูกค้า</p>
                                    <p className="font-bold text-gray-900 text-base">{customers.find(c => c.id === previewDoc.customer_id)?.business_name}</p>
                                    <p className="text-gray-500 mt-1">{customers.find(c => c.id === previewDoc.customer_id)?.address || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">วันที่ออกเอกสาร</p>
                                        <p className="text-gray-900 font-medium">{new Date(previewDoc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="mt-4 space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{previewDoc.type === 'quotation' ? 'ยืนราคาถึงวันที่' : 'ครบกำหนดชำระ'}</p>
                                        <p className="text-blue-600 font-bold">{new Date(previewDoc.valid_until || previewDoc.due_date || '').toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Items */}
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y border-gray-200 bg-gray-50/50">
                                        <th className="py-3 text-left font-bold text-gray-700">รายการ</th>
                                        <th className="py-3 text-right font-bold text-gray-700 w-20">จำนวน</th>
                                        <th className="py-3 text-right font-bold text-gray-700 w-32">ราคา/หน่วย</th>
                                        <th className="py-3 text-right font-bold text-gray-700 w-32">รวมเงิน</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewDoc.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-4">
                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                                            </td>
                                            <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                                            <td className="py-4 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                                            <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Totals */}
                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>ราคารวม</span>
                                        <span>{formatCurrency(previewDoc.subtotal)}</span>
                                    </div>
                                    {previewDoc.discount_value > 0 && (
                                        <div className="flex justify-between text-sm text-red-500">
                                            <span>ส่วนลด {previewDoc.discount_type === 'percentage' ? `(${previewDoc.discount_value}%)` : ''}</span>
                                            <span>-{formatCurrency(previewDoc.subtotal - previewDoc.total)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-black text-blue-600 pt-2 border-t border-blue-50">
                                        <span>รวมสุทธิ</span>
                                        <span>{formatCurrency(previewDoc.total)}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Footer Note */}
                            <div className="pt-10 grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">เงื่อนไขการชำระเงิน</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{previewDoc.terms}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">วิธีชำระเงิน</p>
                                        <p className="text-xs text-gray-600">{previewDoc.payment_method || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-end justify-end pb-2">
                                    <div className="text-center">
                                        <div className="w-48 border-b border-gray-300 h-10"></div>
                                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">ผู้อนุมัติ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-6 overflow-y-auto" onClick={() => setPreviewDoc(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 mb-10" id="doc-preview">
                        {/* Preview Actions Bar */}
                        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-xl">
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => {
                                    const printContent = document.getElementById('doc-preview-content');
                                    if (!printContent) return;
                                    const win = window.open('', '_blank');
                                    if (!win) return;
                                    win.document.write(`<html><head><title>${previewDoc.document_number}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#333}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}th{background:#f6f6f6;font-weight:600}.text-right{text-align:right}.mt-4{margin-top:16px}.text-sm{font-size:13px}.font-bold{font-weight:700}.text-gray{color:#666}.header{border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:20px}.sig{margin-top:60px;display:flex;justify-content:space-between}.sig-line{width:200px;border-top:1px solid #999;padding-top:8px;text-align:center;font-size:12px;color:#666}@media print{body{padding:20px}}</style></head><body>${printContent.innerHTML}</body></html>`);
                                    win.document.close();
                                    win.print();
                                }} className="gap-1">
                                    <Printer className="w-3.5 h-3.5" /> Export PDF
                                </Button>
                            </div>
                            <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-gray-200 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>

                        {/* Preview Content */}
                        <div id="doc-preview-content" className="p-8 space-y-6">
                            {/* Company Header */}
                            <div className="header" style={{ borderBottom: '2px solid #2563eb', paddingBottom: '16px' }}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-xl font-bold text-blue-600">LeadSpark Co., Ltd.</h1>
                                        <p className="text-xs text-gray-500 mt-1">123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110</p>
                                        <p className="text-xs text-gray-500">โทร: 02-123-4567 · อีเมล: info@leadspark.co.th</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-gray-800">
                                            {previewDoc.type === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}
                                        </span>
                                        <p className="text-sm font-mono text-blue-600 mt-1">{previewDoc.document_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Document Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-1">ลูกค้า</p>
                                    <p className="font-medium text-gray-800">{customers.find((c) => c.id === previewDoc.customer_id)?.business_name || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase mb-1">วันที่</p>
                                    <p className="text-gray-700">{new Date(previewDoc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    {previewDoc.valid_until && (
                                        <p className="text-xs text-gray-500 mt-0.5">หมดอายุ: {new Date(previewDoc.valid_until).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    )}
                                    {previewDoc.due_date && (
                                        <p className="text-xs text-gray-500 mt-0.5">ครบกำหนด: {new Date(previewDoc.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-200 px-3 py-2 text-left w-10">ลำดับ</th>
                                        <th className="border border-gray-200 px-3 py-2 text-left">รายการ</th>
                                        <th className="border border-gray-200 px-3 py-2 text-right w-16">จำนวน</th>
                                        <th className="border border-gray-200 px-3 py-2 text-right w-28">ราคาต่อหน่วย</th>
                                        <th className="border border-gray-200 px-3 py-2 text-right w-28">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewDoc.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="border border-gray-200 px-3 py-2 text-center text-gray-500">{idx + 1}</td>
                                            <td className="border border-gray-200 px-3 py-2">
                                                <span className="font-medium">{item.name}</span>
                                                {item.description && <span className="text-xs text-gray-400 ml-1">({item.description})</span>}
                                            </td>
                                            <td className="border border-gray-200 px-3 py-2 text-right">{item.quantity}</td>
                                            <td className="border border-gray-200 px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                                            <td className="border border-gray-200 px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">ราคารวม</span>
                                        <span>{formatCurrency(previewDoc.subtotal)}</span>
                                    </div>
                                    {previewDoc.discount_value > 0 && (
                                        <div className="flex justify-between text-sm text-red-500">
                                            <span>ส่วนลด ({previewDoc.discount_type === 'percentage' ? `${previewDoc.discount_value}%` : `฿${previewDoc.discount_value}`})</span>
                                            <span>-{formatCurrency(previewDoc.subtotal - previewDoc.total)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-base border-t pt-2">
                                        <span>ยอดรวมทั้งสิ้น</span>
                                        <span className="text-blue-600">{formatCurrency(previewDoc.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            {previewDoc.terms && (
                                <div className="text-sm">
                                    <p className="text-xs text-gray-400 uppercase mb-1">เงื่อนไข</p>
                                    <p className="text-gray-600">{previewDoc.terms}</p>
                                </div>
                            )}

                            {/* Signature */}
                            <div className="flex justify-between mt-12 pt-4">
                                <div className="text-center">
                                    <div className="w-48 border-t border-gray-300 pt-2">
                                        <p className="text-xs text-gray-500">ผู้เสนอราคา / ผู้ออกเอกสาร</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="w-48 border-t border-gray-300 pt-2">
                                        <p className="text-xs text-gray-500">ผู้อนุมัติ / ลูกค้า</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
