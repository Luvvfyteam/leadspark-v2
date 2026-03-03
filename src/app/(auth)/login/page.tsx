'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate login
        setTimeout(() => {
            router.push('/');
        }, 1200);
    };

    const isValid = email.trim() && password.length >= 1;

    return (
        <div className="w-full max-w-md">
            <Card className="shadow-2xl shadow-blue-100/50 border-gray-100 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
                        <p className="text-sm text-gray-500 font-medium">Sign in to your LeadSpark workspace</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        className="rounded-xl h-12 pl-10 text-sm font-medium"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                                    <Link href="#" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="rounded-xl h-12 pl-10 pr-11 text-sm font-medium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Remember me */}
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <span className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Remember me</span>
                        </label>

                        <Button
                            type="submit"
                            disabled={!isValid || loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-200 transition-all disabled:opacity-40 disabled:shadow-none"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Social buttons */}
                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-sm text-gray-600 border-gray-200 hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Continue with Google
                    </Button>

                    {/* Link to register */}
                    <p className="text-center text-sm text-gray-500 font-medium">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                            Create one free
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
