import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import '../styles/app-header.css';

export default function AppHeader({ onLogout }) {
  const { t } = useTranslation();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const userMenuRef = useRef(null);
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const username = user.username || t('header.defaultUser');
  const role = user.role || 'USER';

  useEffect(() => {
    const closeMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout?.();
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <>
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-brand-mark"><img src="/dashboard-train.png" alt="" /></span>
          <h1>{t('header.title')}</h1>
          <span className="portal-brand-divider" />
          <p>{t('header.platform')}</p>
        </div>
        <div className="portal-header-actions">
          <LanguageToggle className="portal-language-toggle" />
          <ThemeToggle className="portal-theme-toggle" />
          <span className="portal-header-divider" />
          <div className="portal-notification-wrap">
            <button type="button" className="portal-header-button" onClick={() => setNotificationOpen((value) => !value)}>
              <span className="portal-bell"><i className="fa-regular fa-bell" /><b>12</b></span>{t('header.messages')}
            </button>
            {notificationOpen ? <div className="portal-notification-popover"><strong>{t('header.latestAlarm')}</strong><p>{t('header.alarmExample')}</p><small>{t('header.unread')}</small></div> : null}
          </div>
          <span className="portal-header-divider" />
          <div className="portal-user-wrap" ref={userMenuRef}>
            <button type="button" className={`portal-header-button portal-user ${userMenuOpen ? 'is-open' : ''}`} onClick={() => setUserMenuOpen((value) => !value)}>
              <span><i className="fa-solid fa-user-tie" /></span>{username}<i className="fa-solid fa-angle-down portal-user-chevron" />
            </button>
            {userMenuOpen ? <div className="portal-user-dropdown">
              <button type="button" onClick={() => { setAccountOpen(true); setUserMenuOpen(false); }}><i className="fa-regular fa-user" />{t('header.account')}</button>
              <button type="button" className="logout" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket" />{t('header.logout')}</button>
            </div> : null}
          </div>
          <span className="portal-header-divider" />
          <button type="button" className="portal-fullscreen" onClick={toggleFullscreen} title={t('header.fullscreen')}><i className="fa-solid fa-expand" /></button>
        </div>
      </header>
      {accountOpen ? <div className="portal-account-mask" onClick={(event) => event.target === event.currentTarget && setAccountOpen(false)}>
        <section className="portal-account-dialog" role="dialog" aria-modal="true" aria-label={t('header.account')}>
          <header><div><i className="fa-solid fa-user-gear" /><span><strong>{t('header.account')}</strong><small>{t('header.accountInfo')}</small></span></div><button type="button" onClick={() => setAccountOpen(false)}><i className="fa-solid fa-xmark" /></button></header>
          <div className="portal-account-body"><div className="portal-account-avatar"><i className="fa-solid fa-user-tie" /></div><dl><div><dt>{t('header.username')}</dt><dd>{username}</dd></div><div><dt>{t('header.role')}</dt><dd>{role}</dd></div></dl><p><i className="fa-solid fa-circle-info" />{t('header.accountHint')}</p></div>
          <footer><button type="button" onClick={() => setAccountOpen(false)}>{t('common.close')}</button></footer>
        </section>
      </div> : null}
    </>
  );
}
