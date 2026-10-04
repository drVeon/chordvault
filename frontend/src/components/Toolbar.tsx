import { Button, Checkbox, Popover } from '@mantine/core';
import { useState, useEffect } from 'react';
import { KeyPicker } from './KeyPicker';

interface ToolbarProps {
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

export function Toolbar({
  currentKey,
  nashville,
  nashvilleDisabled,
  onNashvilleChange,
  twoCol,
  onTwoColToggle,
  fontSize,
  onFontChange,
  onReset,
  onPickKey,
  onAutoFit,
  onSaveOnline,
  onSaveLocal,
  onExportPdf,
  onToggleSettings,
  isModified,
  overrides,
  settingsActive,
  renderKey,
}: ToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const ov = overrides || {};
  const isDefault = fontSize === 0 && !twoCol;

  useEffect(() => {
    setPickerOpen(false);
  }, [renderKey]);

  return (
    <>
      <div className="transpose-bar">
        <Popover opened={pickerOpen} onChange={setPickerOpen} trapFocus returnFocus width="min(90vw, 440px)">
        <Popover.Target><Button
          className={`key-current${nashville ? ' disabled' : ''}`}
          data-testid="key-display"
          onClick={() => setPickerOpen((v) => !v)}
        >
          KEY {currentKey || '?'}
        </Button></Popover.Target>
        <Popover.Dropdown>
          <KeyPicker currentKey={currentKey} onPickKey={onPickKey} visible={pickerOpen}
            isModified={isModified}
            onSaveOnline={onSaveOnline ? () => { onSaveOnline(); setPickerOpen(false); } : undefined}
            onSaveLocal={onSaveLocal ? () => { onSaveLocal(); setPickerOpen(false); } : undefined}
          />
        </Popover.Dropdown>
        </Popover>
          <Checkbox
            className={ov.num ? 'overridden' : undefined}
            id="nashville-toggle"
            label="123"
            aria-label="Number notation"
            type="checkbox"
            checked={nashville}
            disabled={nashvilleDisabled}
            onChange={(e) => onNashvilleChange(e.target.checked)}
          />
        <Button
          className={`transpose-btn col-toggle${twoCol ? ' active' : ''}${ov.twoCol ? ' overridden' : ''}`}
          onClick={onTwoColToggle}
          variant={twoCol ? 'light' : 'default'}
          aria-pressed={twoCol}
          aria-label="Multi-column layout"
          title={twoCol ? 'Single column' : 'Multi-column'}
        >
          &#124;&#124;
        </Button>
        <Button
          className={`transpose-btn font-btn${ov.font ? ' overridden' : ''}`}
          onClick={() => onFontChange(-1)}
          aria-label="Decrease font size"
        >
          A&#8722;
        </Button>
        <Button
          className={`transpose-btn font-btn${ov.font ? ' overridden' : ''}`}
          onClick={() => onFontChange(1)}
          aria-label="Increase font size"
        >
          A+
        </Button>
        <span className="toolbar-divider" />
        {onAutoFit && (
          <Button
            className={"transpose-btn font-btn autofit-btn"}
            onClick={onAutoFit}
            title="Auto-fit for this screen (one-time)"
          >
            FIT
          </Button>
        )}
        <span className="toolbar-spacer" />
        {onExportPdf && (
          <Button
            className="transpose-btn font-btn pdf-btn"
            onClick={onExportPdf}
            title="Export as PDF"
          >
            PDF
          </Button>
        )}
        {onToggleSettings && (
          <Button
            className={`transpose-btn font-btn gear-btn${settingsActive ? ' active' : ''}`}
            onClick={onToggleSettings}
            aria-label="Setlist defaults"
            aria-expanded={settingsActive}
            variant={settingsActive ? 'light' : 'default'}
            title="Settings"
          >
            &#9881;
          </Button>
        )}
        <Button
          className="transpose-btn font-btn font-reset"
          onClick={onReset}
          disabled={isDefault}
          title="Reset font and columns"
        >
          &#8634;
        </Button>
      </div>
    </>
  );
}
