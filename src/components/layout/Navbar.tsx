import React, { useState } from 'react';
import { Bell, User, Calendar, Shield, LogOut, Menu, X, ChevronDown, CheckCircle2, FileText, Stethoscope, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HospitalLogo } from '../common/HospitalLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiBot?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAiBot }) => {
  const { user, role, logout, notifications, unreadCount, markNotificationRead } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'departments', label: 'Departments' },
    { id: 'doctors', label: 'Our Doctors' },
    { id: 'dashboard', label: 'Patient Portal' },
    { id: 'doctor_panel', label: 'Doctor Panel', badge: role === 'doctor' ? 'DOCTOR' : 'CONSULT' },
    ...(role === 'admin' || role === 'staff' || role === 'super_admin'
      ? [{ id: 'admin', label: 'Admin Panel', badge: 'ADMIN' }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 xl:gap-6">
        
        {/* Brand Logo on Left Side */}
        <div className="flex items-center flex-shrink-0 mr-2 xl:mr-4">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 group text-left focus:outline-none flex-shrink-0 cursor-pointer"
          >
            <HospitalLogo size="md" variant="full" theme="light" />
          </button>
        </div>


        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-shrink-0">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`group relative px-2.5 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/90 hover:shadow-sm hover:scale-[1.02] active:scale-95'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'bg-amber-500 text-white group-hover:bg-amber-600 group-hover:scale-105'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & User Menu */}
        <div className="hidden md:flex items-center gap-2 xl:gap-3 flex-shrink-0">
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300 hover:scale-110 hover:shadow-md transition-all duration-200 relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" /> Notifications
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">{notifications.length} total</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No recent notifications.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                          notif.read ? 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50/70 border-emerald-200 text-slate-900 font-medium hover:bg-emerald-100/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-emerald-800">{notif.title}</span>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed mb-1">{notif.message}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/80 hover:shadow-md hover:scale-[1.03] transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs border border-emerald-300">
                  {user.full_name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-black text-slate-900 leading-tight">{user.full_name}</div>
                  <div className="text-[10px] text-emerald-700 font-bold capitalize">{role.replace('_', ' ')}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl mb-1">
                    <p className="text-xs font-black text-slate-900">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-200">
                        {role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {(role === 'admin' || role === 'staff' || role === 'super_admin' || role === 'receptionist') && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-800 hover:bg-amber-100/80 hover:text-amber-900 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-600" /> Admin / Staff Portal
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      setActiveTab('home');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-100/80 hover:text-rose-800 transition-all flex items-center gap-2 mt-1 border-t border-slate-100 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" /> LOGOUT / EXIT WORKSPACE
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="px-4 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 font-bold text-xs hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-4 h-4" /> Login / Signup
            </button>
          )}

          {/* AI Desk Chatbot Button */}
          {onOpenAiBot && (
            <button
              onClick={onOpenAiBot}
              className="px-3 xl:px-3.5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer border border-teal-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
              title="Open 24/7 AI Desk Assistant"
            >
              <Bot className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>AI Desk</span>
            </button>
          )}

          {/* Book Appointment CTA */}
          <button
            onClick={() => setActiveTab('booking')}
            className="px-3.5 xl:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-teal-500 hover:via-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Calendar className="w-4 h-4" /> Book Appointment
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === link.id
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {onOpenAiBot && (
              <button
                onClick={() => {
                  onOpenAiBot();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <Bot className="w-4 h-4 text-emerald-300" /> 24/7 AI Desk Assistant
              </button>
            )}

            {!user ? (
              <button
                onClick={() => {
                  setActiveTab('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" /> Login / Register
              </button>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  setActiveTab('home');
                }}
                className="w-full py-3 rounded-xl bg-rose-50 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> LOGOUT / EXIT WORKSPACE
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('booking');
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <Calendar className="w-4 h-4" /> Book Appointment Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
