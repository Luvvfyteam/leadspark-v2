'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useLanguage } from '@/contexts/LanguageContext';
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
    CreditCard, Info, Upload, Paperclip, Clock, AlertTriangle, Link, Mail, CheckCircle2
} from 'lucide-react';

type TabType = 'quotation' | 'invoice';

function formatCurrency(n: number) {
    return '฿' + n.toLocaleString('th-TH');
}

function DocumentsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { documents, customers, services, addDocument, updateDocument } = useAppStore();
    const { canExport } = usePermissions();
    const { showToast } = useToast();
    const { t } = useLanguage();

    const [tab, setTab] = useState<TabType>('quotation');
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);

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

    // Attachment state (UI-only)
    const [attachments, setAttachments] = useState<{ name: string; size: number; type: string }[]>([]);

    // Upload external modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCustId, setUploadCustId] = useState('');
    const [uploadCustSearch, setUploadCustSearch] = useState('');
    const [uploadType, setUploadType] = useState<DocumentType>('quotation');
    const [uploadAmount, setUploadAmount] = useState('');
    const [uploadLabel, setUploadLabel] = useState('');
    const [uploadDrag, setUploadDrag] = useState(false);

    // Enhanced send modal
    const [sendDocId, setSendDocId] = useState<string | null>(null);
    const [sendEmail, setSendEmail] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);

    // Service preset search
    const [serviceSearch, setServiceSearch] = useState('');

    useEffect(() => {
        const prefillCustId = searchParams.get('customer_id');
        const prefillType = searchParams.get('type') as DocumentType;
        if (prefillCustId) {
            setSelectedCustId(prefillCustId);
            if (prefillType) setCreateType(prefillType);
            setShowWizard(true);
            setWizardStep(2);
        }
    }, [searchParams]);

    const filtered = useMemo(() =>
        documents.filter((d) => d.type === tab).sort((a, b) => b.created_at.localeCompare(a.created_at))
        , [documents, tab]);

    const quotations = documents.filter((d) => d.type === 'quotation');
    const invoices = documents.filter((d) => d.type === 'invoice');

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = discountType === 'percentage' ? subtotal * (discountValue / 100) : discountValue;
    const total = subtotal - discount;

    const TODAY = new Date().toISOString().split('T')[0];

    // Expiry helpers
    const getExpiryDiff = (valid_until: string | null): number | null => {
        if (!valid_until) return null;
        const a = new Date(TODAY).getTime();
        const b = new Date(valid_until).getTime();
        return Math.round((b - a) / 86400000);
    };

    const ExpiryBadge = ({ valid_until }: { valid_until: string | null }) => {
        const diff = getExpiryDiff(valid_until);
        if (diff === null || valid_until === null) return null;
        if (diff < 0) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" />{t('docs.expiry.expired')}</span>;
        if (diff <= 3) return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse"><Clock className="w-3 h-3" />{t('docs.expiry.daysLeft')} {diff} {t('docs.expiry.days')}</span>;
        return <span className="text-[10px] text-gray-400">{new Date(valid_until as string).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>;
    };

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
        setTerms(t('docs.wizard.terms') || 'ชำระเงินภายใน 30 วัน');
        setDueDate('');
        setAttachments([]);
        setServiceSearch('');
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
        setWizardStep(4);
        setShowWizard(true);
    };

    const handleSend = (id: string) => {
        setSendDocId(id);
        setSendEmail('');
        setLinkCopied(false);
    };

    const handleConfirmSend = () => {
        if (!sendDocId) return;
        updateDocument(sendDocId, { status: 'sent' });
        showToast(t('docs.send.sentToast'));
        setSendDocId(null);
    };

    const handleUploadExternal = () => {
        if (!uploadFile || !uploadCustId || !uploadLabel) return;
        const doc: Doc = {
            id: `doc-${Date.now()}`,
            team_id: 'team-001',
            customer_id: uploadCustId,
            deal_id: null,
            type: uploadType,
            document_number: getNextNumber(uploadType),
            items: [{ name: uploadLabel, description: 'นำเข้าจากไฟล์ภายนอก', quantity: 1, unit_price: Number(uploadAmount) || 0, total: Number(uploadAmount) || 0 }],
            subtotal: Number(uploadAmount) || 0,
            discount_type: 'fixed',
            discount_value: 0,
            total: Number(uploadAmount) || 0,
            terms: 'ชำระเงินภายใน 30 วัน',
            valid_until: uploadType === 'quotation' ? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] : null,
            due_date: null,
            payment_method: null,
            status: 'draft',
            created_by: 'user-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        addDocument(doc);
        showToast(`${t('docs.upload.toast')} ${doc.document_number}`);
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadCustId('');
        setUploadAmount('');
        setUploadLabel('');
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">{t('docs.title')}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{t('docs.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canExport && (
                        <Button variant="outline" size="sm" onClick={() => showToast('Exporting...')} className="rounded-xl">
                            <Download className="w-4 h-4 mr-2" /> {t('docs.btn.export')}
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)} className="rounded-xl gap-1.5">
                        <Upload className="w-4 h-4" /> {t('docs.btn.upload')}
                    </Button>
                    <Button onClick={() => { resetWizard(); setShowWizard(true); }} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> {t('docs.btn.create')}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button onClick={() => setTab('quotation')} className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'quotation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <FileText className="w-4 h-4" /> {t('docs.tab.quotation')} ({quotations.length})
                </button>
                <button onClick={() => setTab('invoice')} className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'invoice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Receipt className="w-4 h-4" /> {t('docs.tab.invoice')} ({invoices.length})
                </button>
            </div>

            <Card className="shadow-sm overflow-hidden border-gray-100 rounded-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('docs.table.number')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('docs.table.customer')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('docs.table.date')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('docs.table.amount')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{t('docs.table.status')}</th>
                                {tab === 'quotation' && <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{t('docs.table.expiry')}</th>}
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('docs.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">{t('docs.table.empty')}</td></tr>
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
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge className={`text-[10px] px-2 py-0.5 ${statusCfg.color}`}>{statusCfg.label}</Badge>
                                                    {tab === 'quotation' && <ExpiryBadge valid_until={doc.valid_until} />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setPreviewDoc(doc)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title={t('docs.action.preview')}><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDuplicate(doc)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title={t('docs.action.duplicate')}><Copy className="w-4 h-4" /></button>
                                                    {doc.type === 'quotation' && (doc.status === 'accepted' || doc.status === 'sent') && (
                                                        <button onClick={() => handleConvert(doc)} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded" title={t('docs.action.convert')}><RefreshCcw className="w-4 h-4" /></button>
                                                    )}
                                                    {doc.status === 'draft' && (
                                                        <button onClick={() => handleSend(doc.id)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded" title={t('docs.action.send')}><Send className="w-4 h-4" /></button>
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

            <SlideOverPanel
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                title={wizardStep === 1 ? t('docs.wizard.typeStep') : `${t(createType === 'quotation' ? 'docs.wizard.quotationType' : 'docs.wizard.invoiceType')} - ${getNextNumber(createType)}`}
                width="xl"
                footer={
                    <div className="flex justify-between w-full">
                        <Button variant="ghost" onClick={() => setWizardStep(prev => Math.max(1, prev - 1))} disabled={wizardStep === 1} className="gap-2">
                            <ChevronLeft className="w-4 h-4" /> {t('docs.wizard.btnBack')}
                        </Button>
                        {wizardStep < 5 ? (
                            <Button onClick={() => setWizardStep(prev => prev + 1)} disabled={(wizardStep === 2 && !selectedCustId) || (wizardStep === 3 && items[0].name === '')} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                {t('docs.wizard.btnNext')} <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleCreate('draft')}>{t('docs.wizard.btnDraft')}</Button>
                                <Button onClick={() => handleCreate('sent')} className="bg-blue-600 hover:bg-blue-700">{t('docs.wizard.btnSend')}</Button>
                            </div>
                        )}
                    </div>
                }
            >
                <StepIndicator />

                {wizardStep === 1 && (
                    <div className="grid grid-cols-2 gap-6 pt-10">
                        <button onClick={() => { setCreateType('quotation'); setWizardStep(2); }} className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all ${createType === 'quotation' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${createType === 'quotation' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}><FileText className="w-8 h-8" /></div>
                            <div className="text-center"><p className="font-bold text-gray-900">{t('docs.wizard.quotationType')}</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('docs.wizard.quotationDesc')}</p></div>
                        </button>
                        <button onClick={() => { setCreateType('invoice'); setWizardStep(2); }} className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all ${createType === 'invoice' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${createType === 'invoice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}><Receipt className="w-8 h-8" /></div>
                            <div className="text-center"><p className="font-bold text-gray-900">{t('docs.wizard.invoiceType')}</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('docs.wizard.invoiceDesc')}</p></div>
                        </button>
                    </div>
                )}

                {wizardStep === 2 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                            <div><p className="text-sm font-semibold text-blue-900">{t('docs.wizard.customerSearch')}</p><p className="text-xs text-blue-700 mt-0.5">{t('docs.wizard.customerHint')}</p></div>
                        </div>
                        {selectedCustId ? (
                            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{customers.find(c => c.id === selectedCustId)?.business_name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-gray-900">{customers.find(c => c.id === selectedCustId)?.business_name}</p>
                                        <p className="text-xs text-gray-500">{customers.find(c => c.id === selectedCustId)?.industry}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustId('')} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="พิมพ์ชื่อลูกค้า..." className="pl-12 h-12 text-base rounded-xl" autoFocus />
                                {custSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10">
                                        {customers.filter(c => c.business_name.toLowerCase().includes(custSearch.toLowerCase())).slice(0, 5).map(c => (
                                            <button key={c.id} onClick={() => { setSelectedCustId(c.id); setCustSearch(''); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">{c.business_name.charAt(0)}</div>
                                                <div className="text-left"><p className="text-sm font-semibold text-gray-900">{c.business_name}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.industry}</p></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {!selectedCustId && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('docs.wizard.recentCustomers')}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {customers.slice(0, 4).map(c => (
                                        <button key={c.id} onClick={() => setSelectedCustId(c.id)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 transition-all text-left">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">{c.business_name.charAt(0)}</div>
                                            <p className="text-sm font-medium text-gray-700 truncate">{c.business_name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {wizardStep === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900">{t('docs.wizard.itemsTitle')}</h4>
                            <button onClick={() => setItems(prev => [...prev, { name: '', description: '', quantity: 1, unit_price: 0, total: 0 }])} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                                <Plus className="w-3.5 h-3.5" /> {t('docs.wizard.addItem')}
                            </button>
                        </div>

                        {/* Preset service picker */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('docs.wizard.presetLabel')}</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)}
                                    placeholder={t('docs.wizard.presetSearch')}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {services.filter(s => s.is_active && (serviceSearch === '' || s.name.toLowerCase().includes(serviceSearch.toLowerCase()))).slice(0, 8).map(s => (
                                    <button key={s.id} onClick={() => {
                                        const newItem = { name: s.name, description: s.description, quantity: 1, unit_price: s.price, total: s.price };
                                        if (items.length === 1 && items[0].name === '') { setItems([newItem]); } else { setItems(prev => [...prev, newItem]); }
                                    }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center gap-1.5 font-medium">
                                        <Plus className="w-3 h-3" /> {s.name} <span className="text-gray-400 font-normal">฿{s.price.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item rows */}
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="group relative bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <button onClick={() => items.length > 1 && setItems(prev => prev.filter((_, i) => i !== idx))} className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-12 sm:col-span-7">
                                            <input value={item.name} onChange={(e) => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} placeholder={t('docs.wizard.itemName')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none" />
                                            <input value={item.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} placeholder={t('docs.wizard.itemDesc')} className="mt-2 w-full border border-gray-100 rounded-lg px-3 py-1.5 text-xs bg-white/50 focus:ring-1 focus:ring-blue-200 outline-none" />
                                        </div>
                                        <div className="col-span-4 sm:col-span-2">
                                            <p className="text-[10px] text-gray-400 uppercase mb-1">{t('docs.wizard.qty')}</p>
                                            <input type="number" value={item.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); n[idx].total = n[idx].quantity * n[idx].unit_price; setItems(n); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center bg-white focus:ring-2 focus:ring-blue-200 outline-none" />
                                        </div>
                                        <div className="col-span-8 sm:col-span-3">
                                            <p className="text-[10px] text-gray-400 uppercase mb-1 text-right">{t('docs.wizard.unitPrice')}</p>
                                            <input type="number" value={item.unit_price} onChange={(e) => { const n = [...items]; n[idx].unit_price = Number(e.target.value); n[idx].total = n[idx].quantity * n[idx].unit_price; setItems(n); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-right bg-white font-semibold focus:ring-2 focus:ring-blue-200 outline-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* File attachment */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {t('docs.wizard.attachLabel')}</p>
                            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        const filtered = files.filter(f => f.size <= 10 * 1024 * 1024);
                                        setAttachments(prev => [...prev, ...filtered.map(f => ({ name: f.name, size: f.size, type: f.type }))]);
                                    }}
                                />
                                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-400">{t('docs.wizard.attachHint')} <span className="text-blue-600 font-semibold">{t('docs.wizard.attachBrowse')}</span></p>
                                <p className="text-[10px] text-gray-300 mt-1">{t('docs.wizard.attachFormat')}</p>
                            </label>
                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    {attachments.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="text-xs font-medium text-gray-700">{f.name}</span>
                                                <span className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                                            </div>
                                            <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {wizardStep === 4 && (
                    <div className="space-y-8">
                        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                                <span className="text-gray-400">{t('docs.preview.subtotal')} ({items.length} รายการ)</span>
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">{t('docs.preview.discount')}</span>
                                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className="bg-white/10 border-none rounded text-xs px-2 py-1 outline-none">
                                        <option value="fixed" className="text-black">฿</option>
                                        <option value="percentage" className="text-black">%</option>
                                    </select>
                                    <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-16 bg-transparent border-b border-white/20 text-right focus:border-blue-400 outline-none text-sm font-bold" />
                                </div>
                                <span className="text-red-400 font-medium">-{formatCurrency(discount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium">{t('docs.wizard.total')}</span>
                                <span className="text-3xl font-bold text-blue-400">{formatCurrency(total)}</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {createType === 'quotation' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t('docs.wizard.validDays')}</label>
                                        <Input type="number" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} className="h-11 rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t('docs.wizard.dueDate')}</label>
                                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 rounded-xl" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> {t('docs.wizard.paymentMethod')}</label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                                        <option value="โอนเงินผ่านธนาคาร">โอนเงินผ่านธนาคาร</option>
                                        <option value="PromptPay">PromptPay</option>
                                        <option value="เงินสด">เงินสด</option>
                                        <option value="เช็คสั่งจ่าย">เช็คสั่งจ่าย</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {t('docs.wizard.terms')}</label>
                                <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('docs.wizard.termsPlaceholder')} />
                            </div>
                        </div>
                    </div>
                )}

                {wizardStep === 5 && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-700">
                            <Eye className="w-5 h-5 shrink-0" />
                            <p className="text-xs leading-relaxed">{t('docs.wizard.reviewNote')}</p>
                        </div>
                        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /><span className="text-sm font-bold text-gray-900">{getNextNumber(createType)}</span></div>
                                <Badge variant="outline" className="text-[10px] uppercase">{createType}</Badge>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('docs.table.customer')}</p><p className="text-sm font-bold">{customers.find(c => c.id === selectedCustId)?.business_name}</p></div>
                                    <div className="text-right"><p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{t('docs.wizard.total')}</p><p className="text-lg font-bold text-blue-600">{formatCurrency(total)}</p></div>
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

            {previewDoc && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-6 overflow-y-auto" onClick={() => setPreviewDoc(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 mb-10">
                        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 rounded-t-xl">
                            <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1"><Printer className="w-3.5 h-3.5" /> {t('docs.preview.print')}</Button>
                            <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-gray-200 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-10 space-y-8">
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
                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('docs.preview.customer')}</p>
                                    <p className="font-bold text-gray-900 text-base">{customers.find(c => c.id === previewDoc.customer_id)?.business_name}</p>
                                    <p className="text-gray-500 mt-1">{customers.find(c => c.id === previewDoc.customer_id)?.address || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('docs.preview.issueDate')}</p>
                                    <p className="text-gray-900 font-medium">{new Date(previewDoc.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">{previewDoc.type === 'quotation' ? t('docs.preview.validUntil') : t('docs.preview.dueDate')}</p>
                                    <p className="text-blue-600 font-bold">{new Date(previewDoc.valid_until || previewDoc.due_date || '').toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y border-gray-200 bg-gray-50/50">
                                        <th className="py-3 text-left font-bold text-gray-700">{t('docs.preview.itemName')}</th>
                                        <th className="py-3 text-right font-bold text-gray-700 w-20">{t('docs.preview.qty')}</th>
                                        <th className="py-3 text-right font-bold text-gray-700 w-32">{t('docs.preview.unitPrice')}</th>
                                        <th className="py-3 text-right font-bold text-gray-700 w-32">{t('docs.preview.total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewDoc.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-4"><p className="font-bold text-gray-900">{item.name}</p><p className="text-xs text-gray-400 mt-0.5">{item.description}</p></td>
                                            <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                                            <td className="py-4 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                                            <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500"><span>ราคารวม</span><span>{formatCurrency(previewDoc.subtotal)}</span></div>
                                    {previewDoc.discount_value > 0 && (
                                        <div className="flex justify-between text-sm text-red-500">
                                            <span>ส่วนลด {previewDoc.discount_type === 'percentage' ? `(${previewDoc.discount_value}%)` : ''}</span>
                                            <span>-{formatCurrency(previewDoc.subtotal - previewDoc.total)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-black text-blue-600 pt-2 border-t border-blue-50"><span>รวมสุทธิ</span><span>{formatCurrency(previewDoc.total)}</span></div>
                                </div>
                            </div>
                            <div className="pt-10 grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">เงื่อนไขการชำระเงิน</p><p className="text-xs text-gray-600 leading-relaxed">{previewDoc.terms}</p></div>
                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">วิธีชำระเงิน</p><p className="text-xs text-gray-600">{previewDoc.payment_method || '-'}</p></div>
                                </div>
                                <div className="flex items-end justify-end pb-2">
                                    <div className="text-center"><div className="w-48 border-b border-gray-300 h-10"></div><p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">ผู้อนุมัติ</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload External Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUploadModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-blue-600" />
                                <h3 className="font-bold text-gray-900">อัปโหลดเอกสารจากภายนอก</h3>
                            </div>
                            <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* File Drop Zone */}
                            <label
                                onDragOver={(e) => { e.preventDefault(); setUploadDrag(true); }}
                                onDragLeave={() => setUploadDrag(false)}
                                onDrop={(e) => { e.preventDefault(); setUploadDrag(false); const f = e.dataTransfer.files[0]; if (f) { setUploadFile(f); setUploadLabel(f.name.replace(/\.[^.]+$/, '')); } }}
                                className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${uploadDrag ? 'border-blue-400 bg-blue-50' : uploadFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                            >
                                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setUploadLabel(f.name.replace(/\.[^.]+$/, '')); } }} />
                                {uploadFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-green-800">{uploadFile.name}</p>
                                            <p className="text-xs text-green-600">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-500">{t('docs.upload.dropHint')}</p>
                                        <p className="text-xs text-gray-400 mt-1">{t('docs.upload.browse')} — {t('docs.upload.format')}</p>
                                    </>
                                )}
                            </label>

                            {/* Customer & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('docs.upload.type')}</label>
                                    <select value={uploadType} onChange={(e) => setUploadType(e.target.value as DocumentType)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none">
                                        <option value="quotation">{t('docs.wizard.quotationType')}</option>
                                        <option value="invoice">{t('docs.wizard.invoiceType')}</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('docs.upload.amount')}</label>
                                    <input type="number" value={uploadAmount} onChange={(e) => setUploadAmount(e.target.value)} placeholder="0"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('docs.upload.name')}</label>
                                <input value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)} placeholder={t('docs.upload.namePlaceholder')}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
                            </div>

                            <div className="space-y-1.5 relative">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('docs.upload.customer')}</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={uploadCustId ? (customers.find(c => c.id === uploadCustId)?.business_name || '') : uploadCustSearch}
                                        onChange={(e) => { setUploadCustId(''); setUploadCustSearch(e.target.value); }}
                                        placeholder={t('docs.upload.custSearch')}
                                        className="w-full pl-9 pr-3 border border-gray-200 rounded-xl py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                                {uploadCustSearch && !uploadCustId && (
                                    <div className="absolute left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10 mt-1">
                                        {customers.filter(c => c.business_name.toLowerCase().includes(uploadCustSearch.toLowerCase())).slice(0, 4).map(c => (
                                            <button key={c.id} onClick={() => { setUploadCustId(c.id); setUploadCustSearch(''); }}
                                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 border-b last:border-0 font-medium">{c.business_name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowUploadModal(false)}>{t('docs.upload.cancel')}</Button>
                            <Button onClick={handleUploadExternal} disabled={!uploadFile || !uploadCustId || !uploadLabel} className="bg-blue-600 hover:bg-blue-700">
                                <Upload className="w-4 h-4 mr-1.5" /> {t('docs.upload.save')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Send Modal */}
            {sendDocId && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setSendDocId(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-blue-600" />
                                <h3 className="font-bold text-gray-900">{t('docs.send.title')}</h3>
                            </div>
                            <button onClick={() => setSendDocId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{t('docs.send.emailLabel')}</label>
                                <div className="flex gap-2">
                                    <input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder={t('docs.send.emailPlaceholder')}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                        type="email"
                                    />
                                    <Button onClick={handleConfirmSend} disabled={!sendEmail} className="bg-blue-600 hover:bg-blue-700 shrink-0">{t('docs.send.sendBtn')}</Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-xs text-gray-400 font-medium">{t('docs.send.or')}</span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            {/* Copy Link */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Link className="w-3.5 h-3.5" />{t('docs.send.copyLink')}</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-400 font-mono truncate">
                                        https://leadspark.app/doc/{sendDocId?.slice(-8)}
                                    </div>
                                    <button onClick={() => { navigator.clipboard.writeText(`https://leadspark.app/doc/${sendDocId?.slice(-8)}`); setLinkCopied(true); showToast(t('docs.send.linkCopied')); }}
                                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${linkCopied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600'}`}>
                                        {linkCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex justify-end">
                            <Button variant="outline" onClick={() => setSendDocId(null)}>{t('docs.send.close')}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DocumentsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <DocumentsPageInner />
        </Suspense>
    );
}
