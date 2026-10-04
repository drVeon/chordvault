import { Tabs, Button, PasswordInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../lib/api';
import type { AuthConfig, AuthResponse } from '../types';

interface AuthViewProps {
  navigate: (view: string) => void;
}

export function AuthView({ navigate }: AuthViewProps) {
  const { login } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'login' | 'register' | 'invite'>('login');
  const form = useForm({ initialValues: { username: '', password: '', inviteCode: '' }, validate: { username: value => value ? null : t('auth.fillAllFields'), password: value => value ? null : t('auth.fillAllFields') } });
  const { username, password, inviteCode } = form.values;
  const { setValues } = form;
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<AuthConfig>({ allowRegistration: true, invitesEnabled: false, turnstileSiteKey: null, demoMode: false });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const inviteRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<AuthConfig>('GET', '/api/auth/config').then((cfg) => {
      setConfig(cfg);
      if (cfg.demoMode) {
        setValues({ username: 'demo', password: 'demopass123' });
      }
    }).catch(() => {});
  }, [setValues]);

  useEffect(() => {
    if (tab === 'invite' && inviteRef.current) inviteRef.current.focus();
    else if (userRef.current) userRef.current.focus();
  }, [tab]);

  useEffect(() => {
    const siteKey = config.turnstileSiteKey;
    if (!siteKey || tab === 'login') return;
    setTurnstileToken(null);

    const scriptId = 'cf-turnstile-script';
    const renderWidget = () => {
      const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => void } };
      if (turnstileRef.current && w.turnstile) {
        while (turnstileRef.current.firstChild) turnstileRef.current.removeChild(turnstileRef.current.firstChild);
        w.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };

    if (document.getElementById(scriptId)) {
      renderWidget();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [config.turnstileSiteKey, tab]);

  const submit = async () => {
    if (submittingRef.current) return;
    setError('');
    if (tab === 'invite' && !inviteCode) { setError(t('auth.fillAllFields')); return; }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const effectiveTab = !config.allowRegistration ? 'login' : tab;
      const endpoint = tab === 'invite' ? '/api/auth/redeem-invite' : effectiveTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'invite' ? { code: inviteCode, username, password, turnstile_token: turnstileToken }
        : effectiveTab === 'login' ? { username, password } : { username, password, turnstile_token: turnstileToken };
      const data = await api<AuthResponse>('POST', endpoint, body);
      login(data);
      navigate('browse');
    } catch (e) { setError((e as Error).message); }
    finally { submittingRef.current = false; setSubmitting(false); }
  };

  const showTabs = config.allowRegistration;
  const showInviteLink = !config.allowRegistration && config.invitesEnabled && tab !== 'invite';

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={(event) => form.onSubmit(submit)(event)}>
        <div className="auth-logo">{t('auth.logo')}</div>
        <div className="auth-tagline">{t('auth.tagline')}</div>
        {showTabs && (
          <Tabs value={tab === 'login' ? 'login' : 'register'} onChange={(value) => setTab(value === 'login' ? 'login' : 'register')} className="auth-tabs">
            <Tabs.List grow><Tabs.Tab value="login">{t('auth.signIn')}</Tabs.Tab><Tabs.Tab value="register">{t('auth.register')}</Tabs.Tab></Tabs.List>
          </Tabs>
        )}
        {tab === 'invite' && (
          <div className="field">

            <TextInput label={<>{t('auth.inviteCode')}</>} type="text" ref={inviteRef} {...form.getInputProps('inviteCode')} placeholder={t('auth.inviteCodePlaceholder')} autoComplete="off" />
          </div>
        )}
        <div className="field">

          <TextInput label={<>{t('auth.username')}</>} type="text" ref={userRef} id="auth-user" {...form.getInputProps('username')} placeholder={t('auth.usernamePlaceholder')} autoComplete="username" />
        </div>
        <div className="field">

          <PasswordInput label={<>{t('auth.password')}</>} type="password" {...form.getInputProps('password')} placeholder="••••••••" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
        </div>
        {config.turnstileSiteKey && tab !== 'login' && <div ref={turnstileRef} style={{ marginTop: 8 }} />}
        <Button fullWidth className="btn btn-full" id="auth-submit" style={{ marginTop: 8 }} type="submit" loading={submitting} disabled={submitting}>
          {tab === 'invite' ? t('auth.createAccount') : (tab === 'login' || !showTabs ? t('auth.signIn') : t('auth.createAccount'))}
        </Button>
        {showInviteLink && (
          <Button variant="default" fullWidth className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setTab('invite')}>{t('auth.haveInvite')}</Button>
        )}
        {tab === 'invite' && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); }} style={{ fontSize: 13, color: 'var(--muted)' }}>{t('auth.backToLogin')}</a>
          </div>
        )}
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</div>}
      </form>
    </div>
  );
}
