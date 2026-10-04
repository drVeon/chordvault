import { Badge, Paper, Modal } from '@mantine/core';
import { modals, useModals } from '@mantine/modals';
import { useFocusReturn } from '@mantine/hooks';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { useLocalSetlists } from '../hooks/useLocalSetlists';
import type { SetlistListItem } from '../types';

interface AddToSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
  songTitle: string;
  songArtist: string;
  songVisibility?: string;
  targetKey: string | null;
  nashville: boolean;
}

export function AddToSetlistModal({
  isOpen,
  onClose,
  songId,
  songTitle,
  songArtist,
  songVisibility,
  targetKey,
  nashville,
}: AddToSetlistModalProps) {
  const modalManager = useModals();
  useFocusReturn({ opened: isOpen });
  const apiCall = useApi();
  const { user } = useAuth();
  const { t } = useI18n();
  const { setlists, addEntry: lsAddEntry, create: lsCreate } = useLocalSetlists();
  const [userSetlists, setUserSetlists] = useState<SetlistListItem[]>([]);
  const openSession = useRef(0);
  useEffect(() => {
    openSession.current += 1;
    return () => { openSession.current += 1; };
  }, [isOpen]);

  const loadSetlists = useCallback(async () => {
    const session = openSession.current;
    if (user) {
      try {
        const sls = await apiCall<SetlistListItem[]>('GET', '/api/setlists');
        if (session === openSession.current) setUserSetlists(sls);
      } catch { /* ignore */ }
    } else {
      const formatted = setlists.map((sl) => ({
        id: sl.id,
        name: sl.name,
        song_count: sl.entries.length,
        visibility: 'private',
        event_date: null,
      }));
      setUserSetlists(formatted);
    }
  }, [user, apiCall, setlists]);

  useEffect(() => {
    if (isOpen) {
      loadSetlists();
    }
  }, [isOpen, loadSetlists]);

  const addToExisting = async (targetId: number | string, confirmed = false) => {
    const session = openSession.current;
    const targetSetlist = userSetlists.find((sl) => sl.id === targetId);
    if (!user) {
      const added = lsAddEntry(String(targetId), {
        song_id: songId,
        title: songTitle,
        artist: songArtist,
        target_key: targetKey,
        nashville: nashville ? 1 : 0,
      });
      if (added) {
        onClose();
        toast(t('setlist.songAdded'), 'success');
      } else {
        toast('Failed to add song', 'error');
      }
      return;
    }
    if (!confirmed && songVisibility === 'private' && targetSetlist?.visibility === 'public') {
      modals.openConfirmModal({ children: 'This song is private. Other viewers of this public setlist will see it as "[Private Song]". Continue?', labels: { confirm: 'Continue', cancel: 'Cancel' }, onConfirm: () => { void addToExisting(targetId, true); } });
      return;
    }
    try {
      await apiCall('POST', `/api/setlists/${targetId}/songs`, {
        song_id: songId,
        target_key: targetKey,
        nashville,
      });
      if (session !== openSession.current) return;
      onClose();
      toast(t('setlist.songAdded'), 'success');
    } catch (e) {
      if (session === openSession.current) toast((e as Error).message, 'error');
    }
  };

  const createAndAdd = () => {
    const session = openSession.current;
    modals.openContextModal({ modal: 'setlistName', title: t('setlist.enterName'), innerProps: { onSubmit: async (name: string) => {
    if (session !== openSession.current) return;
    if (!user) {
      const sl = lsCreate(name.trim());
      if (!sl) {
        toast('Max 50 setlists', 'error');
        return;
      }
      lsAddEntry(sl.id, {
        song_id: songId,
        title: songTitle,
        artist: songArtist,
        target_key: targetKey,
        nashville: nashville ? 1 : 0,
      });
      onClose();
      toast(t('setlist.songAdded'), 'success');
      return;
    }
    try {
      const result = await apiCall<{ id: number }>('POST', '/api/setlists', {
        name: name.trim(),
      });
      await apiCall('POST', `/api/setlists/${result.id}/songs`, {
        song_id: songId,
        target_key: targetKey,
        nashville,
      });
      if (session !== openSession.current) return;
      onClose();
      toast(t('setlist.songAdded'), 'success');
    } catch (e) {
      if (session === openSession.current) toast((e as Error).message, 'error');
    }
  } } });
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title={<>{t('setlist.addToSetlist')}</>} returnFocus={false} trapFocus={modalManager.modals.length === 0} closeOnEscape={modalManager.modals.length === 0} closeOnClickOutside={modalManager.modals.length === 0}>


        <div className="song-grid">
          <Paper withBorder className="song-card mantine-focus-auto" role="button" tabIndex={0} onClick={createAndAdd} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); createAndAdd(); } }}>
            <div className="song-card-info">
              <div className="song-card-title">{t('setlist.newSetlist')}</div>
            </div>
          </Paper>
          {userSetlists.map((sl) => (
            <Paper withBorder key={sl.id} className="song-card mantine-focus-auto" role="button" tabIndex={0} onClick={() => addToExisting(sl.id)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); void addToExisting(sl.id); } }}>
              <div className="song-card-info">
                <div className="song-card-title">{sl.name}</div>
                <div className="song-card-meta">
                  {sl.song_count} {sl.song_count !== 1 ? t('admin.songPlural') : t('admin.song')}
                </div>
                {sl.visibility === 'public' && (
                  <Badge size="sm">Public</Badge>
                )}
              </div>
            </Paper>
          ))}
        </div>

    </Modal>
  );
}
