import { Loader, Stack, Text } from '@mantine/core';
import { useI18n } from '../context/I18nContext';

export function Loading() {
  const { t } = useI18n();
  return (
    <Stack align="center" py={80} px={20} c="dimmed" style={{ gridColumn: '1 / -1' }}>
      <Loader aria-label={t('common.loading')} />
      <Text>{t('common.loading')}</Text>
    </Stack>
  );
}
