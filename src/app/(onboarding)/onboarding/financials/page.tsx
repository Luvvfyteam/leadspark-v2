'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Landmark, CreditCard, User, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

const STEPS = [
    { num: 1, label: 'Organization' },
    { num: 2, label: 'Financials' },
    { num: 3, label: 'Invite Team' },
];

const THAI_BANKS = [
    'Bangkok Bank (BBL)',
    'Kasikorn Bank (KBANK)',
    'SCB – Siam Commercial Bank',
    'Krungthai Bank (KTB)',
    'Bank of Ayudhya (BAY)',
    'TMBThanachart Bank (TTB)',
    'UOB Thailand',
    'CIMB Thai',
    'Other',
];

export default function FinancialsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
    });

    const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

    const isValid = form.bankName && form.accountNumber.trim() && form.accountHolder.trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            router.push('/onboarding/invite');
        }, 900);
    };

    return (
        <div className="w-full max-w-xl">
            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8 w-full max-w-xs mx-auto">
                {STEPS.map((step, i) => (
                    <div key={step.num} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all
                                ${step.num < 2
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : step.num === 2
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100'
                                        : 'bg-gray-100 text-gray-400'
                                }`}>
                                {step.num < 2 ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                            </div>
                            <span className={`text-[10px] font-bold mt-1.5 tracking-wide ${step.num <= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full ${step.num < 2 ? 'bg-blue-300' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            <Card className="shadow-2xl shadow-blue-100/40 border-gray-100 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-1">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <Landmark className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Payment details</h1>
                        <p className="text-sm text-gray-500 font-medium">Add your bank account for receiving payments from customers.</p>
                    </div>

                    {/* Security notice */}
                    <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-100 rounded-2xl px-4 py-3">
                        <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                            Your banking information is encrypted and stored securely. It is only used to process payments on your behalf.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Bank Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Name <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                <select
                                    value={form.bankName}
                                    onChange={(e) => update('bankName', e.target.value)}
                                    className="w-full pl-10 pr-4 h-12 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Select your bank...</option>
                                    {THAI_BANKS.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Number <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <Input
                                    value={form.accountNumber}
                                    onChange={(e) => update('accountNumber', e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 012-3-45678-9"
                                    className="rounded-xl h-12 pl-10 text-sm font-medium tracking-widest"
                                    required
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        {/* Account Holder */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Holder Name <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <Input
                                    value={form.accountHolder}
                                    onChange={(e) => update('accountHolder', e.target.value)}
                                    placeholder="As shown on your bank account"
                                    className="rounded-xl h-12 pl-10 text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/onboarding/organization')}
                                className="h-12 px-6 rounded-2xl font-bold text-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isValid || loading}
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-200 transition-all disabled:opacity-40 disabled:shadow-none"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
