import { Switch, Button } from '@mantine/core';
interface SettingsPanelProps {
  nashville: boolean;
  onNashvilleChange: (val: boolean) => void;
  hideYt: boolean;
  onHideYtChange: (val: boolean) => void;
  twoCol: boolean;
  onTwoColChange: (val: boolean) => void;
  fontSize: number;
  onFontChange: (delta: number) => void;
  onFontReset: () => void;
}

export function SettingsPanel({
  nashville,
  onNashvilleChange,
  hideYt,
  onHideYtChange,
  twoCol,
  onTwoColChange,
  fontSize,
  onFontChange,
  onFontReset,
}: SettingsPanelProps) {
  return (
    <div className="sl-options-panel">
      <div className="sl-options-title">Setlist defaults (all songs)</div>
      <Switch className="sl-option" label={<> Number notation </>} type="checkbox" checked={nashville} onChange={(e) => onNashvilleChange(e.target.checked)}  />
      <Switch className="sl-option" label={<> Hide YouTube </>} type="checkbox" checked={hideYt} onChange={(e) => onHideYtChange(e.target.checked)}  />
      <Switch className="sl-option" label={<> Multi-column layout </>} type="checkbox" checked={twoCol} onChange={(e) => onTwoColChange(e.target.checked)}  />
      <div className="sl-option">
        <span>Font size</span>
        <div className="sl-font-btns">
          <Button aria-label="Decrease default font size" variant="default" size="xs" className="btn btn-ghost btn-sm" onClick={() => onFontChange(-1)}>A&#8722;</Button>
          <Button aria-label="Increase default font size" variant="default" size="xs" className="btn btn-ghost btn-sm" onClick={() => onFontChange(1)}>A+</Button>
          <Button
            className={`btn btn-ghost btn-sm${fontSize === 0 ? ' disabled' : ''}`}
            onClick={onFontReset}
            disabled={fontSize === 0}
            title="Reset"
          >
            &#8634;
          </Button>
        </div>
      </div>
    </div>
  );
}
