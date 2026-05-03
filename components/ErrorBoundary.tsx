
import React, { ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
  componentStack?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: any, info: ErrorInfo) {
    console.error("UI crash:", error, info);
    (this as any).setState({
      message: String(error?.message || error),
      componentStack: info?.componentStack || '',
    });
  }

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem('liora-user-profile');
      localStorage.removeItem('liora-needs-onboarding');
    } catch { /* silent */ }
    window.location.reload();
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif' }}>
          <h3 style={{ color: '#c00', marginBottom: 8 }}>Something went wrong</h3>
          <p style={{ color: '#555', marginBottom: 16 }}>
            Your profile data may be in an unexpected format. Click the button below to clear it and start fresh.
          </p>

          <button
            onClick={this.handleClearAndReload}
            style={{
              background: '#18181b', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
              fontSize: 14, fontWeight: 600, marginBottom: 24,
            }}
          >
            Clear Profile Data &amp; Reload
          </button>

          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', color: '#888', fontSize: 12 }}>
              Technical details (for debugging)
            </summary>
            <pre style={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              background: '#f5f5f5', padding: 12, borderRadius: 6,
              fontSize: 11, marginTop: 8, color: '#333',
            }}>
              Error: {this.state.message}{'\n\n'}
              Component stack:{this.state.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
