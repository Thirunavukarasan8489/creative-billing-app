"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  PieChart,
  Plus,
  ChevronLeft,
  Menu,
  Settings,
  CheckCircle2,
  FileSpreadsheet,
  LogOut,
  User,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  // Sidebar default is CLOSED on mobile (< lg), always OPEN on desktop (lg:)
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    window.location.href = "/login";
  };

  const navLinks = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/quotations", label: "Rate Quotations", icon: FileSpreadsheet },
    { href: "/companies", label: "Client Ledgers & Statements", icon: Building2 },
    { href: "/reports", label: "GST & Tax Reports", icon: PieChart },
    { href: "/settings", label: "Press Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E11D48] flex items-center justify-center font-bold text-white shadow-sm">
            <span className="font-serif text-sm">CL</span>
          </div>
          <span className="font-serif font-bold text-sm tracking-wide text-white">
            Creative Line Graphics
          </span>
        </div>
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          title="Toggle Navigation Menu"
        >
          {isOpenMobile ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-64 bg-[#0F172A] text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 space-y-6 flex-1 overflow-y-auto">
          {/* Brand Header */}
          <Link
            href="/"
            onClick={() => setIsOpenMobile(false)}
            className="flex items-center gap-3 group border-b border-slate-800 pb-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#9E1356] flex items-center justify-center font-bold text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="font-serif text-xl tracking-tight">CL</span>
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold tracking-wide text-white group-hover:text-[#E11D48] transition-colors">
                CREATIVE LINE
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Printing Press
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  Live
                </span>
              </div>
            </div>
          </Link>

          {/* Create New Bill CTA Button */}
          <Link
            href="/invoices/new"
            onClick={() => setIsOpenMobile(false)}
            className="w-full py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-rose-400/20 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>Create New Bill</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpenMobile(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-2.5">
          <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="truncate">creativetpr@gmail.com</span>
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tiruppur • Tamil Nadu</p>
            <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Protected Session
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-rose-950/60 hover:border-rose-800/60 border border-slate-800 text-slate-300 hover:text-rose-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{isLoggingOut ? "Logging out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
