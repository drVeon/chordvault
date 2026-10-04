import { fireEvent, renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
afterEach(() => document.querySelectorAll('[role="menu"], [role="dialog"]').forEach(element => element.remove()));

describe('music shortcut ownership', () => {
  it('resumes music shortcuts after an interaction is hidden', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ ArrowRight: handler }, true));
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu'); menu.style.display = 'none'; document.body.append(menu);
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(handler).toHaveBeenCalledOnce(); menu.remove();
  });
  it('leaves dialog keys and their defaults alone', () => {
    const handler = vi.fn((e: KeyboardEvent) => e.preventDefault());
    renderHook(() => useKeyboardShortcuts({ ArrowRight: handler, Escape: handler }, true));
    const dialog = document.createElement('div'); dialog.setAttribute('role', 'dialog'); document.body.append(dialog);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled(); expect(event.defaultPrevented).toBe(false);
    dialog.remove();
  });
  it('does not steal arrows from a focused control', () => {
    const handler = vi.fn(); renderHook(() => useKeyboardShortcuts({ ArrowRight: handler }, true));
    const button = document.createElement('button'); document.body.append(button);
    fireEvent.keyDown(button, { key: 'ArrowRight' }); expect(handler).not.toHaveBeenCalled(); button.remove();
  });
  it('accepts uppercase letters and both plus key variants once', () => {
    const lower = vi.fn(), upper = vi.fn(), plus = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: lower, N: upper, '+': plus }, true));
    fireEvent.keyDown(document.body, { key: 'n' });
    fireEvent.keyDown(document.body, { key: 'N', shiftKey: true });
    fireEvent.keyDown(document.body, { key: '+', shiftKey: true, code: 'Equal' });
    fireEvent.keyDown(document.body, { key: '+', code: 'NumpadAdd' });
    expect(lower).toHaveBeenCalledOnce(); expect(upper).toHaveBeenCalledOnce(); expect(plus).toHaveBeenCalledTimes(2);
  });
});
