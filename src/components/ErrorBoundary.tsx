import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Renders a visible message instead of a blank screen if the tree throws. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Orbita crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-6">
          <div className="max-w-md rounded-2xl border border-edge bg-white/50 p-6 text-center">
            <h1 className="font-heading text-xl font-semibold text-ink">Something broke</h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink/70">
              The visualizer hit an unexpected error. Reload the page; if it persists, try a
              different image.
            </p>
            <pre className="mt-3 overflow-auto rounded-lg bg-paper p-3 text-left font-mono text-xs text-accent-dark">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg border border-edge bg-paper px-4 py-2 font-heading text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
