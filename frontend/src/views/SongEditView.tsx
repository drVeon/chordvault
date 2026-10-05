import { Badge, Tabs, Switch, Button, TextInput, useComputedColorScheme } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { showStatusNotification as toast } from '../lib/notifications';
import { useSongEditor } from '../hooks/useSongEditor';
import { TagPicker } from '../components/TagPicker';
import { LanguagePicker } from '../components/LanguagePicker';
import { OcrModal } from '../components/OcrModal';
import { CodeMirrorEditor } from '../components/CodeMirrorEditor';
import { EditorPreview } from '../components/EditorPreview';
import { detectFormat, toChordPro, ensureKeyDirective, extractDirective, updateDirective } from '../lib/chords';
import type { Song } from '../types';
import { EditorActionBar } from '../components/EditorActionBar';

interface SongEditViewProps {
  songId?: number;
  navigate: (view: string, params?: Record<string, string>) => void;
}

export function SongEditView({ songId, navigate }: SongEditViewProps) {
  const apiCall = useApi();
  const { user } = useAuth();
  const { t } = useI18n();
  const [song, setSong] = useState<Song | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [saved, setSaved] = useState<{ content: string; visibility: 'public' | 'private' }>({ content: '', visibility: 'public' });
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const theme = useComputedColorScheme('dark');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [forceRender, setForceRender] = useState(0);

  const editor = useSongEditor();
  const { state, handleContentChange, handleFieldChange, handleTagsChange, handleLanguageChange, setInitialContent } = editor;

  useEffect(() => {
    if (songId) {
      apiCall<Song>('GET', `/api/songs/${songId}`)
        .then((s) => {
          setSong(s);
          setVisibility(s.visibility === 'private' ? 'private' : 'public');

          // CodeMirror joins lines with \n, so CRLF content would read as an unsaved edit.
          let c = s.content.replace(/\r\n?/g, '\n');
          // Inject missing directives from DB columns into content for old songs
          if (s.title && !extractDirective(c, 'title')) c = updateDirective(c, 'title', s.title);
          if (s.artist && !extractDirective(c, 'artist')) c = updateDirective(c, 'artist', s.artist);
          if (s.bpm && !extractDirective(c, 'tempo')) c = updateDirective(c, 'tempo', String(s.bpm));
          if (s.youtube_url && !extractDirective(c, 'x_youtube')) c = updateDirective(c, 'x_youtube', s.youtube_url);
          if (s.tags && !extractDirective(c, 'x_tags')) c = updateDirective(c, 'x_tags', s.tags);
          if (s.language && !extractDirective(c, 'x_language')) c = updateDirective(c, 'x_language', s.language);

          setInitialContent(c);
          setSaved({ content: c, visibility: s.visibility === 'private' ? 'private' : 'public' });
        })
        .catch((e) => { toast(e.message, 'error'); navigate('my-songs'); });
    }
  }, [songId, apiCall, navigate, setInitialContent]);

  useEffect(() => {
    if (user) {
      apiCall<{ hasKey: boolean }>('GET', '/api/settings/gemini-key')
        .then((d) => setHasGeminiKey(d.hasKey))
        .catch(() => {});
      apiCall<{ languages: string[] }>('GET', '/api/settings/languages')
        .then((d) => setPreferredLanguages(d.languages))
        .catch(() => {});
    }
  }, [apiCall, user]);

  const save = async () => {
    const { content } = state;
    if (!extractDirective(content, 'title')?.trim()) { toast(t('songEdit.titleRequired'), 'error'); return; }
    if (!content.trim()) { toast(t('songEdit.contentRequired'), 'error'); return; }
    if (content.length > 100000) { toast(t('songEdit.contentTooLarge'), 'error'); return; }
    const bpmVal = extractDirective(content, 'tempo');
    if (bpmVal && (isNaN(parseInt(bpmVal, 10)) || parseInt(bpmVal, 10) < 1 || parseInt(bpmVal, 10) > 300)) {
      toast('BPM must be between 1 and 300', 'error'); return;
    }
    const fmt = detectFormat(content);
    if (!fmt) { toast('No chords detected. Add chords in [brackets] before the syllable, e.g. [G]Amazing [C]grace', 'error'); return; }
    if (!extractDirective(content, 'x_language')) { toast('Please select a language', 'error'); return; }

    let finalContent = toChordPro(content);
    finalContent = ensureKeyDirective(finalContent);

    try {
      if (song) {
        await apiCall('PUT', `/api/songs/${song.id}`, {
          content: finalContent, format_detected: fmt, visibility
        });
        toast(t('songEdit.saved'), 'success');
        navigate('song-view', { id: String(song.id) });
      } else {
        const result = await apiCall<{ id: number }>('POST', '/api/songs', {
          content: finalContent, format_detected: fmt, visibility
        });
        toast(t('songEdit.created'), 'success');
        navigate('song-view', { id: String(result.id) });
      }
    } catch (e) { toast((e as Error).message, 'error'); }
  };

  const deleteSong = async () => {
    if (!song) return;
modals.openConfirmModal({ children: t('songEdit.confirmDelete'), labels: { confirm: 'Confirm', cancel: 'Cancel' }, onConfirm: async () => {
    try {
      await apiCall('DELETE', `/api/songs/${song.id}`);
      toast(t('songEdit.deleted'));
      navigate('my-songs');
    } catch (e) { toast((e as Error).message, 'error'); }

} });
};

  const cancel = () => {
    if (song) navigate('song-view', { id: String(song.id) });
    else navigate('my-songs');
  };

  const isOwner = !song || (user && song && user.id === song.user_id);

  const saveAsVersion = async () => {
    const { content } = state;
    const targetId = songId || (song?.id);
    if (!targetId) return;
    if (!extractDirective(content, 'title')?.trim()) { toast(t('songEdit.titleRequired'), 'error'); return; }
    if (!content.trim()) { toast(t('songEdit.contentRequired'), 'error'); return; }
    const fmt = detectFormat(content);
    if (!fmt) { toast('No chords detected. Add chords in [brackets] before the syllable, e.g. [G]Amazing [C]grace', 'error'); return; }
    if (!extractDirective(content, 'x_language')) { toast('Please select a language', 'error'); return; }

    let finalContent = toChordPro(content);
    finalContent = ensureKeyDirective(finalContent);

    try {
      const result = await apiCall<{ id: number }>('POST', `/api/songs/${targetId}/version`, {
        content: finalContent
      });
      toast('Version created successfully', 'success');
      navigate('song-view', { id: String(result.id) });
    } catch (e) { toast((e as Error).message, 'error'); }
  };

  const dirty = state.content !== saved.content || visibility !== saved.visibility;
  const title = songId ? (isOwner ? t('songEdit.editSong') : t('songEdit.createVersion')) : t('songEdit.newSong');

  return (
    <>
      <EditorActionBar
        title={title}
        dirty={dirty}
        onLeave={cancel}
        saveLabel={isOwner ? t('songEdit.save') : t('songEdit.saveAsMyVersion')}
        onSave={isOwner ? save : saveAsVersion}
        onSaveAsVersion={isOwner && songId ? saveAsVersion : undefined}
        onDelete={song && isOwner ? deleteSong : undefined}
        t={t}
      />
      <div className="edit-cols">
        <div className="field">

          <TextInput label={<>{t('songEdit.titleLabel')}</>} type="text" value={state.title} onChange={(e) => handleFieldChange('title', e.target.value, editor.setTitle)} placeholder={t('songEdit.titlePlaceholder')} />
        </div>
        <div className="field">

          <TextInput label={<>{t('songEdit.artistLabel')}</>} type="text" value={state.artist} onChange={(e) => handleFieldChange('artist', e.target.value, editor.setArtist)} placeholder={t('songEdit.artistPlaceholder')} />
        </div>
        <div className="field">

          <LanguagePicker value={state.language} onChange={handleLanguageChange} preferredLanguages={preferredLanguages} />
        </div>
        <div className="field">

          <TextInput label={<>BPM</>} type="number" value={state.bpm} onChange={(e) => handleFieldChange('tempo', e.target.value, editor.setBpm)} placeholder="e.g. 120" min="1" max="300" />
        </div>
      </div>
      <div className="field">

        <TextInput label={<>YouTube URL</>} type="url" value={state.youtubeUrl} onChange={(e) => handleFieldChange('x_youtube', e.target.value, editor.setYoutubeUrl)} placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div className="field">
        <div className="mantine-InputWrapper-label">Tags</div>
        <TagPicker selected={state.tags} onChange={handleTagsChange} />
      </div>
      <div className="field">
        <Switch label={<>Public {visibility === 'private' && <span style={{ fontSize: 12, color: 'var(--muted)' }}>&#128274; Only you can see this song</span>}</>}
              type="checkbox"
              disabled={!isOwner}
              checked={visibility === 'public'}
              onChange={(e) => setVisibility(e.target.checked ? 'public' : 'private')}
             />

      </div>
      <div className="field">
        <div className="chordpro-hint-row">
          <p className="chordpro-hint" dangerouslySetInnerHTML={{ __html: t('songEdit.chordproHint') + ' You can also paste chords-over-lyrics or Ultimate Guitar format — it will be auto-converted.' }} />
          {state.formatBadge && <Badge size="md" h="auto" py={4} color={state.formatBadge.ok ? 'green' : 'orange'} styles={{ root: { flexShrink: state.formatBadge.ok ? 0 : 1 }, label: { whiteSpace: 'normal' } }}>{state.formatBadge.text}</Badge>}
        </div>
        {user && (
          <div className="ocr-row">
            <Button variant="default" size="xs" className="btn btn-sm btn-ghost" onClick={() => setOcrOpen(true)}>&#128247; Import from image or PDF</Button>
          </div>
        )}
        <Tabs value={editorTab} onChange={(value) => { if (value === 'preview') { setEditorTab('preview'); setForceRender(n => n + 1); } else setEditorTab('edit'); }} className="editor-tabs">
          <Tabs.List grow><Tabs.Tab value="edit">Edit</Tabs.Tab><Tabs.Tab value="preview">Preview</Tabs.Tab></Tabs.List>
        </Tabs>
        <div className="editor-split">
          <div className={`cm-editor-wrap${editorTab === 'preview' ? ' editor-hidden' : ''}`} role="tabpanel">
            <CodeMirrorEditor
              value={state.content}
              onChange={handleContentChange}
              darkMode={theme === 'dark'}
              placeholder={'Paste any format:\n\nChordPro:  [G]Let it [D]be\n\nOr chords over lyrics:\n  G        D\n  Let it be'}
            />
          </div>
          <div className={`editor-preview-wrap${editorTab === 'edit' ? ' editor-hidden' : ''}`} role="tabpanel">
            <EditorPreview content={state.content} forceRender={forceRender} />
          </div>
        </div>
      </div>
        <OcrModal
          opened={ocrOpen}
          hasGeminiKey={hasGeminiKey}
          onResult={(text, lang) => {
            let c = text;
            if (lang && !extractDirective(c, 'x_language')) c = updateDirective(c, 'x_language', lang);
            setInitialContent(c);
          }}
          onClose={() => setOcrOpen(false)}
        />
    </>
  );
}
