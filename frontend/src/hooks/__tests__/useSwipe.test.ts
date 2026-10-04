import { renderHook, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { useSwipe } from '../useSwipe';

describe('touch song navigation', () => {
  let container: HTMLDivElement;
  const onNext = vi.fn();
  const onPrev = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); container = document.createElement('div'); document.body.append(container); });
  afterEach(() => container.remove());
  const point = (x: number, y = 0) => ({ clientX: x, clientY: y, identifier: 0 });
  const setup = () => {
    const ref = createRef<HTMLElement>(); ref.current = container;
    renderHook(() => useSwipe({ onNext, onPrev, enabled: true, containerRef: ref }));
  };
  it('does not swipe when touching a child of a control', () => {
    container.innerHTML = '<button><span>Fit</span></button>'; setup();
    const target = container.querySelector('span')!;
    fireEvent.touchStart(target, { touches: [point(0)] });
    fireEvent.touchMove(target, { touches: [point(100)] });
    fireEvent.touchEnd(target, { changedTouches: [point(100)], touches: [] });
    expect(onPrev).not.toHaveBeenCalled();
  });
  it('does not navigate after a canceled gesture', () => {
    setup();
    fireEvent.touchStart(container, { touches: [point(0)] });
    fireEvent.touchMove(container, { touches: [point(100)] });
    fireEvent.touchCancel(container, { touches: [] });
    fireEvent.touchEnd(container, { changedTouches: [point(100)], touches: [] });
    expect(onPrev).not.toHaveBeenCalled();
  });
  it('does not treat a multi-touch gesture as navigation', () => {
    setup();
    fireEvent.touchStart(container, { touches: [point(0), point(30)] });
    fireEvent.touchMove(container, { touches: [point(100), point(130)] });
    fireEvent.touchEnd(container, { changedTouches: [point(100)], touches: [] });
    expect(onPrev).not.toHaveBeenCalled();
  });
  it('keeps vertical scrolling separate from horizontal navigation', () => {
    setup();
    fireEvent.touchStart(container, { touches: [point(0)] });
    fireEvent.touchMove(container, { touches: [point(5, 70)] });
    fireEvent.touchEnd(container, { changedTouches: [point(20, 150)], touches: [] });
    expect(onPrev).not.toHaveBeenCalled();
    fireEvent.touchStart(container, { touches: [point(100)] });
    fireEvent.touchMove(container, { touches: [point(10)] });
    fireEvent.touchEnd(container, { changedTouches: [point(10)], touches: [] });
    expect(onNext).toHaveBeenCalledOnce();
  });
});
