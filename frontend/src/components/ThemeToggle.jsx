import React, { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveCurrentLang } from '../i18n/index.js';

const THEME_STORAGE_KEY = 'rail-system-theme';

function readTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the current page theme even if local storage is unavailable.
  }
}

export default function ThemeToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const isEnglish = resolveCurrentLang(i18n) === 'en';
  const [theme, setTheme] = useState(readTheme);
  const isLight = theme === 'light';
  const label = isEnglish
    ? `Switch to ${isLight ? 'dark' : 'light'} theme`
    : `切换至${isLight ? '暗色' : '亮色'}系统`;

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      className={`${className} system-theme-toggle ${isLight ? 'is-light' : ''}`.trim()}
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      title={label}
      aria-label={label}
      aria-pressed={isLight}
    >
      <i className={`${isLight ? 'fa-solid' : 'fa-regular'} fa-lightbulb`} aria-hidden="true" />
    </button>
  );
}
