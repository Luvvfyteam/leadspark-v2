# LeadSpark v2 — UX Refactor Tasks

> **อ่านก่อนเริ่ม:** Codebase ใช้ Next.js 14 App Router, Zustand (store), shadcn/ui, Tailwind CSS, Recharts
> Mock data อยู่ใน `src/lib/mock-*.ts` ทั้งหมด | State อยู่ใน `src/stores/app-store.ts`
> ข้อมูล hardcode: today = '2026-02-17', currentUser = 'user-001' (Asia, Admin)

---

## Priority 0 — Shared Components (ทำก่อน ใช้ทุกหน้า)

> ⚠️ P0 ทั้งหมดต้องเสร็จก่อนเริ่ม P1 เพราะ P1+ ต้องใช้ component พวกนี้

### P0-1: SlideOverPanel Component ✅ DONE

**ไฟล์:** `src/components/shared/SlideOverPanel.tsx`

- [x] สร้าง component ใหม่ (อย่าใช้ shadcn `<Sheet>` เพราะ animation ไม่ตรง spec)
- [x] Panel เลื่อนเข้าจากขวา กว้าง 40% ของจอ (`w-[40vw]` min-width 480px)
- [x] Mobile (< 768px): full width (`w-full`)
- [x] โครงสร้าง layout: Header + Body (scrollable) + Footer (sticky)
- [x] Props: `isOpen`, `onClose`, `title`, `children`, `footer?`, `width?: 'md'|'lg'|'xl'`
- [x] กด Escape → ปิด
- [x] กด backdrop → ปิด
- [x] Animation: slide-in จากขวา + backdrop fade (duration-300)
- [x] Lock body scroll เมื่อเปิด
- [x] ใช้ `createPortal` render ออกนอก DOM tree หลัก
- [x] Auto-focus close button เมื่อเปิด (accessibility)
- [x] `pointer-events-none` บน panel ตอนปิด (ป้องกัน click ระหว่าง animation)
- [x] SSR-safe (`mounted` guard)

---

### P0-2: CheckboxActionBar Component ✅ DONE

**ไฟล์:** `src/components/shared/CheckboxActionBar.tsx`

- [x] State machine: `idle → pending → noting` (auto-confirm เมื่อ timeLeft === 0)
- [x] ติ๊ก → row จาง `opacity-50` + `line-through` บน content
- [x] Inline action bar: [✓ ยืนยัน] [↩ ยกเลิก] [📝 หมายเหตุ]
- [x] Countdown progress bar (เขียว, 5 วิ, 100ms interval)
- [x] Countdown pause + reset เมื่อเข้า noting mode
- [x] กด ยกเลิก → reset idle, เรียก onCancel
- [x] กด หมายเหตุ → noting mode, textarea auto-focus
- [x] Enter → confirm + note | Shift+Enter → newline | Esc → กลับ pending
- [x] Escape handler ใช้ capture phase (ไม่ชน SlideOverPanel)
- [x] parent `checked=true` → snap กลับ idle
- [x] **Wired ใน `TodayTasks.tsx`** — ทดสอบได้ที่ `/` dashboard

---

### P0-3: SmartFilterBar Component ✅ DONE

**ไฟล์:** `src/components/shared/SmartFilterBar.tsx`

- [x] Layout: [🔍 Search] [Filter1 ▾] [Filter2 ▾] [+ เพิ่มตัวกรอง]
- [x] Props: `FilterConfig[]`, `activeFilters`, `onFilterChange`, `onSearch`, `searchPlaceholder`, `searchValue`
- [x] Filter types: `select` (radio-like) / `multiselect` (checkbox) / `number` (input) / `range` (min+max)
- [x] Active filter chips row: `[label: value ✕]` + ล้างทั้งหมด
- [x] กด chip ✕ → ลบ filter นั้น | กด "ล้างทั้งหมด" → clear ทั้งหมด
- [x] "+ เพิ่มตัวกรอง" → dropdown แสดงเฉพาะ filter ที่ยังไม่ได้ใช้
- [x] Active filter button มี highlight สีฟ้า (bg-blue-50 border-blue-300)
- [x] Dropdown เดียวกันทีละอัน (openKey state)
- [x] Click-outside closes dropdown (document mousedown listener)
- [x] Chip enter animation: `animate-in fade-in-0 slide-in-from-bottom-1`
- [x] Mobile: toggle button "ตัวกรอง (N)" ขยาย/ซ่อน filter buttons
- [x] **Wired ใน `/customers`** — แทน select dropdowns เดิม, ทดสอบได้เลย

