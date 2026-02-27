'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, TrendingUp, BarChart3, Clock, Sparkles } from 'lucide-react';

const observations = [
    {
        icon: TrendingUp,
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        text: 'ลีดกลุ่มร้านอาหารปิดได้ 40%',
        detail: 'อัตราปิดสูงสุดในทุกกลุ่มอุตสาหกรรม',
    },
    {
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        text: '3 ลูกค้าไม่ได้ติดต่อเกิน 14 วัน',
        detail: 'คาเฟ่ลุมพินี, โยคะสตูดิโอ OM, ร้านกระเป๋า Bagster',
    },
    {
        icon: Lightbulb,
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        text: 'ค้างรับ ฿94K มี 2 รายเลยกำหนด',
        detail: 'Brew House ฿55,000, สำนักงานบัญชี AAA ฿39,000',
    },
    {
        icon: Clock,
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        text: 'ลีดที่ติดต่อภายใน 48 ชม. ปิดได้สูงกว่า 60%',
        detail: 'มี 5 ลีดใหม่ที่ยังไม่ได้ติดต่อ',
    },
    {
        icon: BarChart3,
        bg: 'bg-indigo-50',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        text: 'เดือนนี้: ปิดดีล 4 รายการ ดีขึ้น 33% จากเดือนก่อน',
        detail: 'รายได้รวม ฿153,000 จากเป้า ฿500,000',
    },
];

export function AIObservations() {
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
                <div className="space-y-3">
                    {observations.map((obs, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-3 p-4 rounded-xl ${obs.bg} hover:shadow-sm transition-shadow duration-200 cursor-default`}
                        >
                            <div className={`p-2 rounded-lg ${obs.iconBg} shrink-0`}>
                                <obs.icon className={`w-4 h-4 ${obs.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{obs.text}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{obs.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
