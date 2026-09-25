import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DataState({ loading, error, isEmpty, colSpan, onRetry }) {
  const { t } = useTranslation();
  const message = loading ? t('common.loading') : error ? t('common.loadFailed') : t('common.noData');
  if (!loading && !error && !isEmpty) return null;

  return (
    <tr>
      <td colSpan={colSpan} className="table-state">
        {message}
        {error && onRetry ? <button type="button" className="btn-detail" onClick={onRetry}>{t('common.retry')}</button> : null}
      </td>
    </tr>
  );
}
