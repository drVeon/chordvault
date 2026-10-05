import { Badge, Button, VisuallyHidden } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { KeyBadge } from './KeyBadge';
import { ListCard } from './ListCard';
import type { SongListItem } from '../types';
import { languageName } from '../lib/languages';

interface SongCardProps {
  song: SongListItem;
  isOwner?: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

export function SongCard({ song, isOwner, onClick, onEdit }: SongCardProps) {
  return (
    <ListCard
      title={song.title}
      meta={song.artist}
      onClick={onClick}
      actions={[
        (song.version_count ?? 0) > 1 && <Badge key="versions" variant="filled">{song.version_count} Versions</Badge>,
        song.language && <Badge key="language" title={languageName(song.language)}>{song.language.toUpperCase()}</Badge>,
        song.visibility === 'private' && <Badge key="private" px={8} title="Private"><IconLock size={14} aria-hidden /><VisuallyHidden>Private</VisuallyHidden></Badge>,
        song.key && <KeyBadge key="key" songKey={song.key} />,
        song.bpm && <Badge key="bpm">{song.bpm}</Badge>,
        isOwner && onEdit && (
          <Button key="edit" variant="default" size="xs"
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            Edit
          </Button>
        ),
      ]}
    >
      {song.tags && (
        <div className="song-card-tags">
          {song.tags.split(',').map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
    </ListCard>
  );
}
