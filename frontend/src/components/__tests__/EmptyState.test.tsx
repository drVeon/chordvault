import { fireEvent, render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

it('renders an iconless message without an action', () => {
  render(<EmptyState text="No songs yet" />);
  expect(screen.getByText('No songs yet')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('preserves an existing action', () => {
  const onClick = vi.fn();
  render(<EmptyState icon={<span>♪</span>} text="No songs yet" action={{ label: 'Add songs', onClick }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add songs' }));
  expect(onClick).toHaveBeenCalledOnce();
});

it('keeps secondary explanation text visible', () => {
  render(<EmptyState text={<>This song is private<span>The song owner has marked it as private.</span></>} />);
  expect(screen.getByText('This song is private')).toBeVisible();
  expect(screen.getByText('The song owner has marked it as private.')).toBeVisible();
});
