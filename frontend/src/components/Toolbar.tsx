import { ActionIcon } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconDownload, IconRestore } from '@tabler/icons-react';
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
  onToggleSettings?: () => void;
  isModified?: boolean;
  overrides?: { num?: boolean; twoCol?: boolean; font?: boolean };
  settingsActive?: boolean;
  renderKey?: number | string;
}

export function Toolbar(props: ToolbarProps) {
  const { twoCol, fontSize, onReset, onAutoFit, onExportPdf, onToggleSettings, settingsActive, overrides = {} } = props;
  return (
    <div className="transpose-bar" role="toolbar" aria-label="Display">
      <KeyGroup {...props} numOverridden={overrides.num} />
      <TextSizeGroup onFontChange={props.onFontChange} overridden={overrides.font} />
      {onAutoFit && <FitButton onAutoFit={onAutoFit} />}
      <ColumnsToggle twoCol={twoCol} onTwoColToggle={props.onTwoColToggle} overridden={overrides.twoCol} />
      <span className="toolbar-spacer" />
      {onExportPdf && (
        <ActionIcon variant="subtle" size={44} aria-label="Export PDF" title="Export as PDF" onClick={onExportPdf}>
          <IconDownload size={20} aria-hidden />
        </ActionIcon>
      )}
      {onToggleSettings && (
        <ActionIcon variant={settingsActive ? 'default' : 'subtle'} size={44} aria-label="Setlist defaults" aria-expanded={settingsActive} title="Settings" onClick={onToggleSettings}>
          <IconAdjustmentsHorizontal size={20} aria-hidden />
        </ActionIcon>
      )}
      <ActionIcon variant="subtle" size={44} aria-label="Reset font and columns" title="Reset font and columns" onClick={onReset} disabled={fontSize === 0 && !twoCol}>
        <IconRestore size={20} aria-hidden />
      </ActionIcon>
    </div>
  );
}
