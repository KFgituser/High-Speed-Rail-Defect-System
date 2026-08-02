import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login.jsx';
import Query from './components/Query.jsx';
import Visualization2DPage from './components/Visualization2DPage.jsx';
import Visualization3DPage from './components/Visualization3DPage.jsx';
import BackToTop from './components/BackToTop.jsx';

function useTitle() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    let nextTitle = '';

    if (path === '/') {
      nextTitle = t('titles.login');
    } else if (path.startsWith('/query')) {
      nextTitle = t('titles.query');
    } else if (path.startsWith('/visualization/2d')) {
      nextTitle = t('titles.viz2d');
    } else if (path.startsWith('/visualization/3d')) {
      nextTitle = t('titles.viz3d');
    }

    if (nextTitle) {
      document.title = nextTitle;
    }
  }, [i18n.language, location.pathname, t]);
}

export default function App() {
  useTitle();

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/query" element={<Query />} />
        <Route path="/visualization/2d" element={<Visualization2DPage />} />
        <Route path="/visualization/2d/:id" element={<Visualization2DPage />} />
        <Route path="/visualization/3d" element={<Visualization3DPage />} />
        <Route path="/visualization/3d/:id" element={<Visualization3DPage />} />
        <Route path="*" element={<div>404</div>} />
      </Routes>
      <BackToTop />
    </>
  );
}
