"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DashboardIcon,
  CampaignsIcon,
  ContactsIcon,
  TemplatesIcon,
  AnalyticsIcon,
  SettingsIcon,
  HelpIcon,
  SignOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogoIcon,
  MenuIcon,
} from "@/components/Icons";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: CampaignsIcon },
  { name: "Contacts", href: "/dashboard/contacts", icon: ContactsIcon },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

const bottomNavigation = [
  { name: "Help & Docs", href: "/dashboard/help", icon: HelpIcon },
  { name: "Sign out", href: "#", icon: SignOutIcon, onClick: () => signOut({ callbackUrl: "/signin" }) },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-lg shadow-slate-900/5 lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" aria-hidden="true" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out bg-slate-950 text-slate-100 border-r border-slate-800 ${collapsed ? "w-16" : ""} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[84px] items-center justify-between border-b border-white/10 px-5">
            <Link href="/dashboard" className="flex items-center gap-3" aria-label="Immortify Digital Home">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"><LogoIcon className="h-6 w-6" /></span>
              {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight text-white">Immortify Digital</span>}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
            </button>
          </div>

          {!collapsed && <p className="px-6 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Workspace</p>}
          <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all-fast ${active ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/10" : "text-slate-400 hover:bg-white/8 hover:text-white"} ${collapsed ? "justify-center px-2" : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 transition-transform" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <nav className="space-y-1" aria-label="Secondary navigation">
              {bottomNavigation.map((item) => item.name === "Help & Docs" ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all-fast hover:bg-white/8 hover:text-white ${collapsed ? "justify-center px-2" : ""}`}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all-fast hover:bg-white/8 hover:text-white ${collapsed ? "justify-center px-2" : ""}`}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </button>
              ))}
            </nav>

            {!collapsed && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-slate-600">Immortify Digital</p>
                <p className="mt-1 px-3 text-[10px] text-slate-600">v1.0.0 · Ahmedabad, India</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}