import { Badge } from '@mantine/core';

export function KeyBadge({ songKey }: { songKey: string }) {
  return (
    <Badge className="key-badge" bg="var(--chord-tint)" c="var(--cv-chord)">
      {songKey}
    </Badge>
  );
}
