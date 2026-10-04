import { act, renderHook, waitFor } from '@testing-library/react';
import { useCopyNotification } from '../useCopyNotification';
const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock('../../lib/notifications', () => ({ showStatusNotification: notify }));
beforeEach(() => vi.clearAllMocks());
afterEach(() => { Reflect.deleteProperty(navigator, 'clipboard'); });
it('reports repeated successes and then denial without stale success', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const { result } = renderHook(() => useCopyNotification('Copied'));
  act(() => result.current('one')); await waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
  act(() => result.current('two')); await waitFor(() => expect(notify).toHaveBeenCalledTimes(2));
  writeText.mockRejectedValueOnce(new Error('Denied'));
  act(() => result.current('three')); await waitFor(() => expect(notify).toHaveBeenCalledTimes(3));
  expect(notify.mock.calls).toEqual([['Copied', 'success'], ['Copied', 'success'], ['Denied', 'error']]);
});
it('reports unsupported clipboard without claiming success', async () => {
  Reflect.deleteProperty(navigator, 'clipboard');
  const { result } = renderHook(() => useCopyNotification('Copied'));
  act(() => result.current('one')); await waitFor(() => expect(notify).toHaveBeenCalled());
  expect(notify.mock.calls[0][1]).toBe('error');
});
