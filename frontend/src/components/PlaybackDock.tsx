import { ActionIcon, Affix, Button, Group } from '@mantine/core';
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

function NavButton({ labeled, label, text, icon, disabled, onClick }: { labeled: boolean; label: string; text: string; icon: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  const Icon = icon === 'prev' ? IconChevronLeft : IconChevronRight;
  if (!labeled) {
    return <ActionIcon variant="default" size="input-lg" aria-label={label} disabled={disabled} onClick={onClick}><Icon size={24} aria-hidden /></ActionIcon>;
  }
  const side = { [icon === 'prev' ? 'leftSection' : 'rightSection']: <Icon size={22} aria-hidden /> };
  return <Button variant="default" size="lg" aria-label={label} disabled={disabled} onClick={onClick} {...side}>{text}</Button>;
}

export function PlaybackDock({ layout, nav, toolbar }: PlaybackDockProps) {
  const labeled = layout === 'tablet';
  const overrides = toolbar.overrides ?? {};
  return (
    <Affix withinPortal={false} position={{ bottom: 0, left: 0, right: 0 }} zIndex={60} className="playback-dock" data-no-swipe>
      <Group component="nav" aria-label="Playback controls" wrap="nowrap" gap={labeled ? 'xs' : 6} bg="var(--cv-band)" px={labeled ? 'sm' : 'xs'} pt="xs" className="playback-dock-bar">
        <NavButton labeled={labeled} label="Previous Song" text="Prev" icon="prev" disabled={!nav.hasPrev} onClick={nav.onPrev} />
        <Group gap={labeled ? 'xs' : 6} wrap="nowrap" justify="center" flex={1} miw={0}>
          <KeyGroup size="lg" dense currentKey={toolbar.currentKey} onPickKey={toolbar.onPickKey} isModified={toolbar.isModified}
            onSaveOnline={toolbar.onSaveOnline} onSaveLocal={toolbar.onSaveLocal} renderKey={toolbar.renderKey} nashville={toolbar.nashville} />
          <TextSizeGroup size="lg" dense onFontChange={toolbar.onFontChange} overridden={overrides.font} />
          {toolbar.onAutoFit && <FitButton size="lg" dense onAutoFit={toolbar.onAutoFit} />}
          {labeled && <ColumnsToggle size="lg" twoCol={toolbar.twoCol} onTwoColToggle={toolbar.onTwoColToggle} overridden={overrides.twoCol} />}
        </Group>
        <NavButton labeled={labeled} label="Next Song" text="Next" icon="next" disabled={!nav.hasNext} onClick={nav.onNext} />
      </Group>
    </Affix>
  );
}
