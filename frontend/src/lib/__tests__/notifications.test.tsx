import { act, render, screen } from '@testing-library/react';
import { notifications, Notifications } from '@mantine/notifications';
import { showStatusNotification } from '../notifications';
afterEach(() => { notifications.clean(); vi.useRealTimers(); });
it('replaces the current message and gives the new one a fresh timeout', () => {
  vi.useFakeTimers();
  render(<Notifications transitionDuration={0} limit={1} />);
  act(() => showStatusNotification('First'));
  act(() => vi.advanceTimersByTime(2500));
  act(() => showStatusNotification('Latest'));
  expect(screen.queryByText('First')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(600));
  expect(screen.getByText('Latest')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(2500));
  expect(screen.queryByText('Latest')).not.toBeInTheDocument();
});
