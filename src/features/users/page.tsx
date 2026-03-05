'use client';

import AppShell from '@/core/AppShell';
import AdminPanelView from '@features/admin/components/AdminPanelView';

export default function UsersPage() {
  return (
    <AppShell currentView="users" title="Users">
      <AdminPanelView activeTab="users" />
    </AppShell>
  );
}
