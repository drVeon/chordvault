import { SearchField } from '../components/SearchField';
import { SearchRow } from '../components/SearchRow';
import { Tabs, Button, TextInput, ActionIcon } from '@mantine/core';
import { IconCalendar, IconPlus } from '@tabler/icons-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { useLocalSetlists } from '../hooks/useLocalSetlists';
import { SetlistCard } from '../components/SetlistCard';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import type { SetlistListItem } from '../types';
import { getSessionItem, setSessionItem } from '../lib/storage';
import { PageTitle } from '../components/PageTitle';

interface SetlistsViewProps {
  navigate: (view: string, params?: Record<string, string>) => void;
  initialTab?: string;
}

export function SetlistsView({ navigate }: SetlistsViewProps) {
  const apiCall = useApi();
  const { user } = useAuth();
  const { t } = useI18n();
  const ls = useLocalSetlists();

  const activeTab = user ? 'cloud' : 'local';

  const [setlists, setSetlists] = useState<SetlistListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [query, setQuery] = useState(() => getSessionItem('cv_setlists_query') || '');
  const [dateFrom, setDateFrom] = useState(() => getSessionItem('cv_setlists_date_from') || '');
  const [dateTo, setDateTo] = useState(() => getSessionItem('cv_setlists_date_to') || '');
  const [showDates, setShowDates] = useState(() => getSessionItem('cv_setlists_show_dates') === 'true');
  const [page, setPage] = useState(() => {
    const saved = getSessionItem('cv_setlists_page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const nameRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (q = '', from = '', to = '', targetPage = 1) => {
    if (!user) return;
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
      const data = await apiCall<PaginatedSetlistsResponse>('GET', `/api/setlists${qs}`);
      setSetlists(data.setlists);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setLoaded(true);

      setSessionItem('cv_setlists_query', q);
      setSessionItem('cv_setlists_date_from', from);
      setSessionItem('cv_setlists_date_to', to);
      setSessionItem('cv_setlists_page', String(data.page));
    } catch (e) { toast((e as Error).message, 'error'); }
  }, [apiCall, user]);

  useEffect(() => {
    if (activeTab === 'cloud') {
      load(query, dateFrom, dateTo, page);
    } else {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, activeTab]);

  useEffect(() => { if (showNew && nameRef.current) nameRef.current.focus(); }, [showNew]);

  const create = async () => {
    if (!newName.trim()) { toast(t('setlist.nameRequired'), 'error'); return; }
    if (newName.length > 200) { toast('Name too long', 'error'); return; }

    if (activeTab === 'local') {
      const sl = ls.create(newName.trim());
      if (!sl) { toast('Max 50 setlists', 'error'); return; }
      toast(t('setlist.created'), 'success');
      navigate('setlist-edit', { id: sl.id });
    } else {
      try {
        const result = await apiCall<{ id: number }>('POST', '/api/setlists', { name: newName.trim() });
        toast(t('setlist.created'), 'success');
        navigate('setlist-edit', { id: String(result.id) });
      } catch (e) { toast((e as Error).message, 'error'); }
    }
  };

  const handleClear = () => {
    setQuery('');
    if (activeTab === 'local') {
      setSessionItem('cv_setlists_query', '');
    } else {
      load('', dateFrom, dateTo, 1);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'cloud') {
      load(query, dateFrom, dateTo, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (activeTab === 'cloud') {
      load(query, dateFrom, dateTo, newPage);
      window.scrollTo(0, 0);
    }
  };

  const localSetlistsToRender = query.trim()
    ? ls.setlists.filter(sl => sl.name.toLowerCase().includes(query.toLowerCase()))
    : ls.setlists;

  return (
    <>
      <div className="view-header">
        <PageTitle className="view-title">{t('setlist.title')}</PageTitle>
        <Button size="xs" className="btn btn-sm" leftSection={<IconPlus size={14} aria-hidden />} onClick={() => setShowNew(true)}>{t('setlist.newSetlist')}</Button>
      </div>
      <Tabs variant="pills" value="mine" onChange={(tab) => navigate(tab === 'public' ? 'public-setlists' : 'setlists')} className="setlist-tabs">
        <Tabs.List grow><Tabs.Tab value="mine">My Setlists</Tabs.Tab><Tabs.Tab value="public">Public Setlists</Tabs.Tab></Tabs.List>
      </Tabs>
      {!user && (
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
          These setlists are saved in your browser. Sign in to create server-synced setlists.
        </p>
      )}
      {showNew && (
        <SearchRow mb={16}>
          <TextInput aria-label={t('setlist.namePlaceholder')}
            flex={3}
            miw={0}
            ref={nameRef}
            type="text"
            placeholder={t('setlist.namePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
          />
          <Button size="xs" className="btn btn-sm" onClick={create}>{t('setlist.create')}</Button>
          <Button variant="default" size="xs" className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>{t('songEdit.cancel')}</Button>
        </SearchRow>
      )}
      <SearchRow>
        <SearchField label={t('setlist.searchPlaceholder')} value={query} onSearch={handleSearch} onClear={handleClear}

          onChange={(val) => {

            setQuery(val);

            if (activeTab === 'local') setSessionItem('cv_setlists_query', val);

          }} />
        <Button variant="default" size="sm" onClick={handleSearch}>{t('songs.search')}</Button>
        {activeTab === 'cloud' && (
          <ActionIcon
            size="input-sm"
            variant={showDates ? 'filled' : 'default'}
            aria-label="Filter by date"
            aria-pressed={showDates}
            title="Filter by date"
            onClick={() => {
              const next = !showDates;
              setShowDates(next);
              setSessionItem('cv_setlists_show_dates', String(next));
            }}
          >
            <IconCalendar size={18} aria-hidden />
          </ActionIcon>
        )}
      </SearchRow>
      {activeTab === 'cloud' && showDates && (
        <SearchRow mt={-10}>
          <TextInput label={<>From</>} type="date" flex={1} miw={0} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <TextInput label={<>To</>} type="date" flex={1} miw={0} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </SearchRow>
      )}
      <div className="song-grid">
        {loaded && (
          activeTab === 'cloud' ? (
            setlists.length === 0 ? (
              <EmptyState icon="&#127926;" text={t('setlist.noSetlists')} />
            ) : (
              setlists.map((sl) => (
                <SetlistCard
                  key={sl.id}
                  setlist={sl}
                  onClick={() => navigate('setlist-edit', { id: String(sl.id) })}
                  onPlay={() => navigate('setlist-play', { id: String(sl.id) })}
                />
              ))
            )
          ) : (
            localSetlistsToRender.length === 0 ? (
              <EmptyState icon="&#127926;" text={t('setlist.noSetlists')} />
            ) : (
              localSetlistsToRender.map((sl) => (
                <SetlistCard
                  key={sl.id}
                  setlist={{
                    id: sl.id,
                    name: sl.name,
                    visibility: 'private',
                    song_count: sl.entries.length,
                    event_date: null,
                  }}
                  onClick={() => navigate('setlist-edit', { id: sl.id })}
                  onPlay={() => navigate('setlist-play', { id: sl.id, local: '1' })}
                />
              ))
            )
          )
        )}
      </div>
      {activeTab === 'cloud' && (
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </>
  );
}
