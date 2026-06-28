import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-red-400/25 bg-red-400/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-sm">
          {this.state.error?.message ?? "An unexpected error occurred. Please try refreshing the page."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Page
        </button>
      </div>
    );
  }
}
