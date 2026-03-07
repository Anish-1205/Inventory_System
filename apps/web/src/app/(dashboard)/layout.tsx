import { DashboardNav } from '@/components/ui/dashboard-nav';
import { SyncStatusBar } from '@/components/sync/sync-status-bar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SyncStatusBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
