'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';

interface Toast {
    id: string;
    message: string;
    undoAction?: () => void;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, undoAction?: () => void, duration?: number) => void;
    showConfirm: (message: string, onConfirm: () => void) => void;
    removeToast: (id: string) => void;
    confirmDialog: { message: string; onConfirm: () => void } | null;
    closeConfirm: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, undoAction?: () => void, duration = 10000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, undoAction, duration }]);
    }, []);

    const showConfirm = useCallback((message: string, onConfirm: () => void) => {
        setConfirmDialog({ message, onConfirm });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmDialog(null);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, showConfirm, removeToast, confirmDialog, closeConfirm }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
            {/* Confirm Dialog */}
            {confirmDialog && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
                        <p className="text-gray-900 text-sm mb-4">{confirmDialog.message}</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeConfirm}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }}
                                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), toast.duration || 10000);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-left-5 min-w-[280px]">
            <span className="text-sm flex-1">{toast.message}</span>
            {toast.undoAction && (
                <button
                    onClick={() => { toast.undoAction!(); onRemove(toast.id); }}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium whitespace-nowrap"
                >
                    ย้อนกลับ
                </button>
            )}
            <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-white">
                ✕
            </button>
        </div>
    );
}
