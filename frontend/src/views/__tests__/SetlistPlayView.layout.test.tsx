import { fireEvent, render, screen } from '@testing-library/react';
import { Mock } from 'vitest';
import { SetlistPlayView } from '../SetlistPlayView';
import { useSetlistPlayer } from '../../hooks/useSetlistPlayer';

const layout = vi.hoisted(() => ({ current: 'phone' as 'desktop' | 'tablet' | 'phone' }));
vi.mock('../../hooks/usePlaybackLayout', () => ({ usePlaybackLayout: () => layout.current }));
vi.mock('../../hooks/useSetlistPlayer', () => ({ useSetlistPlayer: vi.fn() }));
const columns = vi.hoisted(() => ({ twoCol: false }));
vi.mock('../../hooks/useTwoCol', () => ({ useTwoCol: () => ({ twoCol: columns.twoCol, toggleTwoCol: vi.fn(), setTwoColTo: vi.fn() }) }));
vi.mock('../../hooks/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock('../../context/I18nContext', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../lib/notifications', () => ({ showStatusNotification: vi.fn() }));
vi.mock('../../hooks/useSwipe', () => ({ useSwipe: vi.fn() }));
vi.mock('../../hooks/useKeyboardShortcuts', () => ({ useKeyboardShortcuts: vi.fn() }));

const LONG = '奇異恩典 Amazing Grace (中英雙語版 bilingual arrangement)';

beforeEach(() => {
  columns.twoCol = false;
  (useSetlistPlayer as Mock).mockReturnValue({
    setlist: { id: 1, name: 'Sunday worship', entries: [] },
    entry: { entry_id: 1, title: LONG, content: '{key: G}\n[G]Amazing grace' },
    index: 0, total: 4, prev: vi.fn(), next: vi.fn(), exit: vi.fn(),
    updateEntry: vi.fn(), isModified: false, saveOnline: vi.fn(), saveLocal: vi.fn(),
  });
});

describe('playback layouts', () => {
  it('phone: dock with prev and next, no columns toggle, swipe-proof', () => {
    layout.current = 'phone';
    const { container } = render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    const dock = container.querySelector('.playback-dock')!;
    expect(dock).toHaveAttribute('data-no-swipe');
    expect(screen.getByRole('button', { name: 'Previous Song' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next Song' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Multi-column layout' })).toBeNull();
  });

  it('tablet: dock includes the columns toggle', () => {
    layout.current = 'tablet';
    const { container } = render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(container.querySelector('.playback-dock')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Multi-column layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Setlist defaults' })).toBeInTheDocument();
  });

  it('desktop: no dock, toolbar sits in the top bar', () => {
    layout.current = 'desktop';
    const { container } = render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(container.querySelector('.playback-dock')).toBeNull();
    expect(container.querySelector('.playback-topbar [role="group"][aria-label="Display"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument();
  });

  it('desktop: shows the tempo and YouTube link in the top bar', () => {
    layout.current = 'desktop';
    (useSetlistPlayer as Mock).mockReturnValue({
      setlist: { id: 1, name: 'Sunday worship', entries: [] },
      entry: { entry_id: 1, title: 'It Is Well', content: '{key: C}\n[C]When peace', bpm: 72, youtube_url: 'https://youtube.com/watch?v=abc' },
      index: 0, total: 4, prev: vi.fn(), next: vi.fn(), exit: vi.fn(),
      updateEntry: vi.fn(), isModified: false, saveOnline: vi.fn(), saveLocal: vi.fn(),
    });
    render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(screen.getByText('72 bpm')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Watch on YouTube' })).toHaveAttribute('href', 'https://youtube.com/watch?v=abc');
  });

  it.each(['desktop', 'tablet', 'phone'] as const)('%s: a swipe on the top bar cannot change songs', (l) => {
    layout.current = l;
    const { container } = render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(container.querySelector('.playback-topbar')).toHaveAttribute('data-no-swipe');
  });

  it('phone: a per-song number notation override shows on the dock and in the More menu', async () => {
    layout.current = 'phone';
    const player = (useSetlistPlayer as Mock)();
    (useSetlistPlayer as Mock).mockReturnValue({ ...player, entry: { ...player.entry, _num: 1 } });
    render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Key and notation' })).toHaveAttribute('data-overridden', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'More display options' }));
    expect(await screen.findByRole('menuitem', { name: 'Number notation, on' })).toBeInTheDocument();
  });

  it('tablet: Reset stays off until this song has its own text size or columns', async () => {
    layout.current = 'tablet';
    columns.twoCol = true;
    render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'More display options' }));
    expect(await screen.findByRole('menuitem', { name: 'Reset text size and columns' })).toHaveAttribute('data-disabled', 'true');
  });

  it('shows the full title and position without truncating', () => {
    render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(LONG);
    expect(screen.getByText('1 of 4, Sunday worship')).toBeInTheDocument();
  });

  it('keeps the exit hook the smoke test uses', () => {
    const { container } = render(<SetlistPlayView setlistId={1} navigate={vi.fn()} />);
    expect(container.querySelector('button.btn-exit')).not.toBeNull();
  });
});
