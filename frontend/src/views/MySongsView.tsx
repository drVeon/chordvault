import { SearchField } from '../components/SearchField';
import { SearchRow } from '../components/SearchRow';
import { Button, SimpleGrid, Group } from '@mantine/core';
import { IconPlus, IconGuitarPick } from '@tabler/icons-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { SongCard } from '../components/SongCard';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import type { SongListItem } from '../types';
import { useSearchSessionValue, searchPage } from '../hooks/useSearchSessionValue';
import { PageTitle } from '../components/PageTitle';
import { TagFilter } from '../components/TagFilter';

interface MySongsViewProps {
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function MySongsView({ navigate }: MySongsViewProps) {
  const api = useApi();
  const { t } = useI18n();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [savedQuery, saveQuery] = useSearchSessionValue('cv_mysongs_query');
  const [query, setQuery] = useState(savedQuery);
  const [savedTag, saveTag] = useSearchSessionValue('cv_mysongs_tag');
  const [tagFilter, setTagFilter] = useState(savedTag);
  const [loaded, setLoaded] = useState(false);
  const [savedPage, savePage] = useSearchSessionValue('cv_mysongs_page', '1');
  const [page, setPage] = useState(() => searchPage(savedPage));
  const [totalPages, setTotalPages] = useState(1);

  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

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
        if (!active.current) return;
        setSongs(data.songs);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setLoaded(true);
        saveQuery(q);
        saveTag(tag);
        savePage(String(data.page));
      })
      .catch((e) => { if (active.current) toast(e.message, 'error'); });
  }, [api, saveQuery, saveTag, savePage]);

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
      <Group justify="space-between" mb="lg">
        <PageTitle className="view-title">{t('songs.mySongs')}</PageTitle>
      </Group>
      <SearchRow>
        <SearchField label={t('songs.searchPlaceholder')} value={query} onChange={setQuery} onSearch={doSearch} onClear={handleClear} />
        <Button variant="default" size="sm" onClick={doSearch}>{t('songs.search')}</Button>
        <Button size="sm" w={{ base: '100%', xs: 'auto' }} leftSection={<IconPlus size={16} aria-hidden />} onClick={() => navigate('song-edit')}>{t('songs.newSong')}</Button>
      </SearchRow>
      <div className="search-filters">
        <TagFilter selected={tagFilter} onChange={changeTag} />
      </div>
      <SimpleGrid className="song-grid" minColWidth="min(100%, 320px)" autoFlow="auto-fill" spacing={12}>
        {loaded && songs.length === 0 ? (
          <EmptyState
            icon={<IconGuitarPick size={56} aria-hidden />}
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
      </SimpleGrid>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </>
  );
}
