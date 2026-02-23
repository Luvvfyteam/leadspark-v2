'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>หน้าหลัก</span>
            </Link>
            {items.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-blue-600">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 font-medium">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
