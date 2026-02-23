'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, TrendingUp, BarChart3, Clock } from 'lucide-react';

const observations = [
    {
        icon: TrendingUp,
        bg: 'bg-green-50 border-green-100',
        iconColor: 'text-green-500',
        text: 'ลีดกลุ่มร้านอาหารปิดได้ 40%',
        detail: 'อัตราปิดสูงสุดในทุกกลุ่มอุตสาหกรรม',
    },
    {
        icon: AlertTriangle,
        bg: 'bg-amber-50 border-amber-100',
        iconColor: 'text-amber-500',
        text: '3 ลูกค้าไม่ได้ติดต่อเกิน 14 วัน',
        detail: 'คาเฟ่ลุมพินี, โยคะสตูดิโอ OM, ร้านกระเป๋า Bagster',
    },
    {
        icon: Lightbulb,
        bg: 'bg-blue-50 border-blue-100',
        iconColor: 'text-blue-500',
        text: 'ค้างรับ ฿94K มี 2 รายเลยกำหนด',
        detail: 'Brew House ฿55,000, สำนักงานบัญชี AAA ฿39,000',
    },
    {
        icon: Clock,
        bg: 'bg-purple-50 border-purple-100',
        iconColor: 'text-purple-500',
        text: 'ลีดที่ติดต่อภายใน 48 ชม. ปิดได้สูงกว่า 60%',
        detail: 'มี 5 ลีดใหม่ที่ยังไม่ได้ติดต่อ',
    },
    {
        icon: BarChart3,
        bg: 'bg-indigo-50 border-indigo-100',
        iconColor: 'text-indigo-500',
        text: 'เดือนนี้: ปิดดีล 4 รายการ ดีขึ้น 33% จากเดือนก่อน',
        detail: 'รายได้รวม ฿153,000 จากเป้า ฿500,000',
    },
];

export function AIObservations() {
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Spark AI สังเกตการณ์
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {observations.map((obs, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${obs.bg}`}
                        >
                            <obs.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${obs.iconColor}`} />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{obs.text}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{obs.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
