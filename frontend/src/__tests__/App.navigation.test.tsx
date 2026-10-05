import { act, render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';

const { call, user } = vi.hoisted(() => ({ call: vi.fn(), user: { id: 1 } }));
vi.mock('../hooks/useApi', () => ({ useApi: () => call }));
vi.mock('../lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/api')>(),
  api: vi.fn().mockResolvedValue({ demoMode: false }),
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user, isAdmin: false }) }));
vi.mock('../views/SetlistPlayView', async () => {
  const { useSetlistPlayer } = await import('../hooks/useSetlistPlayer');
  return {
    SetlistPlayView: (props: Parameters<typeof useSetlistPlayer>[0]) => {
      const { setlist, index } = useSetlistPlayer(props);
      return <output data-testid="player">{setlist?.id}:{index}</output>;
    },
  };
});

afterEach(() => { history.replaceState(null, '', '/'); vi.restoreAllMocks(); });

it('lets App navigate to a different setlist while the old playback listener is mounted', async () => {
  call.mockImplementation((_method: string, path: string) => Promise.resolve({
    id: Number(path.split('/').pop()), name: 'Setlist', visibility: 'public', event_date: null,
    entries: [0, 1].map(i => ({ entry_id: i, song_id: i + 1, content: '[C]Grace', target_key: null })),
  }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  history.replaceState(null, '', '#setlist/1/play');
  render(<App />);
  await waitFor(() => expect(screen.getByTestId('player')).toHaveTextContent('1:0'));
  await act(async () => { location.hash = '#setlist/2/play/1'; });
  await waitFor(() => expect(call).toHaveBeenCalledWith('GET', '/api/setlists/2'));
  await waitFor(() => expect(screen.getByTestId('player')).toHaveTextContent('2:1'));
  expect(location.hash).toBe('#setlist/2/play/1');
});
