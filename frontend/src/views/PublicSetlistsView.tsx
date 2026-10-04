import { SearchField } from '../components/SearchField';
import { Tabs, Button, TextInput } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { SetlistCard } from '../components/SetlistCard';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import type { SetlistListItem } from '../types';
import { getSessionItem, setSessionItem } from '../lib/storage';
import { PageTitle } from '../components/PageTitle';

interface PublicSetlistsViewProps {
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function PublicSetlistsView({ navigate }: PublicSetlistsViewProps) {
  const apiCall = useApi();
  const { t } = useI18n();
  const [setlists, setSetlists] = useState<SetlistListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(() => getSessionItem('cv_publicsetlists_query') || '');
  const [dateFrom, setDateFrom] = useState(() => getSessionItem('cv_publicsetlists_date_from') || '');
  const [dateTo, setDateTo] = useState(() => getSessionItem('cv_publicsetlists_date_to') || '');
  const [showDates, setShowDates] = useState(() => getSessionItem('cv_publicsetlists_show_dates') === 'true');
  const [page, setPage] = useState(() => {
    const saved = getSessionItem('cv_publicsetlists_page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (q = '', from = '', to = '', targetPage = 1) => {
    const params: string[] = [];
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (from) params.push(`date_from=${encodeURIComponent(from)}`);
    if (to) params.push(`date_to=${encodeURIComponent(to)}`);
    params.push(`page=${targetPage}`);
    params.push(`limit=20`);
    const qs = params.length > 0 ? `?${params.join('&')}` : '';
    try {
      interface PaginatedSetlistsResponse {
        setlists: SetlistListItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
      const data = await apiCall<PaginatedSetlistsResponse>('GET', `/api/setlists/public${qs}`);
      setSetlists(data.setlists);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setLoaded(true);

      setSessionItem('cv_publicsetlists_query', q);
      setSessionItem('cv_publicsetlists_date_from', from);
      setSessionItem('cv_publicsetlists_date_to', to);
      setSessionItem('cv_publicsetlists_page', String(data.page));
    } catch (e) { toast((e as Error).message, 'error'); }
  }, [apiCall]);

  useEffect(() => {
    load(query, dateFrom, dateTo, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const handleClear = () => {
    setQuery('');
    load('', dateFrom, dateTo, 1);
  };

  const handleSearch = () => load(query, dateFrom, dateTo, 1);

  const handlePageChange = (newPage: number) => {
    load(query, dateFrom, dateTo, newPage);
    window.scrollTo(0, 0);
  };

  const showSearch = !loaded || setlists.length > 0 || page > 1;

  return (
    <>
      <div className="view-header">
        <PageTitle className="view-title">{t('setlist.browseSetlists')}</PageTitle>
      </div>
      <Tabs variant="pills" value="public" onChange={(tab) => navigate(tab === 'public' ? 'public-setlists' : 'setlists')} className="setlist-tabs">
        <Tabs.List grow><Tabs.Tab value="mine">My Setlists</Tabs.Tab><Tabs.Tab value="public">Public Setlists</Tabs.Tab></Tabs.List>
      </Tabs>
      {showSearch && (
        <>
          <div className="search-row">
            <SearchField label={t('setlist.searchPlaceholder')} value={query} onChange={setQuery} onSearch={handleSearch} onClear={handleClear} />
            <Button variant="default" size="sm"
              leftSection={<IconCalendar size={16} aria-hidden />}
              aria-pressed={showDates}
              onClick={() => {
                const next = !showDates;
                setShowDates(next);
                setSessionItem('cv_publicsetlists_show_dates', String(next));
              }}
            >
              Date
            </Button>
            <Button variant="default" size="sm" onClick={handleSearch}>{t('songs.search')}</Button>
          </div>
          {showDates && (
            <div className="search-row" style={{ marginTop: -10 }}>

              <TextInput label={<>From</>} type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); load(query, e.target.value, dateTo, 1); }} />

              <TextInput label={<>To</>} type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); load(query, dateFrom, e.target.value, 1); }} />
            </div>
          )}
        </>
      )}
      {loaded && setlists.length === 0 ? (
        <EmptyState icon="&#128269;" text={t('setlist.noPublicSetlists')} />
      ) : (
        <>
          <div className="song-grid">
            {setlists.map((sl) => (
              <SetlistCard
                key={sl.id}
                setlist={sl}
                onClick={() => navigate('setlist-edit', { id: String(sl.id) })}
                showUsername
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </>
  );
}
