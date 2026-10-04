import { render, screen } from '@testing-library/react';
import { Mock } from 'vitest';
import { SetlistPlayView } from '../SetlistPlayView';
import { useSetlistPlayer } from '../../hooks/useSetlistPlayer';

const layout = vi.hoisted(() => ({ current: 'phone' as 'desktop' | 'tablet' | 'phone' }));
vi.mock('../../hooks/usePlaybackLayout', () => ({ usePlaybackLayout: () => layout.current }));
vi.mock('../../hooks/useSetlistPlayer', () => ({ useSetlistPlayer: vi.fn() }));
vi.mock('../../hooks/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock('../../context/I18nContext', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../lib/notifications', () => ({ showStatusNotification: vi.fn() }));
vi.mock('../../hooks/useSwipe', () => ({ useSwipe: vi.fn() }));
vi.mock('../../hooks/useKeyboardShortcuts', () => ({ useKeyboardShortcuts: vi.fn() }));

const LONG = '奇異恩典 Amazing Grace (中英雙語版 bilingual arrangement)';

beforeEach(() => {
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
    expect(container.querySelector('.playback-topbar [role="toolbar"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument();
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
