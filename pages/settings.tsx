import AppShell from '../App';

export default function SettingsPage() {
  return (
    <AppShell currentView="settings" title="Settings">
      <div className="p-6 space-y-4 text-terminal-muted">
        <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
          <h3 className="text-white text-sm font-semibold mb-1">Admin Tools</h3>
          <p className="text-xs text-terminal-muted mb-3">
            Manage users, roles and access flags from the admin area.
          </p>
          <a
            href="/settings/admins"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-terminal-dark border border-terminal-border text-terminal-muted rounded-md"
          >
            Open Admin Panel
          </a>
        </div>
      </div>
    </AppShell>
  );
}
