import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled page error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-state" role="alert">
          <h1>{this.props.title}</h1>
          <p>{this.props.message}</p>
          <button type="button" onClick={() => this.setState({ hasError: false })}>{this.props.retry}</button>
        </main>
      );
    }
    return this.props.children;
  }
}
