import { Paper, Button } from '@mantine/core';
import type { SetlistListItem } from '../types';
import { useI18n } from '../context/I18nContext';

interface SetlistCardProps {
  setlist: SetlistListItem;
  onClick: () => void;
  onPlay?: () => void;
  showUsername?: boolean;
}

export function SetlistCard({ setlist, onClick, onPlay, showUsername }: SetlistCardProps) {
  const { t } = useI18n();
  const date = setlist.event_date || (setlist.updated_at ? new Date(setlist.updated_at).toLocaleDateString() : '');

  return (
    <Paper withBorder className="song-card setlist-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onClick(); } }}>
      <div className="song-card-info">
        <div className="song-card-title">{setlist.name}</div>
        <div className="song-card-meta">
          {showUsername && setlist.username && `@${setlist.username} · `}
          {setlist.song_count} {setlist.song_count !== 1 ? t('admin.songPlural') : t('admin.song')}
          {date && ` · ${date}`}
        </div>
      </div>
      <div className="song-card-actions">
        {onPlay && setlist.song_count > 0 && (
          <Button variant="default" size="xs"
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
          >
            {t('setlist.play')}
          </Button>
        )}
      </div>
    </Paper>
  );
}
