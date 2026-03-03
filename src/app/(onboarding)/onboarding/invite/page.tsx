'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Plus, X, Users, ArrowLeft, CheckCircle2, Rocket } from 'lucide-react';

const STEPS = [
    { num: 1, label: 'Organization' },
    { num: 2, label: 'Financials' },
    { num: 3, label: 'Invite Team' },
];

const ROLES = ['Admin', 'Member', 'Viewer'] as const;
type Role = typeof ROLES[number];

interface Invite {
    id: string;
    email: string;
    role: Role;
}

const ROLE_META: Record<Role, { color: string; desc: string }> = {
    Admin: { color: 'bg-purple-100 text-purple-700', desc: 'Full access' },
    Member: { color: 'bg-blue-100 text-blue-700', desc: 'Can edit leads & deals' },
    Viewer: { color: 'bg-gray-100 text-gray-600', desc: 'Read only' },
};

export default function InvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('Member');
    const [invites, setInvites] = useState<Invite[]>([]);

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isDuplicate = invites.some((i) => i.email.toLowerCase() === email.toLowerCase().trim());

    const addInvite = () => {
        if (!isEmailValid || isDuplicate) return;
        setInvites((prev) => [...prev, { id: Date.now().toString(), email: email.trim().toLowerCase(), role }]);
        setEmail('');
    };

    const removeInvite = (id: string) => setInvites((prev) => prev.filter((i) => i.id !== id));

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addInvite();
        }
    };

    const handleComplete = () => {
        setLoading(true);
        setTimeout(() => {
            router.push('/');
        }, 1200);
    };

    const handleSkip = () => router.push('/');

    return (
        <div className="w-full max-w-xl">
            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8 w-full max-w-xs mx-auto">
                {STEPS.map((step, i) => (
                    <div key={step.num} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all
                                ${step.num < 3
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : step.num === 3
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100'
                                        : 'bg-gray-100 text-gray-400'
                                }`}>
                                {step.num < 3 ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                            </div>
                            <span className={`text-[10px] font-bold mt-1.5 tracking-wide ${step.num <= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full ${step.num < 3 ? 'bg-blue-300' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            <Card className="shadow-2xl shadow-blue-100/40 border-gray-100 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-1">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Invite your team</h1>
                        <p className="text-sm text-gray-500 font-medium">Add teammates to collaborate. You can always invite more people later.</p>
                    </div>

                    {/* Invite input row */}
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="colleague@company.com"
                                    className="rounded-xl h-12 pl-10 text-sm font-medium"
                                />
                            </div>

                            {/* Role selector */}
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="h-12 px-3 rounded-xl border border-input bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>

                            <Button
                                type="button"
                                onClick={addInvite}
                                disabled={!isEmailValid || isDuplicate}
                                className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 disabled:opacity-40 disabled:shadow-none"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Duplicate warning */}
                        {isDuplicate && (
                            <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5 ml-1">
                                ⚠ This email has already been added
                            </p>
                        )}
                    </div>

                    {/* Role legend */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {ROLES.map((r) => (
                            <div key={r} className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${ROLE_META[r].color}`}>{r}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{ROLE_META[r].desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* Invite list */}
                    {invites.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Invites ({invites.length})</p>
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {invites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-white">
                                                    {invite.email[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{invite.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${ROLE_META[invite.role].color}`}>
                                                {invite.role}
                                            </span>
                                            <button
                                                onClick={() => removeInvite(invite.id)}
                                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {invites.length === 0 && (
                        <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-400">No invites yet</p>
                            <p className="text-[11px] text-gray-300 font-medium mt-0.5">Add a teammate email above</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/onboarding/financials')}
                            className="h-12 px-6 rounded-2xl font-bold text-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleSkip}
                            className="h-12 px-5 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            Skip for now
                        </Button>
                        <Button
                            type="button"
                            onClick={handleComplete}
                            disabled={loading}
                            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-200 transition-all"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Rocket className="w-4 h-4 mr-1.5" />
                                    Launch LeadSpark
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
