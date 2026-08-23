import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TradeOS ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.removeItem('tradeos_temp_draft');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0F1626] border border-[#2A3A5E] rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Application Safe Mode</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                A temporary rendering hiccup occurred. TradeOS has preserved your safe state.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-left overflow-auto max-h-28 text-[11px] font-mono text-rose-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Terminal</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
