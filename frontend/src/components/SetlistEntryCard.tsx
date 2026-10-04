import { Badge, Button, VisuallyHidden, CloseButton, Group } from '@mantine/core';
import { IconGripVertical, IconLock } from '@tabler/icons-react';
import { getSongKey } from '../lib/chords';
import { entrySemitones } from '../lib/setlistKeys';
import type { SetlistEntry } from '../types';

interface SetlistEntryCardProps {
  entry: SetlistEntry;
  idx: number;
  isEditable: boolean;
  isLocal: boolean;
  onRemove: (entryId: number | string, idx: number) => void;
  onStepKey: (entryId: number | string, idx: number, direction: 1 | -1) => void;
  onClick: (idx: number) => void;
  t: (key: string) => string;
  dragProps?: React.HTMLProps<HTMLDivElement>;
  handleProps?: React.HTMLProps<HTMLDivElement>;
  isDragging?: boolean;
}

export function SetlistEntryCard({
  entry,
  idx,
  isEditable,
  isLocal,
  onRemove,
  onStepKey,
  onClick,
  t,
  dragProps,
  handleProps,
  isDragging,
}: SetlistEntryCardProps) {
  const content = entry.content_override || entry.content;
  const semitones = entrySemitones(content, entry.target_key);
  const keyDisplay = getSongKey(content, semitones);
  const canStep = !!(entry.target_key || getSongKey(content, 0));

  return (
    <div
      className={`song-card setlist-song-item ${isDragging ? 'dragging' : ''}`}
      onClick={() => onClick(idx)}
      {...dragProps}
    >
      {isEditable && (
        <div
          className="setlist-drag-handle"
          onClick={(e) => e.stopPropagation()}
          {...handleProps}
          title="Drag to reorder"
        >
          <IconGripVertical size={20} aria-hidden />
        </div>
      )}
      <div className="setlist-song-pos">{idx + 1}</div>
      <div className="song-card-info">
        <div className="song-card-title">
          {entry.title}
          {entry.visibility === 'private' && (
            <Badge ml={8} px={8} title="Private"><IconLock size={14} aria-hidden /><VisuallyHidden>Private</VisuallyHidden></Badge>
          )}
          {!isLocal && isEditable && entry.content_override && (
            <Badge ml={8}>{t('setlist.edited')}</Badge>
          )}
        </div>
        <div className="song-card-meta">
          {entry.artist ? `${entry.artist} · ` : ''}
          {keyDisplay}
        </div>
      </div>
      {isEditable && (
        <Group className="setlist-entry-controls" gap={4} wrap="nowrap" justify="flex-end" w={{ base: '100%', xs: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <Button variant="default" size="xs" className="btn btn-ghost btn-sm" disabled={!canStep} onClick={() => onStepKey(entry.entry_id, idx, -1)}>
            &#9837;
          </Button>
          <Button variant="default" size="xs" className="btn btn-ghost btn-sm" disabled={!canStep} onClick={() => onStepKey(entry.entry_id, idx, 1)}>
            &#9839;
          </Button>
        </Group>
      )}
      {isEditable && (
        <CloseButton
          size="lg"
          aria-label="Remove"
          title="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(entry.entry_id, idx);
          }}
        />
      )}
    </div>
  );
}

