'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, MessageSquare, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActionState = 'idle' | 'pending' | 'noting'

interface CheckboxActionBarProps {
  /** Actual completion status from the parent/store */
  checked: boolean
  /** Called after user confirms (or auto-timeout). note is only set when user typed one. */
  onConfirm: (note?: string) => void
  /** Called when user explicitly cancels — parent usually does nothing */
  onCancel: () => void
  /** The task row content rendered next to the checkbox */
  children: React.ReactNode
  /** Milliseconds before auto-confirm fires. Default 5000. */
  autoConfirmDelay?: number
}

export function CheckboxActionBar({
  checked,
  onConfirm,
  onCancel,
  children,
  autoConfirmDelay = 5000,
}: CheckboxActionBarProps) {
  const [actionState, setActionState] = useState<ActionState>('idle')
  const [note, setNote] = useState('')
  const [timeLeft, setTimeLeft] = useState(autoConfirmDelay)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // If parent marks task completed externally, snap back to idle
  useEffect(() => {
    if (checked) {
      setActionState('idle')
      setNote('')
    }
  }, [checked])

  // Countdown: runs only in 'pending'. Pauses (and resets) on any other state.
  useEffect(() => {
    if (actionState !== 'pending') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setTimeLeft(autoConfirmDelay)
      return
    }

    setTimeLeft(autoConfirmDelay)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 100))
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [actionState, autoConfirmDelay])

  // Auto-confirm when countdown reaches zero
  useEffect(() => {
    if (actionState === 'pending' && timeLeft === 0) {
      setActionState('idle')
      setNote('')
      onConfirm(undefined)
    }
  }, [timeLeft, actionState, onConfirm])

  // Focus textarea as soon as noting mode opens
  useEffect(() => {
    if (actionState !== 'noting') return
    const t = setTimeout(() => noteRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [actionState])

  // Escape in noting mode → back to pending (capture phase so it fires before SlideOverPanel's handler)
  useEffect(() => {
    if (actionState !== 'noting') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setActionState('pending')
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [actionState])

  /* ── helpers ─────────────────────────────────────────── */

  const confirm = (noteText?: string) => {
    setActionState('idle')
    setNote('')
    onConfirm(noteText || undefined)
  }

  const cancel = () => {
    setActionState('idle')
    setNote('')
    onCancel()
  }

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      confirm(note || undefined)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setActionState('pending')
    }
  }

  /* ── derived ─────────────────────────────────────────── */

  const isPending = actionState === 'pending' || actionState === 'noting'
  const progressPct = (timeLeft / autoConfirmDelay) * 100

  /* ── render ──────────────────────────────────────────── */

  return (
    <div
      className={cn(
        'rounded-lg transition-colors duration-200',
        isPending && 'bg-green-50/50',
      )}
    >
      {/* ── Main row ─────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-2.5">
        <input
          type="checkbox"
          checked={checked || isPending}
          onChange={() => { if (!checked) setActionState('pending') }}
          disabled={checked}
          aria-label="ทำเสร็จแล้ว"
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
        />

        {/* Content — dimmed + strikethrough while pending */}
        <div
          className={cn(
            'min-w-0 flex-1 transition-opacity duration-200',
            isPending && 'opacity-50 line-through',
          )}
        >
          {children}
        </div>
      </div>

      {/* ── Action bar (pending / noting) ────────────────── */}
      {isPending && (
        <div className="ml-7 pb-2.5 pr-2.5">

          {/* Countdown bar — hidden in noting mode (countdown is paused anyway) */}
          {actionState === 'pending' && (
            <div className="mb-2 h-0.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => confirm()}
              className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-3 w-3" />
              ยืนยัน
            </button>

            <button
              onClick={cancel}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-3 w-3" />
              ยกเลิก
            </button>

            <button
              onClick={() =>
                setActionState(actionState === 'noting' ? 'pending' : 'noting')
              }
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                actionState === 'noting'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              <MessageSquare className="h-3 w-3" />
              หมายเหตุ
            </button>
          </div>

          {/* Note textarea — only in noting mode */}
          {actionState === 'noting' && (
            <div className="mt-2 space-y-1.5">
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                placeholder="พิมพ์หมายเหตุ... (Enter บันทึก · Shift+Enter ขึ้นบรรทัดใหม่ · Esc ยกเลิก)"
                rows={2}
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setActionState('pending')}
                  className="rounded-md px-2.5 py-1 text-xs text-gray-500 transition-colors hover:text-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => confirm(note || undefined)}
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  บันทึก + เสร็จ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