---

### P0-4: EmptyState Component ✅ DONE

**ไฟล์:** `src/components/shared/EmptyState.tsx`

- [x] Layout: icon circle + title + description + primary button + secondary button
- [x] Props: `icon?`, `title`, `description?`, `actionLabel?`, `onAction?`, `secondaryActionLabel?`, `onSecondaryAction?`, `className?`
- [x] Centered, `py-16`, icon ใน circle `bg-gray-100`
- [x] Primary CTA: `bg-blue-600` | Secondary: outline border
- [x] **Wired ใน `/customers`** — แยก 2 cases: ไม่มีลูกค้าเลย vs ไม่ตรง filter

---

## Priority 1 — หน้าหลัก (Dashboard) `/`

> ไฟล์หลัก: `src/app/page.tsx`, `src/components/dashboard/`

### P1-1: ปรับ SummaryCards + Expand Panels

**ไฟล์:** `src/components/dashboard/SummaryCards.tsx`

- [ ] เปลี่ยน label "ลูกค้าเปิดใช้งาน" → "ลูกค้าปัจจุบัน"
- [ ] เปลี่ยน label "ลีดทั้งหมด" → "ลีดใหม่เดือนนี้"
- [ ] เปลี่ยน label "รายได้เดือนนี้" → "ยอดขายเดือนนี้"
- [ ] เพิ่ม local state: `expandedCard: string | null`
- [ ] กด card → toggle expand panel ด้านล่าง card (ไม่ redirect)
  - Animation: `max-height` transition (0 → auto)
- [ ] Expanded panel: "งานวันนี้":
  - แสดง 5 tasks ล่าสุดของวันนี้จาก store
  - แต่ละ task แสดง checkbox + ชื่อ + ลูกค้า
  - ปุ่ม "ดูทั้งหมด" → navigate ไป `/tasks`
- [ ] Expanded panel: "ลูกค้าปัจจุบัน":
  - top 5 ลูกค้าที่ไม่มี activity ล่าสุด (sort by last_activity_at ASC)
  - ดึงจาก `customers` ใน store, filter `status: 'active'`
  - ปุ่ม "ดูทั้งหมด" → navigate ไป `/customers`
- [ ] Expanded panel: "ลีดใหม่เดือนนี้":
  - top 5 leads by ai_score จาก store
  - ปุ่ม "ดูทั้งหมด" → navigate ไป `/board`
- [ ] Expanded panel: "ยอดขายเดือนนี้":
  - mini bar chart (ใช้ Recharts ที่มีอยู่แล้ว)
  - top 3 deals ใหญ่สุดของเดือน
  - ปุ่ม "ดูทั้งหมด" → navigate ไป `/payments`
- [ ] กด card อีกครั้งเมื่อ expand อยู่ → collapse

---

### P1-2: ปรับ TodayTasks ใน Dashboard

**ไฟล์:** `src/components/dashboard/TodayTasks.tsx`

- [ ] แทน checkbox ปัจจุบันด้วย `<CheckboxActionBar>` (P0-2)
- [ ] `onConfirm` → call `toggleTask(taskId)` ใน store + move to "เสร็จแล้ว" section
- [ ] กดชื่อ task → เปิด `<SlideOverPanel>` (P0-1) แสดง task detail
  - Panel content: title, customer, assignee, due date, category, description
  - ไม่ต้อง navigate ไป `/tasks`
- [ ] กดชื่อลูกค้า → เปิด `<SlideOverPanel>` แสดง customer mini profile
  - Customer card: ชื่อ, industry, status, phone, last activity
  - ปุ่ม "ดูทั้งหมด" → navigate ไป `/customers/[id]`
- [ ] เพิ่ม collapsed section "เสร็จแล้ววันนี้" ด้านล่าง
  - Default: collapsed, แสดงจำนวน `(N)`
  - กด header → expand รายการ
- [ ] ลบ redirect ที่มีอยู่เดิม (ถ้ามี) เมื่อกดชื่อ task

---

### P1-3: Morning Brief Section

**ไฟล์:** `src/components/dashboard/MorningBrief.tsx` (ใหม่)

