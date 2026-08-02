import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/index.js';
import { resolveCurrentLang } from '../i18n/index.js';
import AppLayout from './AppLayout.jsx';
import '../styles/visualization-2d.css';

const LINE_OPTIONS = [
  { value: '\u4eac\u6caa\u9ad8\u94c1', label: '\u4eac\u6caa\u9ad8\u94c1', min: 0, max: 1318 },
  { value: '\u4eac\u5e7f\u9ad8\u94c1', label: '\u4eac\u5e7f\u9ad8\u94c1', min: 0, max: 2298 },
  { value: '\u6caa\u6606\u9ad8\u94c1', label: '\u6caa\u6606\u9ad8\u94c1', min: 0, max: 2252 },
  { value: '\u54c8\u5927\u9ad8\u94c1', label: '\u54c8\u5927\u9ad8\u94c1', min: 0, max: 921 }
];

const YEARS = [2022, 2023, 2024, 2025];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const ANALYSIS_API = '/analysis-results';
const ANALYSIS_ROW_KEYS = ['total', 'damage', 'crack', 'diagonal', 'mud', 'time'];
const slotTitle = (index) => `Slot ${index + 1}`;

const buildAnalysisRows = () =>
  ANALYSIS_ROW_KEYS.map((key) => ({
    key,
    v1: '-',
    v2: '-',
    v3: '-',
    v4: '-'
  }));

const pickMetric = (metrics, keys, fallback = 0) => {
  for (const key of keys) {
    if (metrics?.[key] !== undefined && metrics?.[key] !== null) return metrics[key];
  }
  return fallback;
};

const normalizeDefectType = (value) => {
  const cls = String(value || '').trim().toLowerCase();
  if (!cls) return '';
  if (cls.includes('damage') || cls.includes('\u7834\u635f') || cls.includes('\u942e') || cls.includes('ç ´')) return 'damage';
  if (cls.includes('diagonal') || cls.includes('\u659c\u88c2\u7eb9') || cls.includes('\u659c') || cls.includes('æ–œ')) return 'diagonal';
  if (cls.includes('crack') || cls.includes('\u88c2\u7eb9') || cls.includes('\u7441') || cls.includes('è£')) return 'crack';
  if (cls.includes('mud') || cls.includes('\u5192\u6d46') || cls.includes('\u9346') || cls.includes('\u6d46') || cls.includes('å') || cls.includes('æµ')) return 'mud';
  return '';
};

