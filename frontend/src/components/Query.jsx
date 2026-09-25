import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AppLayout from './AppLayout.jsx';
import { getLines, getDiseaseTypes, getDetections, getLedgers, getDetail } from '../api/index.js';
import { downloadDetail, downloadExport } from '../api/export.js';
import QueryDataTable from './query/QueryDataTable.jsx';
import QueryDetailModal from './query/QueryDetailModal.jsx';
import '../styles/query.css';

const PAGE_SIZE = 20;
const lineEnglish = {
  京沪高速铁路: 'Beijing-Shanghai High-Speed Railway', 京沪高铁: 'Beijing-Shanghai High-Speed Railway',
  京广高速铁路: 'Beijing-Guangzhou High-Speed Railway', 京广高铁: 'Beijing-Guangzhou High-Speed Railway',
  沪昆高速铁路: 'Shanghai-Kunming High-Speed Railway', 沪昆高铁: 'Shanghai-Kunming High-Speed Railway',
  哈大高铁: 'Harbin-Dalian High-Speed Railway'
};
const typeEnglish = { 破损: 'Damage', 裂纹: 'Crack', 斜裂纹: 'Diagonal crack', 冒浆: 'Mud jacking', 冒渣: 'Mud jacking' };

const initialPage = { page: 0, totalElements: 0, totalPages: 0 };
const toDetection = (item) => ({ id: item.id, line: item.lineName, location: item.location, type: item.typeName, date: item.detectDate, severity: item.severity, desc: item.description, inspector: item.inspector });
const toLedger = (item) => ({ id: item.id, line: item.lineName, location: item.location, type: item.typeName, date: item.recordDate, severity: item.severity, desc: item.description, recorder: item.recorder });

