import { Badge, Paper, Button, VisuallyHidden } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { KeyBadge } from './KeyBadge';
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
    <Paper withBorder className="song-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onClick(); } }}>
      <div className="song-card-info">
        <div className="song-card-title">{song.title}</div>
        {song.artist && <div className="song-card-meta">{song.artist}</div>}
        {song.tags && (
          <div className="song-card-tags">
            {song.tags.split(',').map((tag) => (
              <Badge key={tag} size="md">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="song-card-actions">
        {song.version_count && song.version_count > 1 && (
          <Badge variant="filled">{song.version_count} Versions</Badge>
        )}
        {song.language && <Badge title={languageName(song.language)}>{song.language.toUpperCase()}</Badge>}
        {song.visibility === 'private' && <Badge px={8} title="Private"><IconLock size={14} aria-hidden /><VisuallyHidden>Private</VisuallyHidden></Badge>}
        {song.key && <KeyBadge songKey={song.key} />}
        {song.bpm && <Badge>{song.bpm}</Badge>}
        {isOwner && onEdit && (
          <Button variant="default" size="xs"
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            Edit
          </Button>
        )}
      </div>
    </Paper>
  );
}