- [ ] สร้าง component ใหม่
- [ ] วางไว้ด้านบนสุดของ `src/app/page.tsx` ก่อน `<SummaryCards>`
- [ ] ดึงข้อมูลจาก store:
  - จำนวน tasks วันนี้: filter `due_date === TODAY && !is_completed`
  - จำนวน customers ต้อง follow up: ดูจาก activities (ไม่มี activity ใน 7+ วัน)
  - ยอดขาย % ของเป้า: ดูจาก `goals` store
- [ ] UI:
  ```
  สวัสดีตอนเช้า [ชื่อ] 👋
  วันนี้มี [N] งาน · [N] ลูกค้าต้อง follow up · ยอดขายเดือนนี้ [X]% ของเป้า
  ```
- [ ] ตัวเลขแต่ละอัน: กด → scroll ไปส่วนที่เกี่ยวข้องในหน้า หรือ navigate ไปหน้าเต็ม
- [ ] Greeting ปรับตามเวลา: เช้า/สาย/บ่าย/เย็น (ใช้ new Date().getHours())
- [ ] Background: gradient ที่โดดเด่นเล็กน้อย (bg-blue-50 border-l-4 border-blue-500)

---

### P1-4: Customer Attention Section

**ไฟล์:** `src/components/dashboard/CustomerAttention.tsx` (ใหม่)

- [ ] สร้าง component ใหม่
- [ ] วางใน `src/app/page.tsx` ระหว่าง TodayTasks กับ AIObservations
- [ ] Logic คัด customers "ต้องสนใจ":
  - ไม่มี activity ใน 14+ วัน (ดูจาก `activities` store filter by `customer_id`)
  - `status: 'overdue_payment'`
  - มี deal `payment_status: 'unpaid'` เกิน due date
- [ ] แต่ละรายการแสดง: ชื่อลูกค้า + เหตุผล flag + วันที่ last activity
- [ ] กด → เปิด `<SlideOverPanel>` customer mini profile
- [ ] ถ้าไม่มีรายการ: ไม่ render section นี้ (null)

---

## Priority 1 — หน้างาน (Tasks) `/tasks`

> ไฟล์หลัก: `src/app/tasks/page.tsx`

### P1-5: Task Row ใช้ CheckboxActionBar

- [ ] แทน checkbox ปัจจุบันใน task row ทุก view ด้วย `<CheckboxActionBar>` (P0-2)
- [ ] `onConfirm(note)`:
  - call `toggleTask(taskId)` ใน store
  - ถ้า note มี: call `addComment(taskId, note)`
  - task ย้ายไป section "เสร็จแล้ว" (animated)
- [ ] `onCancel`: คืนสภาพ row ปกติ
- [ ] Section "เสร็จแล้ว" ด้านล่างแต่ละ date group:
  - Default collapsed, แสดงจำนวน
  - กด → expand รายการ completed ของ group นั้น
- [ ] ระวัง: อย่าแก้ไข `toggleTask` ใน store — ใช้เหมือนเดิม, แค่เพิ่ม UX delay

---

### P1-6: Task Detail SlideOverPanel

- [ ] แทน inline expand panel ปัจจุบัน (ถ้ามี) ด้วย `<SlideOverPanel>` (P0-1) `width="lg"`
- [ ] กดชื่อ task → เปิด SlideOverPanel
- [ ] Panel content:
  - **Header:** title + status badge + [แก้ไข] [ลบ] (ลบ: Admin only)
  - **Body:**
    - ลูกค้า (กดได้ → customer panel ซ้อน หรือ navigate)
    - ผู้รับผิดชอบ (inline edit: dropdown)
    - กำหนดส่ง (inline edit: date input)
    - หมวดหมู่ (badge จาก `TASK_CATEGORY_CONFIG`)
    - รายละเอียด (textarea, editable)
    - Divider "---"
    - Comments (ดึงจาก `taskComments` ใน store filter by task_id)
    - Add comment form (input + Enter)
  - **Footer:** [✓ ทำเสร็จ] [📝 เพิ่ม Comment]
- [ ] Edit fields: call store actions ที่มีอยู่แล้ว (`updateTask`)
- [ ] Delete: call `deleteTask` (มีอยู่แล้วใน store), ต้องมี confirm dialog

---

### P1-7: Quick Add Task

