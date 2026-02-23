'use client';

import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { AIObservations } from '@/components/dashboard/AIObservations';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SummaryCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasks />
        <AIObservations />
      </div>
      <RecentActivity />
    </div>
  );
}
