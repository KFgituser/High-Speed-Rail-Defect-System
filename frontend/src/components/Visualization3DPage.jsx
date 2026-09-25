import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/index.js';
import { openAuthorizedSse } from '../api/sse.js';
import { resolveCurrentLang } from '../i18n/index.js';
import AppLayout from './AppLayout.jsx';
import '../styles/visualization-3d.css';

const getLabels = (t) => ({
  back: t('viz3d.back'),
  title: t('viz3d.title'),
  downloadAll: t('viz3d.downloadAll'),
  scatterTitle: t('viz3d.scatterTitle'),
  ampTitle: t('viz3d.ampTitle'),
  generating: t('viz3d.generating'),
  generateFailed: t('viz3d.generateFailed'),
  generateTimeout: t('viz3d.generateTimeout'),
  noImage: t('viz3d.noImage'),
  date: t('viz3d.date'),
  location: t('viz3d.location'),
  download: t('viz3d.download'),
  noDownload: t('viz3d.noDownload'),
  ampGenerating: t('viz3d.ampGenerating'),
  ampGenerate: t('viz3d.ampGenerate'),
  ampGenerateFailed: t('viz3d.ampGenerateFailed'),
  ampGenerateTimeout: t('viz3d.ampGenerateTimeout')
});

const scatterSlotTitle = (index) => `Slot${index + 1} Scatter`;
const ampSlotTitle = (index) => `Slot${index + 1} Amplitude`;

