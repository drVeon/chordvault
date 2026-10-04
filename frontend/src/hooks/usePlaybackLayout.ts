import { useMediaQuery } from '@mantine/hooks';

export type PlaybackLayout = 'desktop' | 'tablet' | 'phone';

const OPTIONS = { getInitialValueInEffect: false };

export function usePlaybackLayout(): PlaybackLayout {
  const desktop = useMediaQuery('(min-width: 1024px)', undefined, OPTIONS);
  const tablet = useMediaQuery('(min-width: 640px)', undefined, OPTIONS);
  if (desktop) return 'desktop';
  return tablet ? 'tablet' : 'phone';
}
