import { render, screen } from '@testing-library/react';
import { KeyBadge } from '../KeyBadge';

it('shows the key as written', () => {
  render(<KeyBadge songKey="F#m" />);
  expect(screen.getByText('F#m')).toBeInTheDocument();
});
