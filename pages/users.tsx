import AppShell from '../App';
import AdminPanelView from '../views/AdminPanelView';

export default function UsersPage() {
  return (
    <AppShell currentView="users" title="Users">
      <AdminPanelView activeTab="users" />
    </AppShell>
  );
}
