import { Title } from '@mantine/core';
import type { ReactNode } from 'react';

/** The large heading at the top of a page; wraps evenly instead of truncating. */
export function PageTitle({ order = 2, className, children }: { order?: 1 | 2; className?: string; children: ReactNode }) {
  return (
    <Title order={order} className={className} fz={{ base: 28, sm: 34 }} fw={700} lts="-0.015em" style={{ textWrap: 'balance' }}>
      {children}
    </Title>
  );
}