export default function Query() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const isEnglish = i18n.language?.startsWith('en');
  const [lines, setLines] = useState([]);
  const [diseaseTypes, setDiseaseTypes] = useState([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentLine, setCurrentLine] = useState({ min: 0, max: 3000 });
  const [minPercent, setMinPercent] = useState(0);
  const [maxPercent, setMaxPercent] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const sliderRef = useRef(null);
  const [leftSeverity, setLeftSeverity] = useState('');
  const [leftType, setLeftType] = useState('');
  const [rightSeverity, setRightSeverity] = useState('');
  const [rightType, setRightType] = useState('');
  const [detections, setDetections] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [detectionMeta, setDetectionMeta] = useState(initialPage);
  const [ledgerMeta, setLedgerMeta] = useState(initialPage);
  const [detectionLoading, setDetectionLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [detectionError, setDetectionError] = useState(false);
  const [ledgerError, setLedgerError] = useState(false);
  const [detail, setDetail] = useState({});

  const severityOptions = useMemo(() => [
    { value: '严重', label: t('severity.severe') }, { value: '一般', label: t('severity.medium') }, { value: '轻微', label: t('severity.minor') }
  ], [t]);
  const displayLine = useCallback((value) => isEnglish ? lineEnglish[value] || value || '' : value || '', [isEnglish]);
  const displayType = useCallback((value) => isEnglish ? typeEnglish[value] || value || '' : value || '', [isEnglish]);
  const displayDescription = useCallback((value) => value || '', []);
  const displayPerson = useCallback((value) => value || '', []);
  const getSeverityLabel = useCallback((value) => ({ 严重: t('severity.severe'), 一般: t('severity.medium'), 轻微: t('severity.minor') }[value] || value || ''), [t]);
  const getSeverityClass = useCallback((value) => ({ 严重: 'badge-danger', 一般: 'badge-warning', 轻微: 'badge-success' }[value] || 'badge-secondary'), []);
  const typeOptions = useMemo(() => Array.from(new Set([...diseaseTypes, ...detections.map((item) => item.type), ...ledgers.map((item) => item.type)].filter(Boolean))), [diseaseTypes, detections, ledgers]);
  const startMeters = Math.round((currentLine.min + (currentLine.max - currentLine.min) * minPercent / 100) * 1000);
  const endMeters = Math.round((currentLine.min + (currentLine.max - currentLine.min) * maxPercent / 100) * 1000);
  const formatLocation = (meters) => `K${Math.floor(meters / 1000)}+${String(meters % 1000).padStart(3, '0')}`;

  const buildFilters = useCallback((type, severity) => {
    const params = {};
    if (selectedLine) params.line = selectedLine;
    if (type) params.type = type;
    if (selectedTypes.length) params.types = selectedTypes.join(',');
    if (severity) params.severity = severity;
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    params.minMileage = startMeters;
    params.maxMileage = endMeters;
    return params;
  }, [selectedLine, selectedTypes, startDate, endDate, startMeters, endMeters]);
  const buildParams = useCallback((page, type, severity) => ({
    ...buildFilters(type, severity), page, size: PAGE_SIZE, sortDir: 'desc'
  }), [buildFilters]);

  const loadDetections = useCallback(async (page = 0) => {
    setDetectionLoading(true); setDetectionError(false);
    try {
      const result = await getDetections(buildParams(page, leftType, leftSeverity));
      setDetections((result.content || []).map(toDetection));
      setDetectionMeta({ page: result.page ?? page, totalElements: result.totalElements ?? 0, totalPages: result.totalPages ?? 0 });
    } catch (error) { console.error('[detections] load failed', error); setDetectionError(true); } finally { setDetectionLoading(false); }
  }, [buildParams, leftSeverity, leftType]);
  const loadLedgers = useCallback(async (page = 0) => {
    setLedgerLoading(true); setLedgerError(false);
    try {
      const result = await getLedgers(buildParams(page, rightType, rightSeverity));
      setLedgers((result.content || []).map(toLedger));
      setLedgerMeta({ page: result.page ?? page, totalElements: result.totalElements ?? 0, totalPages: result.totalPages ?? 0 });
    } catch (error) { console.error('[ledgers] load failed', error); setLedgerError(true); } finally { setLedgerLoading(false); }
  }, [buildParams, rightSeverity, rightType]);
  const search = useCallback(() => Promise.all([loadDetections(0), loadLedgers(0)]), [loadDetections, loadLedgers]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [lineData, typeData] = await Promise.all([getLines(), getDiseaseTypes()]);
        setLines((lineData || []).map((line) => ({ value: line.name, min: line.kmMin, max: line.kmMax })));
        const values = Array.isArray(typeData) ? typeData : typeData?.data || [];
        setDiseaseTypes(values.map((item) => typeof item === 'string' ? item : item.name || item.typeName).filter(Boolean));
      } catch (error) { console.error('[query] metadata load failed', error); }
    };
    void loadMetadata();
    void search();
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return;
      const point = event.touches ? event.touches[0].clientX : event.clientX;
      const percent = Math.max(0, Math.min(100, (point - rect.left) / rect.width * 100));
      if (activeHandle === 'min') setMinPercent(Math.min(percent, maxPercent));
      else setMaxPercent(Math.max(percent, minPercent));
    };
    const stop = () => { setDragging(false); setActiveHandle(null); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', stop); document.addEventListener('touchmove', move); document.addEventListener('touchend', stop);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', stop); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', stop); };
  }, [activeHandle, dragging, maxPercent, minPercent]);

  const selectLine = (value) => {
    setSelectedLine(value);
    const line = lines.find((item) => item.value === value);
    setCurrentLine(line ? { min: line.min, max: line.max } : { min: 0, max: 3000 });
    setMinPercent(0); setMaxPercent(100);
  };
  const reset = () => { setSelectedLine(''); setSelectedTypes([]); setStartDate(''); setEndDate(''); setLeftSeverity(''); setLeftType(''); setRightSeverity(''); setRightType(''); setCurrentLine({ min: 0, max: 3000 }); setMinPercent(0); setMaxPercent(100); };
  const toggleType = (value) => setSelectedTypes((previous) => previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]);
  const showDetail = async (id) => {
    try {
      const result = await getDetail(id); const item = result.detection || result.ledger || {};
      setDetail({ id: item.id, line: item.lineName, location: item.location, type: item.typeName, date: item.detectDate || item.recordDate, severity: item.severity, suggestion: item.suggestion, history: Array.isArray(item.history) ? item.history : item.history ? [item.history] : [] });
      if (!modalInstanceRef.current && modalRef.current) modalInstanceRef.current = new Modal(modalRef.current);
      modalInstanceRef.current?.show();
    } catch (error) { console.error('[detail] load failed', error); }
  };
  const saveExport = (response, fallbackFilename) => {
    let filename = fallbackFilename;
    const disposition = response.headers['content-disposition'];
    const match = disposition && /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
    if (match) filename = decodeURIComponent(match[1] || match[2]);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const exportData = async (type) => {
    try {
      const detection = buildFilters(leftType, leftSeverity);
      const ledger = buildFilters(rightType, rightSeverity);
      const params = {
        line: detection.line, start: detection.start, end: detection.end,
        types: detection.types, minMileage: detection.minMileage, maxMileage: detection.maxMileage,
        detectionType: detection.type, detectionSeverity: detection.severity,
        ledgerType: ledger.type, ledgerSeverity: ledger.severity
      };
      const response = await downloadExport(type, params);
      saveExport(response, type === 'left' ? t('query.filenameDetection') : type === 'right' ? t('query.filenameLedger') : t('query.filenameAll'));
    } catch (error) { console.error('[export] failed', error); alert(error.response?.status === 401 ? t('query.exportExpired') : t('query.exportFailedRetry')); }
  };
  const exportDetail = async () => {
    if (!detail.id) return;
    try {
      saveExport(await downloadDetail(detail.id), t('query.filenameDetail', { id: detail.id }));
    } catch (error) { console.error('[detail export] failed', error); alert(t('query.exportFailedRetry')); }
  };

  return <AppLayout onLogout={() => navigate('/')}><div className="main-content"><section className="query-section"><div className="section-title"><h4>{t('query.conditionTitle')}</h4><div className="section-actions"><button className="btn-primary" onClick={() => void search()} type="button">{t('query.queryBtn')}</button><button className="btn-secondary" onClick={reset} type="button">{t('query.resetBtn')}</button></div></div><div className="query-form"><div className="form-row"><div className="form-group"><label>{t('query.lineLabel')}</label><select id="lineSelect" className="form-input" value={selectedLine} onChange={(event) => selectLine(event.target.value)}><option value="">{t('query.linePlaceholder')}</option>{lines.map((line) => <option key={line.value} value={line.value}>{displayLine(line.value)}</option>)}</select></div><div className="form-group"><label>{t('query.locationLabel')}</label><div className="range-inputs"><input className="form-input" value={formatLocation(startMeters)} readOnly /><span className="range-separator">-</span><input className="form-input" value={formatLocation(endMeters)} readOnly /></div></div></div><div className="range-slider-container query-range-slider"><div className="slider-header"><span>{t('common.adjustRange')}</span></div><div className="slider-values-display"><span>{formatLocation(startMeters)}</span><span>{formatLocation(endMeters)}</span></div><div className="slider-wrapper" ref={sliderRef} onMouseDown={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const percent = (event.clientX - rect.left) / rect.width * 100; setActiveHandle(Math.abs(percent - minPercent) < Math.abs(percent - maxPercent) ? 'min' : 'max'); setDragging(true); }} onTouchStart={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const percent = (event.touches[0].clientX - rect.left) / rect.width * 100; setActiveHandle(Math.abs(percent - minPercent) < Math.abs(percent - maxPercent) ? 'min' : 'max'); setDragging(true); }}><div className="slider-track" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} /><div className="slider-handle min-handle" style={{ left: `${minPercent}%` }} /><div className="slider-handle max-handle" style={{ left: `${maxPercent}%` }} /></div></div><div className="form-row"><div className="form-group"><label>{t('query.timeRangeLabel')}</label><div className="date-inputs"><input type="date" className="form-input" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><span className="date-separator">{t('common.to')}</span><input type="date" className="form-input" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div></div><div className="form-group"><label>{t('query.typeLabel')}</label><div className="checkbox-group">{diseaseTypes.map((type) => <label key={type} className="checkbox-label"><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />{displayType(type)}</label>)}</div></div></div></div></section><section className="result-section"><div className="section-header"><h4>{t('query.resultsTitle')}</h4><div className="export-actions"><button className="btn-export" onClick={() => exportData('left')} type="button">{t('query.exportDetection')}</button><button className="btn-export" onClick={() => exportData('right')} type="button">{t('query.exportLedger')}</button><button className="btn-export" onClick={() => exportData('all')} type="button">{t('query.exportAll')}</button></div></div><div className="comparison-tables"><QueryDataTable titleKey="query.tableDetectionTitle" personKey="query.colInspector" rows={detections} page={detectionMeta.page + 1} pageMeta={detectionMeta} loading={detectionLoading} error={detectionError} severity={leftSeverity} type={leftType} severityOptions={severityOptions} typeOptions={typeOptions} onSeverityChange={setLeftSeverity} onTypeChange={setLeftType} onRetry={() => loadDetections(detectionMeta.page)} onPageChange={(page) => loadDetections(page - 1)} onDetail={showDetail} displayLine={displayLine} displayType={displayType} displayDescription={displayDescription} displayPerson={displayPerson} getSeverityLabel={getSeverityLabel} getSeverityClass={getSeverityClass} /><QueryDataTable titleKey="query.tableLedgerTitle" personKey="query.colRecorder" rows={ledgers} page={ledgerMeta.page + 1} pageMeta={ledgerMeta} loading={ledgerLoading} error={ledgerError} severity={rightSeverity} type={rightType} severityOptions={severityOptions} typeOptions={typeOptions} onSeverityChange={setRightSeverity} onTypeChange={setRightType} onRetry={() => loadLedgers(ledgerMeta.page)} onPageChange={(page) => loadLedgers(page - 1)} onDetail={showDetail} displayLine={displayLine} displayType={displayType} displayDescription={displayDescription} displayPerson={displayPerson} getSeverityLabel={getSeverityLabel} getSeverityClass={getSeverityClass} /></div></section></div><QueryDetailModal modalRef={modalRef} detail={detail} displayLine={displayLine} displayType={displayType} displayDescription={displayDescription} getSeverityClass={getSeverityClass} getSeverityLabel={getSeverityLabel} onExport={() => void exportDetail()} /></AppLayout>;
}
