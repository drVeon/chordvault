import { renderHook, act } from '@testing-library/react';
import { useDragReorder } from '../useDragReorder';
import { describe, it, expect, vi } from 'vitest';

describe('useDragReorder Hook', () => {
  it('moves the same desktop item across queued drag-over events', () => {
    const initial = ['A', 'B', 'C', 'D'];
    const save = vi.fn();
    const { result } = renderHook(() => useDragReorder(initial, save));
    act(() => result.current.dragProps(0).onDragStart());
    const event = { preventDefault: vi.fn() } as unknown as React.DragEvent;
    act(() => {
      result.current.dragProps(1).onDragOver(event);
      result.current.dragProps(3).onDragOver(event);
    });
    expect(result.current.items).toEqual(['B', 'C', 'D', 'A']);
    act(() => result.current.dragProps(3).onDragEnd());
    expect(save).toHaveBeenCalledExactlyOnceWith(['B', 'C', 'D', 'A']);
  });

  it('initializes with the provided items', () => {
    const onSave = vi.fn();
    const initialItems = ['A', 'B', 'C'];
    const { result } = renderHook(() => useDragReorder(initialItems, onSave));

    expect(result.current.items).toEqual(initialItems);
    expect(result.current.draggedIdx).toBeNull();
  });

  it('syncs items when initialItems changes externally', () => {
    const onSave = vi.fn();
    const initialItems = ['A', 'B', 'C'];
    const { result, rerender } = renderHook(
      ({ items }) => useDragReorder(items, onSave),
      { initialProps: { items: initialItems } }
    );

    expect(result.current.items).toEqual(initialItems);

    const updatedItems = ['D', 'E'];
    rerender({ items: updatedItems });

    expect(result.current.items).toEqual(updatedItems);
  });

  it('handles HTML5 desktop drag and drop events', () => {
    const onSave = vi.fn();
    const initialItems = ['A', 'B', 'C'];
    const { result } = renderHook(() => useDragReorder(initialItems, onSave));

    // Enable dragging by simulating mouse down on drag handle
    act(() => {
      result.current.handleProps(0).onMouseDown();
    });

    // Start dragging index 0 ('A')
    act(() => {
      result.current.dragProps(0).onDragStart();
    });
    expect(result.current.draggedIdx).toBe(0);

    // Drag over index 1 ('B')
    act(() => {
      const mockEvent = { preventDefault: vi.fn() };
      result.current.dragProps(1).onDragOver(mockEvent as unknown as React.DragEvent);
    });

    // Items should swap live in hook state
    expect(result.current.items).toEqual(['B', 'A', 'C']);
    expect(result.current.draggedIdx).toBe(1);

    // End drag
    act(() => {
      result.current.dragProps(1).onDragEnd();
    });

    expect(result.current.draggedIdx).toBeNull();
    expect(onSave).toHaveBeenCalledWith(['B', 'A', 'C']);
  });

  it('handles touch events for mobile reordering', () => {
    const onSave = vi.fn();
    const initialItems = ['A', 'B', 'C'];
    const { result } = renderHook(() => useDragReorder(initialItems, onSave));

    // Touch Start on index 0
    act(() => {
      result.current.handleProps(0).onTouchStart({ touches: [{}] } as unknown as React.TouchEvent);
    });
    expect(result.current.draggedIdx).toBe(0);

    // Touch Move over index 2 ('C')
    const mockClosest = vi.fn().mockReturnValue({
      getAttribute: (attr: string) => (attr === 'data-index' ? '2' : null),
    });

    document.elementFromPoint = vi.fn().mockReturnValue({
      closest: mockClosest,
    } as unknown as Element);

    act(() => {
      const mockEvent = {
        touches: [{ clientX: 100, clientY: 200 }],
        preventDefault: vi.fn(),
        cancelable: true,
      };
      result.current.handleProps(0).onTouchMove(mockEvent as unknown as React.TouchEvent);
    });

    // Items should swap 'A' to index 2
    expect(result.current.items).toEqual(['B', 'C', 'A']);
    expect(result.current.draggedIdx).toBe(2);
    expect(document.elementFromPoint).toHaveBeenCalledWith(100, 200);

    // Touch End
    act(() => {
      result.current.handleProps(0).onTouchEnd();
    });

    expect(result.current.draggedIdx).toBeNull();
    expect(onSave).toHaveBeenCalledWith(['B', 'C', 'A']);

    delete (document as unknown as Record<string, unknown>).elementFromPoint;
  });
});

