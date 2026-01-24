import AppShell from '../../App';
import AdminPanelView from '../../views/AdminPanelView';

export default function AdminSettingsPage() {
  return (
    <AppShell currentView="settings" title="Settings / Admins">
      <AdminPanelView />
    </AppShell>
  );
}
