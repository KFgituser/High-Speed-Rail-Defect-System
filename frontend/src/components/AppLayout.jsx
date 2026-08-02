import React from 'react';
import AppHeader from './AppHeader.jsx';
import '../styles/app-layout.css';

export default function AppLayout({ children, onLogout }) {
  return (
    <div className="main-container">
      <AppHeader onLogout={onLogout} />
      <main className="page-body">{children}</main>
    </div>
  );
}
