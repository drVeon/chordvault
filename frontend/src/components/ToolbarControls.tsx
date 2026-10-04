import { Button, Popover } from '@mantine/core';
import { IconArrowsMaximize, IconChevronDown, IconLayoutColumns } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { KeyPicker } from './KeyPicker';

interface KeyGroupProps {
  currentKey: string;
  onPickKey: (key: string) => void;
  isModified?: boolean;
  onSaveOnline?: () => void;
  onSaveLocal?: () => void;
  renderKey?: number | string;
  nashville?: boolean;
  nashvilleDisabled?: boolean;
  onNashvilleChange?: (checked: boolean) => void;
  numOverridden?: boolean;
}

export function KeyGroup({ currentKey, onPickKey, isModified, onSaveOnline, onSaveLocal, renderKey, nashville, nashvilleDisabled, onNashvilleChange, numOverridden }: KeyGroupProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [renderKey]);
  const closeAfter = (fn?: () => void) => fn && (() => { fn(); setOpen(false); });

  return (
    <div className="control-group" role="group" aria-label="Key and notation">
      <Popover opened={open} onChange={setOpen} trapFocus returnFocus width="min(90vw, 440px)">
        <Popover.Target>
          <button type="button" className="control-seg key-current" data-testid="key-display" data-dimmed={nashville || undefined} onClick={() => setOpen((v) => !v)}>
            Key <b className="key-current-value">{currentKey || '?'}</b>
            <IconChevronDown size={16} aria-hidden />
          </button>
        </Popover.Target>
        <Popover.Dropdown>
          <KeyPicker currentKey={currentKey} onPickKey={onPickKey} visible={open} isModified={isModified}
            onSaveOnline={closeAfter(onSaveOnline)} onSaveLocal={closeAfter(onSaveLocal)} />
        </Popover.Dropdown>
      </Popover>
      {onNashvilleChange && (
        <button type="button" className="control-seg" aria-label="Number notation" aria-pressed={!!nashville}
          data-overridden={numOverridden || undefined} disabled={nashvilleDisabled} onClick={() => onNashvilleChange(!nashville)}>
          123
        </button>
      )}
    </div>
  );
}

export function TextSizeGroup({ onFontChange, overridden }: { onFontChange: (delta: number) => void; overridden?: boolean }) {
  return (
    <div className="control-group" role="group" aria-label="Text size" data-overridden={overridden || undefined}>
      <button type="button" className="control-seg" aria-label="Decrease font size" onClick={() => onFontChange(-1)}>A&#8722;</button>
      <button type="button" className="control-seg" aria-label="Increase font size" onClick={() => onFontChange(1)}>A+</button>
    </div>
  );
}

export function FitButton({ onAutoFit }: { onAutoFit: () => void }) {
  return (
    <Button variant="default" className="control-btn autofit-btn" onClick={onAutoFit} title="Auto-fit for this screen (one-time)" leftSection={<IconArrowsMaximize size={18} aria-hidden />}>
      Fit
    </Button>
  );
}

export function ColumnsToggle({ twoCol, onTwoColToggle, overridden }: { twoCol: boolean; onTwoColToggle: () => void; overridden?: boolean }) {
  return (
    <button type="button" className="control-icon col-toggle" aria-label="Multi-column layout" aria-pressed={twoCol}
      data-overridden={overridden || undefined} onClick={onTwoColToggle} title={twoCol ? 'Single column' : 'Multi-column'}>
      <IconLayoutColumns size={20} aria-hidden />
    </button>
  );
}
