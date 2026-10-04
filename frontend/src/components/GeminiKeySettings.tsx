import { Paper, Button, PasswordInput } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

export function GeminiKeySettings() {
  const apiCall = useApi();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [pending, setPending] = useState<'save' | 'remove' | null>(null);
  const [message, setMessage] = useState<{ text: string; color: string } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiCall<{ hasKey: boolean }>('GET', '/api/settings/gemini-key');
      setHasKey(data.hasKey);
    } catch {
      setHasKey(null);
      setMessage({ text: 'Could not check key status', color: 'var(--danger)' });
    }
  }, [apiCall]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const saveKey = async () => {
    if (pending) return;
    setMessage(null);
    if (!geminiKey.trim()) {
      setMessage({ text: 'Enter an API key', color: 'var(--danger)' });
      return;
    }
    setPending('save');
    try {
      await apiCall('PUT', '/api/settings/gemini-key', { api_key: geminiKey.trim() });
      setHasKey(true);
      setGeminiKey('');
      setMessage({ text: hasKey ? 'Key replaced' : 'Key saved', color: 'var(--success)' });
    } catch (error) {
      setMessage({ text: (error as Error).message, color: 'var(--danger)' });
    } finally {
      setPending(null);
    }
  };

  const removeKey = async () => {
    if (pending) return;
    setPending('remove');
    try {
      await apiCall('DELETE', '/api/settings/gemini-key');
      setHasKey(false);
      setGeminiKey('');
      setMessage({ text: 'Key removed', color: 'var(--success)' });
    } catch (error) {
      setMessage({ text: (error as Error).message, color: 'var(--danger)' });
    } finally {
      setPending(null);
    }
  };

  return (
    <Paper withBorder className="auth-card">
      <div className={`gemini-key-status${hasKey ? ' configured' : ''}`} role="status">
        {hasKey === null ? 'Checking key status…' : hasKey ? '✓ Key configured' : 'No key configured'}
      </div>
      <div className="field">

        <PasswordInput label={<>{hasKey ? 'Replace Gemini API Key' : 'Gemini API Key'}</>}
          id="gemini-api-key"
          type="password"
          value={geminiKey}
          onChange={(event) => setGeminiKey(event.target.value)}
          placeholder={hasKey ? '•••••••••••• (saved key)' : 'Paste your Gemini API key here'}
          autoComplete="off"
        />
      </div>
      <div className="flex-row">
        <Button size="xs" className="btn btn-sm" onClick={saveKey} loading={pending === 'save'} disabled={pending === 'remove'}>
          {hasKey ? 'Replace Key' : 'Save Key'}
        </Button>
        {hasKey && (
          <Button color="red" size="xs" className="btn btn-danger btn-sm" onClick={removeKey} loading={pending === 'remove'} disabled={pending === 'save'}>
            Remove Key
          </Button>
        )}
      </div>
      {message && (
        <div className="field-message" style={{ color: message.color }}>
          {message.text}
        </div>
      )}
    </Paper>
  );
}