- [ ] แต่ละ date section header (วันนี้, พรุ่งนี้, สัปดาห์นี้, เลยกำหนด) เพิ่มปุ่ม `+` เล็กๆ ขวาสุด
- [ ] กด `+` → inline text field ปรากฏด้านล่าง section header
  - `<input>` placeholder "พิมพ์ชื่องาน แล้วกด Enter..."
  - `autoFocus` ทันที
  - Enter → call `addTask` ใน store ด้วย `{ title, due_date: sectionDate, assigned_to: currentUser }`
  - Esc → ยกเลิก input
- [ ] ปุ่ม "+ เพิ่มงาน" หลัก (header) → เปิด `<SlideOverPanel>` form เต็ม (แทน modal ปัจจุบัน)
  - SlideOverPanel form fields: title, customer_id, assignee, due_date, category, description

---

## Priority 1 — หน้าลูกค้า (Customers) `/customers`

> ไฟล์หลัก: `src/app/customers/page.tsx`

### P1-8: View Toggle (Table / Card)

- [ ] เพิ่ม toggle ปุ่ม `[≡ Table] [⊞ Card]` ที่ header
- [ ] Local state: `view: 'table' | 'card'` (default: `'table'`)
- [ ] **Table View:**
  - `<table>` หรือ `div grid` แสดง columns: Pin ★ | ชื่อ | อุตสาหกรรม | สถานะ | ผู้ดูแล | มูลค่า Deal | ติดต่อล่าสุด | เพิ่มเมื่อ
  - กดหัว column → sort ascending/descending (toggle)
  - Sortable columns: ชื่อ, สถานะ, มูลค่า, ติดต่อล่าสุด
  - "มูลค่า Deal": sum ของ `deals` ที่ customer_id ตรงกัน (ดูจาก `deals` ใน store)
  - "ติดต่อล่าสุด": latest `created_at` ของ activities filter by `customer_id`
- [ ] **Card View:**
  - แบบเดิมที่มีอยู่ (card grid) แต่เพิ่ม: มูลค่ารวม, จำนวน tasks ค้าง, last activity date
- [ ] ทั้ง 2 view: กดชื่อ → SlideOverPanel (P1-10) แทนการ navigate ไป `/customers/[id]`

---

### P1-9: Smart Filter Bar สำหรับ Customers

- [ ] แทน filter ปัจจุบัน (search + 2 select dropdown แยก) ด้วย `<SmartFilterBar>` (P0-3)
- [ ] Filter configs:
  ```ts
  [
    { key: 'status', label: 'สถานะ', options: CUSTOMER_STATUS_CONFIG, type: 'select' },
    { key: 'industry', label: 'อุตสาหกรรม', options: INDUSTRY_OPTIONS, type: 'select' },
    { key: 'assigned_to', label: 'ผู้ดูแล', options: TEAM_MEMBERS, type: 'select' },
    { key: 'tags', label: 'แท็ก', options: [], type: 'multiselect' },
    { key: 'no_contact_days', label: 'ไม่ติดต่อนานกว่า', type: 'number' },
  ]
  ```
- [ ] เชื่อม filter state กับ customer list filtering logic ที่มีอยู่

---

### P1-10: Customer SlideOverPanel

- [ ] กดชื่อ customer (ทั้ง table และ card view) → เปิด `<SlideOverPanel>` `width="md"`
- [ ] Panel content:
  - **Header:** ชื่อธุรกิจ + status badge
  - **Body:**
    - Industry badge + assigned_to
    - ข้อมูลติดต่อ: phone, email, LINE (icon + text)
    - Recent activities: 3 รายการล่าสุด จาก `activities` store
    - Tasks ค้าง: จำนวน + 2 tasks ล่าสุด
    - Open deals: จำนวน + มูลค่ารวม
  - **Footer:** [ดูข้อมูลเต็ม →] [+ เพิ่มกิจกรรม]
- [ ] "ดูข้อมูลเต็ม" → navigate ไป `/customers/[id]`

---

### P1-11: Import CSV

- [ ] เพิ่มปุ่ม "📥 นำเข้า" ข้าง "+ เพิ่มลูกค้า"
- [ ] กด → เปิด modal (ใช้ shadcn `<Dialog>` ที่มีอยู่)
- [ ] **Step 1 — Upload:**
  - Drag & drop zone หรือ click to upload
  - รับไฟล์ .csv, .xlsx
  - `<input type="file" accept=".csv,.xlsx">`
