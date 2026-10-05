import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor } from '@testing-library/react';
import { EditorPreview } from '../EditorPreview';
vi.mock('../../lib/chords', () => ({ renderChordPro: (content: string) => `<div>${content}</div>`, songHasKey: () => false, fontScaleValue: () => undefined }));
afterEach(() => vi.useRealTimers());
it('flushes on a preview trigger including zero, then keeps subsequent edits debounced', () => {
  vi.useFakeTimers();
  const { rerender } = render(<EditorPreview content="First" forceRender={0} />);
  expect(screen.getByText('First')).toBeInTheDocument();
  rerender(<EditorPreview content="Latest" forceRender={0} />);
  expect(screen.queryByText('Latest')).not.toBeInTheDocument();
  rerender(<EditorPreview content="Latest" forceRender={1} />);
  expect(screen.getByText('Latest')).toBeInTheDocument();
  rerender(<EditorPreview content="After preview" forceRender={1} />);
  expect(screen.queryByText('After preview')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByText('After preview')).toBeInTheDocument();
  expect(screen.queryByText('Latest')).not.toBeInTheDocument();
});

it('closes the key picker after choosing a key and restores trigger focus', async () => {
  render(<EditorPreview content="{key: C}\n[C]Amazing grace" />);
  const trigger = screen.getByRole('button', { name: 'Key: C' });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'D', exact: true }));
  await waitFor(() => expect(screen.queryByRole('group', { name: 'Transpose key' })).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
