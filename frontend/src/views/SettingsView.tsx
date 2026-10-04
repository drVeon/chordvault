import { Select, Paper, Pill, Button, NativeSelect, PasswordInput, Stack, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { LANGUAGES, languageName } from '../lib/languages';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { exportSongsBlob } from '../lib/api';
import { ImportModal } from '../components/ImportModal';
import { GeminiKeySettings } from '../components/GeminiKeySettings';
import { MAX_PREFERRED_LANGUAGES, MAX_OCR_PROMPT, DEFAULT_GEMINI_MODEL } from '../lib/constants';
import { PageTitle } from '../components/PageTitle';

export function SettingsView() {
  const apiCall = useApi();
  const { demoMode } = useDemo();
  const { user, isAdmin } = useAuth();
  const passwordForm = useForm({ initialValues: { currentPw: '', newPw: '', confirmPw: '' }, validate: { currentPw: value => value ? null : 'All fields are required', newPw: value => value.length >= 6 ? null : 'New password must be at least 6 characters', confirmPw: (value, values) => value === values.newPw ? null : 'New passwords do not match' } });
  const { currentPw, newPw, confirmPw } = passwordForm.values;
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; color: string } | null>(null);
  const [preferredLangs, setPreferredLangs] = useState<string[]>([]);
  const [langMsg, setLangMsg] = useState<{ text: string; color: string } | null>(null);
  const [ocrPrompt, setOcrPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [hasCustomPrompt, setHasCustomPrompt] = useState(false);
  const [promptMsg, setPromptMsg] = useState<{ text: string; color: string } | null>(null);
  const [ocrModel, setOcrModel] = useState(DEFAULT_GEMINI_MODEL);
  const [modelList, setModelList] = useState<{ id: string; label: string; hint: string }[]>([]);
  const [modelMsg, setModelMsg] = useState<{ text: string; color: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ text: string; color: string } | null>(null);
  const [showImport, setShowImport] = useState(false);

  const loadPreferredLangs = useCallback(async () => {
    try {
      const data = await apiCall<{ languages: string[] }>('GET', '/api/settings/languages');
      setPreferredLangs(data.languages);
    } catch {}
  }, [apiCall]);

  const loadOcrPrompt = useCallback(async () => {
    try {
      const data = await apiCall<{ prompt: string | null; defaultPrompt: string }>('GET', '/api/settings/ocr-prompt');
      setDefaultPrompt(data.defaultPrompt);
      if (data.prompt) {
        setOcrPrompt(data.prompt);
        setHasCustomPrompt(true);
      }
    } catch {}
  }, [apiCall]);

  const loadOcrModel = useCallback(async () => {
    try {
      const data = await apiCall<{ model: string; models: { id: string; label: string; hint: string }[] }>('GET', '/api/settings/ocr-model');
      setOcrModel(data.model);
      setModelList(data.models);
    } catch {}
  }, [apiCall]);

  useEffect(() => { loadOcrPrompt(); loadOcrModel(); }, [loadOcrPrompt, loadOcrModel]);
  useEffect(() => { loadPreferredLangs(); }, [loadPreferredLangs]);

  const changePassword = async () => {
    if (changingPassword) return;
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) { setPwMsg({ text: 'All fields are required', color: 'var(--danger)' }); return; }
    if (newPw.length < 6) { setPwMsg({ text: 'New password must be at least 6 characters', color: 'var(--danger)' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ text: 'New passwords do not match', color: 'var(--danger)' }); return; }
    setChangingPassword(true);
    try {
      await apiCall('PUT', '/api/auth/password', { current_password: currentPw, new_password: newPw });
      setPwMsg({ text: 'Password changed successfully', color: 'var(--success)' });
      passwordForm.reset();
    } catch (e) { setPwMsg({ text: (e as Error).message, color: 'var(--danger)' }); }
    finally { setChangingPassword(false); }
  };

  const saveOcrModel = async (model: string) => {
    setOcrModel(model);
    setModelMsg(null);
    try {
      await apiCall('PUT', '/api/settings/ocr-model', { model });
      setModelMsg({ text: 'Default model saved', color: 'var(--success)' });
    } catch (e) { setModelMsg({ text: (e as Error).message, color: 'var(--danger)' }); }
  };

  const saveOcrPrompt = async () => {
    setPromptMsg(null);
    if (!ocrPrompt.trim()) { setPromptMsg({ text: 'Prompt cannot be empty', color: 'var(--danger)' }); return; }
    if (ocrPrompt.length > MAX_OCR_PROMPT) { setPromptMsg({ text: `Prompt must be under ${MAX_OCR_PROMPT} characters`, color: 'var(--danger)' }); return; }
    try {
      await apiCall('PUT', '/api/settings/ocr-prompt', { prompt: ocrPrompt });
      setPromptMsg({ text: 'Custom prompt saved', color: 'var(--success)' });
      setHasCustomPrompt(true);
    } catch (e) { setPromptMsg({ text: (e as Error).message, color: 'var(--danger)' }); }
  };

  const resetOcrPrompt = async () => {
    try {
      await apiCall('DELETE', '/api/settings/ocr-prompt');
      setOcrPrompt('');
      setHasCustomPrompt(false);
      setPromptMsg({ text: 'Reset to default prompt', color: 'var(--success)' });
    } catch (e) { setPromptMsg({ text: (e as Error).message, color: 'var(--danger)' }); }
  };

  const addLang = async (code: string) => {
    if (preferredLangs.includes(code)) return;
    const updated = [...preferredLangs, code];
    try {
      await apiCall('PUT', '/api/settings/languages', { languages: updated });
      setPreferredLangs(updated);
      setLangMsg({ text: 'Saved', color: 'var(--success)' });
    } catch (e) { setLangMsg({ text: (e as Error).message, color: 'var(--danger)' }); }
  };

  const removeLang = async (code: string) => {
    const updated = preferredLangs.filter(c => c !== code);
    try {
      await apiCall('PUT', '/api/settings/languages', { languages: updated });
      setPreferredLangs(updated);
      setLangMsg({ text: 'Saved', color: 'var(--success)' });
    } catch (e) { setLangMsg({ text: (e as Error).message, color: 'var(--danger)' }); }
  };

  const handleExport = async () => {
    if (!user?.token) return;
    setExporting(true);
    setExportMsg(null);
    try {
      const { blob, filename } = await exportSongsBlob(user.token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportMsg({ text: (e as Error).message, color: 'var(--danger)' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="view-header"><PageTitle className="view-title">Settings</PageTitle></div>
      <div className="settings-grid">
        <Paper component="section" withBorder radius="lg" p="lg" bg="var(--cv-raise)" className="settings-section">
          <Title order={3} fz={16} mb={4}>Change Password</Title>
          {demoMode ? (
            <div className="muted-text">Disabled in demo mode</div>
          ) : (
            <form onSubmit={passwordForm.onSubmit(changePassword)}>
              <div className="field"><PasswordInput label={<>Current Password</>} type="password" {...passwordForm.getInputProps('currentPw')} autoComplete="current-password" /></div>
              <div className="field"><PasswordInput label={<>New Password</>} type="password" {...passwordForm.getInputProps('newPw')} autoComplete="new-password" /></div>
              <div className="field"><PasswordInput label={<>Confirm New Password</>} type="password" {...passwordForm.getInputProps('confirmPw')} autoComplete="new-password" /></div>
              <Button className="btn" type="submit" loading={changingPassword} disabled={changingPassword}>Change Password</Button>
              {pwMsg && <div className="field-message" style={{ color: pwMsg.color }}>{pwMsg.text}</div>}
            </form>
          )}
        </Paper>

        <Paper component="section" withBorder radius="lg" p="lg" bg="var(--cv-raise)" className="settings-section">
          <Title order={3} fz={16} mb={4}>My Languages</Title>
          <p className="muted-hint">
            Your preferred languages appear at the top of the language picker when creating songs.
          </p>
          <Stack gap="sm">
            <div className="flex-row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {preferredLangs.map(code => (
                <Pill key={code} size="md" withRemoveButton onRemove={() => removeLang(code)} removeButtonProps={{ 'aria-label': `Remove ${languageName(code)}` }}>
                  {languageName(code)}
                </Pill>
              ))}
              {preferredLangs.length === 0 && <span className="muted-text">No languages set</span>}
            </div>
            {preferredLangs.length < MAX_PREFERRED_LANGUAGES && (
              <div className="field">
                <Select searchable label="Add a language" placeholder="Search languages" value={null} data={LANGUAGES.filter(language => !preferredLangs.includes(language.code)).map(language => ({ value: language.code, label: `${language.name} (${language.code})` }))} onChange={(value) => { if (value) void addLang(value); }} />
              </div>
            )}
            {langMsg && <div className="field-message" style={{ color: langMsg.color }}>{langMsg.text}</div>}
          </Stack>
        </Paper>

        <Paper component="section" withBorder radius="lg" p="lg" bg="var(--cv-raise)" className="settings-section">
          <Title order={3} fz={16} mb={4}>{isAdmin ? 'Import & Export' : 'Export Songs'}</Title>
          <p className="muted-hint">
            Download all songs you can access as ChordPro (.cho) files in a zip.
            {isAdmin ? ' As an admin, you can also bulk import ChordPro files into the library.' : ''}
          </p>
          <Stack gap="sm">
            <div className="flex-row" style={{ flexWrap: 'wrap', gap: 16 }}>
              {isAdmin && (
                <Button size="xs" className="btn btn-sm" onClick={() => setShowImport(true)}>Import Songs</Button>
              )}
              <Button size="xs" className="btn btn-sm" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Export Songs'}
              </Button>
            </div>
            {exportMsg && <div className="field-message" style={{ color: exportMsg.color }}>{exportMsg.text}</div>}
          </Stack>
          <ImportModal opened={showImport} onClose={() => setShowImport(false)} onDone={() => {}} />
        </Paper>

        <Paper component="section" withBorder radius="lg" p="lg" bg="var(--cv-raise)" className="settings-section">
          <Title order={3} fz={16} mb={4}>OCR: API Key</Title>
          <p className="muted-hint">
            Smart OCR uses Google Gemini to extract chords from photos with higher accuracy. Get a free API key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>aistudio.google.com/apikey</a>
          </p>
          <GeminiKeySettings />
        </Paper>

        <Paper component="section" withBorder radius="lg" p="lg" bg="var(--cv-raise)" className="settings-section">
          <Title order={3} fz={16} mb={4}>OCR: Model &amp; Prompt</Title>
          <p className="muted-hint">
            Choose which Gemini model to use for OCR and customize the extraction prompt. You can also change the model per-extraction in the OCR modal.
          </p>
          <Stack gap="sm">
            <div className="field">

              <NativeSelect label={<>Model</>}
                value={ocrModel}
                onChange={(e) => saveOcrModel(e.target.value)}
                style={{ fontSize: 14, padding: '8px 12px' }}
              >
                {modelList.map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.hint}</option>
                ))}
              </NativeSelect>
              {modelMsg && <div className="field-message" style={{ marginTop: 4, color: modelMsg.color }}>{modelMsg.text}</div>}
            </div>
            <div className="field">

              <Textarea label={<>Prompt</>}
                value={ocrPrompt}
                onChange={(e) => setOcrPrompt(e.target.value)}
                placeholder={defaultPrompt}
                rows={7}
                maxLength={MAX_OCR_PROMPT}
                style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              />
              <div className="muted-text" style={{ fontSize: 11, textAlign: 'right', marginTop: 4 }}>
                {ocrPrompt.length} / {MAX_OCR_PROMPT}
              </div>
            </div>
            <div className="flex-row" style={{ flexWrap: 'wrap' }}>
              <Button size="xs" className="btn btn-sm" onClick={saveOcrPrompt}>Save Prompt</Button>
              {!ocrPrompt && (
                <Button size="xs" className="btn btn-sm" style={{ background: 'var(--surface-alt, var(--surface))' }} onClick={() => setOcrPrompt(defaultPrompt)}>
                  Copy Default
                </Button>
              )}
              {hasCustomPrompt && (
                <Button color="red" size="xs" className="btn btn-danger btn-sm" onClick={resetOcrPrompt}>Reset to Default</Button>
              )}
            </div>
            {promptMsg && <div className="field-message" style={{ color: promptMsg.color }}>{promptMsg.text}</div>}
          </Stack>
        </Paper>
      </div>
    </>
  );
}
