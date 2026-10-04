import { useEffect, useEffectEvent, useState } from 'react';
import { useClipboard } from '@mantine/hooks';
import { showStatusNotification } from '../lib/notifications';

export function useCopyNotification(successMessage: string) {
  const clipboard = useClipboard();
  const [request, setRequest] = useState<{ text: string } | null>(null);
  const performCopy = useEffectEvent((text: string) => clipboard.copy(text));
  useEffect(() => { if (request) performCopy(request.text); }, [request]);
  useEffect(() => {
    if (!request) return;
    if (clipboard.error) {
      showStatusNotification(clipboard.error.message, 'error');
      setRequest(null);
    } else if (clipboard.copied) {
      showStatusNotification(successMessage, 'success');
      setRequest(null);
    }
  }, [clipboard.error, clipboard.copied, request, successMessage]);
  return (text: string) => {
    if (request) return;
    clipboard.reset();
    setRequest({ text });
  };
}
