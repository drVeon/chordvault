import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { SongCard } from '../components/SongCard';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { TagFilter } from '../components/TagFilter';
import type { SongListItem } from '../types';
import { getSessionItem, setSessionItem } from '../lib/storage';

interface MySongsViewProps {
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function MySongsView({ navigate }: MySongsViewProps) {
  const api = useApi();
  const { t } = useI18n();
  const toast = useToast();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [query, setQuery] = useState(() => getSessionItem('cv_mysongs_query') || '');
  const [tagFilter, setTagFilter] = useState(() => getSessionItem('cv_mysongs_tag') || '');
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(() => {
    const saved = getSessionItem('cv_mysongs_page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback((q = '', tag = '', targetPage = 1) => {
    let url = '/api/songs';
    const params: string[] = [];
    if (q.trim()) params.push(`q=${encodeURIComponent(q.trim())}`);
    if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
    params.push(`page=${targetPage}`);
    params.push(`limit=20`);
    url += '?' + params.join('&');
    
    interface PaginatedSongsResponse {
      songs: SongListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    api<PaginatedSongsResponse>('GET', url)
      .then((data) => {
        setSongs(data.songs);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setLoaded(true);
        setSessionItem('cv_mysongs_query', q);
        setSessionItem('cv_mysongs_tag', tag);
        setSessionItem('cv_mysongs_page', String(data.page));
      })
      .catch((e) => toast(e.message, 'error'));
  }, [api, toast]);

  useEffect(() => {
    load(query, tagFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const handleClear = () => {
    setQuery('');
    load('', tagFilter, 1);
  };

  const doSearch = () => load(query, tagFilter, 1);

  const changeTag = (tag: string) => {
    setTagFilter(tag);
    load(query, tag, 1);
  };

  const handlePageChange = (newPage: number) => {
    load(query, tagFilter, newPage);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <div className="view-header">
        <h2 className="view-title">{t('songs.mySongs')}</h2>
      </div>
      <div className="search-row">
        <div className="search-input-wrapper">
          <input
            type="search"
            placeholder={t('songs.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={handleClear}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={doSearch}>{t('songs.search')}</button>
        <button className="btn btn-sm" onClick={() => navigate('song-edit')}>{t('songs.newSong')}</button>
      </div>
      <div className="search-filters">
        <TagFilter selected={tagFilter} onChange={changeTag} />
      </div>
      <div className="song-grid">
        {loaded && songs.length === 0 ? (
          <EmptyState
            icon="&#127928;"
            text={query || tagFilter ? t('songs.noMatches') : t('songs.noSongs')}
            action={!query && !tagFilter ? { label: t('songs.addFirst'), onClick: () => navigate('song-edit') } : undefined}
          />
        ) : (
          songs.map((s) => (
            <SongCard
              key={s.id}
              song={s}
              isOwner
              onClick={() => navigate('song-view', { id: String(s.id) })}
              onEdit={() => navigate('song-edit', { id: String(s.id) })}
              onTagClick={changeTag}
            />
          ))
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </>
  );
}
