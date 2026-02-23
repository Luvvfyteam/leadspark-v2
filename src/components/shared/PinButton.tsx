'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinButtonProps {
    isPinned: boolean;
    onClick: () => void;
    className?: string;
}

export function PinButton({ isPinned, onClick, className }: PinButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                'transition-colors hover:scale-110',
                isPinned ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300',
                className
            )}
        >
            <Star className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
        </button>
    );
}
