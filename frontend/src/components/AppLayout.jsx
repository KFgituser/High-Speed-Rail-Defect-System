import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader.jsx';
import '../styles/app-layout.css';

const navItems = [
  { key: 'overview', icon: 'fa-map', path: '/dashboard' },
  { key: 'realtime', icon: 'fa-triangle-exclamation' },
  { key: 'query', icon: 'fa-magnifying-glass', path: '/query' },
  { key: '2d', icon: 'fa-cube', path: '/visualization/2d' },
  { key: '3d', icon: 'fa-cubes', path: '/visualization/3d' },
  { key: 'analytics', icon: 'fa-chart-column' },
  { key: 'devices', icon: 'fa-display' },
  { key: 'reports', icon: 'fa-rectangle-list' },
  { key: 'system', icon: 'fa-gear' }
];

export default function AppLayout({ children, onLogout }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeKey = location.pathname.startsWith('/visualization/2d') ? '2d'
    : location.pathname.startsWith('/visualization/3d') ? '3d'
      : location.pathname.startsWith('/query') ? 'query' : 'overview';

  return (
    <div className="main-container portal-app">
      <AppHeader onLogout={onLogout} />
      <div className="portal-shell">
        <aside className={`portal-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
          <nav>
            {navItems.map((item) => (
              <button key={item.key} type="button" className={`portal-nav-item ${activeKey === item.key ? 'active' : ''}`} title={t(`nav.${item.key}`)} onClick={() => item.path && navigate(item.path)}>
                <i className={`fa-solid ${item.icon}`} /><span>{t(`nav.${item.key}`)}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="portal-collapse" onClick={() => setCollapsed((value) => !value)}>
            <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} /><span>{t('nav.collapse')}</span>
          </button>
        </aside>
        <main className="page-body">{children}</main>
      </div>
      <footer className="portal-footer">
        <span><i />{t('footer.systemStatus')}: <b>{t('footer.normal')}</b></span>
        <span>{t('footer.lastUpdated')}: {clock.toLocaleDateString('zh-CN').replaceAll('/', '-')} {clock.toLocaleTimeString('zh-CN', { hour12: false })}</span>
        <span>{t('footer.currentLine')}</span>
      </footer>
    </div>
  );
}