- [ ] **Step 2 — Map Columns:**
  - อ่าน headers จากไฟล์
  - แสดง: "คอลัมน์ [ชื่อในไฟล์] → [Select: ชื่อธุรกิจ / โทรศัพท์ / อีเมล / ...]"
  - Required mapping: ชื่อธุรกิจ
- [ ] **Step 3 — Preview:**
  - แสดง 5 rows แรกหลัง mapping
  - แสดงจำนวน rows ทั้งหมด
- [ ] **Step 4 — Import:**
  - กด "นำเข้า X ราย" → call `addCustomer` ใน store วนซ้ำ
  - Progress indicator
  - Success: "สำเร็จ! นำเข้า X ราย" + ปิด modal
- [ ] **หมายเหตุ:** เป็น trojan horse entry point — ทำ UX ให้ smooth ที่สุด
- [ ] เนื่องจากยังไม่มี real file parser: ใช้ mock parsing ก่อน (parse CSV text manually หรือ placeholder)

---

## Priority 2 — หน้า Pipeline (Board) `/board`

> ไฟล์หลัก: `src/app/board/page.tsx` | Constants: `src/lib/constants.ts` → `BOARD_COLUMNS`

### P2-1: Custom Columns

- [ ] เพิ่ม state ใน `app-store.ts`:
  ```ts
  boardColumns: BoardColumn[]  // { id, label, color, order }
  addBoardColumn: (column) => void
  updateBoardColumn: (id, data) => void
  removeBoardColumn: (id) => void
  reorderBoardColumns: (columns) => void
  ```
- [ ] Default columns: `['new', 'contacted', 'interested', 'won', 'lost']`
  - เพิ่ม `'lost'` column พร้อม label "ไม่สำเร็จ"
  - ปัจจุบัน `BOARD_COLUMNS` ใน constants.ts filter ออก `lost` — เปลี่ยนให้แสดง
- [ ] ดับเบิ้ลคลิก column header → inline edit ชื่อ (input แทน h3)
  - Enter หรือ blur → save + call `updateBoardColumn`
- [ ] ปุ่ม "+ เพิ่มคอลัมน์" ที่ขวาสุดของ board
  - กด → inline input ชื่อ column → Enter → `addBoardColumn`
- [ ] Column "ไม่สำเร็จ": เมื่อลาก card เข้า → modal ถาม "เหตุผลที่ไม่สำเร็จ" (required field)

---

### P2-2: Column Summary

- [ ] เพิ่ม subheader ด้านล่างชื่อ column แต่ละอัน:
  ```
  เจรจาต่อรอง
  (5) · ฿250,000
  ```
- [ ] คำนวณจาก leads ใน column นั้น:
  - จำนวน: `leads.filter(l => l.board_status === col.id).length`
  - มูลค่า: sum ของ deals ที่ผูกกับ lead (ปัจจุบัน leads ไม่มี `value` field โดยตรง — ใช้ `ai_score * 5000` เป็น estimate หรือ hardcode)
  - **หมายเหตุ:** ตรวจสอบ `Lead` type ใน `src/types/index.ts` — ไม่มี `value` field ให้เพิ่มหรือ compute จาก deals
- [ ] Format: `฿${(value/1000).toFixed(0)}K` ถ้าเกิน 1000

---

### P2-3: Lead SlideOverPanel

- [ ] กด card → เปิด `<SlideOverPanel>` (P0-1) `width="lg"` แทนการ navigate ไป `/board/[id]`
- [ ] Panel content:
  - **Header:** ชื่อธุรกิจ + AI score badge + status badge
  - **Body:**
    - AI score breakdown (fit/need/potential — แบบเดียวกับ `/board/[id]`)
    - ข้อมูลติดต่อ (phone, email, LINE, website, Facebook)
    - Google rating
    - Activities timeline (3 ล่าสุด)
    - Notes input (inline add)
    - Tasks (tasks ที่ผูกกับ lead นี้)
  - **Footer:** [+ เพิ่มกิจกรรม] [แปลงเป็นลูกค้า] [ดูข้อมูลเต็ม →]
- [ ] "ดูข้อมูลเต็ม" → navigate ไป `/board/[id]` (เก็บหน้าเดิมไว้)
- [ ] "แปลงเป็นลูกค้า": แสดงเฉพาะ status = 'won', call `convertLeadToCustomer` ที่มีอยู่ใน store

---

## Priority 2 — หน้าเอกสาร (Documents) `/documents`

