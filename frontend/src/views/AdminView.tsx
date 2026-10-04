import { Badge, Paper, Switch, Button } from '@mantine/core';
import { ListCard } from '../components/ListCard';
import { useCopyNotification } from '../hooks/useCopyNotification';
import { modals } from '@mantine/modals';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { Loading } from '../components/Loading';
import type { AdminStats, AdminUser, InviteCode, AdminConfig, Correction } from '../types';
import { useDemo } from '../context/DemoContext';
import { languageName } from '../lib/languages';
import { PageTitle } from '../components/PageTitle';

interface AdminViewProps {
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function AdminView({ navigate }: AdminViewProps) {
  const apiCall = useApi();
  const { user, isAdmin } = useAuth();
  const { demoMode } = useDemo();
  const { t, tReplace } = useI18n();
  const copyWithFeedback = useCopyNotification(t('admin.codeCopied'));
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [config, setConfig] = useState<AdminConfig>({ allowRegistration: true });
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const pendingAction = useRef(false);

  const runAction = async (action: () => Promise<void>) => {
    if (pendingAction.current) return;
    pendingAction.current = true;
    setBusy(true);
    try { await action(); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { pendingAction.current = false; setBusy(false); }
  };

  const loadInvites = useCallback(async () => {
    try {
      const inv = await apiCall<InviteCode[]>('GET', '/api/admin/invites');
      setInvites(inv);
    } catch { /* ignore */ }
  }, [apiCall]);

  const load = useCallback(async () => {
    try {
      const [s, u, c, cfg] = await Promise.all([
        apiCall<AdminStats>('GET', '/api/admin/stats'),
        apiCall<AdminUser[]>('GET', '/api/admin/users'),
        apiCall<Correction[]>('GET', '/api/admin/corrections'),
        apiCall<AdminConfig>('GET', '/api/admin/config'),
      ]);
      setStats(s); setUsers(u); setCorrections(c); setConfig(cfg);
      await loadInvites();
    } catch (e) { toast((e as Error).message, 'error'); navigate('my-songs'); }
  }, [apiCall, navigate, loadInvites]);

  useEffect(() => {
    if (!isAdmin) { navigate('my-songs'); return; }
    load();
  }, [isAdmin, navigate, load]);

  const toggleReg = (val: boolean) => runAction(async () => {
    try {
      await apiCall('PUT', '/api/admin/config', { allowRegistration: val });
      setConfig({ ...config, allowRegistration: val });
      toast(val ? 'Registration enabled' : 'Registration disabled', 'success');
    } catch (e) { toast((e as Error).message, 'error'); }
  });

  const generateInvite = () => runAction(async () => {
    try {
      const data = await apiCall<{ code: string }>('POST', '/api/admin/invites');
      setInviteCode(data.code);
      await loadInvites();
    } catch (e) { toast((e as Error).message, 'error'); }
  });

  const deleteInvite = (id: number) => runAction(async () => {
    try { await apiCall('DELETE', `/api/admin/invites/${id}`); await loadInvites(); }
    catch (e) { toast((e as Error).message, 'error'); }
  });

  const setRole = async (userId: number, role: string) => {
    const action = role === 'admin' ? t('admin.confirmPromote') : t('admin.confirmDemote');
    modals.openConfirmModal({ children: action, labels: { confirm: 'Confirm', cancel: 'Cancel' }, onConfirm: () => runAction(async () => {
    try {
      await apiCall('PUT', `/api/admin/users/${userId}/role`, { role });
      toast(role === 'admin' ? t('admin.userPromoted') : t('admin.userDemoted'), 'success');
      await load();
    } catch (e) { toast((e as Error).message, 'error'); }

}) });
};

  const setDisabled = async (userId: number, disabled: boolean) => {
    modals.openConfirmModal({ children: disabled ? t('admin.confirmDisable') : t('admin.confirmEnable'), labels: { confirm: 'Confirm', cancel: 'Cancel' }, onConfirm: () => runAction(async () => {
    try {
      await apiCall('PUT', `/api/admin/users/${userId}/disabled`, { disabled });
      toast(disabled ? t('admin.userDisabled') : t('admin.userEnabled'), 'success');
      await load();
    } catch (e) { toast((e as Error).message, 'error'); }

}) });
};

  const deleteUser = async (userId: number, username: string) => {
    modals.openConfirmModal({ children: tReplace('admin.confirmDeleteUser', { username }), labels: { confirm: 'Confirm', cancel: 'Cancel' }, onConfirm: () => runAction(async () => {
    try { await apiCall('DELETE', `/api/admin/users/${userId}`); toast(t('admin.userDeleted'), 'success'); await load(); }
    catch (e) { toast((e as Error).message, 'error'); }

}) });
};

  const resetPassword = (userId: number, username: string) => modals.openContextModal({ modal: 'resetPassword', title: tReplace('admin.resetPasswordPrompt', { username }), innerProps: { onSubmit: (newPassword: string) => runAction(async () => {
    try {
      await apiCall('PUT', `/api/admin/users/${userId}/password`, { password: newPassword });
      toast(t('admin.passwordReset'), 'success');
    } catch (e) { toast((e as Error).message, 'error'); }
  }) } });

  const deleteSong = async (songId: number, title: string) => {
    modals.openConfirmModal({ children: tReplace('admin.confirmDeleteSong', { title }), labels: { confirm: 'Confirm', cancel: 'Cancel' }, onConfirm: () => runAction(async () => {
    try { await apiCall('DELETE', `/api/admin/songs/${songId}`); toast(t('admin.songDeleted'), 'success'); await load(); }
    catch (e) { toast((e as Error).message, 'error'); }

}) });
};

  if (!stats) return <Loading />;

  const isOwner = user?.role === 'owner';
  const currentId = user?.id;
  const pending = invites.filter((i) => !i.used_at);

  return (
    <>
      <div className="view-header"><PageTitle className="view-title">{t('admin.title')}</PageTitle></div>
      <div className="admin-stats">
        <Paper withBorder className="stat-card"><div className="stat-value">{stats.userCount}</div><div className="stat-label">{t('admin.users')}</div></Paper>
        <Paper withBorder className="stat-card"><div className="stat-value">{stats.songCount}</div><div className="stat-label">{t('admin.songs')}</div></Paper>
        {stats.pendingCount > 0 && <Paper withBorder className="stat-card stat-warn"><div className="stat-value">{stats.pendingCount}</div><div className="stat-label">Pending corrections</div></Paper>}
        {stats.noFormatCount > 0 && <Paper withBorder className="stat-card stat-warn"><div className="stat-value">{stats.noFormatCount}</div><div className="stat-label">No chords detected</div></Paper>}
      </div>

      {stats.languageDistribution && stats.languageDistribution.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 className="admin-section-title">Languages</h3>
          <div className="admin-stats">
            {stats.languageDistribution.map(({ language, count }) => (
              <Paper withBorder key={language} className="stat-card">
                <div className="stat-value">{count}</div>
                <div className="stat-label">{language ? languageName(language) : 'Not set'}</div>
              </Paper>
            ))}
          </div>
        </div>
      )}

      <h3 className="admin-section-title">{t('admin.inviteUsers')}</h3>
      <Paper withBorder className="ocr-invite-card">
        <div style={{ marginBottom: 14 }}>
          <Switch mb="sm" label="Open Registration" checked={config.allowRegistration} onChange={(e) => toggleReg(e.target.checked)} disabled={demoMode || busy}  />
          <div className="muted-text" style={{ marginTop: 4 }}>
            {config.allowRegistration ? 'Anyone can create an account — no email verification, so open to spam. Use invite codes instead.' : 'Registration is closed. Use invite codes to add new users.'}
          </div>
          {demoMode && <div className="muted-text" style={{ fontSize: 12, marginTop: 4 }}>Disabled in demo mode</div>}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div className="flex-align-center" style={{ gap: 12, flexWrap: 'wrap' }}>
            <Button className="btn" onClick={generateInvite} disabled={demoMode || busy} title={demoMode ? 'Disabled in demo mode' : ''}>{t('admin.generateInvite')}</Button>
            {inviteCode && (
              <div className="flex-align-center">
                <code style={{ fontSize: 18, fontWeight: 600, padding: '6px 14px', background: 'var(--accent-bg)', borderRadius: 8, userSelect: 'all' as const, letterSpacing: '0.08em' }}>{inviteCode}</code>
                <Button variant="default" size="xs" className="btn btn-ghost btn-sm" onClick={() => copyWithFeedback(inviteCode)}>{t('admin.copy')}</Button>
              </div>
            )}
          </div>
          <div className="muted-text" style={{ marginTop: 8 }}>Generate a single-use code and share it. The person enters it on the sign-in page to create their account.</div>
          {pending.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div className="muted-text" style={{ fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('admin.pendingInvites')}</div>
              {pending.map((inv) => (
                <div key={inv.id} className="flex-align-center" style={{ marginBottom: 4 }}>
                  <code style={{ fontSize: 13 }}>{inv.code}</code>
                  <span className="muted-text" style={{ fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString()}</span>
                  <Button variant="default" size="xs" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => deleteInvite(inv.id)} disabled={demoMode || busy}>&#10005;</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Paper>

      <h3 className="admin-section-title">{t('admin.users')}</h3>

      <div className="song-grid" style={{ marginBottom: 28 }}>
        {users.map((u) => {
          const isSelf = u.id === currentId;
          const isTargetOwner = u.role === 'owner';
          const isTargetAdmin = u.role === 'admin';
          const canManage = !isSelf && !isTargetOwner && (isOwner || !isTargetAdmin);

          return (
            <div key={u.id} className="user-card">
              <div className="user-card-top">
                <div className="user-card-info">
                  <div className="song-card-title">@{u.username}{isSelf && <span className="muted-text"> {t('admin.you')}</span>}</div>
                  <div className="song-card-meta">{u.song_count} {u.song_count !== 1 ? t('admin.songPlural') : t('admin.song')} &middot; {t('admin.joined')} {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                <div className="user-card-badges">
                  {u.role === 'owner' && <Badge>owner</Badge>}
                  {u.role === 'admin' && <Badge>admin</Badge>}
                  {u.disabled && <Badge color="red">disabled</Badge>}
                </div>
              </div>
              {canManage && !demoMode && (
                <div className="user-card-actions">
                  {isOwner && (isTargetAdmin
                    ? <Button variant="default" size="xs" className="btn btn-ghost btn-sm" disabled={busy} onClick={(e) => { e.stopPropagation(); setRole(u.id, 'user'); }}>{t('admin.demote')}</Button>
                    : <Button variant="default" size="xs" className="btn btn-ghost btn-sm" disabled={busy} onClick={(e) => { e.stopPropagation(); setRole(u.id, 'admin'); }}>{t('admin.promote')}</Button>
                  )}
                  <Button variant="default" size="xs" className="btn btn-ghost btn-sm" disabled={busy} onClick={(e) => { e.stopPropagation(); resetPassword(u.id, u.username); }}>{t('admin.resetPassword')}</Button>
                  <Button variant="default" size="xs" className="btn btn-ghost btn-sm" disabled={busy} onClick={(e) => { e.stopPropagation(); setDisabled(u.id, !u.disabled); }}>{u.disabled ? t('admin.enable') : t('admin.disable')}</Button>
                  <Button color="red" size="xs" className="btn btn-danger btn-sm" disabled={busy} onClick={(e) => { e.stopPropagation(); deleteUser(u.id, u.username); }}>{t('admin.delete')}</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stats.recentSongs.length > 0 && (
        <>
          <h3 className="admin-section-title">{t('admin.recentSongs')}</h3>
          <div className="song-grid">
            {stats.recentSongs.map((s) => (
              <ListCard
                key={s.id}
                className="mantine-focus-auto"
                title={s.title}
                meta={<>{s.artist ? `${s.artist} · ` : ''}@{s.username} &middot; {new Date(s.created_at).toLocaleDateString()}</>}
                onClick={() => navigate('song-view', { id: String(s.id) })}
                actions={<Button color="red" size="xs" className="btn btn-danger btn-sm" disabled={busy} onClick={(e) => { e.stopPropagation(); deleteSong(s.id, s.title); }}>{t('admin.delete')}</Button>}
              />
            ))}
          </div>
        </>
      )}

      {corrections.length > 0 && (
        <>
          <h3 className="admin-section-title">Pending Corrections ({corrections.length})</h3>
          <div className="song-grid">
            {corrections.map((c) => (
              <ListCard
                key={c.id}
                className="mantine-focus-auto"
                title={c.title}
                meta={<>by @{c.submitter} &middot; {new Date(c.created_at).toLocaleDateString()}</>}
                onClick={() => navigate('song-view', { id: String(c.parent_id) })}
                actions={<Badge color="yellow">pending</Badge>}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
