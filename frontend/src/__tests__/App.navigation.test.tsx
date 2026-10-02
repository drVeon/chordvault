import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../App';

// Real App router + real SongView; every other view is a stub that names itself,
// so the test can see which view the router actually landed on.

const { stub } = vi.hoisted(() => ({
  stub: (name: string) => () => <div>{name} stub</div>,
}));

vi.mock('../views/BrowseView', () => ({ BrowseView: stub('browse') }));
vi.mock('../views/MySongsView', () => ({ MySongsView: stub('my-songs') }));
vi.mock('../views/SongEditView', () => ({ SongEditView: stub('song-edit') }));
vi.mock('../views/CorrectionView', () => ({ CorrectionView: stub('correction') }));
vi.mock('../views/AuthView', () => ({ AuthView: stub('auth') }));
vi.mock('../views/SetlistsView', () => ({ SetlistsView: stub('setlists') }));
vi.mock('../views/PublicSetlistsView', () => ({ PublicSetlistsView: stub('public-setlists') }));
vi.mock('../views/SetlistEditView', () => ({ SetlistEditView: stub('setlist-edit') }));
vi.mock('../views/SetlistPlayView', () => ({ SetlistPlayView: stub('setlist-play') }));
vi.mock('../views/AdminView', () => ({ AdminView: stub('admin') }));
vi.mock('../views/SettingsView', () => ({ SettingsView: stub('settings') }));
vi.mock('../views/AboutView', () => ({ AboutView: stub('about') }));
vi.mock('../components/Nav', () => ({ Nav: () => null }));
vi.mock('../components/DemoBanner', () => ({ DemoBanner: () => null }));
vi.mock('../components/Toast', () => ({ Toast: () => null }));

vi.mock('../lib/api', () => ({ api: () => Promise.resolve({}) }));

const mockApiCall = vi.fn((_method: string, path: string) => {
  if (path === '/api/songs/1') {
    return Promise.resolve({ id: 1, title: 'Ledena', artist: 'Siddharta', content: '{key: G}\n[G]Le kaj', username: 'demo' });
  }
  return Promise.resolve([]);
});
vi.mock('../hooks/useApi', () => ({ useApi: () => mockApiCall }));

const mockUser = { id: 1, username: 'demo', role: 'owner', token: 'x' };
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser, isAdmin: true }) }));
vi.mock('../context/DemoContext', () => ({ useDemo: () => ({ demoMode: false, setDemoMode: () => {} }) }));
const mockT = (k: string) => k;
vi.mock('../context/I18nContext', () => ({ useI18n: () => ({ t: mockT, tReplace: mockT, loaded: true }) }));
const mockToast = vi.fn();
vi.mock('../context/ToastContext', () => ({ useToast: () => mockToast }));

// Let the router's requestAnimationFrame and any queued hashchange events run.
const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));

describe('App navigation', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/');
    // In a real browser the router's rAF runs before a queued hashchange event,
    // so a stray hash reset lands last and wins. jsdom's timer-based rAF
    // inverts that order; running rAF synchronously restores the browser's.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Back from a song returns a signed-in user to My Songs, not the public list', async () => {
    location.hash = '#song/1';
    render(<App />);
    await settle();
    expect(await screen.findByText('Ledena')).toBeDefined();

    fireEvent.click(screen.getByText(/songView\.back/));
    await settle();

    expect(screen.getByText('my-songs stub')).toBeDefined();
    expect(screen.queryByText('browse stub')).toBeNull();
    expect(location.hash).toBe('');
  });
});
