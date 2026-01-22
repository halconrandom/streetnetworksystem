import AppShell from '../App';

export default function AuditPage() {
  return (
    <AppShell currentView="audit" title="Audit Logs">
      <div className="flex items-center justify-center h-full text-terminal-muted">
        <div className="text-center">
          <p className="mb-2">Module Under Construction</p>
          <code className="bg-black/30 px-2 py-1 rounded text-xs">audit_view.tsx</code>
        </div>
      </div>
    </AppShell>
  );
}
