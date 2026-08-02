import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle.jsx';
import { resolveCurrentLang } from '../i18n/index.js';
import '../styles/app-header.css';

export default function AppHeader({ onLogout }) {
  const { t, i18n } = useTranslation();
  const isEnglish = resolveCurrentLang(i18n) === 'en';

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>{t('header.title')}</h1>
        <h2 className={isEnglish ? 'header-subtitle-hidden' : ''}>
          High-Speed Rail Defect Query System
        </h2>
      </div>
      <div className="header-right">
        <span className="user-info">{t('header.welcome')}</span>
        <LanguageToggle />
        <button className="logout-btn" onClick={onLogout} type="button">
          {t('header.logout')}
        </button>
      </div>
    </header>
  );
}
