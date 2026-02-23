'use client';

import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
    name: string;
    className?: string;
}

export function UserAvatar({ name, className }: UserAvatarProps) {
    return (
        <div
            className={cn(
                'rounded-full w-7 h-7 bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center',
                className
            )}
        >
            {getInitials(name)}
        </div>
    );
}
