import { ActionIcon, Popover } from '@mantine/core';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import type { ReactNode } from 'react';

/** Opens the setlist-wide defaults next to the button that asked for them. */
export function SetlistDefaultsButton({ panel }: { panel: ReactNode }) {
  return (
    <Popover position="bottom-end" width={320} shadow="md" radius="lg" trapFocus returnFocus>
      <Popover.Target>
        <ActionIcon size="input-md" aria-label="Setlist defaults" title="Setlist defaults">
          <IconAdjustmentsHorizontal size={22} aria-hidden />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown className="setlist-defaults-panel" p="lg" bg="var(--cv-raise)">{panel}</Popover.Dropdown>
    </Popover>
  );
}
