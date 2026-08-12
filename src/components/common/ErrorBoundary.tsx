import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleClearStorageAndReset = () => {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Shree Krishna Multispeciality Hospital
              </h2>
              <p className="text-xs font-semibold text-amber-400 mt-1 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Portal Session Recovery Mode
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left font-mono overflow-auto max-h-32">
              {this.state.error?.message || 'An unexpected runtime error occurred.'}
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Reload Portal Home
              </button>

              <button
                onClick={this.handleClearStorageAndReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-600/80 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Home className="w-3.5 h-3.5" /> Clear Cache & Hard Reset
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              Need assistance? Helpline: +91 90990 57219 • shreekrishnamultispeciality.sil@gmail.com
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
