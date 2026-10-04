import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { ToolbarProps } from './Toolbar';
import { ColumnsToggle, FitButton, KeyGroup, TextSizeGroup } from './ToolbarControls';

export interface PlaybackNav {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

interface PlaybackDockProps {
  layout: 'tablet' | 'phone';
  nav: PlaybackNav;
  toolbar: ToolbarProps;
}

export function PlaybackDock({ layout, nav, toolbar }: PlaybackDockProps) {
  const labeled = layout === 'tablet';
  const overrides = toolbar.overrides ?? {};
  return (
    <nav className="playback-dock" aria-label="Playback controls" data-no-swipe>
      <button type="button" className="dock-nav-btn" aria-label="Previous Song" disabled={!nav.hasPrev} onClick={nav.onPrev}>
        <IconChevronLeft size={24} aria-hidden />{labeled && 'Prev'}
      </button>
      <div className="dock-controls">
        <KeyGroup currentKey={toolbar.currentKey} onPickKey={toolbar.onPickKey} isModified={toolbar.isModified}
          onSaveOnline={toolbar.onSaveOnline} onSaveLocal={toolbar.onSaveLocal} renderKey={toolbar.renderKey} nashville={toolbar.nashville} />
        <TextSizeGroup onFontChange={toolbar.onFontChange} overridden={overrides.font} />
        {toolbar.onAutoFit && <FitButton onAutoFit={toolbar.onAutoFit} />}
        {labeled && <ColumnsToggle twoCol={toolbar.twoCol} onTwoColToggle={toolbar.onTwoColToggle} overridden={overrides.twoCol} />}
      </div>
      <button type="button" className="dock-nav-btn" aria-label="Next Song" disabled={!nav.hasNext} onClick={nav.onNext}>
        {labeled && 'Next'}<IconChevronRight size={24} aria-hidden />
      </button>
    </nav>
  );
}
