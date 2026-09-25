import React from 'react';
import { useTranslation } from 'react-i18next';

export default function VisualizationSlots({ items, busyIndex, defaultStart, defaultEnd, onGenerate3D, onImageError }) {
  const { t } = useTranslation();
  return <section className="visualization-section"><h2>{t('viz2d.resultTitle')}</h2><div className="visualization-grid">{items.map((item, index) => <div className="view-container" key={`viz-${index}`}><div className="view-header"><h3>{item.title}</h3><button className="btn-to-3d" type="button" disabled={busyIndex === index} onClick={() => onGenerate3D(index)}>{busyIndex === index ? t('common.generating') : t('viz2d.generate3d')}</button></div><div className="image-container">{item.image ? <img src={item.image} alt={item.title} className="visualization-image" onError={() => onImageError(index)} /> : <div className="visualization-image" aria-label={item.title} />}<div className="image-info"><p><strong>{t('viz2d.recordTime')}:</strong> {item.date}</p><p><strong>{t('viz2d.locationRange')}:</strong> {item.startLabel || defaultStart} - {item.endLabel || defaultEnd}</p></div></div></div>)}</div></section>;
}
