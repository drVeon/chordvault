import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SongEditView } from '../SongEditView';

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock CodeMirrorEditor as a textarea that fires onChange
vi.mock('../../components/CodeMirrorEditor', () => ({
  CodeMirrorEditor: ({ value, onChange, placeholder }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock EditorPreview — not needed for sync tests
vi.mock('../../components/EditorPreview', () => ({
  EditorPreview: () => <div data-testid="preview" />,
}));

// Mock OcrModal
vi.mock('../../components/OcrModal', () => ({
  OcrModal: () => null,
}));

// Mock hooks — stable references to avoid infinite re-renders from effect deps
const mockApiCall = vi.fn().mockImplementation((_method: string, path: string) => {
  if (path === '/api/settings/gemini-key') return Promise.resolve({ hasKey: false });
  if (path === '/api/settings/languages') return Promise.resolve({ languages: [] });
  return Promise.resolve({});
});
const mockUser = { id: 1, username: 'testuser', role: 'owner', token: 'fake' };
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockToast = vi.fn();
const mockT = (key: string) => key;
const mockTReplace = (key: string) => key;

vi.mock('../../hooks/useApi', () => ({
  useApi: () => mockApiCall,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAdmin: true, login: mockLogin, logout: mockLogout }),
}));

vi.mock('../../context/I18nContext', () => ({
  useI18n: () => ({
    t: mockT,
    tReplace: mockTReplace,
    loaded: true,
  }),
}));

vi.mock('../../lib/notifications', () => ({
  showStatusNotification: (...args: unknown[]) => mockToast(...args),
}));

const SONG = { id: 5, user_id: 1, title: 'It Is Well', artist: 'Horatio Spafford', content: '{title: It Is Well}\n{key: C}\n[C]When peace', visibility: 'public', bpm: null, youtube_url: null, tags: '', language: 'en' };

function serve(song: typeof SONG | null) {
  mockApiCall.mockImplementation((_method: string, path: string) => {
    if (path === '/api/settings/gemini-key') return Promise.resolve({ hasKey: false });
    if (path === '/api/settings/languages') return Promise.resolve({ languages: [] });
    if (song && path === `/api/songs/${song.id}`) return Promise.resolve(song);
    return Promise.resolve({});
  });
}

async function renderEditor(songId?: number) {
  await act(async () => { render(<SongEditView songId={songId} navigate={vi.fn()} />); });
}

describe('SongEditView action bar', () => {
  beforeEach(() => { vi.clearAllMocks(); serve(null); });

  it('new song: Save only, unsaved once something is typed', async () => {
    await renderEditor();
    expect(screen.getByRole('heading', { level: 1, name: 'songEdit.newSong' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'songEdit.moreActions' })).toBeNull();
    expect(screen.queryByText('songEdit.unsaved')).toBeNull();
    fireEvent.change(screen.getByTestId('editor'), { target: { value: '[G]Amazing grace' } });
    expect(screen.getByText('songEdit.unsaved')).toBeInTheDocument();
  });

  it('own song: loads clean, the bar menu offers Save as new version and Delete', async () => {
    serve(SONG);
    await renderEditor(5);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'songEdit.editSong' })).toBeInTheDocument());
    await waitFor(() => expect((screen.getByTestId('editor') as HTMLTextAreaElement).value).toContain('It Is Well'));
    expect(screen.queryByText('songEdit.unsaved')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'songEdit.moreActions' }));
    expect(await screen.findByRole('menuitem', { name: 'songEdit.saveAsNewVersion' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'songEdit.deleteSong' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'songEdit.deleteSong' })).toBeNull();
  });

  it("someone else's song: one primary Save as my version, no menu, no Delete", async () => {
    serve({ ...SONG, user_id: 2 });
    await renderEditor(5);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'songEdit.createVersion' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'songEdit.saveAsMyVersion' })).toHaveAttribute('data-variant', 'filled');
    expect(screen.queryByRole('button', { name: 'songEdit.save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'songEdit.moreActions' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'songEdit.deleteSong' })).toBeNull();
  });
});
