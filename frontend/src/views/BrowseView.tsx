import { SearchField } from '../components/SearchField';
import { SearchRow } from '../components/SearchRow';
import { ActionIcon, Button, NativeSelect, SimpleGrid } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconPlus, IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { SongCard } from '../components/SongCard';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import type { SongListItem } from '../types';
import { LANGUAGES } from '../lib/languages';
import { useSearchSessionValue, searchPage } from '../hooks/useSearchSessionValue';

interface BrowseViewProps {
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function BrowseView({ navigate }: BrowseViewProps) {
  const api = useApi();
  const { user } = useAuth();
  const { t } = useI18n();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [savedQuery, saveQuery] = useSearchSessionValue('cv_browse_query');
  const [query, setQuery] = useState(savedQuery);
  const [savedLangFilter, saveLangFilter] = useSearchSessionValue('cv_browse_lang');
  const [langFilter, setLangFilter] = useState(savedLangFilter);
  const [savedShowFilters, saveShowFilters] = useSearchSessionValue('cv_browse_show_filters', 'false');
  const showFilters = savedShowFilters === 'true';
  const [loaded, setLoaded] = useState(false);
  const [savedPage, savePage] = useSearchSessionValue('cv_browse_page', '1');
  const [page, setPage] = useState(() => searchPage(savedPage));
  const [totalPages, setTotalPages] = useState(1);

  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const load = useCallback(async (q = '', lang = '', targetPage = 1) => {
    try {
      let url = '/api/songs/public';
      const params: string[] = [];
      if (q) params.push(`q=${encodeURIComponent(q)}`);
      if (lang) params.push(`language=${encodeURIComponent(lang)}`);
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
      const data = await api<PaginatedSongsResponse>('GET', url);
      if (!active.current) return;
      setSongs(data.songs);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setLoaded(true);

      saveQuery(q);
      saveLangFilter(lang);
      savePage(String(data.page));
    } catch (e) { if (active.current) toast((e as Error).message, 'error'); }
  }, [api, saveQuery, saveLangFilter, savePage]);

  useEffect(() => {
    load(query, langFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const handleClear = () => {
    setQuery('');
    load('', langFilter, 1);
  };

  const doSearch = () => load(query, langFilter, 1);

  const handlePageChange = (newPage: number) => {
    load(query, langFilter, newPage);
    window.scrollTo(0, 0);
  };

  const showHero = !user && !query && !langFilter && loaded && songs.length === 0 && page === 1;

  return (
    <>
      {showHero ? (
        <div className="hero">
          <div className="hero-title">&#9833; ChordVault</div>
          <div className="hero-tagline">{t('hero.tagline')}</div>
          <div className="hero-cta">{t('hero.cta')}</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button className="btn" onClick={() => navigate('auth')}>{t('auth.signIn')}</Button>
            <Button variant="default" className="btn btn-ghost" onClick={() => navigate('about')}>Learn more</Button>
          </div>
        </div>
      ) : (
        <>
          <SearchRow>
            <SearchField label={t('songs.searchPlaceholder')} value={query} onChange={setQuery} onSearch={doSearch} onClear={handleClear} />
            <Button variant="default" size="sm" onClick={doSearch}>{t('songs.search')}</Button>
            <ActionIcon
              size="input-sm"
              variant={showFilters || langFilter ? 'filled' : 'default'}
              aria-label="Filters"
              aria-pressed={showFilters}
              title="Filters"
              onClick={() => {
                const next = !showFilters;
                saveShowFilters(String(next));
              }}
            >
              <IconAdjustmentsHorizontal size={18} aria-hidden />
            </ActionIcon>
            {user && (
              <Button size="sm" w={{ base: '100%', xs: 'auto' }} leftSection={<IconPlus size={16} aria-hidden />} onClick={() => navigate('song-edit')}>New Song</Button>
            )}
          </SearchRow>
          {showFilters && (
            <div className="search-filters">
              <NativeSelect
                className="language-filter"
                value={langFilter}
                onChange={(e) => { setLangFilter(e.target.value); load(query, e.target.value, 1); }}
              >
                <option value="">All languages</option>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </NativeSelect>
            </div>
          )}
          <SimpleGrid className="song-grid" minColWidth="min(100%, 320px)" autoFlow="auto-fill" spacing={12}>
            {loaded && songs.length === 0 ? (
              <EmptyState icon={<IconSearch size={56} aria-hidden />} text={t('songs.noPublicSongs')} />
            ) : (
              songs.map((s) => (
                <SongCard
                  key={s.id}
                  song={s}
                  isOwner={user?.username === s.username}
                  onClick={() => navigate('song-view', { id: String(s.id) })}
                  onEdit={() => navigate('song-edit', { id: String(s.id) })}
                />
              ))
            )}
          </SimpleGrid>
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </>
  );
}