describe('canceled touch reordering', () => {
  it('keeps every item across consecutive touch moves before a render', () => {
    const initial = ['A', 'B', 'C', 'D'];
    const save = vi.fn();
    const { result } = renderHook(() => useDragReorder(initial, save));
    let target = 1;
    document.elementFromPoint = vi.fn().mockImplementation(() => ({ closest: () => ({ getAttribute: () => String(target) }) }));
    act(() => result.current.handleProps(0).onTouchStart({ touches: [{}] } as unknown as React.TouchEvent));
    const move = { touches: [{ clientX: 0, clientY: 10 }], cancelable: true, preventDefault: vi.fn() } as unknown as React.TouchEvent;
    act(() => {
      result.current.handleProps(0).onTouchMove(move);
      target = 3;
      result.current.handleProps(0).onTouchMove(move);
    });
    expect(result.current.items).toEqual(['B', 'C', 'D', 'A']);
    act(() => result.current.handleProps(3).onTouchEnd());
    expect(save).toHaveBeenCalledExactlyOnceWith(['B', 'C', 'D', 'A']);
  });

  it('cancels an active touch when an external list replaces the items', () => {
    const save = vi.fn();
    const { result, rerender } = renderHook(({ items }) => useDragReorder(items, save), { initialProps: { items: ['A', 'B'] } });
    act(() => result.current.handleProps(0).onTouchStart({ touches: [{}] } as unknown as React.TouchEvent));
    rerender({ items: ['D', 'E', 'F'] });
    act(() => result.current.handleProps(0).onTouchEnd());
    expect(result.current.items).toEqual(['D', 'E', 'F']);
    expect(result.current.draggedIdx).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('restores the original order and performs no save after cancellation', () => {
    const initial = ['A', 'B']; const save = vi.fn();
    const { result } = renderHook(() => useDragReorder(initial, save));
    act(() => result.current.handleProps(0).onTouchStart({ touches: [{}] } as unknown as React.TouchEvent));
    document.elementFromPoint = vi.fn().mockReturnValue({ closest: () => ({ getAttribute: () => '1' }) });
    act(() => result.current.handleProps(0).onTouchMove({ touches: [{ clientX: 0, clientY: 10 }], cancelable: true, preventDefault: vi.fn() } as unknown as React.TouchEvent));
    act(() => (result.current.handleProps(0) as { onTouchCancel?: () => void }).onTouchCancel?.());
    act(() => result.current.handleProps(0).onTouchEnd());
    expect(save).not.toHaveBeenCalled(); expect(result.current.items).toEqual(initial);
  });
  it('aborts a drag when a second finger is added', () => {
    const initial = ['A', 'B']; const save = vi.fn();
    const { result } = renderHook(() => useDragReorder(initial, save));
    act(() => result.current.handleProps(0).onTouchStart({ touches: [{}] } as unknown as React.TouchEvent));
    document.elementFromPoint = vi.fn().mockReturnValue({ closest: () => ({ getAttribute: () => '1' }) });
    act(() => result.current.handleProps(0).onTouchMove({ touches: [{ clientX: 0, clientY: 10 }, { clientX: 30, clientY: 10 }], cancelable: true, preventDefault: vi.fn() } as unknown as React.TouchEvent));
    act(() => result.current.handleProps(0).onTouchEnd());
    expect(save).not.toHaveBeenCalled(); expect(result.current.items).toEqual(initial);
  });
});
