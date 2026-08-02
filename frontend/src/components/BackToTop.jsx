import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/back-to-top.css';

const THRESHOLD = 200;

export default function BackToTop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setVisible(window.scrollY > THRESHOLD);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  if (!visible) return null;

  return (
    <button
      className="back-to-top"
      onClick={scrollTop}
      aria-label={t('common.backToTop')}
      type="button"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5h10v2H7z" />
        <path d="M12 6l-6 6h4v6h4v-6h4z" />
      </svg>
    </button>
  );
}
