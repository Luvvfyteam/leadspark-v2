'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, TrendingUp, BarChart3, Clock, Sparkles, ArrowRight } from 'lucide-react';

const observations = [
    {
        icon: TrendingUp,
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        text: 'ลีดกลุ่มร้านอาหารปิดได้ 40%',
        detail: 'อัตราปิดสูงสุดในทุกกลุ่มอุตสาหกรรม',
        action: { label: 'ดู pipeline →', href: '/board' },
        badge: { text: 'ร้านอาหาร × 40%', color: 'bg-green-100 text-green-700' },
    },
    {
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        text: '3 ลูกค้าไม่ได้ติดต่อเกิน 14 วัน',
        detail: 'คาเฟ่ลุมพินี, โยคะสตูดิโอ OM, ร้านกระเป๋า Bagster',
        action: { label: 'ดูลูกค้า →', href: '/customers' },
        badge: { text: '⚠️ 3 ราย', color: 'bg-amber-100 text-amber-700' },
    },
    {
        icon: Lightbulb,
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        text: 'ค้างรับ ฿94K มี 2 รายเลยกำหนด',
        detail: 'Brew House ฿55,000 · สำนักงานบัญชี AAA ฿39,000',
        action: { label: 'ดูรายรับ →', href: '/payments' },
        badge: { text: '฿94,000', color: 'bg-blue-100 text-blue-700' },
    },
    {
        icon: Clock,
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        text: 'ลีดที่ติดต่อ 48 ชม. ปิดได้สูงกว่า 60%',
        detail: 'มี 5 ลีดใหม่ที่ยังไม่ได้ติดต่อ',
        action: { label: 'ดูลีด →', href: '/board' },
        badge: { text: '5 ลีดรอ', color: 'bg-purple-100 text-purple-700' },
    },
    {
        icon: BarChart3,
        bg: 'bg-indigo-50',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        text: 'เดือนนี้: ปิด 4 ดีล ดีขึ้น 33%',
        detail: 'รายได้รวม ฿153,000 จากเป้า ฿500,000',
        action: { label: 'ดูรายงาน →', href: '/reports' },
        badge: { text: '30.6% ของเป้า', color: 'bg-indigo-100 text-indigo-700' },
    },
];

export function AIObservations() {
    const router = useRouter();
    return (
        <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Spark AI</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                        สังเกตการณ์
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2.5">
                    {observations.map((obs, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-3 p-3.5 rounded-xl ${obs.bg} hover:shadow-sm transition-shadow duration-200`}
                        >
                            <div className={`p-2 rounded-lg ${obs.iconBg} shrink-0`}>
                                <obs.icon className={`w-4 h-4 ${obs.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-gray-900 leading-snug">{obs.text}</p>
                                    {/* Inline context badge */}
                                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${obs.badge.color}`}>
                                        {obs.badge.text}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-500 flex-1 truncate">{obs.detail}</p>
                                    {/* Action link */}
                                    <button
                                        onClick={() => router.push(obs.action.href)}
                                        className="shrink-0 ml-2 text-[11px] text-gray-400 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
                                    >
                                        {obs.action.label}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
