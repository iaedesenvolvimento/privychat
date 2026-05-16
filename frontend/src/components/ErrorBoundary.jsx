import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-ink px-6 py-12 text-mist">
          <div className="glass mx-auto max-w-md rounded-2xl p-6">
            <p className="text-sm font-semibold text-neon">PrivyChat</p>
            <h1 className="mt-3 text-2xl font-bold">Algo saiu do fluxo.</h1>
            <p className="mt-2 text-sm text-slate-300">
              Recarregue o app para iniciar uma nova sessão com segurança.
            </p>
            <button
              className="mt-5 w-full rounded-2xl bg-neon px-4 py-3 font-bold text-ink"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
