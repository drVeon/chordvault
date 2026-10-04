import { ActionIcon, Divider, Group } from '@mantine/core';
import { IconDownload, IconRestore } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { SetlistDefaultsButton } from './SetlistDefaultsButton';
import { ColumnsToggle, FitButton, KeyGroup, TextSizeGroup } from './ToolbarControls';

export interface ToolbarProps {
  currentKey: string;
  nashville: boolean;
  nashvilleDisabled?: boolean;
  onNashvilleChange: (checked: boolean) => void;
  twoCol: boolean;
  onTwoColToggle: () => void;
  fontSize: number;
  onFontChange: (delta: number) => void;
  onReset: () => void;
  onPickKey: (key: string) => void;
  onAutoFit?: () => void;
  onSaveOnline?: () => void;
  onSaveLocal?: () => void;
  onExportPdf?: () => void;
  isModified?: boolean;
  overrides?: { num?: boolean; twoCol?: boolean; font?: boolean };
  settingsPanel?: ReactNode;
  renderKey?: number | string;
}

export function Toolbar(props: ToolbarProps) {
  const { twoCol, fontSize, onReset, onAutoFit, onExportPdf, settingsPanel, overrides = {} } = props;
  return (
    <Group className="transpose-bar" role="toolbar" aria-label="Display" gap="xs">
      <KeyGroup {...props} numOverridden={overrides.num} />
      <TextSizeGroup onFontChange={props.onFontChange} overridden={overrides.font} />
      {onAutoFit && <FitButton onAutoFit={onAutoFit} />}
      <ColumnsToggle twoCol={twoCol} onTwoColToggle={props.onTwoColToggle} overridden={overrides.twoCol} />
      <Divider orientation="vertical" mx={4} />
      {onExportPdf && (
        <ActionIcon variant="subtle" size="input-md" aria-label="Export PDF" title="Export as PDF" onClick={onExportPdf}>
          <IconDownload size={20} aria-hidden />
        </ActionIcon>
      )}
      {settingsPanel && <SetlistDefaultsButton panel={settingsPanel} />}
      <ActionIcon variant="subtle" size="input-md" aria-label="Reset font and columns" title="Reset font and columns" onClick={onReset} disabled={fontSize === 0 && !twoCol}>
        <IconRestore size={20} aria-hidden />
      </ActionIcon>
    </Group>
  );
}
