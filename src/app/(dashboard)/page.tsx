'use client';

import { MorningBrief } from '@/components/dashboard/MorningBrief';
import { SparkPulse } from '@/components/dashboard/SparkPulse';
import { AIObservations } from '@/components/dashboard/AIObservations';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { CustomerAttention } from '@/components/dashboard/CustomerAttention';
import { SummaryBar } from '@/components/dashboard/SummaryBar';

export default function DashboardPage() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Morning Brief — greeting + quick stats */}
      <MorningBrief />

      {/* 2. Spark Pulse — business health 🟢🟡🔴 */}
      <SparkPulse />

      {/* 3. AI Observations */}
      <AIObservations />

      {/* 4. Today's work + customers needing attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TodayTasks />
        <CustomerAttention />
      </div>

      {/* 5. Compact summary stats bar */}
      <SummaryBar />
    </div>
  );
}
