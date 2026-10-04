import { Loader } from '@mantine/core';
import { useI18n } from '../context/I18nContext';

export function Loading() {
  const { t } = useI18n();
  return (
    <div className="empty">
      <Loader aria-label={t('common.loading')} />
      <p>{t('common.loading')}</p>
    </div>
  );
}
