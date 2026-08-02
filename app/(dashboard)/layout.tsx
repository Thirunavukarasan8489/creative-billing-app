import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] text-[#0F172A]">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-4 px-6 text-center">
          <p className="font-medium">
            <span className="park-avenue text-brand-rose text-lg">Creative Line Graphics</span> —
            Printing Press Billing Management System • Tiruppur, Tamil Nadu
          </p>
        </footer>
      </div>
    </div>
  );
}
