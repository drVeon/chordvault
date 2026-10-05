import { Badge } from '@mantine/core';

/** A song's key in the chord colour, on a square so short and long keys line up. */
export function KeyBadge({ songKey }: { songKey: string }) {
  return (
    <Badge className="key-badge" radius="md" h={40} miw={40} px={8} fz={17} fw={700} ff="var(--font-chord)" bg="var(--chord-tint)" c="var(--cv-chord)" style={{ fontStretch: '78%' }}>
      {songKey}
    </Badge>
  );
}