> ไฟล์หลัก: `src/app/documents/page.tsx`

### P2-4: Document Creation Wizard

- [ ] แทน modal เดิม (create document inline form) ด้วย `<SlideOverPanel>` `width="xl"` หรือ full-page route `/documents/new`
- [ ] 5 steps โดยใช้ step indicator:
  ```
  [1. ประเภท] → [2. ลูกค้า] → [3. รายการ] → [4. เงื่อนไข] → [5. Preview]
  ```
- [ ] **Step 1:** เลือก [ใบเสนอราคา] หรือ [ใบแจ้งหนี้] (2 ปุ่มใหญ่)
- [ ] **Step 2:** ค้นหาลูกค้า (search input + dropdown list จาก customers store)
  - แสดง recent customers 5 คนล่าสุด
- [ ] **Step 3:** เพิ่มรายการ
  - Quick add จาก `services` ใน store (ปุ่ม chip แต่ละ service)
  - Manual add: ชื่อ, คำอธิบาย, จำนวน, ราคา/หน่วย
  - คำนวณ subtotal realtime
- [ ] **Step 4:** ส่วนลด + เงื่อนไข
  - discount_type (percentage/fixed) + discount_value
  - terms textarea
  - valid_until (quotation) หรือ due_date (invoice)
- [ ] **Step 5:** Preview
  - render document preview แบบ mini (ใช้ logic จาก preview modal เดิม)
  - **Footer:** [⬅ แก้ไข] [บันทึกร่าง] [บันทึก + ส่ง]
- [ ] "บันทึก" → call `addDocument` ใน store

---

### P2-5: Document Quick Actions

- [ ] เพิ่ม action column ที่แต่ละ row ใน document list:
  ```
  [👁 ดู] [📄 ทำซ้ำ] [🔄 แปลง] [📤 ส่ง]
  ```
- [ ] **"👁 ดู":** เปิด preview modal (ใช้ logic เดิมที่มีอยู่)
- [ ] **"📄 ทำซ้ำ":** สร้าง document ใหม่ copy ทุก field (new id, new number, status: draft)
- [ ] **"🔄 แปลง quotation→invoice":** แสดงเฉพาะ quotation ที่ status = 'accepted' หรือ 'sent'
  - สร้าง invoice ใหม่ pre-fill ทุก fields จาก quotation
  - เปิด step 4 (เงื่อนไข) ของ wizard เพื่อตั้ง due_date → save
- [ ] **"📤 ส่ง":** เปลี่ยน status → 'sent' + toast "ส่งเอกสารแล้ว"

---

### P2-6: Document Entry Points

- [ ] **จาก Pipeline (Board):** เมื่อย้าย lead ไป column "ปิดการขาย ✓":
  - Modal ย้าย deal เพิ่มปุ่ม "สร้างใบเสนอราคา" (ถ้า lead ถูก convert แล้ว)
  - กด → เปิด Document Wizard step 2 พร้อม pre-fill customer
- [ ] **จาก Customer Detail (`/customers/[id]`):**
  - Section Documents เพิ่มปุ่ม "+ สร้างเอกสาร"
  - กด → เปิด Document Wizard step 1 พร้อม pre-fill customer_id

---

## Priority 2 — หน้ารายงาน (Reports) `/reports`

> ไฟล์หลัก: `src/app/reports/page.tsx`

### P2-7: Date Range Picker

- [ ] เพิ่มที่ top ของหน้า (ก่อน charts):
  ```
  [สัปดาห์นี้] [เดือนนี้ •] [ไตรมาสนี้] [กำหนดเอง ▾]
  ```
- [ ] Local state: `dateRange: { start: Date; end: Date }` + `preset: string`
- [ ] "กำหนดเอง" → date picker สองช่อง (from - to)
- [ ] ลบ hardcode `'2026-02'` ใน reports page ออก → ใช้ dateRange แทน
- [ ] Charts ทั้งหมดใช้ dateRange filter data

---

### P2-8: Goal Tracker Inline

- [ ] ดึง goals จาก store: `goals.find(g => g.month === currentMonth)`
- [ ] ถ้ายังไม่มีเป้าหมาย:
  - แสดง CTA: "ยังไม่ได้ตั้งเป้าหมายเดือนนี้"
  - ปุ่ม "ตั้งเป้าหมายเดือนนี้" → inline form expand (ไม่ต้องไป settings)
  - Form: revenue_target, deals_target, leads_target
  - Submit → call `updateGoal` ใน store
