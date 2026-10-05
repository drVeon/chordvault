import { Badge, Flex, Modal, Button, NativeSelect, TextInput } from '@mantine/core';
import { ListCard } from './ListCard';
import { SearchRow } from './SearchRow';
import { useModals } from '@mantine/modals';
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import type { SongListItem, SongVersion } from '../types';

interface SongPickerProps {
  opened: boolean;
  onPick: (song: SongListItem) => void;
  onClose: () => void;
}

export function SongPicker({ opened, onPick, onClose }: SongPickerProps) {
  const modalManager = useModals();
  const { t } = useI18n();
  return (
    <Modal opened={opened} onClose={onClose} title={t('setlist.pickSong')} trapFocus={modalManager.modals.length === 0} closeOnEscape={modalManager.modals.length === 0} closeOnClickOutside={modalManager.modals.length === 0}>
      {opened && <SongPickerContent onPick={onPick} />}
    </Modal>
  );
}

function SongPickerContent({ onPick }: Pick<SongPickerProps, 'onPick'>) {
  const api = useApi();
  const { t } = useI18n();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const load = useCallback(async (q = '') => {
    try {
      const data = await api<SongListItem[]>('GET', '/api/songs/public' + (q ? `?q=${encodeURIComponent(q)}` : ''));
      setSongs(data);
      setExpandedId(null);
    } catch { /* ignore */ }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const handleCardClick = async (s: SongListItem) => {
    if (s.version_count && s.version_count > 1) {
      if (expandedId === s.id) {
        setExpandedId(null);
      } else {
        setExpandedId(s.id);
        setLoadingVersions(true);
        try {
          const v = await api<SongVersion[]>('GET', `/api/songs/${s.id}/versions`);
          setVersions(v);
        } catch { /* ignore */ } finally {
          setLoadingVersions(false);
        }
      }
    } else {
      onPick(s);
    }
  };

  return (
    <>


        <SearchRow mb={8}>
          <TextInput aria-label={t('songs.searchPlaceholder')}
            flex={3}
            miw={0}
            type="search"
            placeholder={t('songs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(search); }}
            data-autofocus
          />
          <Button variant="default" size="xs" className="btn btn-ghost btn-sm" onClick={() => load(search)}>Search</Button>
        </SearchRow>
        <div className="song-grid">
          {songs.length === 0 ? (
            <div className="empty"><div className="empty-text">{t('songs.noPublicSongs')}</div></div>
          ) : songs.map((s) => (
            <div key={s.id} className="song-picker-item" style={{ display: 'contents' }}>
              <ListCard
                className="mantine-focus-auto"
                title={s.title}
                meta={<>
                  {s.artist || ''}
                  {(s.version_count ?? 0) > 1 && (
                    <Badge variant="filled" size="sm" ml={8}>{s.version_count} Versions</Badge>
                  )}
                </>}
                onClick={() => { void handleCardClick(s); }}
                style={expandedId === s.id ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : undefined}
              />
              {expandedId === s.id && (
                <Flex className="song-card version-list-card" align="center" justify="space-between" wrap="wrap" gap={12} px={16} py={12} mt={-12} style={{ gridColumn: '1 / -1', borderTopLeftRadius: 0, borderTopRightRadius: 0, background: 'var(--bg-alt)' }}>
                  {loadingVersions ? (
                    <div style={{ padding: 8, color: 'var(--muted)', fontSize: 13 }}>Loading versions...</div>
                  ) : (
                    <>
                      <div className="version-selector-container" style={{ background: 'var(--surface)' }}>
                        <span className="version-selector-label">Version</span>
                        <NativeSelect
                          className="version-select-compact"
                          onChange={(e) => {
                            const vId = parseInt(e.target.value);
                            const v = versions.find(ver => ver.id === vId);
                            if (v) onPick({ ...s, id: v.id, username: v.username });
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select...</option>
                          {versions.map((v, idx) => (
                            <option key={v.id} value={v.id}>
                              {idx + 1} (@{v.username}) {v.youtube_url ? '▶' : ''}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                        {versions.length} {t('setlist.versions').toLowerCase()}
                      </div>
                    </>
                  )}
                </Flex>
              )}
            </div>
          ))}
        </div>

    </>
  );
}
