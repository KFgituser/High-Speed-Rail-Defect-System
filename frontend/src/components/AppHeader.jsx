import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { resolveCurrentLang } from '../i18n/index.js';
import '../styles/app-header.css';

export default function AppHeader({ onLogout }) {
  const { t, i18n } = useTranslation();
  const isEnglish = resolveCurrentLang(i18n) === 'en';
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
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

  const text = isEnglish
    ? {
        platform: 'Intelligent Inspection Platform', messages: 'Messages', latest: 'Latest Alarm',
        unread: '12 unread messages', admin: 'Administrator', account: 'Account Settings', logout: 'Log Out',
        accountInfo: 'Account Information', username: 'Username', role: 'Role', roleValue: 'System Administrator',
        accountHint: 'Contact the system administrator to update your profile or password.', close: 'Close', fullscreen: 'Fullscreen'
      }
    : {
        platform: '智能巡检分析平台', messages: '消息中心', latest: '最新告警', unread: '共 12 条未读消息',
        admin: '管理员', account: '账户设置', logout: '退出登录', accountInfo: '账户信息', username: '用户名',
        role: '角色', roleValue: '系统管理员', accountHint: '如需修改账户资料或密码，请联系系统管理员。', close: '关闭', fullscreen: '全屏'
      };

  return (
    <>
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-brand-mark"><img src="/dashboard-train.png" alt="" /></span>
          <h1>{t('header.title')}</h1>
          <span className="portal-brand-divider" />
          <p>{text.platform}</p>
        </div>

        <div className="portal-header-actions">
          <LanguageToggle className="portal-language-toggle" />
          <ThemeToggle className="portal-theme-toggle" />
          <span className="portal-header-divider" />
          <div className="portal-notification-wrap">
            <button type="button" className="portal-header-button" onClick={() => setNotificationOpen((value) => !value)}>
              <span className="portal-bell"><i className="fa-regular fa-bell" /><b>12</b></span>{text.messages}
            </button>
            {notificationOpen ? (
              <div className="portal-notification-popover">
                <strong>{text.latest}</strong><p>DK512+300 · {isEnglish ? 'Rail corrugation' : '钢轨波磨'}</p><small>{text.unread}</small>
              </div>
            ) : null}
          </div>
          <span className="portal-header-divider" />
          <div className="portal-user-wrap" ref={userMenuRef}>
            <button type="button" className={`portal-header-button portal-user ${userMenuOpen ? 'is-open' : ''}`} onClick={() => setUserMenuOpen((value) => !value)}>
              <span><i className="fa-solid fa-user-tie" /></span>{text.admin}<i className="fa-solid fa-angle-down portal-user-chevron" />
            </button>
            {userMenuOpen ? (
              <div className="portal-user-dropdown">
                <button type="button" onClick={() => { setAccountOpen(true); setUserMenuOpen(false); }}><i className="fa-regular fa-user" />{text.account}</button>
                <button type="button" className="logout" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket" />{text.logout}</button>
              </div>
            ) : null}
          </div>
          <span className="portal-header-divider" />
          <button type="button" className="portal-fullscreen" onClick={toggleFullscreen} title={text.fullscreen}><i className="fa-solid fa-expand" /></button>
        </div>
      </header>

      {accountOpen ? (
        <div className="portal-account-mask" onClick={(event) => event.target === event.currentTarget && setAccountOpen(false)}>
          <section className="portal-account-dialog" role="dialog" aria-modal="true" aria-label={text.account}>
            <header><div><i className="fa-solid fa-user-gear" /><span><strong>{text.account}</strong><small>{text.accountInfo}</small></span></div><button type="button" onClick={() => setAccountOpen(false)}><i className="fa-solid fa-xmark" /></button></header>
            <div className="portal-account-body">
              <div className="portal-account-avatar"><i className="fa-solid fa-user-tie" /></div>
              <dl><div><dt>{text.username}</dt><dd>admin</dd></div><div><dt>{text.role}</dt><dd>{text.roleValue}</dd></div></dl>
              <p><i className="fa-solid fa-circle-info" />{text.accountHint}</p>
            </div>
            <footer><button type="button" onClick={() => setAccountOpen(false)}>{text.close}</button></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
