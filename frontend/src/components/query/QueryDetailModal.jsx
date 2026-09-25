import React from 'react';
import { useTranslation } from 'react-i18next';

export default function QueryDetailModal({ modalRef, detail, displayLine, displayType, displayDescription, getSeverityClass, getSeverityLabel, onExport }) {
  const { t } = useTranslation();

  return (
    <div className="modal fade" id="detailModal" tabIndex="-1" aria-labelledby="detailModalLabel" aria-hidden="true" ref={modalRef}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="detailModalLabel">{t('query.detailTitle', { id: detail.id })}</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label={t('query.closeAria')} />
          </div>
          <div className="modal-body">
            <div className="detail-section">
              <h5>{t('query.basicInfo')}</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>{t('query.fieldDefectId')}:</strong> <span>{detail.id}</span></p>
                  <p><strong>{t('query.fieldLineName')}:</strong> <span>{displayLine(detail.line)}</span></p>
                  <p><strong>{t('query.fieldLocation')}:</strong> <span>{detail.location}</span></p>
                </div>
                <div className="col-md-6">
                  <p><strong>{t('query.fieldType')}:</strong> <span>{displayType(detail.type)}</span></p>
                  <p><strong>{t('query.fieldDate')}:</strong> <span>{detail.date}</span></p>
                  <p><strong>{t('query.fieldSeverity')}:</strong> <span className={`badge ${getSeverityClass(detail.severity)}`}>{getSeverityLabel(detail.severity)}</span></p>
                </div>
              </div>
            </div>
            <div className="detail-section">
              <h5>{t('query.photos')}</h5>
              <div className="photo-container"><p>{t('query.noPhotos')}</p></div>
            </div>
            <div className="detail-section"><h5>{t('query.suggestion')}</h5><p>{displayDescription(detail.suggestion)}</p></div>
            <div className="detail-section">
              <h5>{t('query.history')}</h5>
              <div>{(detail.history || []).map((item, index) => <div key={index} className="history-item">{displayDescription(item)}</div>)}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">{t('query.modalClose')}</button>
            <button type="button" className="btn btn-primary" onClick={onExport}>{t('query.exportDetail')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
