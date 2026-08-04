import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AppLayout from './AppLayout.jsx';
import { resolveCurrentLang } from '../i18n/index.js';
import { API_BASE, getLines, getDiseaseTypes, getDetections, getLedgers, getDetail } from '../api/index.js';
import '../styles/query.css';

const LINE_LABELS_EN = {
  京沪高速铁路: 'Beijing-Shanghai High-Speed Railway',
  沪昆高速铁路: 'Shanghai-Kunming High-Speed Railway',
  京广高速铁路: 'Beijing-Guangzhou High-Speed Railway',
  京沪高铁: 'Beijing-Shanghai High-Speed Railway',
  京广高铁: 'Beijing-Guangzhou High-Speed Railway',
  沪昆高铁: 'Shanghai-Kunming High-Speed Railway',
  哈大高铁: 'Harbin-Dalian High-Speed Railway'
};

const DEFECT_TYPE_LABELS_EN = {
  轨道裂纹: 'Track crack',
  路基沉降: 'Subgrade settlement',
  道砟流失: 'Ballast loss',
  扣件松动: 'Fastener looseness',
  钢轨锈蚀: 'Rail corrosion',
  钢轨病害: 'Rail defect',
  轨枕病害: 'Sleeper defect',
  扣件病害: 'Fastener defect',
  道床病害: 'Track bed defect',
  路基病害: 'Subgrade defect',
  破损: 'Damage',
  裂纹: 'Crack',
  斜裂纹: 'Diagonal crack',
  冒浆: 'Mud jacking',
  冒渣: 'Mud jacking'
};

const DESCRIPTION_LABELS_EN = {
  '右股钢轨表面发现纵向裂纹，长度约18cm。': 'Longitudinal crack detected on the right rail surface, approximately 18 cm long.',
  '线路左侧路基出现局部沉降，影响范围约12m。': 'Localized settlement found on the left side of the subgrade, affecting about 12 m.',
  '连续检查发现3处扣件存在轻微松动。': 'Continuous inspection found 3 fasteners with minor loosening.',
  '根据检测结果登记，右股钢轨存在严重裂纹。': 'Registered from inspection results: severe crack exists on the right rail.',
  '路基局部沉降，需持续跟踪。': 'Localized subgrade settlement requires continued tracking.',
  '部分扣件松动，暂未影响行车安全。': 'Some fasteners are loose; train operation safety is not currently affected.'
};

const PERSON_LABELS_EN = {
  张伟: 'Zhang Wei',
  李娜: 'Li Na',
  王强: 'Wang Qiang',
  赵敏: 'Zhao Min',
  陈磊: 'Chen Lei',
  刘洋: 'Liu Yang'
};

