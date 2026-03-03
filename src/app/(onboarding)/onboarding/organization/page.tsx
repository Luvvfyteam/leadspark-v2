'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, FileText, MapPin, Phone, Mail, ImagePlus, ArrowRight, CheckCircle2 } from 'lucide-react';

const STEPS = [
    { num: 1, label: 'Organization' },
    { num: 2, label: 'Financials' },
    { num: 3, label: 'Invite Team' },
];

export default function OrganizationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        companyName: '',
        taxId: '',
        address: '',
        phone: '',
        contactEmail: '',
    });

    const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

    const isValid = form.companyName.trim() && form.taxId.trim() && form.address.trim() && form.contactEmail.trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            router.push('/onboarding/financials');
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
                                ${step.num === 1
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {step.num === 1 ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                            </div>
                            <span className={`text-[10px] font-bold mt-1.5 tracking-wide ${step.num === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full ${step.num < 1 ? 'bg-blue-200' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            <Card className="shadow-2xl shadow-blue-100/40 border-gray-100 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-1">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Set up your organization</h1>
                        <p className="text-sm text-gray-500 font-medium">Tell us about your company. You can update these details later.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Logo upload */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">
                                    <ImagePlus className="w-6 h-6 text-gray-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700">Upload logo</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">PNG, JPG up to 2MB · Recommended 200×200px</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Company Name */}
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Name <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        value={form.companyName}
                                        onChange={(e) => update('companyName', e.target.value)}
                                        placeholder="e.g. Acme Corporation Co., Ltd."
                                        className="rounded-xl h-12 pl-10 text-sm font-medium"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Tax ID */}
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax ID / Registration Number <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        value={form.taxId}
                                        onChange={(e) => update('taxId', e.target.value)}
                                        placeholder="e.g. 0105554123456"
                                        className="rounded-xl h-12 pl-10 text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => update('phone', e.target.value)}
                                        placeholder="02-xxx-xxxx"
                                        className="rounded-xl h-12 pl-10 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Contact Email */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Email <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        type="email"
                                        value={form.contactEmail}
                                        onChange={(e) => update('contactEmail', e.target.value)}
                                        placeholder="contact@company.com"
                                        className="rounded-xl h-12 pl-10 text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                                    <textarea
                                        value={form.address}
                                        onChange={(e) => update('address', e.target.value)}
                                        placeholder="123 Sukhumvit Rd, Khlong Toei, Bangkok 10110"
                                        rows={3}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={!isValid || loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-200 transition-all disabled:opacity-40 disabled:shadow-none"
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
