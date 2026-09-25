import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AnalysisComparison({ visible, items, rows, onExport }) {
  const { t } = useTranslation();
  if (!visible) return null;
  return <section className="analysis-section"><h2>{t('viz2d.analysisTitle')}</h2><div className="analysis-content"><div className="analysis-table"><table><thead><tr><th>{t('viz2d.analysisMetric')}</th>{items.map((item, index) => <th key={index}>{item.title}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.key}><td>{t(`viz2d.analysisRows.${row.key}`)}</td><td>{row.v1}</td><td>{row.v2}</td><td>{row.v3}</td><td>{row.v4}</td></tr>)}</tbody></table></div><button className="btn-export-analysis" onClick={onExport} type="button">{t('viz2d.exportAnalysis')}</button></div></section>;
}
