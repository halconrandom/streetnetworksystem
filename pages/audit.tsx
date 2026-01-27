import AppShell from '../App';
import AdminPanelView from '../views/AdminPanelView';

export default function AuditPage() {
  return (
    <AppShell currentView="audit" title="Audit Logs">
      <AdminPanelView activeTab="audit" />
    </AppShell>
  );
}
