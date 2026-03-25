import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, UsersIcon, EnvelopeIcon, PaperAirplaneIcon,
  MegaphoneIcon, DocumentTextIcon, ChartBarIcon,
  Cog6ToothIcon, ArrowLeftOnRectangleIcon, Bars3Icon,
  XMarkIcon, BoltIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid, UsersIcon as UsersSolid,
  EnvelopeIcon as EnvelopeSolid, MegaphoneIcon as MegaphoneSolid,
  ChartBarIcon as ChartSolid,
} from '@heroicons/react/24/solid';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',  Icon: HomeIcon,         ActiveIcon: HomeSolid },
  { to: '/contacts',  label: 'Contacts',   Icon: UsersIcon,        ActiveIcon: UsersSolid },
  { to: '/messages',  label: 'Messages',   Icon: EnvelopeIcon,     ActiveIcon: EnvelopeSolid },
  { to: '/compose',   label: 'Compose',    Icon: PaperAirplaneIcon, ActiveIcon: PaperAirplaneIcon },
  { to: '/campaigns', label: 'Campaigns',  Icon: MegaphoneIcon,    ActiveIcon: MegaphoneSolid },
  { to: '/templates', label: 'Templates',  Icon: DocumentTextIcon, ActiveIcon: DocumentTextIcon },
  { to: '/analytics', label: 'Analytics',  Icon: ChartBarIcon,     ActiveIcon: ChartSolid },
];

const NavItem = ({ to, label, Icon, ActiveIcon, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
        isActive
          ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive
          ? <ActiveIcon className="w-4.5 h-4.5 flex-shrink-0" />
          : <Icon className="w-4.5 h-4.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
        }
        {label}
      </>
    )}
  </NavLink>
);

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ onClose }) => (
    <aside className="flex flex-col h-full w-64 bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-brand">
          <BoltIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">MessageHub</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto btn-ghost btn-sm rounded-lg p-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <NavItem to="/settings" label="Settings" Icon={Cog6ToothIcon} ActiveIcon={Cog6ToothIcon} onClick={onClose} />

        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-slate-900">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-shrink-0 animate-slide-right">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost btn-sm p-1.5">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <BoltIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">MessageHub</span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
