'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    dotColor: string;
    label: string;
    className?: string;
}

export function StatusBadge({ dotColor, label, className }: StatusBadgeProps) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
            <span className={cn('w-2 h-2 rounded-full inline-block', dotColor)} />
            {label}
        </span>
    );
}
