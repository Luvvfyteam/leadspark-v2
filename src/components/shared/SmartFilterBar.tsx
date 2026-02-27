'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  /** Not needed for 'number'/'range' types */
  options: FilterOption[]
  type: 'select' | 'multiselect' | 'number' | 'range'
}

interface SmartFilterBarProps {
  filters: FilterConfig[]
  activeFilters: Record<string, string | string[]>
  onFilterChange: (key: string, value: string | string[] | null) => void
  onSearch: (query: string) => void
  searchPlaceholder?: string
  searchValue?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(value: string | string[] | undefined): boolean {
  if (!value) return false
  if (Array.isArray(value)) return value.length > 0
  return value.trim() !== ''
}

function getChipLabel(filter: FilterConfig, value: string | string[]): string {
  if (filter.type === 'number' && typeof value === 'string') {
    return `${value} วัน`
  }
  if (filter.type === 'range' && Array.isArray(value)) {
    const [min, max] = value
    if (min && max) return `${min} – ${max}`
    if (min) return `≥ ${min}`
    if (max) return `≤ ${max}`
    return ''
  }
  if (filter.type === 'multiselect' && Array.isArray(value)) {
    if (value.length === 1) {
      return filter.options.find((o) => o.value === value[0])?.label ?? value[0]
    }
    return `${value.length} รายการ`
  }
  // select — value is a string
  if (typeof value === 'string') {
    return filter.options.find((o) => o.value === value)?.label ?? value
  }
  return ''
}

// ─── Dropdown contents ────────────────────────────────────────────────────────

function SelectDropdown({
  filter,
  activeValue,
  onChange,
  onClose,
}: {
  filter: FilterConfig
  activeValue: string | undefined
  onChange: (value: string | null) => void
  onClose: () => void
}) {
  return (
    <div className="py-1">
      {filter.options.map((opt) => {
        const selected = activeValue === opt.value
        return (
          <button
            key={opt.value}
            onMouseDown={(e) => {
              e.preventDefault()
              onChange(selected ? null : opt.value)
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
              selected && 'bg-blue-50 font-medium text-blue-700',
            )}
          >
            <span className={cn('h-3.5 w-3.5 shrink-0', !selected && 'invisible')}>
              <Check className="h-3.5 w-3.5" />
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function MultiSelectDropdown({
  filter,
  activeValues,
  onChange,
}: {
  filter: FilterConfig
  activeValues: string[]
  onChange: (value: string[] | null) => void
}) {
  const toggle = (val: string) => {
    const next = activeValues.includes(val)
      ? activeValues.filter((v) => v !== val)
      : [...activeValues, val]
    onChange(next.length > 0 ? next : null)
  }

  return (
    <div className="py-1">
      {filter.options.map((opt) => {
        const checked = activeValues.includes(opt.value)
        return (
          <label
            key={opt.value}
            onMouseDown={(e) => { e.preventDefault(); toggle(opt.value) }}
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
          >
            <span
              className={cn(
                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                checked
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300 bg-white',
              )}
            >
              {checked && <Check className="h-2.5 w-2.5 text-white" />}
            </span>
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}

function NumberDropdown({
  filter,
  activeValue,
  onChange,
}: {
  filter: FilterConfig
  activeValue: string | undefined
  onChange: (value: string | null) => void
}) {
  return (
    <div className="p-3">
      <label className="mb-1 block text-xs text-gray-500">{filter.label}</label>
      <input
        type="number"
        min={0}
        value={activeValue ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="กรอกจำนวน..."
        autoFocus
        className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>
  )
}

function RangeDropdown({
  filter,
  activeValues,
  onChange,
}: {
  filter: FilterConfig
  activeValues: [string, string]
  onChange: (value: string[] | null) => void
}) {
  const update = (index: 0 | 1, val: string) => {
    const next: [string, string] = [...activeValues] as [string, string]
    next[index] = val
    onChange(next[0] || next[1] ? next : null)
  }

  return (
    <div className="space-y-2 p-3">
      {(['ต่ำสุด', 'สูงสุด'] as const).map((label, i) => (
        <div key={i}>
          <label className="mb-0.5 block text-xs text-gray-500">{label}</label>
          <input
            type="number"
            min={0}
            value={activeValues[i] ?? ''}
            onChange={(e) => update(i as 0 | 1, e.target.value)}
            autoFocus={i === 0}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      ))}
    </div>
  )
}

// ─── Single filter button + dropdown ─────────────────────────────────────────

function FilterButton({
  filter,
  activeFilters,
  isOpen,
  onToggle,
  onFilterChange,
  onClose,
}: {
  filter: FilterConfig
  activeFilters: Record<string, string | string[]>
  isOpen: boolean
  onToggle: () => void
  onFilterChange: (key: string, value: string | string[] | null) => void
  onClose: () => void
}) {
  const raw = activeFilters[filter.key]
  const active = isActive(raw)

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors',
          active
            ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800',
        )}
      >
        {filter.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Clear button inside dropdown */}
          {active && (
            <div className="border-b border-gray-100 px-3 py-1.5">
              <button
                onClick={() => { onFilterChange(filter.key, null); onClose() }}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                ✕ ล้างตัวกรองนี้
              </button>
            </div>
          )}

          {filter.type === 'select' && (
            <SelectDropdown
              filter={filter}
              activeValue={typeof raw === 'string' ? raw : undefined}
              onChange={(v) => onFilterChange(filter.key, v)}
              onClose={onClose}
            />
          )}
          {filter.type === 'multiselect' && (
            <MultiSelectDropdown
              filter={filter}
              activeValues={(raw as string[] | undefined) ?? []}
              onChange={(v) => onFilterChange(filter.key, v)}
            />
          )}
          {filter.type === 'number' && (
            <NumberDropdown
              filter={filter}
              activeValue={typeof raw === 'string' ? raw : undefined}
              onChange={(v) => onFilterChange(filter.key, v)}
            />
          )}
          {filter.type === 'range' && (
            <RangeDropdown
              filter={filter}
              activeValues={(raw as [string, string] | undefined) ?? ['', '']}
              onChange={(v) => onFilterChange(filter.key, v)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SmartFilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onSearch,
  searchPlaceholder = 'ค้นหา...',
  searchValue = '',
}: SmartFilterBarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // The inactive filters available to add via "+ เพิ่มตัวกรอง"
  const unusedFilters = filters.filter((f) => !isActive(activeFilters[f.key]))

  // Active filter entries for chips
  const activeEntries = filters.filter((f) => isActive(activeFilters[f.key]))
  const hasActive = activeEntries.length > 0

  // Close open dropdown on outside mousedown
  useEffect(() => {
    if (!openKey) return
    const handler = () => setOpenKey(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openKey])

  const toggleFilter = (key: string) =>
    setOpenKey((prev) => (prev === key ? null : key))

  const clearAll = () => {
    activeEntries.forEach((f) => onFilterChange(f.key, null))
  }

  return (
    <div className="space-y-2">
      {/* ── Row 1: Search + filter buttons ───────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors md:hidden',
            hasActive
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          ตัวกรอง
          {hasActive && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeEntries.length}
            </span>
          )}
        </button>

        {/* Filter buttons — hidden on mobile unless mobileOpen */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            'hidden md:flex',
            mobileOpen && '!flex w-full',
          )}
        >
          {filters.map((filter) => (
            <FilterButton
              key={filter.key}
              filter={filter}
              activeFilters={activeFilters}
              isOpen={openKey === filter.key}
              onToggle={() => toggleFilter(filter.key)}
              onFilterChange={onFilterChange}
              onClose={() => setOpenKey(null)}
            />
          ))}

          {/* + เพิ่มตัวกรอง — only when there are unused filters */}
          {unusedFilters.length > 0 && (
            <div className="relative">
              <button
                onClick={() => toggleFilter('__add__')}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white px-3 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
              >
                <Plus className="h-3.5 w-3.5" />
                เพิ่มตัวกรอง
              </button>

              {openKey === '__add__' && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <p className="px-3 py-1.5 text-xs font-medium text-gray-400">
                    ตัวกรองที่ยังไม่ได้ใช้
                  </p>
                  {unusedFilters.map((f) => (
                    <button
                      key={f.key}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setOpenKey(f.key)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Plus className="h-3.5 w-3.5 text-gray-400" />
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Active filter chips ────────────────────────────── */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeEntries.map((filter) => {
            const value = activeFilters[filter.key]
            const chipLabel = getChipLabel(filter, value)
            if (!chipLabel) return null
            return (
              <span
                key={filter.key}
                className="animate-in fade-in-0 slide-in-from-bottom-1 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                <span className="text-blue-500">{filter.label}:</span>
                {chipLabel}
                <button
                  onClick={() => onFilterChange(filter.key, null)}
                  aria-label={`ลบตัวกรอง ${filter.label}`}
                  className="ml-0.5 rounded-full p-0.5 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )
          })}

          <button
            onClick={clearAll}
            className="text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}
    </div>
  )
}
