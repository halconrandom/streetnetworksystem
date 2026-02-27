import AppShell from '@/core/AppShell';
import AdminPanelView from '@features/admin/components/AdminPanelView';

export default function AuditPage() {
  return (
    <AppShell currentView="audit" title="Audit Logs">
      <AdminPanelView activeTab="audit" />
    </AppShell>
  );
}