- [ ] ถ้ามีเป้าแล้ว:
  - Progress bars แต่ละ metric:
    ```
    💰 ยอดขาย: [████████░░] 68% (฿340K / ฿500K)
    🤝 Deal ปิด: [██████░░░░] 53% (8 / 15)
    🧲 ลีดใหม่: [████████████] 92% (46 / 50)
    ```
  - AI prediction text: "ถ้ายอดเท่าเดิมอีก 2 สัปดาห์ คาดว่าจะถึง 85% ของเป้า"
  - กด progress bar → drill-down

---

### P2-9: Scorecard Section

- [ ] เพิ่ม 4 ช่องใหญ่ด้านบนสุด (ก่อน charts):
  | ยอดขาย | Deal ปิด | Conversion Rate | ค่าเฉลี่ย/Deal |
  |---------|---------|----------------|----------------|
  | ฿340K ▲+12% | 8 ▲+2 | 28% ▼-3% | ฿42.5K |
- [ ] คำนวณ % เทียบเดือนก่อน (เดือนก่อน = month - 1 จาก dateRange)
- [ ] สีตัวเลข: ▲ = text-green-600, ▼ = text-red-500

---

### P2-10: Drill-down Charts

- [ ] Revenue chart (bar): `onClick` บน bar → แสดง list deals ของเดือนนั้น
  - แสดงใน panel ด้านล่าง chart (expand)
  - deals filter by created_at ในเดือนนั้น
- [ ] Industry pie chart: `onClick` บน slice → filter customers list by industry
  - แสดง list customers ใน panel ด้านล่าง
- [ ] ใช้ Recharts onClick event (มีอยู่แล้ว) + local state `selectedBar`, `selectedSlice`

---

## Priority 2 — หน้าค้นหาลีด (Search) `/search`

> ไฟล์หลัก: `src/app/search/page.tsx`

### P2-11: Filter 2 ชั้น

- [ ] **ชั้น 1 (แสดงตลอด):** ประเภทธุรกิจ, พื้นที่, คำค้นหา (ปัจจุบันมีอยู่แล้ว แค่จัดใหม่)
- [ ] **ชั้น 2 (กด "ตัวกรองเพิ่มเติม ▾" → expand panel):**
  - Rating ★ (min rating slider หรือ select)
  - จำนวนรีวิว (min reviews input)
  - มีเว็บไซต์ (checkbox)
  - มี Facebook (checkbox)
  - ขนาดธุรกิจ (small/medium/large checkboxes)
- [ ] ปุ่ม "ตัวกรองเพิ่มเติม" แสดงจำนวน active filters ชั้น 2: "ตัวกรองเพิ่มเติม (3)"
- [ ] ชั้น 2 filter state ยังคงแยกจากชั้น 1 เพื่อ UX ที่ชัดเจน

---

### P2-12: AI Score Tooltip

- [ ] ทุก AI score badge (ในผลลัพธ์) เพิ่ม tooltip เมื่อ hover:
  ```
  Fit: 35/40 · Need: 24/30 · Potential: 26/30
  "ธุรกิจนี้ตรงกับบริการของคุณ และมีแนวโน้มต้องการ"
  ```
- [ ] ใช้ shadcn `<Tooltip>` ที่มีอยู่ใน `src/components/ui/tooltip.tsx`
- [ ] Trigger: hover บน score badge
- [ ] Content: breakdown ทั้ง 3 + คำอธิบาย 1 บรรทัด (generate จาก score values)

---

### P2-13: Saved Search

- [ ] เพิ่ม state ใน store หรือ localStorage:
  ```ts
  savedSearches: { id, name, filters }[]
  ```
- [ ] ปุ่ม "💾 บันทึกการค้นหานี้" ที่ header (active เมื่อมี filter ที่ตั้งแล้ว)
- [ ] กด → modal: "ตั้งชื่อการค้นหา" → input → "บันทึก"
- [ ] Saved searches แสดงเป็น chips ด้านบนหน้า
- [ ] กด chip → apply filters ทั้งหมดจาก saved search
- [ ] กด ✕ บน chip → ลบ saved search (confirm)

---

### P2-14: Bulk Action

