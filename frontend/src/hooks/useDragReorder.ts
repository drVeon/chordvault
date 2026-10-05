import { useState, useRef, useEffect } from 'react';
import { useListState } from '@mantine/hooks';

export function useDragReorder<T>(
  initialItems: T[],
  onSave: (items: T[]) => void
) {
  const [items, { setState: setItems, reorder }] = useListState(initialItems);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [canDrag, setCanDrag] = useState(false);
  const currentTouchIdx = useRef<number | null>(null);
  const touchOriginalItems = useRef<T[] | null>(null);

  const prevInitialItems = useRef<T[]>(initialItems);

  // Sync state if initialItems changes externally (e.g. song added or removed)
  useEffect(() => {
    const isSame =
      initialItems.length === prevInitialItems.current.length &&
      initialItems.every((item, idx) => item === prevInitialItems.current[idx]);

    if (!isSame) {
      setItems(initialItems);
      currentTouchIdx.current = null;
      touchOriginalItems.current = null;
      setDraggedIdx(null);
    }
    prevInitialItems.current = initialItems;
  }, [initialItems, setItems]);

  // HTML5 Drag & Drop (Desktop)
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    reorder({ from: draggedIdx, to: idx });
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setCanDrag(false);
    onSave(items);
  };

  // Touch Reordering (Mobile/Touchscreen)
  const handleTouchStart = (idx: number) => {
    touchOriginalItems.current = items;
    currentTouchIdx.current = idx;
    setDraggedIdx(idx);
  };

  const cancelTouch = () => {
    if (touchOriginalItems.current) setItems(touchOriginalItems.current);
    touchOriginalItems.current = null;
    currentTouchIdx.current = null;
    setDraggedIdx(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (currentTouchIdx.current === null) return;
    if (e.touches.length !== 1) { cancelTouch(); return; }

    // Prevent default scrolling behavior on mobile while dragging
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const entryElement = element.closest('[data-index]');
    if (!entryElement) return;

    const hoverIdx = parseInt(entryElement.getAttribute('data-index') || '', 10);
    if (isNaN(hoverIdx) || hoverIdx < 0 || hoverIdx >= items.length || hoverIdx === currentTouchIdx.current) return;

    reorder({ from: currentTouchIdx.current, to: hoverIdx });

    currentTouchIdx.current = hoverIdx;
    setDraggedIdx(hoverIdx);
  };

  const handleTouchEnd = () => {
    if (currentTouchIdx.current === null) return;
    currentTouchIdx.current = null;
    touchOriginalItems.current = null;
    setDraggedIdx(null);
    onSave(items);
  };

  return {
    items,
    setItems,
    draggedIdx,
    dragProps: (idx: number) => ({
      draggable: canDrag,
      onDragStart: () => handleDragStart(idx),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, idx),
      onDragEnd: handleDragEnd,
      'data-index': idx,
    }),
    handleProps: (idx: number) => ({
      onMouseDown: () => setCanDrag(true),
      onMouseUp: () => setCanDrag(false),
      onMouseLeave: () => setCanDrag(false),
      onTouchStart: (event: React.TouchEvent) => {
        if (event.touches.length === 1) handleTouchStart(idx);
        else cancelTouch();
      },
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: cancelTouch,
    }),
  };
}
