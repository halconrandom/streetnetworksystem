import { TopNav } from './TopNav';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Layout({ children, fullWidth = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] font-sans flex flex-col overflow-x-hidden">
      <TopNav />
      <main className={fullWidth ? "flex-1 min-h-0 py-0" : "flex-1 py-8"}>
        <div className={fullWidth ? "w-full h-full min-h-0 px-0" : "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full"}>
          {children}
        </div>
      </main>
    </div>
  );
}
