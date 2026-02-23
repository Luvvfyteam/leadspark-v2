'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DOCUMENT_STATUS_CONFIG } from '@/lib/constants';
import { usePermissions } from '@/lib/usePermissions';
import { useToast } from '@/components/ui/toast';
import { Document as Doc, DocumentItem, DocumentType, DiscountType } from '@/types';
import {
    FileText, FilePlus, Receipt, X, Plus, Trash2, Search, Download, Eye, Printer,
} from 'lucide-react';

type TabType = 'quotation' | 'invoice';

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

export default function DocumentsPage() {
    const router = useRouter();
    const { documents, customers, services, addDocument } = useAppStore();
    const { canExport } = usePermissions();
    const { showToast } = useToast();
    const [tab, setTab] = useState<TabType>('quotation');
    const [showCreate, setShowCreate] = useState(false);
    const [createType, setCreateType] = useState<DocumentType>('quotation');
    const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);

    // Create form state
    const [custSearch, setCustSearch] = useState('');
    const [selectedCust, setSelectedCust] = useState('');
    const [items, setItems] = useState<DocumentItem[]>([{ name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
    const [discountType, setDiscountType] = useState<DiscountType>('fixed');
    const [discountValue, setDiscountValue] = useState(0);
    const [terms, setTerms] = useState('ชำระเงินภายใน 30 วัน');
    const [validDays, setValidDays] = useState(30);
    const [dueDate, setDueDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('transfer');

    const filtered = useMemo(() => documents.filter((d) => d.type === tab).sort((a, b) => b.created_at.localeCompare(a.created_at)), [documents, tab]);

    const quotations = documents.filter((d) => d.type === 'quotation');
    const invoices = documents.filter((d) => d.type === 'invoice');

    const getNextNumber = (type: DocumentType) => {
        const prefix = type === 'quotation' ? 'QT' : 'INV';
        const existing = documents.filter((d) => d.type === type);
        const maxNum = existing.reduce((max, d) => {
            const num = parseInt(d.document_number.split('-')[1], 10);
            return num > max ? num : max;
        }, 0);
        return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
    };

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue;
    const total = subtotal - discount;

    const updateItem = (idx: number, field: keyof DocumentItem, value: string | number) => {
        setItems((prev) => prev.map((item, i) => {
            if (i !== idx) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                updated.total = Number(updated.quantity) * Number(updated.unit_price);
            }
            return updated;
        }));
    };

    const addItem = () => setItems((prev) => [...prev, { name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
    const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

    const addServiceItem = (svc: { name: string; description: string; price: number }) => {
        setItems((prev) => [...prev, { name: svc.name, description: svc.description, quantity: 1, unit_price: svc.price, total: svc.price }]);
    };

    const handleCreate = () => {
        if (!selectedCust || items.length === 0 || !items[0].name) return;
        const doc: Doc = {
            id: `doc-${Date.now()}`,
            team_id: 'team-001',
            customer_id: selectedCust,
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
            status: 'draft',
            created_by: 'user-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        addDocument(doc);
        showToast(`สร้างเอกสาร ${doc.document_number} แล้ว`);
        resetForm();
    };

    const exportCSV = () => {
        const headers = ['เลขที่', 'ประเภท', 'ลูกค้า', 'จำนวนเงิน', 'สถานะ', 'วันที่'];
        const rows = filtered.map((d) => [
            d.document_number, d.type === 'quotation' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้',
            customers.find((c) => c.id === d.customer_id)?.business_name || '-',
            d.total.toString(), DOCUMENT_STATUS_CONFIG[d.status]?.label || d.status,
            new Date(d.created_at).toLocaleDateString('th-TH'),
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'documents.csv'; a.click();
        URL.revokeObjectURL(url);
        showToast('ดาวน์โหลด CSV แล้ว');
    };

    const resetForm = () => {
        setShowCreate(false);
        setCustSearch('');
        setSelectedCust('');
        setItems([{ name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
        setDiscountType('fixed');
        setDiscountValue(0);
        setTerms('ชำระเงินภายใน 30 วัน');
        setDueDate('');
    };

    const filteredCusts = custSearch
        ? customers.filter((c) => c.business_name.includes(custSearch)).slice(0, 5)
        : [];

    const openCreate = (type: DocumentType) => {
        setCreateType(type);
        resetForm();
        setShowCreate(true);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">เอกสาร</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {quotations.length} ใบเสนอราคา · {invoices.length} ใบแจ้งหนี้
                    </p>
                </div>
                <div className="flex gap-2">
                    {canExport && (
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download className="w-4 h-4 mr-1" /> CSV
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => openCreate('quotation')} className="gap-1.5">
                        <FilePlus className="w-4 h-4" /> สร้างใบเสนอราคา
                    </Button>
                    <Button onClick={() => openCreate('invoice')} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                        <Receipt className="w-4 h-4" /> สร้างใบแจ้งหนี้
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setTab('quotation')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors ${tab === 'quotation' ? 'bg-white text-blue-600 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileText className="w-3.5 h-3.5" />
                    ใบเสนอราคา ({quotations.length})
                </button>
                <button
                    onClick={() => setTab('invoice')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors ${tab === 'invoice' ? 'bg-white text-blue-600 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Receipt className="w-3.5 h-3.5" />
                    ใบแจ้งหนี้ ({invoices.length})
                </button>
            </div>

            {/* Document List */}
            <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
                        <div className="col-span-2">เลขที่</div>
                        <div className="col-span-3">ลูกค้า</div>
                        <div className="col-span-2">วันที่</div>
                        <div className="col-span-2 text-right">จำนวนเงิน</div>
                        <div className="col-span-1">{tab === 'invoice' ? 'ครบกำหนด' : 'หมดอายุ'}</div>
                        <div className="col-span-2 text-center">สถานะ</div>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">ยังไม่มีเอกสาร</div>
                    ) : (
                        filtered.map((doc) => {
                            const cust = customers.find((c) => c.id === doc.customer_id);
                            const statusCfg = DOCUMENT_STATUS_CONFIG[doc.status] || DOCUMENT_STATUS_CONFIG.draft;
                            return (
                                <div key={doc.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 items-center transition-colors">
                                    <div className="col-span-2">
                                        <span className="text-sm font-mono font-medium text-gray-700">{doc.document_number}</span>
                                    </div>
                                    <div className="col-span-3">
                                        <button onClick={() => cust && router.push(`/customers/${cust.id}`)} className="text-sm text-blue-600 hover:underline truncate block text-left">{cust?.business_name || '-'}</button>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-xs text-gray-500">
                                            {new Date(doc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(doc.total)}</span>
                                    </div>
                                    <div className="col-span-1">
                                        <span className="text-xs text-gray-400">
                                            {(doc.due_date || doc.valid_until) ? new Date(doc.due_date || doc.valid_until || '').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center gap-1">
                                        <Badge className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
                                        <button onClick={() => setPreviewDoc(doc)} className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="ดูตัวอย่าง">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* Create Document Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-10 overflow-y-auto" onClick={() => setShowCreate(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 space-y-5 mb-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {createType === 'quotation' ? 'สร้างใบเสนอราคา' : 'สร้างใบแจ้งหนี้'}
                                <span className="ml-2 text-sm font-mono text-blue-500">{getNextNumber(createType)}</span>
                            </h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                        </div>

                        {/* Customer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า *</label>
                            {selectedCust ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-900 font-medium">{customers.find((c) => c.id === selectedCust)?.business_name}</span>
                                    <button onClick={() => { setSelectedCust(''); setCustSearch(''); }} className="text-gray-400 hover:text-red-500">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="ค้นหาลูกค้า..." className="pl-9" />
                                    {custSearch && filteredCusts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                                            {filteredCusts.map((c) => (
                                                <button key={c.id} onClick={() => { setSelectedCust(c.id); setCustSearch(''); }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0">{c.business_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Service Catalog */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกจากแคตตาล็อก</label>
                            <div className="flex gap-2 flex-wrap">
                                {services.filter((s) => s.is_active).map((svc) => (
                                    <button key={svc.id} onClick={() => addServiceItem(svc)}
                                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                        + {svc.name} ({formatCurrency(svc.price)})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Line Items */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">รายการ</label>
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                        <Input value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                            placeholder="ชื่อรายการ" className="col-span-4 text-sm" />
                                        <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                            placeholder="รายละเอียด" className="col-span-3 text-sm" />
                                        <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                            className="col-span-1 text-sm text-center" min={1} />
                                        <Input type="number" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                                            className="col-span-2 text-sm text-right" />
                                        <div className="col-span-1 text-right text-sm font-medium text-gray-700">{formatCurrency(item.total)}</div>
                                        <button onClick={() => removeItem(idx)} className="col-span-1 text-gray-400 hover:text-red-500 flex justify-center">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addItem} className="mt-2 text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
                            </button>
                        </div>

                        {/* Discount & Totals */}
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">ราคารวม</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-20">ส่วนลด</span>
                                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                                    className="border rounded px-2 py-1 text-sm">
                                    <option value="fixed">฿ บาท</option>
                                    <option value="percentage">%</option>
                                </select>
                                <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    className="w-24 text-sm" min={0} />
                                {discount > 0 && <span className="text-sm text-red-500">-{formatCurrency(discount)}</span>}
                            </div>
                            <div className="flex items-center justify-between text-base font-bold border-t pt-2">
                                <span>ยอดรวมทั้งสิ้น</span>
                                <span className="text-blue-600">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Terms & Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไข</label>
                                <Input value={terms} onChange={(e) => setTerms(e.target.value)} />
                            </div>
                            {createType === 'quotation' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">อายุใบเสนอราคา (วัน)</label>
                                    <Input type="number" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันครบกำหนดชำระ</label>
                                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                </div>
                            )}
                        </div>

                        {createType === 'invoice' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">วิธีชำระเงิน</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm">
                                    <option value="transfer">โอนเงิน</option>
                                    <option value="promptpay">PromptPay</option>
                                    <option value="cash">เงินสด</option>
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
                            <Button variant="outline" onClick={() => {
                                if (!selectedCust || !items[0]?.name) return;
                                const preDoc: Doc = {
                                    id: 'preview',
                                    team_id: 'team-001',
                                    customer_id: selectedCust,
                                    deal_id: null,
                                    type: createType,
                                    document_number: getNextNumber(createType),
                                    items: items.filter((i) => i.name),
                                    subtotal,
                                    discount_type: discountType,
                                    discount_value: discountValue,
                                    total,
                                    terms,
                                    valid_until: createType === 'quotation' ? new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0] : null,
                                    due_date: createType === 'invoice' && dueDate ? dueDate : null,
                                    payment_method: createType === 'invoice' ? paymentMethod : null,
                                    status: 'draft',
                                    created_by: 'user-001',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                };
                                setPreviewDoc(preDoc);
                            }} disabled={!selectedCust || !items[0]?.name} className="gap-1">
                                <Eye className="w-4 h-4" /> ดูตัวอย่าง
                            </Button>
                            <Button onClick={handleCreate} disabled={!selectedCust || !items[0]?.name} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-1" /> สร้างเอกสาร
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
