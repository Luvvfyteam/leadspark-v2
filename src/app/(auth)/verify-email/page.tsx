'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
    const [resendCountdown, setResendCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendCountdown]);

    const handleResend = () => {
        setResent(true);
        setCanResend(false);
        setResendCountdown(60);
        setTimeout(() => setResent(false), 3000);
    };

    return (
        <div className="w-full max-w-md">
            <Card className="shadow-2xl shadow-blue-100/50 border-gray-100 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border-2 border-blue-100 relative">
                            <Mail className="w-8 h-8 text-blue-600" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-black text-gray-900">Check your inbox</h1>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            We&apos;ve sent a verification link to
                        </p>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 inline-block px-4 py-1.5 rounded-full border border-blue-100">
                            you@company.com
                        </p>
                    </div>

                    {/* Status */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Waiting for verification</p>
                            <p className="text-xs text-amber-600 leading-relaxed">
                                Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleResend}
                            disabled={!canResend}
                            variant="outline"
                            className="w-full h-12 rounded-xl font-bold text-sm border-gray-200"
                        >
                            {resent ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Email sent!
                                </>
                            ) : canResend ? (
                                'Resend verification email'
                            ) : (
                                `Resend in ${resendCountdown}s`
                            )}
                        </Button>

                        <Link href="/onboarding/organization" className="block">
                            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-200">
                                I&apos;ve verified — Continue setup
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {/* Back to login */}
                    <p className="text-center text-sm text-gray-500 font-medium">
                        Wrong email?{' '}
                        <Link href="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                            Go back
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
