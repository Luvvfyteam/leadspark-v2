'use client';

import { MorningBrief } from '@/components/dashboard/MorningBrief';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { CustomerAttention } from '@/components/dashboard/CustomerAttention';
import { AIObservations } from '@/components/dashboard/AIObservations';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <MorningBrief />
      <SummaryCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasks />
        <CustomerAttention />
      </div>
      <AIObservations />
      <RecentActivity />
    </div>
  );
}
