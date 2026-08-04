import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader.jsx';
import { resolveCurrentLang } from '../i18n/index.js';
import '../styles/app-layout.css';

const navItems = [
  { key: 'overview', zh: '线路总览', en: 'Line Overview', icon: 'fa-map', path: '/dashboard' },
  { key: 'realtime', zh: '实时监测', en: 'Live Monitoring', icon: 'fa-triangle-exclamation' },
  { key: 'query', zh: '病害查询', en: 'Defect Query', icon: 'fa-magnifying-glass', path: '/query' },
  { key: '2d', zh: '2D分析', en: '2D Analysis', icon: 'fa-cube', path: '/visualization/2d' },
  { key: '3d', zh: '3D分析', en: '3D Analysis', icon: 'fa-cubes', path: '/visualization/3d' },
  { key: 'analytics', zh: '数据分析', en: 'Data Analytics', icon: 'fa-chart-column' },
  { key: 'devices', zh: '设备监测', en: 'Devices', icon: 'fa-display' },
  { key: 'reports', zh: '报表管理', en: 'Reports', icon: 'fa-rectangle-list' },
  { key: 'system', zh: '系统管理', en: 'System', icon: 'fa-gear' }
];

export default function AppLayout({ children, onLogout }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isEnglish = resolveCurrentLang(i18n) === 'en';
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeKey = location.pathname.startsWith('/visualization/2d')
    ? '2d'
    : location.pathname.startsWith('/visualization/3d')
      ? '3d'
      : location.pathname.startsWith('/query')
        ? 'query'
        : 'overview';

  return (
    <div className={`main-container portal-app ${isEnglish ? 'is-english' : ''}`}>
      <AppHeader onLogout={onLogout} />
      <div className="portal-shell">
        <aside className={`portal-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
          <nav>
            {navItems.map((item) => (
              <button key={item.key} type="button" className={`portal-nav-item ${activeKey === item.key ? 'active' : ''}`} title={isEnglish ? item.en : item.zh} onClick={() => item.path && navigate(item.path)}>
                <i className={`fa-solid ${item.icon}`} /><span>{isEnglish ? item.en : item.zh}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="portal-collapse" onClick={() => setCollapsed((value) => !value)}>
            <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} /><span>{isEnglish ? 'Collapse' : '收起'}</span>
          </button>
        </aside>
        <main className="page-body">{children}</main>
      </div>
      <footer className="portal-footer">
        <span><i />{isEnglish ? 'System' : '系统状态'}：<b>{isEnglish ? 'Normal' : '正常'}</b></span>
        <span>{isEnglish ? 'Last updated' : '数据更新时间'}：{clock.toLocaleDateString('zh-CN').replaceAll('/', '-')} {clock.toLocaleTimeString('zh-CN', { hour12: false })}</span>
        <span>{isEnglish ? 'Current line: Beijing–Shanghai HSR' : '当前线路：京沪高铁'}（DK0+000 ~ DK1318+000）</span>
      </footer>
    </div>
  );
}
