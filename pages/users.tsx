import AppShell from '../App';

export default function UsersPage() {
  return (
    <AppShell currentView="users" title="Users">
      <div className="flex items-center justify-center h-full text-terminal-muted">
        <div className="text-center">
          <p className="mb-2">Module Under Construction</p>
          <code className="bg-black/30 px-2 py-1 rounded text-xs">users_view.tsx</code>
        </div>
      </div>
    </AppShell>
  );
}
