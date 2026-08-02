import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

export const normalizeAppLang = (lang) => {
  const value = String(lang || '').toLowerCase();
  return value.startsWith('en') ? 'en' : 'zh';
};

export const getInitialLang = () => {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // ignore
  }

  const navLang = (navigator.language || '').toLowerCase();
  if (navLang.startsWith('en')) return 'en';
  return 'zh';
};

const initialLang = getInitialLang();

const setDocumentLang = (lang) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = normalizeAppLang(lang) === 'en' ? 'en' : 'zh-CN';
};

const persistLang = (lang) => {
  try {
    localStorage.setItem('lang', normalizeAppLang(lang));
  } catch {
    // ignore
  }
};

export const resolveCurrentLang = (i18nInstance = i18n) => {
  const candidates = [
    i18nInstance?.resolvedLanguage,
    i18nInstance?.language,
    Array.isArray(i18nInstance?.languages) ? i18nInstance.languages[0] : '',
    typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : '',
    typeof document !== 'undefined' ? document.documentElement.lang : '',
    typeof navigator !== 'undefined' ? navigator.language : ''
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    return normalizeAppLang(candidate);
  }

  return 'zh';
};

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en }
  },
  lng: initialLang,
  fallbackLng: 'zh',
  interpolation: { escapeValue: false }
});

setDocumentLang(initialLang);
persistLang(initialLang);
i18n.on('languageChanged', (lang) => {
  const nextLang = normalizeAppLang(lang);
  setDocumentLang(nextLang);
  persistLang(nextLang);
});

export default i18n;
