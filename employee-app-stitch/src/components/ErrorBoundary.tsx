import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Global error boundary.
 *
 * The reported symptom was a white-screen JS crash on mobile. Whatever the root
 * cause, this guarantees the user never sees a blank tab: any uncaught render
 * error shows a friendly reload card instead. Privacy-first: errors are logged
 * to the console only, never sent anywhere.
 */
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('PulsePath crashed:', error, info);
  }

  private reload = (): void => {
    try {
      window.location.reload();
    } catch {
      /* noop */
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-margin-mobile text-center">
        <div className="w-full max-w-md flex flex-col items-center gap-md">
          <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-background">
            Something went wrong
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            PulsePath hit an unexpected error. Your data is safe on this device.
          </p>
          {this.state.message && (
            <p className="font-caption text-caption text-outline-variant break-all">
              {this.state.message}
            </p>
          )}
          <button
            onClick={this.reload}
            className="mt-sm bg-primary text-on-primary font-label-bold text-label-bold px-xl py-4 rounded-2xl active:scale-95 transition shadow-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
