import { render, screen } from '@testing-library/react';
import { KeyBadge } from '../KeyBadge';

it('shows the key as written', () => {
  render(<KeyBadge songKey="F#m" />);
  expect(screen.getByText('F#m')).toBeInTheDocument();
});

it('draws the key on a 40px square, as the spec sets', () => {
  render(<KeyBadge songKey="C" />);
  const badge = screen.getByText('C').closest('.key-badge')!;
  const style = badge.getAttribute('style') ?? '';
  expect(style).toMatch(/(^|;\s*)height: calc\(2\.5rem/);
  expect(style).toMatch(/min-width: calc\(2\.5rem/);
});
