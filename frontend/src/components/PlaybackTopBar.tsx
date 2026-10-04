import { ActionIcon, Button } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconArrowLeft, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { PlaybackLayout } from '../hooks/usePlaybackLayout';
import type { PlaybackNav } from './PlaybackDock';
import { Toolbar, type ToolbarProps } from './Toolbar';

interface PlaybackTopBarProps {
  layout: PlaybackLayout;
  title: string;
  position: string;
  nav: PlaybackNav;
  onExit: () => void;
  toolbar: ToolbarProps;
  more: ReactNode;
}

function TitleBlock({ title, position }: { title: string; position: string }) {
  return (
    <div className="playback-title">
      <h1 className="playback-title-main">{title}</h1>
      <span className="playback-title-sub">{position}</span>
    </div>
  );
}

export function PlaybackTopBar({ layout, title, position, nav, onExit, toolbar, more }: PlaybackTopBarProps) {
  if (layout === 'desktop') {
    return (
      <header className="playback-topbar">
        <Button variant="subtle" className="btn-exit" leftSection={<IconArrowLeft size={20} aria-hidden />} onClick={onExit}>Exit</Button>
        <span className="playback-divider" />
        <ActionIcon variant="subtle" size={44} aria-label="Previous Song" disabled={!nav.hasPrev} onClick={nav.onPrev}><IconChevronLeft size={22} aria-hidden /></ActionIcon>
        <TitleBlock title={title} position={position} />
        <ActionIcon variant="subtle" size={44} aria-label="Next Song" disabled={!nav.hasNext} onClick={nav.onNext}><IconChevronRight size={22} aria-hidden /></ActionIcon>
        <span className="toolbar-spacer" />
        <Toolbar {...toolbar} />
      </header>
    );
  }
  return (
    <header className="playback-topbar compact">
      <ActionIcon variant="subtle" size={44} className="btn-exit" aria-label="Exit playback" onClick={onExit}><IconX size={22} aria-hidden /></ActionIcon>
      <TitleBlock title={title} position={position} />
      <div className="playback-topbar-actions">
        {toolbar.onToggleSettings && (
          <ActionIcon variant={toolbar.settingsActive ? 'default' : 'subtle'} size={44} aria-label="Setlist defaults" aria-expanded={toolbar.settingsActive} onClick={toolbar.onToggleSettings}>
            <IconAdjustmentsHorizontal size={22} aria-hidden />
          </ActionIcon>
        )}
        {more}
      </div>
    </header>
  );
}