- [ ] เพิ่ม checkbox บนแต่ละ lead card (top-left corner)
- [ ] "เลือกทั้งหมด" checkbox ที่ header ของผลลัพธ์
- [ ] เมื่อเลือก ≥ 1 card → floating action bar ด้านล่างหน้าจอ (fixed position):
  ```
  "เลือก 5 ราย" [+ เพิ่มเข้า Pipeline] [📤 Export] [🏷 ติดแท็ก] [✕ ยกเลิก]
  ```
- [ ] "เพิ่มเข้า Pipeline" → call `moveLeadToColumn` (วน loop) + toast
- [ ] "Export" → download CSV จาก selected leads data
- [ ] "ติดแท็ก" → dropdown input เพิ่ม tag ให้ leads ที่เลือก

---

## Priority 3 — หน้าตั้งค่า (Settings) `/settings`

> ไฟล์หลัก: `src/app/settings/page.tsx`

### P3-1: Tabs ใหม่

- [ ] เพิ่ม tabs ใน sidebar settings navigation:
  - **"เชื่อมต่อ"** (ใหม่): LINE OA, Google Calendar, Bank API — placeholder UI พร้อม "เร็วๆ นี้"
  - **"นำเข้า/ส่งออก"** (ใหม่):
    - Import: ลูกค้า (CSV), ลีด — link ไป `/customers` import flow
    - Export: ลูกค้า (CSV), เอกสาร (PDF zip), รายงาน (Excel)
    - Backup: "ดาวน์โหลดข้อมูลทั้งหมด"
  - **"แผน/Billing"** (ใหม่):
    - แสดง plan ปัจจุบัน: Free / Premium / Business
    - Usage summary (จำนวน customers, documents, team members)
    - ปุ่ม "อัปเกรด" (placeholder)

---

### P3-2: Company Info Live Preview

- [ ] ใน tab "บริษัท": เพิ่ม 2-column layout
  - ซ้าย: form ที่มีอยู่แล้ว
  - ขวา: mini invoice preview (แสดง logo, ชื่อบริษัท, ที่อยู่, เลขภาษี)
- [ ] Preview update realtime เมื่อพิมพ์ใน form (useEffect listen form state)
- [ ] Preview: styled เหมือน invoice header จริง (ขนาดย่อ ~50%)

---

### P3-3: Team Invite Flow

- [ ] ในหน้า Team settings: ปุ่ม "+ เชิญสมาชิก"
- [ ] กด → modal/inline form:
  - Email input
  - Role select: [Admin] [Member] [Viewer]
  - ปุ่ม "ส่งคำเชิญ"
- [ ] Submit → เพิ่ม pending invite ใน UI:
  ```
  somchai@example.com — Member — รอยืนยัน [ยกเลิก]
  ```
- [ ] (Mock: ไม่ต้องส่ง email จริง ใช้ store state)

---

### P3-4: Notification Settings

- [ ] ใน tab "การแจ้งเตือน" ปรับ UI:
  - Toggle switches สำหรับแต่ละประเภท:
    - งานเกินกำหนด (task overdue)
    - ครบกำหนดชำระ (payment due)
    - ลีดใหม่ที่ match (new lead match)
    - กิจกรรมของทีม (team activity)
  - ช่องทาง (placeholder): [Email] [LINE] [Push]
  - State เก็บใน store หรือ localStorage

---

## Design Patterns — ต้องใช้สม่ำเสมอทั้ง App

| Pattern | Description | Component |
|---------|-------------|-----------|
| **SlideOverPanel** | กดชื่อ item → panel จากขวา | `P0-1` |
| **CheckboxActionBar** | ติ๊ก → จาง + action bar | `P0-2` |
| **SmartFilterBar** | Filter chips + search | `P0-3` |
| **EmptyState** | List ว่าง → CTA | `P0-4` |
| **ไม่หายทันที** | ทุก destructive action ต้อง confirm | ทุกหน้า |

---

## Checklist ก่อน Merge

- [ ] SlideOverPanel ทุกที่กด Escape ปิดได้
- [ ] CheckboxActionBar countdown timer cancel เมื่อ unmount
- [ ] SmartFilterBar filter state sync กับ URL params (optional แต่ดี)
- [ ] ไม่มี hardcode 'user-001' ที่ควรมาจาก `currentUser` store
- [ ] Empty states ทุก list หน้า
- [ ] Mobile responsive ทุก component ใหม่
- [ ] ไม่ break existing routes และ navigation
