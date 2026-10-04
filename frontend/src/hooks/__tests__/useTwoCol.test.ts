import { act, renderHook } from '@testing-library/react';
import { useTwoCol } from '../useTwoCol';

it('follows viewport changes until manual choice, and resets on remount', () => {
  let matches = false;
  const listeners = new Set<(event: { matches: boolean }) => void>();
  const original = window.matchMedia;
  window.matchMedia = vi.fn(() => ({ matches, media: '', onchange: null, addEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => { listeners.add(listener); }, removeEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => { listeners.delete(listener); }, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia;
  const change = (value: boolean) => act(() => { matches = value; listeners.forEach(listener => listener({ matches })); });
  const { result, unmount } = renderHook(() => useTwoCol());
  expect(result.current.twoCol).toBe(false); change(true); expect(result.current.twoCol).toBe(true);
  act(() => result.current.toggleTwoCol()); expect(result.current.twoCol).toBe(false);
  change(false); change(true); expect(result.current.twoCol).toBe(false);
  unmount(); const next = renderHook(() => useTwoCol()); expect(next.result.current.twoCol).toBe(true); next.unmount();
  window.matchMedia = original;
});
