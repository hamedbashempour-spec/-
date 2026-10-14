import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 dir-rtl text-right font-sans">
          <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-slate-100">
                بروز خطای غیرمنتظره در برنامه
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                سامانه به طور خودکار مانع از بسته شدن صفحه شد. می‌توانید صفحه را بازیابی فرمایید.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 text-[11px] font-mono text-rose-300 break-all text-left dir-ltr max-h-28 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>تلاش مجدد</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>صفحه اصلی</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