export default function Visualization3DPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || '/api', []);
  const getActiveLang = useCallback(() => resolveCurrentLang(i18n), [i18n]);
  const backendOrigin = useMemo(
    () => apiBase.startsWith('http') ? new URL(apiBase).origin : window.location.origin,
    [apiBase]
  );
  const labels = useMemo(() => getLabels(t), [t]);

  const [runningSlotId, setRunningSlotId] = useState(null);
  const [runStatus, setRunStatus] = useState('idle');
  const [comparisonItems, setComparisonItems] = useState(() =>
    Array.from({ length: 4 }, (_, index) => ({ title: scatterSlotTitle(index), image: '', date: '', location: '' }))
  );

  const [runningSlotIdAmp, setRunningSlotIdAmp] = useState(null);
  const [runStatusAmp, setRunStatusAmp] = useState('idle');
  const [comparisonItems2, setComparisonItems2] = useState(() =>
    Array.from({ length: 4 }, (_, index) => ({ title: ampSlotTitle(index), image: '', date: '', location: '' }))
  );

  const esRef = useRef(null);
  const esAmpRef = useRef(null);
  const poll3DRef = useRef(null);
  const poll3DAmpRef = useRef(null);

  useEffect(() => {
    setComparisonItems((prev) =>
      prev.map((item, index) => ({ ...item, title: scatterSlotTitle(index) }))
    );
    setComparisonItems2((prev) =>
      prev.map((item, index) => ({ ...item, title: ampSlotTitle(index) }))
    );
  }, []);

  const isSlotRunning = useCallback(
    (slotId) => runningSlotId === slotId && runStatus === 'running',
    [runningSlotId, runStatus]
  );

  const isAmpSlotRunning = useCallback(
    (slotId) => runningSlotIdAmp === slotId && runStatusAmp === 'running',
    [runningSlotIdAmp, runStatusAmp]
  );

  const handleLogout = () => navigate('/');
  const goBack = () => navigate('/query');

  const toAbsUrl = useCallback(
    (url) => {
      if (!url) return '';
      return url.startsWith('http') ? url : `${backendOrigin}${url}`;
    },
    [backendOrigin]
  );

  const withCacheBust = useCallback((url) => {
    if (!url) return '';
    return url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
  }, []);

  const downloadImage = useCallback(
    async (url, filename) => {
      try {
        if (!url) return;
        const absUrl = url.startsWith('http') ? url : toAbsUrl(url);
        const urlWithCache = withCacheBust(absUrl);

        const res = await fetch(urlWithCache, {
          method: 'GET',
          credentials: 'include'
        });

        if (!res.ok) {
          throw new Error(t('viz3d.downloadFailedStatus', { status: res.status }));
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = filename || 'image.png';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error(error);
        alert(error?.message || t('viz3d.downloadFailed'));
      }
    },
    [t, toAbsUrl, withCacheBust]
  );

  const downloadAllImages = useCallback(() => {
    const items = [...comparisonItems, ...comparisonItems2];
    items.forEach((item, index) => {
      if (item.image) {
        downloadImage(item.image, `${item.title || 'image'}-${index + 1}.png`);
      }
    });
  }, [comparisonItems, comparisonItems2, downloadImage]);

  const cleanupSse = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (poll3DRef.current) {
      clearInterval(poll3DRef.current);
      poll3DRef.current = null;
    }
  }, []);

  const cleanupSseAmp = useCallback(() => {
    if (esAmpRef.current) {
      esAmpRef.current.close();
      esAmpRef.current = null;
    }
    if (poll3DAmpRef.current) {
      clearInterval(poll3DAmpRef.current);
      poll3DAmpRef.current = null;
    }
  }, []);

  const updateItem = useCallback((slotId, updater) => {
    const index = slotId - 1;
    if (index < 0 || index > 3) return;
    setComparisonItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updater(next[index]) };
      return next;
    });
  }, []);

  const updateAmpItem = useCallback((slotId, updater) => {
    const index = slotId - 1;
    if (index < 0 || index > 3) return;
    setComparisonItems2((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updater(next[index]) };
      return next;
    });
  }, []);

  const loadLatest3D = useCallback(
    async (slotId) => {
      const { data } = await api.get('/viz/run3d/latest', { params: { slotId } });
      const start = data?.startLabel || '';
      const end = data?.endLabel || '';
      const img = data?.imageUrl ? withCacheBust(toAbsUrl(data.imageUrl)) : '';

      updateItem(slotId, () => ({
        image: img,
        date: data?.date || '',
        location: start && end ? `${start} - ${end}` : data?.location || ''
      }));
      return data;
    },
    [toAbsUrl, updateItem, withCacheBust]
  );

  const loadLatest3DAmp = useCallback(
    async (slotId) => {
      const { data } = await api.get('/viz/run3damp/latest', { params: { slotId } });
      const start = data?.startLabel || '';
      const end = data?.endLabel || '';
      const img = data?.imageUrl ? withCacheBust(toAbsUrl(data.imageUrl)) : '';

      updateAmpItem(slotId, () => ({
        image: img,
        date: data?.date || '',
        location: start && end ? `${start} - ${end}` : data?.location || ''
      }));
    },
    [toAbsUrl, updateAmpItem, withCacheBust]
  );

  const handleDone = useCallback(
    async (slotId) => {
      cleanupSse();
      try {
        await loadLatest3D(slotId);
        setRunStatus('success');
        setRunningSlotId(null);
      } catch (error) {
        console.error('[3D] loading generated image failed', error);
        setRunStatus('error');
      }
    },
    [cleanupSse, loadLatest3D]
  );

  const watch3D = useCallback(
    (runUuid, slotId) => {
      cleanupSse();
      setRunningSlotId(slotId);
      setRunStatus('running');

      let settled = false;
      let pollFailures = 0;
      const settle = async (status) => {
        if (settled) return;
        settled = true;
        if (status === 'success') {
          await handleDone(slotId);
        } else {
          setRunStatus(status === 'timeout' ? 'timeout' : 'error');
          cleanupSse();
        }
      };

      const url = `${apiBase}/viz/run3d/stream?runUuid=${encodeURIComponent(runUuid)}`;
      esRef.current = openAuthorizedSse(url, {
        onEvent: async ({ event, data }) => {
          if (event === 'done') {
            await settle(data);
            return;
          }
          if (event === 'log') console.log('[3D][log]', data || '');
        },
        onError: (error) => {
          console.error('[3D] SSE error', error);
          esRef.current?.close();
          esRef.current = null;
        }
      });

      poll3DRef.current = setInterval(async () => {
        try {
          const { data } = await api.get('/viz/run3d/status', { params: { runUuid } });
          pollFailures = 0;
          if (['success', 'error', 'timeout'].includes(data?.status)) {
            await settle(data.status);
          }
        } catch (error) {
          console.warn('[3D] status polling failed', error);
          pollFailures += 1;
          if (pollFailures >= 3) await settle('error');
        }
      }, 1500);
    },
    [apiBase, cleanupSse, handleDone]
  );

  const handleAmpDone = useCallback(
    async (slotId) => {
      cleanupSseAmp();
      try {
        await loadLatest3DAmp(slotId);
        setRunStatusAmp('success');
        setRunningSlotIdAmp(null);
      } catch (error) {
        console.error('[3D-AMP] loading generated image failed', error);
        setRunStatusAmp('error');
      }
    },
    [cleanupSseAmp, loadLatest3DAmp]
  );

  const watch3DAmp = useCallback(
    (runUuid, slotId) => {
      cleanupSseAmp();
      setRunningSlotIdAmp(slotId);
      setRunStatusAmp('running');

      let settled = false;
      let pollFailures = 0;
      const settle = async (status) => {
        if (settled) return;
        settled = true;
        if (status === 'success') {
          await handleAmpDone(slotId);
        } else {
          setRunStatusAmp(status === 'timeout' ? 'timeout' : 'error');
          cleanupSseAmp();
        }
      };

      const url = `${apiBase}/viz/run3damp/stream?runUuid=${encodeURIComponent(runUuid)}`;
      esAmpRef.current = openAuthorizedSse(url, {
        onEvent: async ({ event, data }) => {
          if (event === 'done') {
            await settle(data);
            return;
          }
          if (event === 'log') console.log('[3D-AMP][log]', data || '');
        },
        onError: (error) => {
          console.error('[3D-AMP] SSE error', error);
          esAmpRef.current?.close();
          esAmpRef.current = null;
        }
      });

      poll3DAmpRef.current = setInterval(async () => {
        try {
          const { data } = await api.get('/viz/run3damp/status', { params: { runUuid } });
          pollFailures = 0;
          if (['success', 'error', 'timeout'].includes(data?.status)) {
            await settle(data.status);
          }
        } catch (error) {
          console.warn('[3D-AMP] status polling failed', error);
          pollFailures += 1;
          if (pollFailures >= 3) await settle('error');
        }
      }, 1500);
    },
    [apiBase, cleanupSseAmp, handleAmpDone]
  );

  const generate3DAmplitude = useCallback(
    async (slotId) => {
      try {
        if (isAmpSlotRunning(slotId)) return;

        setRunStatusAmp('running');
        setRunningSlotIdAmp(slotId);

        const lang = getActiveLang();
        const { data } = await api.post('/viz/run3damp/start', null, { params: { slotId, lang } });
        const runUuid = data?.runUuid || data?.uuid || data?.id;
        if (!runUuid) {
          await loadLatest3DAmp(slotId);
          setRunStatusAmp('success');
          setRunningSlotIdAmp(null);
          return;
        }

        watch3DAmp(String(runUuid), slotId);
      } catch (error) {
        console.error(error);
        setRunStatusAmp('error');
        setRunningSlotIdAmp(null);
        alert(error?.response?.data?.message || error?.message || t('viz3d.ampGenerateFailed'));
      }
    },
    [getActiveLang, isAmpSlotRunning, loadLatest3DAmp, t, watch3DAmp]
  );

  useEffect(() => {
    const init = async () => {
      for (let slot = 1; slot <= 4; slot += 1) {
        try {
          await loadLatest3D(slot);
        } catch {
          // ignore
        }
      }

      for (let slot = 1; slot <= 4; slot += 1) {
        try {
          await loadLatest3DAmp(slot);
        } catch {
          // ignore
        }
      }

      const params = new URLSearchParams(location.search);
      const slotId = Number(params.get('slotId') || 0);
      const runUuid = String(params.get('runUuid') || '');
      if (slotId >= 1 && slotId <= 4 && runUuid) {
        watch3D(runUuid, slotId);
      }
    };

    init();
    return () => {
      cleanupSse();
      cleanupSseAmp();
    };
  }, [cleanupSse, cleanupSseAmp, loadLatest3D, loadLatest3DAmp, location.search, watch3D]);

  return (
    <AppLayout onLogout={handleLogout}>
      <header className="visualization-header">
        <button className="back-btn" onClick={goBack} type="button">
          {labels.back}
        </button>
        <h1>{labels.title}</h1>
        <div className="header-actions">
          <button className="btn-download-all" onClick={downloadAllImages} type="button">
            {labels.downloadAll}
          </button>
        </div>
      </header>

      <div className="visualization-section">
        <h2>{labels.scatterTitle}</h2>
        <div className="visualization-grid">
          {comparisonItems.map((item, index) => (
            <div className="view-container" key={`scatter-${index}`}>
              <h3>{item.title}</h3>
              <div className="image-container">
                {runningSlotId === index + 1 && ['error', 'timeout'].includes(runStatus) ? (
                  <div className="image-placeholder" role="alert">
                    {runStatus === 'timeout' ? labels.generateTimeout : labels.generateFailed}
                  </div>
                ) : isSlotRunning(index + 1) ? (
                  <div className="image-placeholder loading">{labels.generating}</div>
                ) : item.image ? (
                  <div className="scatter-image-frame">
                    <img src={item.image} alt={item.title} className="visualization-image scatter-image" />
                  </div>
                ) : (
                  <div className="image-placeholder">{labels.noImage}</div>
                )}

                <div className="image-info">
                  <p>
                    <strong>{labels.date}:</strong> {item.date || '\u2014'}
                  </p>
                  <p>
                    <strong>{labels.location}:</strong> {item.location || '\u2014'}
                  </p>
                </div>
                <div className="image-actions">
                  <button
                    className="btn-download"
                    type="button"
                    disabled={!item.image}
                    onClick={() => downloadImage(item.image, `${item.title}.png`)}
                  >
                    {item.image ? labels.download : labels.noDownload}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="visualization-section">
        <h2>{labels.ampTitle}</h2>
        <div className="visualization-grid">
          {comparisonItems2.map((item, index) => (
            <div className="view-container" key={`amp-${index}`}>
              <h3>{item.title}</h3>
              <div className="image-container">
                {runningSlotIdAmp === index + 1 && ['error', 'timeout'].includes(runStatusAmp) ? (
                  <div className="image-placeholder" role="alert">
                    {runStatusAmp === 'timeout' ? labels.ampGenerateTimeout : labels.ampGenerateFailed}
                  </div>
                ) : isAmpSlotRunning(index + 1) ? (
                  <div className="image-placeholder loading">{labels.ampGenerating}</div>
                ) : item.image ? (
                  <img src={item.image} alt={item.title} className="visualization-image" />
                ) : (
                  <div className="image-placeholder">{labels.noImage}</div>
                )}

                <div className="image-info">
                  <p>
                    <strong>{labels.date}:</strong> {item.date || '\u2014'}
                  </p>
                  <p>
                    <strong>{labels.location}:</strong> {item.location || '\u2014'}
                  </p>
                </div>
                <div className="image-actions">
                  <button
                    className="btn-generate-amp"
                    type="button"
                    disabled={isAmpSlotRunning(index + 1)}
                    onClick={() => generate3DAmplitude(index + 1)}
                  >
                    {isAmpSlotRunning(index + 1) ? labels.ampGenerating : labels.ampGenerate}
                  </button>
                  <button
                    className="btn-download"
                    type="button"
                    disabled={!item.image}
                    onClick={() => downloadImage(item.image, `${item.title}.png`)}
                  >
                    {item.image ? labels.download : labels.noDownload}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
