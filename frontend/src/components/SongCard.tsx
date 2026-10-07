import { Badge, Button, Group, VisuallyHidden } from '@mantine/core';
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
  onTagClick?: (tag: string) => void;
}

export function SongCard({ song, isOwner, onClick, onEdit, onTagClick }: SongCardProps) {
  const hasDetails = Boolean(song.tags || song.language || song.key || song.bpm ||
    (song.version_count ?? 0) > 1 || song.visibility === 'private' || (isOwner && onEdit));
  return (
    <ListCard
      title={song.title}
      meta={song.artist}
      onClick={onClick}
    >
      {hasDetails && (
        <Group gap={6} mt={8}>
          {song.tags && song.tags.split(',').map((tag) => (onTagClick ? (
            <Badge key={tag} component="button" type="button" className="badge-tag-link" title={`Show songs tagged ${tag}`}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onTagClick(tag); }}>
              {tag}
            </Badge>
          ) : <Badge key={tag}>{tag}</Badge>))}
          {(song.version_count ?? 0) > 1 && <Badge variant="filled">{song.version_count} Versions</Badge>}
          {song.language && <Badge title={languageName(song.language)}>{song.language.toUpperCase()}</Badge>}
          {song.visibility === 'private' && <Badge px={8} title="Private"><IconLock size={14} aria-hidden /><VisuallyHidden>Private</VisuallyHidden></Badge>}
          {song.key && <KeyBadge songKey={song.key} />}
          {Boolean(song.bpm) && <Badge>{song.bpm}</Badge>}
          {isOwner && onEdit && (
            <Button variant="default" size="xs" ml="auto"
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              Edit
            </Button>
          )}
        </Group>
      )}
    </ListCard>
  );
}
