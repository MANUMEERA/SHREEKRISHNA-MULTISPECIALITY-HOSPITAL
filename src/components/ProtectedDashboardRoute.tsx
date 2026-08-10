import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useNotificationToast } from '../context/NotificationToastContext';
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react';

interface ProtectedDashboardRouteProps {
  allowedRoles: UserRole[];
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  routeName: string;
}

export const ProtectedDashboardRoute: React.FC<ProtectedDashboardRouteProps> = ({
  allowedRoles,
  setActiveTab,
  children,
  routeName
}) => {
  const { user, switchUserRole } = useAuth();
  const { showToast } = useNotificationToast();

  // Inspect user role from user profile or Supabase auth metadata
  const userRole = (user as any)?.user_metadata?.role || user?.role;

  const isAuthorized = user && userRole && allowedRoles.includes(userRole);

  useEffect(() => {
    if (!user) {
      showToast('Authentication Required', `Please log in to access the ${routeName}.`, 'warning');
    } else if (!isAuthorized) {
      showToast('Access Denied', `Your current role (${userRole?.toUpperCase()}) lacks permission for ${routeName}.`, 'warning');
    }
  }, [user, userRole, isAuthorized, routeName, showToast]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Portal Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You must be logged in with appropriate staff credentials to view the <strong className="text-slate-800">{routeName}</strong>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('login')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Go to Login Screen
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Return to Public Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl max-w-lg w-full border border-rose-200 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black uppercase tracking-wider">
              Role Access Permission Guard
            </span>
            <h2 className="text-xl font-black text-slate-900 pt-1">403 Unauthorized Role Access</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your logged-in account role is <strong className="font-mono text-rose-700 uppercase">"{userRole}"</strong>. Accessing <strong className="text-slate-900">{routeName}</strong> requires elevated authorization ({allowedRoles.join(', ').toUpperCase()}).
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Switch Account Role Demo Preset:</span>
            <div className="flex flex-wrap gap-2">
              {allowedRoles.map(role => (
                <button
                  key={role}
                  onClick={async () => {
                    await switchUserRole(role);
                    showToast('Role Switched', `Switched to ${role.toUpperCase()} mode. Access granted.`, 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch to {role.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
