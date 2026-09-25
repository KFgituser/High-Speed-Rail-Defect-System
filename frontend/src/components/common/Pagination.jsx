import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Pagination({ page, totalPages, totalElements, onPageChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-bar">
      <button className="pager-btn" type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        {t('query.pagination.prev')}
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <button key={pageNumber} type="button" className={`pager-btn ${pageNumber === page ? 'active' : ''}`} onClick={() => onPageChange(pageNumber)}>
          {pageNumber}
        </button>
      ))}
      <button className="pager-btn" type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        {t('query.pagination.next')}
      </button>
      <span className="pager-info">{t('query.pagination.total', { count: totalElements, pages: totalPages })}</span>
    </div>
  );
}
