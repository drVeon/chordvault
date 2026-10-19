import { Button, Group, Flex } from '@mantine/core';
import { useLibraryRead } from '../hooks/useLibraryRead';
import { useOffline } from '../context/OfflineContext';
import { SearchField } from '../components/SearchField';
import { SearchRow } from '../components/SearchRow';
import { IconPlus, IconGuitarPick } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { SongCard } from '../components/SongCard';
import { EmptyState } from '../components/EmptyState';
import { CardGrid } from '../components/CardGrid';
import { Pagination } from '../components/Pagination';
import { useSessionField, useSearchSessionValue } from '../hooks/useSearchSessionValue';
import { TagFilter } from '../components/TagFilter';
import { splitTags } from '../lib/tagName';
import { searchKey } from '../lib/storage';
import { LoadErrorAlert } from '../components/LoadErrorAlert';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import type { LibraryQuery } from '../types/offline';
import { PageTitle } from '../components/PageTitle';
import type { Navigate } from '../lib/routes';

interface MySongsViewProps {
  navigate: Navigate;
}

export function MySongsView({ navigate }: MySongsViewProps) {
  const { t } = useI18n();
  const { readOnly } = useOffline();
  const { querySongs } = useLibraryRead();
  const [query, setQuery, saveQuery] = useSessionField(searchKey('mysongs', 'query'));
  const [savedTagFilter, saveTagFilter] = useSearchSessionValue(searchKey('mysongs', 'tags'));
  const [tagFilter, setTagFilter] = useState(() => splitTags(savedTagFilter));
  const fetchOwnSongs = useCallback((filters: LibraryQuery) => querySongs({ ...filters, q: filters.q?.trim(), own: true }), [querySongs]);
  const { items: songs, page, totalPages, loaded, loadError, search, refine, clear, goToPage } = usePaginatedSearch({
    pageKey: searchKey('mysongs', 'page'), listKey: 'songs', fetchPage: fetchOwnSongs,
    filters: { q: query, tags: tagFilter }, setQuery,
    persist: ({ q = '', tags = [] }) => { saveQuery(q); saveTagFilter(tags.join(',')); },
  });
  const changeTags = (next: string[]) => { setTagFilter(next); refine({ tags: next }); };
  const addTag = (tag: string) => { if (!tagFilter.includes(tag)) changeTags([...tagFilter, tag]); };

  return (
    <>
      <LoadErrorAlert message={loadError} />
      <Group justify="space-between" mb="lg">
        <PageTitle className="view-title">{t('songs.mySongs')}</PageTitle>
      </Group>
      <SearchRow>
        <SearchField label={t('songs.searchPlaceholder')} value={query} onChange={setQuery} onSearch={search} onClear={clear} />
        <Button variant="default" size="sm" onClick={search}>{t('songs.search')}</Button>
        <Button size="sm" w={{ base: '100%', xs: 'auto' }} leftSection={<IconPlus size={16} aria-hidden />} disabled={readOnly} onClick={() => navigate('song-edit')}>{t('songs.newSong')}</Button>
      </SearchRow>
      <Flex mt={{ base: 0, xs: -12 }} mb={16}>
        <TagFilter value={tagFilter} onChange={changeTags} />
      </Flex>
      <CardGrid>
        {!loadError && loaded && songs.length === 0 ? (
          <EmptyState
            icon={<IconGuitarPick size={56} aria-hidden />}
            text={query || tagFilter.length ? t('songs.noMatches') : t('songs.noSongs')}
            action={!readOnly && !query && !tagFilter.length ? { label: t('songs.addFirst'), onClick: () => navigate('song-edit') } : undefined}
          />
        ) : (
          songs.map((s) => (
            <SongCard
              key={s.id}
              song={s}
              isOwner
              onClick={() => navigate('song-view', { id: String(s.id) })}
              onEdit={readOnly ? undefined : () => navigate('song-edit', { id: String(s.id) })}
              onTagClick={addTag}
            />
          ))
        )}
      </CardGrid>
      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
    </>
  );
}
