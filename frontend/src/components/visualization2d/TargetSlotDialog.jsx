import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TargetSlotDialog({ open, target, onChange, onCancel, onConfirm }) {
  const { t } = useTranslation();
  if (!open) return null;
  return <div className="gt-modal-mask" onClick={(event) => event.target === event.currentTarget && onCancel()}><div className="gt-modal"><h3 style={{ margin: '0 0 12px' }}>{t('viz2d.targetTitle')}</h3><select className="form-input" style={{ width: '100%', marginTop: '8px' }} value={target ?? ''} onChange={(event) => onChange(Number(event.target.value))}>{[0, 1, 2, 3].map((index) => <option key={index} value={index}>{t('viz2d.slotLabel', { slot: index + 1 })}</option>)}</select><div className="gt-modal-actions"><button className="btn-secondary" onClick={onCancel} type="button">{t('common.cancel')}</button><button className="btn-primary" type="button" disabled={target === null} onClick={onConfirm}>{t('common.confirm')}</button></div></div></div>;
}
