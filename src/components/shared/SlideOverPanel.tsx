'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideOverPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: 'md' | 'lg' | 'xl'
}

const widthClass = {
  md: 'md:w-[40vw] md:min-w-[480px]',
  lg: 'md:w-[50vw] md:min-w-[560px]',
  xl: 'md:w-[60vw] md:min-w-[640px]',
}

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 'md',
}: SlideOverPanelProps) {
  // Guard for SSR — portal needs document.body
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Focus close button when panel opens (accessibility)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (isOpen) {
      // Wait for transition to start before focusing
      const t = setTimeout(() => closeButtonRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // base
          'fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl',
          // width: full on mobile, percentage on desktop
          'w-full',
          widthClass[width],
          // slide animation + disable interaction when offscreen
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="truncate pr-4 text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="ปิด"
            className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer — sticky at bottom */}
        {footer && (
          <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}
