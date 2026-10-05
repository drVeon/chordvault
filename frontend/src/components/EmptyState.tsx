import { Button, EmptyState as MantineEmptyState } from '@mantine/core';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  text: ReactNode;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, text, action }: EmptyStateProps) {
  return (
    <MantineEmptyState
      icon={icon}
      description={text}
      py={80}
      px={20}
      style={{ gridColumn: '1 / -1' }}
      styles={{ indicator: { opacity: 0.3, width: 56, height: 56 }, description: { fontSize: 17, fontWeight: 400 }, actions: { marginTop: 20 } }}
    >
      {action && (
        <MantineEmptyState.Actions>
          <Button onClick={action.onClick}>{action.label}</Button>
        </MantineEmptyState.Actions>
      )}
    </MantineEmptyState>
  );
}
