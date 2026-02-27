'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
    'board': 'Pipeline',
    'customers': 'ลูกค้า',
    'tasks': 'งาน',
    'search': 'ค้นหาลีด',
    'documents': 'เอกสาร',
    'payments': 'การเงิน',
    'spark': 'Spark AI',
    'reports': 'รายงาน',
    'settings': 'ตั้งค่า',
    'marketplace': 'ตลาด B2B',
    'deal-feed': 'Deal Feed',
    'rfq': 'RFQ',
    'proposals': 'ข้อเสนอ',
    'business-profile': 'โปรไฟล์ธุรกิจ',
};

export function Breadcrumbs({ items: manualItems }: { items?: BreadcrumbItem[] }) {
    const pathname = usePathname();
    
    const items = useMemo(() => {
        if (manualItems) return manualItems;
        
        const segments = pathname.split('/').filter(Boolean);
        return segments.map((segment, idx) => {
            const href = '/' + segments.slice(0, idx + 1).join('/');
            const label = ROUTE_LABELS[segment] || segment;
            
            // If it's the last segment and it's a UUID/ID (doesn't have a label), 
            // we usually want to skip it or handle it manually via props.
            // But for auto-gen, we just use the segment name or label.
            return {
                label,
                href: idx === segments.length - 1 ? undefined : href
            };
        });
    }, [pathname, manualItems]);

    return (
        <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-gray-500 mb-6 bg-gray-50/50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <Home className="w-3.5 h-3.5" />
                <span>หน้าหลัก</span>
            </Link>
            {items.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-blue-600 transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 font-bold">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