export default function Query() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const currentLang = resolveCurrentLang(i18n);
  const isEnglish = currentLang === 'en';

  const [selectedLine, setSelectedLine] = useState('');
  const [startPosition, setStartPosition] = useState(0);
  const [endPosition, setEndPosition] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDiseaseTypes, setSelectedDiseaseTypes] = useState([]);
  const [minPercent, setMinPercent] = useState(0);
  const [maxPercent, setMaxPercent] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [currentLineMin, setCurrentLineMin] = useState(0);
  const [currentLineMax, setCurrentLineMax] = useState(3000);
  const [currentDetail, setCurrentDetail] = useState({});

  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState(1);

  const [leftSeverityFilter, setLeftSeverityFilter] = useState('');
  const [leftTypeFilter, setLeftTypeFilter] = useState('');
  const [rightSeverityFilter, setRightSeverityFilter] = useState('');
  const [rightTypeFilter, setRightTypeFilter] = useState('');

  const [lines, setLines] = useState([]);
  const [diseaseTypes, setDiseaseTypes] = useState([]);
  const [detectionData, setDetectionData] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);

  const pageSize = 20;
  const [detPage, setDetPage] = useState(1);
  const [detJump, setDetJump] = useState(1);
  const [ledPage, setLedPage] = useState(1);
  const [ledJump, setLedJump] = useState(1);

  const minPercentRef = useRef(minPercent);
  const maxPercentRef = useRef(maxPercent);
  const currentLineMinRef = useRef(currentLineMin);
  const currentLineMaxRef = useRef(currentLineMax);
  const isDraggingRef = useRef(isDragging);
  const activeHandleRef = useRef(activeHandle);

  useEffect(() => {
    minPercentRef.current = minPercent;
  }, [minPercent]);

  useEffect(() => {
    maxPercentRef.current = maxPercent;
  }, [maxPercent]);

  useEffect(() => {
    currentLineMinRef.current = currentLineMin;
  }, [currentLineMin]);

  useEffect(() => {
    currentLineMaxRef.current = currentLineMax;
  }, [currentLineMax]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    activeHandleRef.current = activeHandle;
  }, [activeHandle]);

  const ticks = useMemo(() => {
    const next = [];
    for (let i = 0; i <= 4; i += 1) {
      const percent = i * 25;
      next.push({ percent, major: true });
    }
    for (let i = 5; i < 100; i += 5) {
      if (i % 25 === 0) continue;
      next.push({ percent: i, major: false });
    }
    return next;
  }, []);

  const labels = useMemo(() => {
    const next = [];
    for (let i = 0; i <= 4; i += 1) {
      const percent = i * 25;
      next.push({ percent, text: `${percent}%`, major: true });
    }
    return next;
  }, []);

  const severityOptions = useMemo(
    () => [
      { value: '严重', label: t('severity.severe') },
      { value: '一般', label: t('severity.medium') },
      { value: '轻微', label: t('severity.minor') }
    ],
    [t]
  );

  const getSeverityLabel = useCallback(
    (severity) => {
      switch (severity) {
        case '严重':
          return t('severity.severe');
        case '一般':
          return t('severity.medium');
        case '轻微':
          return t('severity.minor');
        default:
          return severity || '';
      }
    },
    [t]
  );

  const translateValue = useCallback(
    (value, dictionary) => {
      if (!isEnglish) return value || '';
      return dictionary[value] || value || '';
    },
    [isEnglish]
  );

  const displayLineName = useCallback(
    (value) => translateValue(value, LINE_LABELS_EN),
    [translateValue]
  );

  const displayDefectType = useCallback(
    (value) => translateValue(value, DEFECT_TYPE_LABELS_EN),
    [translateValue]
  );

  const displayDescription = useCallback(
    (value) => translateValue(value, DESCRIPTION_LABELS_EN),
    [translateValue]
  );

  const displayPerson = useCallback(
    (value) => translateValue(value, PERSON_LABELS_EN),
    [translateValue]
  );

  const typeOptions = useMemo(() => {
    const base = diseaseTypes.map((item) => item.value);
    const extra = Array.from(
      new Set([...detectionData.map((item) => item.type), ...ledgerData.map((item) => item.type)])
    );
    return Array.from(new Set([...base, ...extra]));
  }, [diseaseTypes, detectionData, ledgerData]);

  const diseaseTypeOptions = useMemo(() => {
    if (diseaseTypes.length) {
      return diseaseTypes.map((type) => ({
        ...type,
        label: displayDefectType(type.value)
      }));
    }

    const dataTypes = typeOptions
      .filter(Boolean)
      .map((type) => ({ value: type, label: displayDefectType(type) }));
    if (dataTypes.length) return dataTypes;

    return ['钢轨病害', '轨枕病害', '扣件病害', '道床病害', '路基病害'].map((type) => ({
      value: type,
      label: displayDefectType(type)
    }));
  }, [diseaseTypes, displayDefectType, typeOptions]);

  const filteredDetectionData = useMemo(() => {
    return detectionData.filter((item) => {
      const okSeverity = leftSeverityFilter ? item.severity === leftSeverityFilter : true;
      const okType = leftTypeFilter ? item.type === leftTypeFilter : true;
      return okSeverity && okType;
    });
  }, [detectionData, leftSeverityFilter, leftTypeFilter]);

  const filteredLedgerData = useMemo(() => {
    return ledgerData.filter((item) => {
      const okSeverity = rightSeverityFilter ? item.severity === rightSeverityFilter : true;
      const okType = rightTypeFilter ? item.type === rightTypeFilter : true;
      return okSeverity && okType;
    });
  }, [ledgerData, rightSeverityFilter, rightTypeFilter]);

  const startAbsMeters = useMemo(() => {
    const rangeMeters = (currentLineMax - currentLineMin) * 1000;
    return Math.round(currentLineMin * 1000 + (minPercent / 100) * rangeMeters);
  }, [currentLineMax, currentLineMin, minPercent]);

  const endAbsMeters = useMemo(() => {
    const rangeMeters = (currentLineMax - currentLineMin) * 1000;
    return Math.round(currentLineMin * 1000 + (maxPercent / 100) * rangeMeters);
  }, [currentLineMax, currentLineMin, maxPercent]);

  const formatAbsMetersToK = useCallback((absMeters) => {
    const km = Math.floor(absMeters / 1000);
    const m = absMeters % 1000;
    return `K${km}+${String(m).padStart(3, '0')}`;
  }, []);

  const displayStartText = useMemo(
    () => formatAbsMetersToK(startAbsMeters),
    [formatAbsMetersToK, startAbsMeters]
  );
  const displayEndText = useMemo(
    () => formatAbsMetersToK(endAbsMeters),
    [formatAbsMetersToK, endAbsMeters]
  );

  const parseLocationToMeters = useCallback((location) => {
    const match = String(location || '').toUpperCase().match(/K\s*(\d+)\s*\+\s*(\d+)/);
    if (!match) return null;
    return Number(match[1]) * 1000 + Number(match[2]);
  }, []);

  const filterBySelectedLocationRange = useCallback(
    (items) => {
      const start = Math.min(startAbsMeters, endAbsMeters);
      const end = Math.max(startAbsMeters, endAbsMeters);
      return items.filter((item) => {
        const meters = parseLocationToMeters(item.location);
        if (meters === null) return true;
        return meters >= start && meters <= end;
      });
    },
    [endAbsMeters, parseLocationToMeters, startAbsMeters]
  );

  const sortData = useCallback(
    (data) => {
      if (!sortKey) return data;
      return data.slice().sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA < valB) return -1 * sortOrder;
        if (valA > valB) return 1 * sortOrder;
        return 0;
      });
    },
    [sortKey, sortOrder]
  );

  const displayedDetectionData = useMemo(
    () => sortData(filteredDetectionData),
    [filteredDetectionData, sortData]
  );

  const displayedLedgerData = useMemo(
    () => sortData(filteredLedgerData),
    [filteredLedgerData, sortData]
  );

  const detTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredDetectionData.length / pageSize)),
    [filteredDetectionData.length]
  );

  const ledTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredLedgerData.length / pageSize)),
    [filteredLedgerData.length]
  );

  const pagedDetectionData = useMemo(() => {
    const start = (detPage - 1) * pageSize;
    return displayedDetectionData.slice(start, start + pageSize);
  }, [detPage, displayedDetectionData]);

  const pagedLedgerData = useMemo(() => {
    const start = (ledPage - 1) * pageSize;
    return displayedLedgerData.slice(start, start + pageSize);
  }, [ledPage, displayedLedgerData]);

  const handleLogout = () => {
    navigate('/');
  };

  const handleQuery = async () => {
    const params = {};
    if (selectedLine) params.line = selectedLine;
    if (selectedDiseaseTypes.length) params.type = selectedDiseaseTypes[0];
    if (startDate && endDate) {
      params.start = startDate;
      params.end = endDate;
    }

    const det = await getDetections(params);
    const nextDetectionData = det.map((item) => ({
      id: item.id,
      line: item.lineName,
      location: item.location,
      type: item.typeName,
      date: item.detectDate,
      severity: item.severity,
      desc: item.description,
      inspector: item.inspector
    }));
    setDetectionData(filterBySelectedLocationRange(nextDetectionData));

    const led = await getLedgers(params);
    const nextLedgerData = led.map((item) => ({
      id: item.id,
      line: item.lineName,
      location: item.location,
      type: item.typeName,
      date: item.recordDate,
      severity: item.severity,
      desc: item.description,
      recorder: item.recorder
    }));
    setLedgerData(filterBySelectedLocationRange(nextLedgerData));
  };

  useEffect(() => {
    const fetchMeta = async () => {
      const rawLines = await getLines();
      setLines(
        rawLines.map((line) => ({
          value: line.name,
          label: line.name,
          min: line.kmMin,
          max: line.kmMax
        }))
      );

      const rawTypesResponse = await getDiseaseTypes();
      const rawTypes = Array.isArray(rawTypesResponse) ? rawTypesResponse : rawTypesResponse?.data || [];
      setDiseaseTypes(
        rawTypes
          .map((type) => {
            const name = typeof type === 'string' ? type : type.name || type.typeName || type.label || type.value;
            return name ? { value: name, label: name } : null;
          })
          .filter(Boolean)
      );
    };

    fetchMeta();
    handleQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setSelectedLine('');
    setStartPosition(0);
    setEndPosition(0);
    setSelectedDiseaseTypes([]);
    setMinPercent(0);
    setMaxPercent(100);
    setLeftSeverityFilter('');
    setLeftTypeFilter('');
    setRightSeverityFilter('');
    setRightTypeFilter('');

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  };

  const updateRangeSlider = () => {
    const line = lines.find((item) => item.value === selectedLine);
    if (line) {
      setCurrentLineMin(line.min);
      setCurrentLineMax(Math.min(line.max, 3000));
      setStartPosition(line.min);
      setEndPosition(Math.min(line.max, 3000));
      setMinPercent(0);
      setMaxPercent(100);
    } else {
      setCurrentLineMin(0);
      setCurrentLineMax(3000);
      setStartPosition(0);
      setEndPosition(3000);
      setMinPercent(0);
      setMaxPercent(100);
    }
  };

  const updateFromInputs = () => {
    const range = currentLineMax - currentLineMin;
    if (!range) return;
    setMinPercent(((startPosition - currentLineMin) / range) * 100);
    setMaxPercent(((endPosition - currentLineMin) / range) * 100);
  };

  const handleDrag = useCallback((event) => {
    if (!isDraggingRef.current) return;
    const sliderWrapper = document.getElementById('sliderWrapper');
    if (!sliderWrapper) return;
    const rect = sliderWrapper.getBoundingClientRect();
    const moveX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    let newPercent = ((moveX - rect.left) / rect.width) * 100;
    newPercent = Math.max(0, Math.min(100, newPercent));

    if (activeHandleRef.current === 'min') {
      const next = Math.min(newPercent, maxPercentRef.current);
      setMinPercent(next);
    } else {
      const next = Math.max(newPercent, minPercentRef.current);
      setMaxPercent(next);
    }

    const range = currentLineMaxRef.current - currentLineMinRef.current;
    setStartPosition(
      Math.round(currentLineMinRef.current + (minPercentRef.current / 100) * range)
    );
    setEndPosition(
      Math.round(currentLineMinRef.current + (maxPercentRef.current / 100) * range)
    );
  }, []);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  }, [handleDrag]);

  const startDrag = (event) => {
    event.preventDefault();
    setIsDragging(true);
    const sliderWrapper = document.getElementById('sliderWrapper');
    if (!sliderWrapper) return;
    const rect = sliderWrapper.getBoundingClientRect();
    const clickX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const clickPercent = ((clickX - rect.left) / rect.width) * 100;
    const minDist = Math.abs(clickPercent - minPercentRef.current);
    const maxDist = Math.abs(clickPercent - maxPercentRef.current);
    const handle = minDist < maxDist ? 'min' : 'max';
    setActiveHandle(handle);

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case '严重':
        return 'badge-danger';
      case '一般':
        return 'badge-warning';
      case '轻微':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  const showDetail = async (id) => {
    const res = await getDetail(id);
    const obj = res.detection || res.ledger || {};
    setCurrentDetail({
      id: obj.id,
      line: obj.lineName,
      location: obj.location,
      type: obj.typeName,
      date: obj.detectDate || obj.recordDate,
      severity: obj.severity,
      suggestion: obj.suggestion,
      history: Array.isArray(obj.history)
        ? obj.history
        : typeof obj.history === 'string'
        ? JSON.parse(obj.history || '[]')
        : []
    });

    if (!modalInstanceRef.current && modalRef.current) {
      modalInstanceRef.current = new Modal(modalRef.current);
    }
    modalInstanceRef.current?.show();
  };

  const exportData = async (type) => {
    const url =
      type === 'left'
        ? `${API_BASE}/export-detection`
        : type === 'right'
        ? `${API_BASE}/export-ledger`
        : `${API_BASE}/export-all`;

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const text = await res.text();
          if (text) msg += `\n${text}`;
        } catch {
          // ignore
        }
        if (res.status === 401) {
          alert(t('query.exportExpired'));
        } else {
          alert(t('query.exportFailed', { msg }));
        }
        return;
      }

      let filename =
        type === 'left'
          ? t('query.filenameDetection')
          : type === 'right'
          ? t('query.filenameLedger')
          : t('query.filenameAll');

      const dispo = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
      if (dispo) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(dispo);
        const raw = decodeURIComponent(match?.[1] || match?.[2] || '');
        if (raw) filename = raw;
      }

      const blob = await res.blob();
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    } catch (error) {
      console.error(error);
      alert(t('query.exportFailedRetry'));
    }
  };

  const exportDetail = () => {
    console.log('Export detail:', currentDetail.id);
  };

  const openPhotoViewer = (index) => {
    console.log('Open photo viewer index:', index);
  };

  const sortBy = (key) => {
    if (sortKey === key) {
      setSortOrder((value) => -value);
    } else {
      setSortKey(key);
      setSortOrder(1);
    }
  };

  const goDetPage = (page) => {
    const nextPage = Math.min(Math.max(1, Number(page) || 1), detTotalPages);
    setDetPage(nextPage);
    setDetJump(nextPage);
  };

  const goLedPage = (page) => {
    const nextPage = Math.min(Math.max(1, Number(page) || 1), ledTotalPages);
    setLedPage(nextPage);
    setLedJump(nextPage);
  };

  const toggleDiseaseType = (value) => {
    setSelectedDiseaseTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="main-content">
        <div className="query-section">
          <div className="section-title">
            <h4>{t('query.conditionTitle')}</h4>
            <div className="section-actions">
              <button className="btn-primary" onClick={handleQuery} type="button">
                {t('query.queryBtn')}
              </button>
              <button className="btn-secondary" onClick={handleReset} type="button">
                {t('query.resetBtn')}
              </button>
            </div>
          </div>

          <div className="query-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t('query.lineLabel')}</label>
                <select
                  id="lineSelect"
                  className="form-input"
                  value={selectedLine}
                  onChange={(event) => {
                    setSelectedLine(event.target.value);
                    setTimeout(updateRangeSlider, 0);
                  }}
                >
                  <option value="">{t('query.linePlaceholder')}</option>
                  {lines.map((line) => (
                    <option key={line.value} value={line.value} data-min={line.min} data-max={line.max}>
                      {displayLineName(line.value)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('query.locationLabel')}</label>
                <div className="range-inputs">
                  <input
                    name="startPosition"
                    placeholder={t('query.startKmPlaceholder')}
                    className="form-input"
                    value={displayStartText}
                    readOnly
                  />
                  <span className="range-separator">-</span>
                  <input
                    name="endPosition"
                    placeholder={t('query.endKmPlaceholder')}
                    className="form-input"
                    value={displayEndText}
                    readOnly
                  />
                </div>

              </div>
            </div>

            <div className="range-slider-container query-range-slider">
              <div className="slider-header">
                <span>{t('common.adjustRange')}</span>
              </div>
              <div className="slider-values-display">
                <span>{displayStartText}</span>
                <span>{displayEndText}</span>
              </div>

              <div className="slider-wrapper" id="sliderWrapper" onMouseDown={startDrag} onTouchStart={startDrag}>
                <div
                  className="slider-track"
                  style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                />
                <div className="slider-handle min-handle" style={{ left: `${minPercent}%` }} />
                <div className="slider-handle max-handle" style={{ left: `${maxPercent}%` }} />
              </div>

              <div className="slider-ticks">
                {ticks.map((tick) => (
                  <div
                    key={`tick-${tick.percent}`}
                    className={`slider-tick ${tick.major ? 'major' : ''}`}
                    style={{ left: `${tick.percent}%` }}
                  />
                ))}
                {labels.map((label) => (
                  <div
                    key={`label-${label.percent}`}
                    className={`slider-tick-label ${label.major ? 'major' : ''}`}
                    style={{ left: `${label.percent}%` }}
                  >
                    {label.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('query.timeRangeLabel')}</label>
                <div className="date-inputs">
                  <input
                    name="startDate"
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <span className="date-separator">{t('common.to')}</span>
                  <input
                    name="endDate"
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('query.typeLabel')}</label>
                <div className="checkbox-group">
                  {diseaseTypeOptions.map((type) => (
                    <label key={type.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={type.value}
                        checked={selectedDiseaseTypes.includes(type.value)}
                        onChange={() => toggleDiseaseType(type.value)}
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="result-section">
          <div className="section-header">
            <h4>{t('query.resultsTitle')}</h4>
            <div className="export-actions">
              <button className="btn-export" onClick={() => exportData('left')} type="button">
                {t('query.exportDetection')}
              </button>
              <button className="btn-export" onClick={() => exportData('right')} type="button">
                {t('query.exportLedger')}
              </button>
              <button className="btn-export" onClick={() => exportData('all')} type="button">
                {t('query.exportAll')}
              </button>
            </div>
          </div>

          <div className="comparison-tables">
            <div className="table-container">
              <div className="table-head">
                <h4>{t('query.tableDetectionTitle')}</h4>
                <div className="table-filters">
                  <select
                    className="mini-select"
                    value={leftSeverityFilter}
                    onChange={(event) => setLeftSeverityFilter(event.target.value)}
                  >
                    <option value="">{t('query.filterAllSeverity')}</option>
                    {severityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="mini-select"
                    value={leftTypeFilter}
                    onChange={(event) => setLeftTypeFilter(event.target.value)}
                  >
                    <option value="">{t('query.filterAllType')}</option>
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {displayDefectType(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => sortBy('id')}>
                        {t('query.colDefectId')}
                        {sortKey === 'id' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('line')}>
                        {t('query.colLineName')}
                        {sortKey === 'line' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('location')}>
                        {t('query.colLocation')}
                        {sortKey === 'location' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('type')}>
                        {t('query.colType')}
                        {sortKey === 'type' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('date')}>
                        {t('query.colDate')}
                        {sortKey === 'date' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('severity')}>
                        {t('query.colSeverity')}
                        {sortKey === 'severity' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th>{t('query.colDesc')}</th>
                      <th>{t('query.colInspector')}</th>
                      <th>{t('query.colDetail')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDetectionData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td><span className="cell-clamp cell-line">{displayLineName(item.line)}</span></td>
                        <td><span className="cell-clamp cell-short">{item.location}</span></td>
                        <td><span className="cell-clamp cell-short">{displayDefectType(item.type)}</span></td>
                        <td><span className="cell-clamp cell-short">{item.date}</span></td>
                        <td>
                          <span className={`badge ${getSeverityClass(item.severity)}`}>
                            {getSeverityLabel(item.severity)}
                          </span>
                        </td>
                        <td><span className="cell-clamp cell-desc">{displayDescription(item.desc)}</span></td>
                        <td><span className="cell-clamp cell-short">{displayPerson(item.inspector)}</span></td>
                        <td>
                          <button className="btn-detail" onClick={() => showDetail(item.id)} type="button">
                            {t('query.viewDetail')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDetectionData.length > pageSize ? (
                  <div className="pagination-bar">
                    <button
                      className="pager-btn"
                      type="button"
                      disabled={detPage === 1}
                      onClick={() => goDetPage(detPage - 1)}
                    >
                      {t('query.pagination.prev')}
                    </button>
                    {Array.from({ length: detTotalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={`det-${page}`}
                        type="button"
                        className={`pager-btn ${page === detPage ? 'active' : ''}`}
                        onClick={() => goDetPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="pager-btn"
                      type="button"
                      disabled={detPage === detTotalPages}
                      onClick={() => goDetPage(detPage + 1)}
                    >
                      {t('query.pagination.next')}
                    </button>
                    <span className="pager-info">
                      {t('query.pagination.total', { count: filteredDetectionData.length, pages: detTotalPages })}
                    </span>
                    <span className="pager-jump">
                      {t('query.pagination.jumpTo')}
                      <input
                        type="number"
                        min="1"
                        max={detTotalPages}
                        value={detJump}
                        onChange={(event) => setDetJump(Number(event.target.value) || 1)}
                        onKeyUp={(event) => {
                          if (event.key === 'Enter') goDetPage(detJump);
                        }}
                      />
                      {t('query.pagination.page')}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="table-container">
              <div className="table-head">
                <h4>{t('query.tableLedgerTitle')}</h4>
                <div className="table-filters">
                  <select
                    className="mini-select"
                    value={rightSeverityFilter}
                    onChange={(event) => setRightSeverityFilter(event.target.value)}
                  >
                    <option value="">{t('query.filterAllSeverity')}</option>
                    {severityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="mini-select"
                    value={rightTypeFilter}
                    onChange={(event) => setRightTypeFilter(event.target.value)}
                  >
                    <option value="">{t('query.filterAllType')}</option>
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {displayDefectType(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => sortBy('id')}>
                        {t('query.colDefectId')}
                        {sortKey === 'id' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('line')}>
                        {t('query.colLineName')}
                        {sortKey === 'line' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('location')}>
                        {t('query.colLocation')}
                        {sortKey === 'location' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('type')}>
                        {t('query.colType')}
                        {sortKey === 'type' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('date')}>
                        {t('query.colDate')}
                        {sortKey === 'date' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th className="sortable" onClick={() => sortBy('severity')}>
                        {t('query.colSeverity')}
                        {sortKey === 'severity' ? (
                          <span className="sort-arrow">{sortOrder === 1 ? '↑' : '↓'}</span>
                        ) : null}
                      </th>
                      <th>{t('query.colDesc')}</th>
                      <th>{t('query.colRecorder')}</th>
                      <th>{t('query.colDetail')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLedgerData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td><span className="cell-clamp cell-line">{displayLineName(item.line)}</span></td>
                        <td><span className="cell-clamp cell-short">{item.location}</span></td>
                        <td><span className="cell-clamp cell-short">{displayDefectType(item.type)}</span></td>
                        <td><span className="cell-clamp cell-short">{item.date}</span></td>
                        <td>
                          <span className={`badge ${getSeverityClass(item.severity)}`}>
                            {getSeverityLabel(item.severity)}
                          </span>
                        </td>
                        <td><span className="cell-clamp cell-desc">{displayDescription(item.desc)}</span></td>
                        <td><span className="cell-clamp cell-short">{displayPerson(item.recorder)}</span></td>
                        <td>
                          <button className="btn-detail" onClick={() => showDetail(item.id)} type="button">
                            {t('query.viewDetail')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLedgerData.length > pageSize ? (
                  <div className="pagination-bar">
                    <button
                      className="pager-btn"
                      type="button"
                      disabled={ledPage === 1}
                      onClick={() => goLedPage(ledPage - 1)}
                    >
                      {t('query.pagination.prev')}
                    </button>
                    {Array.from({ length: ledTotalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={`led-${page}`}
                        type="button"
                        className={`pager-btn ${page === ledPage ? 'active' : ''}`}
                        onClick={() => goLedPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="pager-btn"
                      type="button"
                      disabled={ledPage === ledTotalPages}
                      onClick={() => goLedPage(ledPage + 1)}
                    >
                      {t('query.pagination.next')}
                    </button>
                    <span className="pager-info">
                      {t('query.pagination.total', { count: filteredLedgerData.length, pages: ledTotalPages })}
                    </span>
                    <span className="pager-jump">
                      {t('query.pagination.jumpTo')}
                      <input
                        type="number"
                        min="1"
                        max={ledTotalPages}
                        value={ledJump}
                        onChange={(event) => setLedJump(Number(event.target.value) || 1)}
                        onKeyUp={(event) => {
                          if (event.key === 'Enter') goLedPage(ledJump);
                        }}
                      />
                      {t('query.pagination.page')}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="detailModal"
        tabIndex="-1"
        aria-labelledby="detailModalLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="detailModalLabel">
                {t('query.detailTitle', { id: currentDetail.id })}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label={t('query.closeAria')}
              />
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h5>{t('query.basicInfo')}</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>{t('query.fieldDefectId')}:</strong> <span>{currentDetail.id}</span>
                    </p>
                    <p>
                      <strong>{t('query.fieldLineName')}:</strong> <span>{displayLineName(currentDetail.line)}</span>
                    </p>
                    <p>
                      <strong>{t('query.fieldLocation')}:</strong> <span>{currentDetail.location}</span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>{t('query.fieldType')}:</strong> <span>{displayDefectType(currentDetail.type)}</span>
                    </p>
                    <p>
                      <strong>{t('query.fieldDate')}:</strong> <span>{currentDetail.date}</span>
                    </p>
                    <p>
                      <strong>{t('query.fieldSeverity')}:</strong>{' '}
                      <span className={`badge ${getSeverityClass(currentDetail.severity)}`}>
                        {getSeverityLabel(currentDetail.severity)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5>{t('query.photos')}</h5>
                <div className="photo-container">
                  <div className="photo-placeholder" onClick={() => openPhotoViewer(0)}>
                    {t('query.photoPreview')}
                  </div>
                  <div className="photo-placeholder" onClick={() => openPhotoViewer(1)}>
                    {t('query.photoPreview')}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5>{t('query.suggestion')}</h5>
                <p>{displayDescription(currentDetail.suggestion)}</p>
              </div>

              <div className="detail-section">
                <h5>{t('query.history')}</h5>
                <div>
                  {(currentDetail.history || []).map((item, index) => (
                    <div key={`history-${index}`} className="history-item">
                      {displayDescription(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                {t('query.modalClose')}
              </button>
              <button type="button" className="btn btn-primary" onClick={exportDetail}>
                {t('query.exportDetail')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