export default function Visualization2DPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:8080/api', []);
  const getActiveLang = useCallback(() => resolveCurrentLang(i18n), [i18n]);
  const backendOrigin = useMemo(() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return window.location.origin;
    }
  }, [apiBase]);
  const vizOutBase = useMemo(() => `${backendOrigin}/viz-out`, [backendOrigin]);

  const [resultTarget, setResultTarget] = useState(null);
  const resultTargetRef = useRef(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const pendingActionRef = useRef(null);

  const [defectId, setDefectId] = useState('');
  const [viewType, setViewType] = useState('both');
  const [defectData, setDefectData] = useState({});
  const [image2D, setImage2D] = useState('');
  const [image3D, setImage3D] = useState('');
  const [analysisData, setAnalysisData] = useState(null);

  const [imgStartLabel, setImgStartLabel] = useState('');
  const [imgEndLabel, setImgEndLabel] = useState('');

  const [currentFile, setCurrentFile] = useState('');
  const [liveOpen, setLiveOpen] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [runStatus, setRunStatus] = useState('running');
  const [exitCode, setExitCode] = useState(null);
  const [seenDone, setSeenDone] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const [startKm, setStartKm] = useState(0);
  const [startM, setStartM] = useState(0);
  const [endKm, setEndKm] = useState(0);
  const [endM, setEndM] = useState(0);

  const [gen3dBusyIndex, setGen3dBusyIndex] = useState(null);

  const [selectedLine, setSelectedLine] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [currentLineMin, setCurrentLineMin] = useState(0);
  const [currentLineMax, setCurrentLineMax] = useState(3000);

  const [startYear, setStartYear] = useState(2022);
  const [endYear, setEndYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [lastIndex, setLastIndex] = useState(-1);
  const [runningAnalyze, setRunningAnalyze] = useState(false);

  const [comparisonItems, setComparisonItems] = useState(() =>
    Array.from({ length: 4 }, (_, index) => ({
      title: slotTitle(index),
      location: '',
      startLabel: '',
      endLabel: '',
      image: ''
    }))
  );

  const [analysisRows, setAnalysisRows] = useState(() => buildAnalysisRows());

  const esRef = useRef(null);
  const previewTimerRef = useRef(null);
  const seenDoneRef = useRef(false);
  const progressTotalRef = useRef(0);
  const isDraggingRef = useRef(isDragging);
  const activeHandleRef = useRef(activeHandle);
  const currentLineMinRef = useRef(currentLineMin);
  const currentLineMaxRef = useRef(currentLineMax);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    activeHandleRef.current = activeHandle;
  }, [activeHandle]);

  useEffect(() => {
    currentLineMinRef.current = currentLineMin;
  }, [currentLineMin]);

  useEffect(() => {
    currentLineMaxRef.current = currentLineMax;
  }, [currentLineMax]);

  useEffect(() => {
    seenDoneRef.current = seenDone;
  }, [seenDone]);

  useEffect(() => {
    resultTargetRef.current = resultTarget;
  }, [resultTarget]);

  useEffect(() => {
    setComparisonItems((prev) =>
      prev.map((item, index) => ({ ...item, title: slotTitle(index) }))
    );
  }, []);

  const progressPercent = useMemo(() => {
    if (!progressTotal) return 0;
    return Math.min(100, Math.round((progressCurrent / progressTotal) * 100));
  }, [progressCurrent, progressTotal]);

  const clampMPart = useCallback((value) => {
    const next = Math.round(Number(value) || 0);
    return Math.max(0, Math.min(999, next));
  }, []);

  const clampAbs = useCallback(
    (meters) => {
      const min = currentLineMin * 1000;
      const max = currentLineMax * 1000;
      return Math.min(max, Math.max(min, meters));
    },
    [currentLineMin, currentLineMax]
  );

  const startAbsMeters = useMemo(
    () => clampAbs(startKm * 1000 + clampMPart(startM)),
    [clampAbs, clampMPart, startKm, startM]
  );

  const endAbsMeters = useMemo(
    () => clampAbs(endKm * 1000 + clampMPart(endM)),
    [clampAbs, clampMPart, endKm, endM]
  );

  const formatAbsMetersToK = useCallback((absMeters) => {
    const km = Math.floor(absMeters / 1000);
    const m = absMeters % 1000;
    return `K${km}+${String(m).padStart(3, '0')}`;
  }, []);

  const displayStartText = useMemo(() => formatAbsMetersToK(startAbsMeters), [formatAbsMetersToK, startAbsMeters]);
  const displayEndText = useMemo(() => formatAbsMetersToK(endAbsMeters), [formatAbsMetersToK, endAbsMeters]);

  const minPercent = useMemo(() => {
    const rangeMeters = (currentLineMax - currentLineMin) * 1000;
    if (!rangeMeters) return 0;
    return ((startAbsMeters - currentLineMin * 1000) / rangeMeters) * 100;
  }, [currentLineMax, currentLineMin, startAbsMeters]);

  const maxPercent = useMemo(() => {
    const rangeMeters = (currentLineMax - currentLineMin) * 1000;
    if (!rangeMeters) return 100;
    return ((endAbsMeters - currentLineMin * 1000) / rangeMeters) * 100;
  }, [currentLineMax, currentLineMin, endAbsMeters]);

  const ticks = useMemo(() => {
    const next = [];
    for (let i = 0; i <= 4; i += 1) next.push({ percent: i * 25, major: true });
    for (let i = 5; i < 100; i += 5) {
      if (i % 25 !== 0) next.push({ percent: i, major: false });
    }
    return next;
  }, []);

  const labels = useMemo(() => {
    const next = [];
    const rangeMeters = (currentLineMax - currentLineMin) * 1000;
    [0, 25, 50, 75, 100].forEach((percent) => {
      const absMeters = Math.round(currentLineMin * 1000 + (percent / 100) * rangeMeters);
      next.push({ percent, text: formatAbsMetersToK(absMeters), major: true });
    });
    return next;
  }, [currentLineMax, currentLineMin, formatAbsMetersToK]);

  const selectedFiles = useMemo(() => {
    return Array.from(selected)
      .sort((a, b) => a - b)
      .map((index) => files[index])
      .filter(Boolean);
  }, [files, selected]);

  const selectedFileName = useMemo(() => selectedFiles[0]?.name || '', [selectedFiles]);

  const currentThumbUrl = useMemo(() => {
    const found = files.find((item) => item.name === selectedFileName);
    return found?.thumbUrl || '';
  }, [files, selectedFileName]);

  const filteredFiles = useMemo(() => {
    const key = fileSearch.trim().toLowerCase();
    if (!key) return files;
    return files.filter((item) => item.name.toLowerCase().includes(key));
  }, [fileSearch, files]);

  const handleLogout = () => navigate('/');
  const goBack = () => navigate('/query');

  const onImgError = (index) => {
    console.error(`Error loading image for index: ${index}`);
  };

  const goToDashboard = () => {
    window.open(
      'http://localhost:8075/webroot/decision/view/duchamp?viewlet=%25E4%25BA%25AC%25E6%25B2%25AA%25E9%25AB%2598%25E9%2593%2581FVS.fvs%252F%25E4%25BA%25AC%25E6%25B2%25AA%25E9%25AB%2598%25E9%2593%2581FVS.fvs&page_number=1'
    );
  };

  const onStartPartChange = () => {
    const nextStartM = clampMPart(startM);
    setStartM(nextStartM);
  };

  const onEndPartChange = () => {
    const nextEndM = clampMPart(endM);
    setEndM(nextEndM);
  };

  const onItemClick = (idx, event) => {
    const isShift = event.shiftKey;
    const isToggle = event.ctrlKey || event.metaKey;
    setSelected((prev) => {
      const next = new Set(prev);
      if (isShift && lastIndex !== -1) {
        const start = Math.min(lastIndex, idx);
        const end = Math.max(lastIndex, idx);
        if (!isToggle) next.clear();
        for (let i = start; i <= end; i += 1) next.add(i);
      } else if (isToggle) {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setLastIndex(idx);
      } else {
        next.clear();
        next.add(idx);
        setLastIndex(idx);
      }
      return next;
    });
  };

  const isSelected = (idx) => selected.has(idx);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`${apiBase}/files`);
      const data = await res.json();
      const nextFiles = Array.isArray(data) ? data : [];
      setFiles(nextFiles);
      setSelected((prev) => {
        if (prev.size || !nextFiles.length) return prev;
        const next = new Set();
        next.add(0);
        setLastIndex(0);
        return next;
      });
    } catch (error) {
      console.error('[files] load error', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const onAnalyzeDoneForChart2 = (url) => {
    window.__chart2__ = url;
    console.log('[Analyze OK][chart2]', url);
  };

  const runAnalyzeForChart2 = async () => {
    if (!selectedFileName) return;
    setRunningAnalyze(true);
    try {
      const form = new URLSearchParams();
      form.set('filename', selectedFileName);
      const res = await fetch(`${apiBase}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form
      });
      const data = await res.json();
      if (data?.imageUrl) {
        onAnalyzeDoneForChart2(data.imageUrl);
      }
    } catch (error) {
      console.error('[analyze] error', error);
    } finally {
      setRunningAnalyze(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const pad = (num) => (num < 10 ? `0${num}` : String(num));
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const openTargetDialog = (action) => {
    pendingActionRef.current = action;
    if (resultTarget === null) {
      const idx = comparisonItems.findIndex((item) => !item.image || item.image.includes('/image/Compare2'));
      const nextTarget = idx >= 0 ? idx : 0;
      setResultTarget(nextTarget);
      resultTargetRef.current = nextTarget;
    }
    setShowTargetDialog(true);
  };

  const confirmTarget = () => {
    setShowTargetDialog(false);
    if (pendingActionRef.current) {
      pendingActionRef.current(resultTargetRef.current);
      pendingActionRef.current = null;
    }
  };

  const setAnalysisCol = (colIdx, dto) => {
    const key = `v${colIdx + 1}`;
    setAnalysisRows((prev) => {
      const next = prev.map((row) => ({ ...row }));
      if (!dto || !dto.metrics) {
        next[0][key] = '-';
        next[1][key] = '-';
        next[2][key] = '-';
        next[3][key] = '-';
        next[4][key] = '-';
        next[5][key] = '-';
        return next;
      }
      const metrics = dto.metrics;
      next[0][key] = metrics.total ?? '-';
      next[1][key] = pickMetric(metrics, ['damage', '破损']);
      next[2][key] = pickMetric(metrics, ['crack', '裂纹']);
      next[3][key] = pickMetric(metrics, ['diagonal', 'diagonalCrack', '斜裂纹']);
      next[4][key] = pickMetric(metrics, ['mud', '冒浆', '冒渣']);
      next[5][key] = (dto.analyzedAt || '').replace('T', ' ');
      return next;
    });
  };

  const loadAnalysisLatest = async () => {
    setAnalysisRows(buildAnalysisRows());
    for (let slotId = 1; slotId <= 4; slotId += 1) {
      try {
        const { data } = await api.get(`${ANALYSIS_API}/latest`, { params: { slotId } });
        if (data && Object.keys(data).length) {
          setAnalysisCol(slotId - 1, data);
        }
      } catch (error) {
        console.warn('[analysis] load latest failed for slot', slotId, error);
      }
    }
  };

  const summarizeDefects = (defs) => {
    let damage = 0;
    let crack = 0;
    let diagonal = 0;
    let mud = 0;
    let latest = '';
    let tmax = 0;
    for (const item of defs || []) {
      const type = normalizeDefectType(item?.cls);
      if (type === 'damage') damage += 1;
      else if (type === 'crack') crack += 1;
      else if (type === 'diagonal') diagonal += 1;
      else if (type === 'mud') mud += 1;

      const ts = Date.parse(String(item?.datetime || '').replace(' ', 'T'));
      if (!Number.isNaN(ts) && ts > tmax) {
        tmax = ts;
        latest = item.datetime;
      }
    }
    const total = damage + crack + diagonal + mud;
    return { total, damage, crack, diagonal, mud, latest };
  };

  const saveAnalysisFromDefects = async (slotId, fileBase) => {
    try {
      const res = await fetch(`${fileBase}/viz-out/defects.json?t=${Date.now()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('defects.json read failed');
      const arr = await res.json();
      const { total, damage, crack, diagonal, mud, latest } = summarizeDefects(arr);

      await api.post(ANALYSIS_API, {
        slotId,
        metrics: { total, damage, crack, diagonal, mud },
        analyzedAt: latest || new Date().toISOString(),
        runId: null
      });
    } catch (error) {
      console.error('[analysis] save failed', error);
    }
  };

  const updateAnalysisFromDefects = async (idx, base = backendOrigin) => {
    try {
      const res = await fetch(`${base}/viz-out/defects.json?t=${Date.now()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('defects.json read failed');
      const arr = await res.json();
      const { total, damage, crack, diagonal, mud, latest } = summarizeDefects(arr);
      const key = `v${idx + 1}`;
      setAnalysisRows((prev) => {
        const next = prev.map((row) => ({ ...row }));
        next[0][key] = `${total}`;
        next[1][key] = damage;
        next[2][key] = crack;
        next[3][key] = diagonal;
        next[4][key] = mud;
        next[5][key] = latest || new Date().toLocaleString();
        return next;
      });
    } catch (error) {
      console.warn('[analysis] update failed', error);
    }
  };

  const loadSlots = async () => {
    try {
      const { data } = await api.get('/slots');
      if (!Array.isArray(data)) return;

      setComparisonItems((prev) => {
        const next = [...prev];
        data.forEach((slot) => {
          const idx = (slot.slotId ?? 1) - 1;
          if (idx < 0 || idx > 3) return;
          const img = slot.imagePath || slot.image || '';
          const date = slot.dateStr || slot.date || '';
          const start = slot.startLabel || '';
          const end = slot.endLabel || '';
          const abs = (url) => (url?.startsWith('http') ? url : url ? `${backendOrigin}${url}` : '');
          next[idx] = {
            ...next[idx],
            image: img ? `${abs(img)}?t=${Date.now()}` : '',
            date,
            startLabel: start,
            endLabel: end,
            location: start && end ? `${start} - ${end}` : ''
          };
        });
        return next;
      });
    } catch (error) {
      console.error('[slots] load failed', error);
    }
  };

  const persistSlotFromVizOut = async (slotId) => {
    const { data } = await api.post(`/slots/${slotId}/snapshot`);
    const abs = (url) => (url?.startsWith('http') ? url : url ? `${backendOrigin}${url}` : '');
    const idx = slotId - 1;
    setComparisonItems((prev) => {
      const next = [...prev];
      const target = { ...next[idx] };
      target.image = `${abs(data.imagePath)}?t=${Date.now()}`;
      target.date = data.dateStr || '';
      target.startLabel = data.startLabel || '';
      target.endLabel = data.endLabel || '';
      target.location = target.startLabel && target.endLabel ? `${target.startLabel} - ${target.endLabel}` : '';
      next[idx] = target;
      return next;
    });
  };

  const refreshVizCardAt = async (idx) => {
    if (idx == null || idx < 0 || idx >= comparisonItems.length) return;
    const imageUrl = `${vizOutBase}/viz2d.png?t=${Date.now()}`;

    setComparisonItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], image: imageUrl };
      return next;
    });

    const [defRes, metaRes] = await Promise.allSettled([
      fetch(`${vizOutBase}/defects.json?t=${Date.now()}`),
      fetch(`${vizOutBase}/viz2d_meta.json?t=${Date.now()}`)
    ]);

    const toTime = (value) => {
      if (!value || typeof value !== 'string') return NaN;
      const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
      return date.getTime();
    };

    let date = '';
    if (defRes.status === 'fulfilled' && defRes.value.ok) {
      try {
        const arr = await defRes.value.json();
        if (Array.isArray(arr) && arr.length) {
          const latest = arr
            .map((item) => item?.datetime)
            .filter(Boolean)
            .sort((a, b) => toTime(b) - toTime(a))[0];
          if (latest) date = latest;
        }
      } catch (error) {
        console.warn('[viz] parse defects.json failed', error);
      }
    }

    let startLabel = '';
    let endLabel = '';
    let locationText = '';
    if (metaRes.status === 'fulfilled' && metaRes.value.ok) {
      try {
        const meta = await metaRes.value.json();
        startLabel = meta?.start_label || '';
        endLabel = meta?.end_label || '';
        locationText = startLabel && endLabel ? `${startLabel} - ${endLabel}` : '';
      } catch (error) {
        console.warn('[viz] parse viz2d_meta.json failed', error);
      }
    }

    setComparisonItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        image: imageUrl,
        date,
        startLabel,
        endLabel,
        location: locationText
      };
      return next;
    });
  };

  const refreshVizCard1 = async () => {
    setComparisonItems((prev) => {
      const next = [...prev];
      next[0] = { ...next[0], image: `${vizOutBase}/viz2d.png?t=${Date.now()}` };
      return next;
    });

    try {
      const res = await fetch(`${vizOutBase}/defects.json?t=${Date.now()}`);
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length) {
        const latest = arr
          .map((item) => item?.datetime)
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))[0];
        if (latest) {
          setComparisonItems((prev) => {
            const next = [...prev];
            next[0] = { ...next[0], date: latest };
            return next;
          });
        }
      }
    } catch (error) {
      console.warn('读取 defects.json 失败', error);
    }
  };

  const loadDefectData = useCallback(() => {
    const id = params.id || '';
    setDefectId(id);
    setViewType('both');
    const defect = {
      id,
      line: '京沪高铁',
      location: 'K500+123',
      type: '裂纹',
      date: new Date().toLocaleString(),
      severity: '严重',
      desc: '轨枕裂纹',
      inspector: '张三'
    };
    setDefectData(defect);
    setImage2D(`/api/defects/${id}/2d.png`);
    setImage3D(`/api/defects/${id}/3d.png`);
    setAnalysisData(defect);
  }, [params.id]);

  const download = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAnalysis = () => {
    const obj = {};
    analysisRows.forEach((row) => {
      const rowLabel = t(`viz2d.analysisRows.${row.key}`);
      obj[rowLabel] = {
        [t('viz2d.slotLabel', { slot: 1 })]: row.v1,
        [t('viz2d.slotLabel', { slot: 2 })]: row.v2,
        [t('viz2d.slotLabel', { slot: 3 })]: row.v3,
        [t('viz2d.slotLabel', { slot: 4 })]: row.v4
      };
    });
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    download(url, `analysis_${Date.now()}.json`);
    URL.revokeObjectURL(url);
  };

  const updateRangeSlider = () => {
    const selected = LINE_OPTIONS.find((item) => item.value === selectedLine);
    if (selected) {
      setCurrentLineMin(selected.min);
      setCurrentLineMax(Math.min(selected.max, 3000));
    } else {
      setCurrentLineMin(0);
      setCurrentLineMax(3000);
    }
    setStartKm(selected ? selected.min : 0);
    setStartM(0);
    setEndKm(selected ? Math.min(selected.max, 3000) : 3000);
    setEndM(0);
  };

  const startDrag = (event) => {
    event.preventDefault();
    setIsDragging(true);
    const sliderWrapper = event.currentTarget;
    const rect = sliderWrapper.getBoundingClientRect();
    const clickX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const clickPercent = ((clickX - rect.left) / rect.width) * 100;
    const minDist = Math.abs(clickPercent - minPercent);
    const maxDist = Math.abs(clickPercent - maxPercent);
    setActiveHandle(minDist < maxDist ? 'min' : 'max');

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  };

  const handleDrag = useCallback(
    (event) => {
      if (!isDraggingRef.current) return;
      const sliderWrapper = document.querySelector('.slider-wrapper');
      if (!sliderWrapper) return;
      const rect = sliderWrapper.getBoundingClientRect();
      const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      const rangeMeters = (currentLineMaxRef.current - currentLineMinRef.current) * 1000;
      let snappedAbsM = Math.round(currentLineMinRef.current * 1000 + (pct / 100) * rangeMeters);

      if (activeHandleRef.current === 'min') {
        const maxAbsM = Math.round(currentLineMinRef.current * 1000 + (maxPercent / 100) * rangeMeters);
        snappedAbsM = Math.min(snappedAbsM, maxAbsM);
        setStartKm(Math.floor(snappedAbsM / 1000));
        setStartM(snappedAbsM % 1000);
      } else {
        const minAbsM = Math.round(currentLineMinRef.current * 1000 + (minPercent / 100) * rangeMeters);
        snappedAbsM = Math.max(snappedAbsM, minAbsM);
        setEndKm(Math.floor(snappedAbsM / 1000));
        setEndM(snappedAbsM % 1000);
      }
    },
    [maxPercent, minPercent]
  );

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  }, [handleDrag]);

  const resetFilters = () => {
    setSelectedLine('');
    setCurrentLineMin(0);
    setCurrentLineMax(3000);
    setStartKm(0);
    setStartM(0);
    setEndKm(3000);
    setEndM(0);
    const currentYear = new Date().getFullYear();
    setStartYear(currentYear - 2);
    setEndYear(currentYear);
    setSelectedMonth('');
    setSelectedDay('');
  };

  const cleanupSse = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  };

  const fetchFinal2D = useCallback((fileBase = backendOrigin) => {
    setImage2D(`${fileBase}/viz-out/viz2d.png?t=${Date.now()}`);
  }, [backendOrigin]);

  const fetchMeta2D = useCallback(async (fileBase, index = 0) => {
    try {
      const res = await fetch(`${fileBase}/viz-out/viz2d_meta.json?t=${Date.now()}`, {
        credentials: 'include'
      });
      if (!res.ok) return;
      const meta = await res.json();
      const startLabel = meta.start_label || '';
      const endLabel = meta.end_label || '';
      setImgStartLabel(startLabel);
      setImgEndLabel(endLabel);

      setComparisonItems((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], startLabel, endLabel };
        }
        return next;
      });

      localStorage.setItem(
        'viz2d_meta_cache',
        JSON.stringify({ start_label: startLabel, end_label: endLabel, ts: Date.now() })
      );
    } catch (error) {
      console.error('读取2D meta失败', error);
    }
  }, []);

  const startAndWatch2DForFile = async (targetIndexArg = resultTargetRef.current) => {
    if (!selectedFileName) {
      alert(t('viz2d.selectFileAlert'));
      return;
    }

    setLiveOpen(true);
    resultTargetRef.current = targetIndexArg;
    setRunStatus('running');
    setExitCode(null);
    setSeenDone(false);
    seenDoneRef.current = false;
    setProgressText('');
    setProgressCurrent(0);
    setProgressTotal(0);
    progressTotalRef.current = 0;
    setPreviewUrl('');

    cleanupSse();

    const fileBase = apiBase.replace('/api', '');
    const query = encodeURIComponent(selectedFileName);
    const lang = getActiveLang();
    esRef.current = new EventSource(
      `${apiBase}/viz/run2d/stream?file=${query}&lang=${encodeURIComponent(lang)}`,
      { withCredentials: true }
    );

    previewTimerRef.current = setInterval(() => {
      setPreviewUrl(`${fileBase}/viz-out/viz2d_preview.png?t=${Date.now()}`);
    }, 700);

    esRef.current.onmessage = async (event) => {
      const line = event.data || '';
      if (line.startsWith('FILE ')) {
        const parts = line.split(' ');
        setCurrentFile(parts.slice(2).join(' '));
      }

      if (line.startsWith('PROGRESS')) {
        const match = line.match(/PROGRESS\s+(\d+)\s*\/\s*(\d+)/i);
        if (match) {
          setProgressCurrent(Number(match[1]));
          const total = Number(match[2]);
          setProgressTotal(total);
          progressTotalRef.current = total;
          setProgressText(t('viz2d.progressText', { current: match[1], total: match[2] }));
        }
        return;
      }

      if (line.startsWith('EXIT')) {
        const match = line.match(/^EXIT\s+(-?\d+)/i);
        if (match) {
          const code = parseInt(match[1], 10);
          setExitCode(code);
          setRunStatus(seenDoneRef.current || code === 0 ? 'success' : 'error');
        } else if (seenDoneRef.current) {
          setRunStatus('success');
          setExitCode(0);
        }
        cleanupSse();
        return;
      }

      if (line.startsWith('ERROR')) {
        if (!seenDoneRef.current) setRunStatus('error');
        return;
      }

      if (line.startsWith('DONE')) {
        setSeenDone(true);
        seenDoneRef.current = true;
        setRunStatus('success');
        setExitCode(0);
        if (progressTotalRef.current) setProgressCurrent(progressTotalRef.current);
        setProgressText(t('common.done'));
        cleanupSse();

        fetchFinal2D(fileBase);
        await fetchMeta2D(apiBase.replace('/api', ''), 0);

        const targetIndex = targetIndexArg ?? resultTargetRef.current;
        if (targetIndex !== null) {
          await refreshVizCardAt(targetIndex);
          const slotId = targetIndex + 1;

          try {
            await persistSlotFromVizOut(slotId);
            await loadSlots();
          } catch (error) {
            console.error('[slots] persist failed', error);
          }

          try {
            await saveAnalysisFromDefects(slotId, fileBase);
            await loadAnalysisLatest();
            await updateAnalysisFromDefects(targetIndex, apiBase.replace('/api', ''));
          } catch (error) {
            console.error('[analysis] refresh failed', error);
          }
        }
      }
    };

    esRef.current.onerror = () => {
      setRunStatus('error');
      cleanupSse();
    };
  };

  const generate3DThenGo = async (index) => {
    const item = comparisonItems[index];
    if (!item?.image) {
      alert(t('viz2d.generate3dAlert'));
      return;
    }

    const slotId = index + 1;
    setGen3dBusyIndex(index);

    try {
      const startLabel = item.startLabel || displayStartText;
      const endLabel = item.endLabel || displayEndText;
      const lang = getActiveLang();
      const { data } = await api.post(
        '/viz/run3d',
        { slotId, startLabel, endLabel, source: 'viz-out', lang },
        { timeout: 0 }
      );
      const runUuid = data?.runUuid || null;
      navigate(`/visualization/3d?slotId=${slotId}&runUuid=${encodeURIComponent(runUuid || '')}`);
    } catch (error) {
      console.error('[3D] 启动失败', error);
      alert(t('viz2d.run3dFailedAlert'));
    } finally {
      setGen3dBusyIndex(null);
    }
  };

  useEffect(() => {
    loadDefectData();
    updateRangeSlider();
    loadFiles();
    loadSlots();
    refreshVizCard1();
    loadAnalysisLatest();

    try {
      const cached = localStorage.getItem('viz2d_meta_cache');
      if (cached) {
        const meta = JSON.parse(cached);
        setComparisonItems((prev) => {
          const next = [...prev];
          if (next[0]) {
            next[0] = { ...next[0], startLabel: meta.start_label || '', endLabel: meta.end_label || '' };
          }
          return next;
        });
      }
    } catch {
      // ignore
    }

    const currentYear = new Date().getFullYear();
    setStartYear(currentYear - 2);
    setEndYear(currentYear);

    return () => cleanupSse();
  }, [loadDefectData]);

  return (
    <AppLayout onLogout={handleLogout}>
      <header className="visualization-header">
        <button className="back-btn" onClick={goBack} type="button">
          {t('viz2d.back')}
        </button>
        <h2>{t('viz2d.title')}</h2>
        <div className="header-actions">
          <button className="btn-download-all" onClick={goToDashboard} type="button">
            {t('viz2d.dashboard')}
          </button>
        </div>
      </header>

      <div className="visualization-content">
        <section className="card file-compare-card">
          <div className="section-title">
            <h3>{t('viz2d.fileFilterTitle')}</h3>
            <div className="section-actions">
              <input
                value={fileSearch}
                onChange={(event) => setFileSearch(event.target.value)}
                className="input search"
                placeholder={t('viz2d.fileSearchPlaceholder')}
              />
              <button className="btn-secondary" onClick={loadFiles} type="button" disabled={loadingFiles}>
                {loadingFiles ? t('common.refreshing') : t('common.refreshList')}
              </button>
            </div>
          </div>

          <div className="file-compare-body">
            <div className="file-list">
              {filteredFiles.map((file, idx) => (
                <div
                  key={file.name}
                  className={`file-row ${isSelected(idx) ? 'active' : ''}`}
                  onClick={(event) => onItemClick(idx, event)}
                  title={file.name}
                >
                  <span className="fname">{file.name}</span>
                  <span className="meta">
                    {(file.size / 1024).toFixed(0)} KB · {formatTime(file.lastModified)}
                  </span>
                </div>
              ))}
              {!filteredFiles.length ? <div className="empty">{t('viz2d.noFiles')}</div> : null}
            </div>

            <div className="hint">
              {t('common.selectedHint')}
              {selectedFiles.length ? (
                <strong>{selectedFiles.map((item) => item.name).join(', ')}</strong>
              ) : (
                <span>{t('common.notSelected')}</span>
              )}
            </div>
            <button className="btn-primary wide" onClick={() => openTargetDialog(startAndWatch2DForFile)} type="button">
              {t('viz2d.generateSelected', { count: selectedFiles.length })}
            </button>
          </div>
        </section>

        {analysisData ? (
          <div className="analysis-section">
            <h2>{t('viz2d.analysisTitle')}</h2>
            <div className="analysis-content">
              <div className="analysis-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('viz2d.analysisMetric')}</th>
                      {comparisonItems.map((item, index) => (
                        <th key={`analysis-${index}`}>{item.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysisRows.map((row) => (
                      <tr key={row.key}>
                        <td>{t(`viz2d.analysisRows.${row.key}`)}</td>
                        <td>{row.v1}</td>
                        <td>{row.v2}</td>
                        <td>{row.v3}</td>
                        <td>{row.v4}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn-export-analysis" onClick={exportAnalysis} type="button">
                {t('viz2d.exportAnalysis')}
              </button>
            </div>
          </div>
        ) : null}

        <div className="visualization-section">
          <h2>{t('viz2d.resultTitle')}</h2>
          <div className="visualization-grid">
            {comparisonItems.map((item, index) => (
              <div className="view-container" key={`viz-${index}`}>
                <div className="view-header">
                  <h3>{item.title}</h3>
                  <button
                    className="btn-to-3d"
                    type="button"
                    disabled={gen3dBusyIndex === index}
                    onClick={() => generate3DThenGo(index)}
                  >
                    {gen3dBusyIndex === index ? t('common.generating') : t('viz2d.generate3d')}
                  </button>
                </div>
                <div className="image-container">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="visualization-image"
                    onError={() => onImgError(index)}
                  />
                  <div className="image-info">
                    <p>
                      <strong>{t('viz2d.recordTime')}:</strong> {item.date}
                    </p>
                    <p>
                      <strong>{t('viz2d.locationRange')}:</strong> {item.startLabel || displayStartText} - {item.endLabel || displayEndText}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {liveOpen ? (
        <div className="dialog-mask">
          <div className="dialog">
            <div className="dialog-header">
              <h3>{t('viz2d.dialogTitle')}</h3>
              {runStatus === 'running' ? <span className="chip chip-running">{t('viz2d.statusRunning')}</span> : null}
              {runStatus === 'success' ? <span className="chip chip-success">{t('viz2d.statusSuccess')}</span> : null}
              {runStatus !== 'running' && runStatus !== 'success' ? (
                <span className="chip chip-error">
                  {Number.isFinite(exitCode)
                    ? t('viz2d.failedWithExit', { code: exitCode })
                    : t('viz2d.statusFailed')}
                </span>
              ) : null}
            </div>

            <div className="dialog-body">
              {currentFile ? (
                <p style={{ margin: '6px 0', color: '#666' }}>{t('viz2d.processing', { file: currentFile })}</p>
              ) : null}
              <p style={{ margin: '6px 0 10px' }}>
                {progressText}
                {progressTotal ? `（${progressPercent}%）` : ''}
              </p>

              {runStatus === 'running' && progressTotal ? (
                <div className="progress">
                  <div className="progress__bar" style={{ width: `${progressPercent}%` }} />
                </div>
              ) : null}

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={t('viz2d.previewAlt')}
                  style={{ maxWidth: '100%', border: '1px solid #eee', borderRadius: '8px' }}
                />
              ) : null}
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                onClick={() => {
                  setLiveOpen(false);
                  cleanupSse();
                }}
              >
                {t('viz2d.dialogClose')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showTargetDialog ? (
        <div className="gt-modal-mask" onClick={(event) => event.target === event.currentTarget && setShowTargetDialog(false)}>
          <div className="gt-modal">
            <h3 style={{ margin: '0 0 12px' }}>{t('viz2d.targetTitle')}</h3>

            <select
              className="form-input"
              style={{ width: '100%', marginTop: '8px' }}
              value={resultTarget ?? ''}
              onChange={(event) => {
                const nextTarget = Number(event.target.value);
                setResultTarget(nextTarget);
                resultTargetRef.current = nextTarget;
              }}
            >
              <option value={0}>{t('viz2d.slotLabel', { slot: 1 })}</option>
              <option value={1}>{t('viz2d.slotLabel', { slot: 2 })}</option>
              <option value={2}>{t('viz2d.slotLabel', { slot: 3 })}</option>
              <option value={3}>{t('viz2d.slotLabel', { slot: 4 })}</option>
            </select>

            <div className="gt-modal-actions">
              <button className="btn-secondary" onClick={() => setShowTargetDialog(false)} type="button">
                {t('common.cancel')}
              </button>
              <button className="btn-primary" type="button" disabled={resultTarget === null} onClick={confirmTarget}>
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
