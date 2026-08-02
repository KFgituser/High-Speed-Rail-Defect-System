import React from 'react';
import { useTranslation } from 'react-i18next';

const LANG_OPTIONS = [
  { code: 'zh', labelKey: 'language.zh' },
  { code: 'en', labelKey: 'language.en' }
];

export default function LanguageToggle({ className = '' }) {
  const { i18n, t } = useTranslation();
  const current = i18n.language && i18n.language.startsWith('en') ? 'en' : 'zh';

  const setLang = (lang) => {
    if (lang === current) return;
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`lang-toggle ${className}`.trim()}>
      {LANG_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={option.code === current ? 'active' : ''}
          onClick={() => setLang(option.code)}
          aria-pressed={option.code === current}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
